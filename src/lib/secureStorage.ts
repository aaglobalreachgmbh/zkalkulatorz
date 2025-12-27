// ============================================
// Secure LocalStorage with AES-256-GCM Encryption
// Phase C3: Encrypted Storage Layer
// ============================================

/**
 * AES-256-GCM encrypted localStorage wrapper
 * - Uses Web Crypto API for encryption
 * - Session-based key (derived from session fingerprint)
 * - Automatic fallback for non-crypto environments
 */

// ============================================================================
// TYPES
// ============================================================================

interface EncryptedPayload {
  v: 1; // Version
  iv: string; // Base64 encoded IV
  data: string; // Base64 encoded encrypted data
  tag: string; // Base64 encoded auth tag (included in data for GCM)
}

interface SecureStorageOptions {
  /** Prefix for all encrypted keys */
  prefix?: string;
  /** Whether to fall back to unencrypted storage if crypto unavailable */
  fallbackToPlain?: boolean;
}

// ============================================================================
// CRYPTO UTILITIES
// ============================================================================

const STORAGE_PREFIX = "mk_secure_";
const KEY_STORAGE = "mk_session_key";
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.subtle !== "undefined"
  );
}

/**
 * Generate a session-unique encryption key
 * Key is derived from a random value stored in sessionStorage
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  // Check sessionStorage for existing key material
  let keyMaterial = sessionStorage.getItem(KEY_STORAGE);
  
  if (!keyMaterial) {
    // Generate new random key material (32 bytes for AES-256)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    keyMaterial = arrayBufferToBase64(randomBytes.buffer);
    sessionStorage.setItem(KEY_STORAGE, keyMaterial);
  }
  
  // Import the raw key material
  const rawKey = base64ToArrayBuffer(keyMaterial);
  
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

/**
 * Encrypt a string value using AES-256-GCM
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API not available");
  }
  
  const key = await getOrCreateSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  const payload: EncryptedPayload = {
    v: 1,
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encrypted),
    tag: "", // Tag is included in encrypted data for GCM
  };
  
  return JSON.stringify(payload);
}

/**
 * Decrypt an encrypted payload using AES-256-GCM
 */
export async function decryptValue(encryptedString: string): Promise<string> {
  if (!isCryptoAvailable()) {
    throw new Error("Web Crypto API not available");
  }
  
  const payload: EncryptedPayload = JSON.parse(encryptedString);
  
  if (payload.v !== 1) {
    throw new Error(`Unsupported encryption version: ${payload.v}`);
  }
  
  const key = await getOrCreateSessionKey();
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const encryptedData = base64ToArrayBuffer(payload.data);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Store an encrypted value in localStorage
 */
export async function setSecureItem<T>(
  key: string,
  value: T,
  options: SecureStorageOptions = {}
): Promise<void> {
  const { prefix = STORAGE_PREFIX, fallbackToPlain = false } = options;
  const storageKey = `${prefix}${key}`;
  
  try {
    if (isCryptoAvailable()) {
      const jsonString = JSON.stringify(value);
      const encrypted = await encryptValue(jsonString);
      localStorage.setItem(storageKey, encrypted);
    } else if (fallbackToPlain) {
      // Fallback: Store with warning marker
      console.warn(`[SecureStorage] Crypto unavailable, storing ${key} unencrypted`);
      localStorage.setItem(storageKey, JSON.stringify({ _unencrypted: true, data: value }));
    } else {
      throw new Error("Crypto unavailable and fallback disabled");
    }
  } catch (error) {
    console.error(`[SecureStorage] Failed to store ${key}:`, error);
    throw error;
  }
}

/**
 * Retrieve and decrypt a value from localStorage
 */
export async function getSecureItem<T>(
  key: string,
  options: SecureStorageOptions = {}
): Promise<T | null> {
  const { prefix = STORAGE_PREFIX, fallbackToPlain = false } = options;
  const storageKey = `${prefix}${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    
    // Check for unencrypted fallback format
    try {
      const parsed = JSON.parse(stored);
      if (parsed._unencrypted) {
        if (!fallbackToPlain) {
          console.warn(`[SecureStorage] Found unencrypted data for ${key}, rejecting`);
          return null;
        }
        return parsed.data as T;
      }
    } catch {
      // Not JSON or not fallback format, proceed with decryption
    }
    
    if (isCryptoAvailable()) {
      const decrypted = await decryptValue(stored);
      return JSON.parse(decrypted) as T;
    } else if (fallbackToPlain) {
      // Try to parse as plain JSON
      return JSON.parse(stored) as T;
    } else {
      throw new Error("Crypto unavailable and fallback disabled");
    }
  } catch (error) {
    console.error(`[SecureStorage] Failed to retrieve ${key}:`, error);
    return null;
  }
}

/**
 * Remove an encrypted value from localStorage
 */
export function removeSecureItem(
  key: string,
  options: SecureStorageOptions = {}
): void {
  const { prefix = STORAGE_PREFIX } = options;
  localStorage.removeItem(`${prefix}${key}`);
}

/**
 * Check if a key exists in secure storage
 */
export function hasSecureItem(
  key: string,
  options: SecureStorageOptions = {}
): boolean {
  const { prefix = STORAGE_PREFIX } = options;
  return localStorage.getItem(`${prefix}${key}`) !== null;
}

/**
 * List all secure storage keys (without prefix)
 */
export function listSecureKeys(options: SecureStorageOptions = {}): string[] {
  const { prefix = STORAGE_PREFIX } = options;
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keys.push(key.slice(prefix.length));
    }
  }
  
  return keys;
}

/**
 * Clear all secure storage items
 */
export function clearSecureStorage(options: SecureStorageOptions = {}): number {
  const { prefix = STORAGE_PREFIX } = options;
  const keys = listSecureKeys(options);
  
  keys.forEach((key) => {
    localStorage.removeItem(`${prefix}${key}`);
  });
  
  return keys.length;
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrate an unencrypted localStorage item to secure storage
 */
export async function migrateToSecure<T>(
  oldKey: string,
  newKey: string,
  options: SecureStorageOptions = {}
): Promise<boolean> {
  try {
    const oldValue = localStorage.getItem(oldKey);
    if (!oldValue) return false;
    
    const parsed = JSON.parse(oldValue) as T;
    await setSecureItem(newKey, parsed, options);
    
    // Remove old unencrypted value
    localStorage.removeItem(oldKey);
    
    console.log(`[SecureStorage] Migrated ${oldKey} → ${newKey}`);
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Migration failed for ${oldKey}:`, error);
    return false;
  }
}

/**
 * Check if data needs migration (exists unencrypted but not encrypted)
 */
export function needsMigration(
  oldKey: string,
  newKey: string,
  options: SecureStorageOptions = {}
): boolean {
  const hasOld = localStorage.getItem(oldKey) !== null;
  const hasNew = hasSecureItem(newKey, options);
  return hasOld && !hasNew;
}

// ============================================================================
// SESSION KEY MANAGEMENT
// ============================================================================

/**
 * Rotate the session encryption key
 * All encrypted data will become inaccessible after rotation
 */
export function rotateSessionKey(): void {
  sessionStorage.removeItem(KEY_STORAGE);
  console.log("[SecureStorage] Session key rotated, old data is now inaccessible");
}

/**
 * Clear session key on logout
 */
export function clearSessionKey(): void {
  sessionStorage.removeItem(KEY_STORAGE);
}

/**
 * Check if session has an active encryption key
 */
export function hasSessionKey(): boolean {
  return sessionStorage.getItem(KEY_STORAGE) !== null;
}
