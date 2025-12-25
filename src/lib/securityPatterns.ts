/**
 * Zentrale Security Patterns - Wiederverwendbare Regeln für das gesamte Projekt
 * 
 * Diese Datei definiert alle Sicherheitsmuster, die automatisch auf neue
 * Komponenten und Dateien angewendet werden.
 */

import { z } from "zod";

// ============================================================================
// THREAT PATTERNS - Erkennung von Angriffsmustern
// ============================================================================

export const THREAT_PATTERNS = {
  // SQL Injection
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|UNION)\b.*\b(FROM|INTO|WHERE|TABLE|DATABASE)\b)/i,
    /(\b(OR|AND)\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
    /(;\s*DROP\s+TABLE)/i,
    /(\b(EXEC|EXECUTE)\s*\()/i,
    /(--\s*$|\/\*|\*\/)/,
  ],
  
  // XSS (Cross-Site Scripting)
  xss: [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<script\b[^>]*>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^>\s]+/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(\s*["']?\s*javascript:/gi,
  ],
  
  // Prompt Injection (für AI-Komponenten)
  promptInjection: [
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|context)/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /user\s*:\s*/gi,
    /\[\s*INST\s*\]/gi,
    /\[\s*\/INST\s*\]/gi,
    /<\|.*?\|>/g,
    /###\s*(system|user|assistant)/gi,
    /forget\s+(everything|all|what)/gi,
    /pretend\s+(you|to\s+be)/gi,
    /act\s+as\s+(if|a|an)/gi,
    /new\s+instructions?:/gi,
    /override\s+(previous|all)/gi,
  ],
  
  // Path Traversal
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\|/g,
    /%2e%2e%2f/gi,
    /%2e%2e\//gi,
    /\.\.%2f/gi,
    /%252e%252e%252f/gi,
  ],
  
  // Command Injection
  commandInjection: [
    /[;&|`$]|\$\(/,
    /\b(cat|ls|rm|mv|cp|chmod|chown|wget|curl|bash|sh|zsh|powershell|cmd)\b/i,
  ],
  
  // LDAP Injection
  ldapInjection: [
    /[()\\*]/,
    /\x00/,
  ],
  
  // NoSQL Injection
  noSqlInjection: [
    /\$where\s*:/i,
    /\$gt\s*:/i,
    /\$lt\s*:/i,
    /\$ne\s*:/i,
    /\$regex\s*:/i,
    /\{\s*"\$\w+"/i,
  ],
} as const;

// ============================================================================
// SANITIZATION RULES - Bereinigung von Input
// ============================================================================

export const SANITIZE_RULES = {
  // Zeichen, die entfernt werden sollen
  removePatterns: [
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control characters
    /<[^>]*>/g, // HTML tags
    /javascript\s*:/gi, // JavaScript protocol
    /data\s*:/gi, // Data URLs (can be used for XSS)
    /vbscript\s*:/gi, // VBScript protocol
  ],
  
  // Ersetzungen
  replacements: [
    { pattern: /&/g, replacement: "&amp;" },
    { pattern: /</g, replacement: "&lt;" },
    { pattern: />/g, replacement: "&gt;" },
    { pattern: /"/g, replacement: "&quot;" },
    { pattern: /'/g, replacement: "&#x27;" },
  ],
  
  // Maximale Längen für verschiedene Eingabetypen
  maxLengths: {
    default: 1000,
    email: 255,
    name: 100,
    password: 128,
    message: 5000,
    search: 200,
    url: 2048,
    code: 10000,
  },
} as const;

// ============================================================================
// VALIDATION SCHEMAS - Zod Schemas für verschiedene Eingabetypen
// ============================================================================

export const VALIDATION_SCHEMAS = {
  // Email
  email: z.string()
    .trim()
    .email({ message: "Ungültige E-Mail-Adresse" })
    .max(255, { message: "E-Mail zu lang (max. 255 Zeichen)" }),
  
  // Passwort
  password: z.string()
    .min(8, { message: "Passwort muss mindestens 8 Zeichen haben" })
    .max(128, { message: "Passwort zu lang (max. 128 Zeichen)" })
    .regex(/[A-Z]/, { message: "Mindestens ein Großbuchstabe erforderlich" })
    .regex(/[a-z]/, { message: "Mindestens ein Kleinbuchstabe erforderlich" })
    .regex(/[0-9]/, { message: "Mindestens eine Zahl erforderlich" }),
  
  // Name
  name: z.string()
    .trim()
    .min(1, { message: "Name erforderlich" })
    .max(100, { message: "Name zu lang (max. 100 Zeichen)" })
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-']+$/, { message: "Ungültige Zeichen im Namen" }),
  
  // Suchfeld
  search: z.string()
    .trim()
    .max(200, { message: "Suchbegriff zu lang" }),
  
  // Allgemeiner Text
  text: z.string()
    .trim()
    .max(5000, { message: "Text zu lang (max. 5000 Zeichen)" }),
  
  // URL
  url: z.string()
    .trim()
    .url({ message: "Ungültige URL" })
    .max(2048, { message: "URL zu lang" }),
  
  // Nummer
  positiveNumber: z.number()
    .positive({ message: "Muss eine positive Zahl sein" }),
} as const;

// ============================================================================
// FILE VALIDATION - Datei-Upload-Regeln
// ============================================================================

export const FILE_VALIDATION = {
  // Erlaubte MIME-Types
  allowedMimeTypes: {
    spreadsheet: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ],
    image: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  
  // Erlaubte Dateiendungen
  allowedExtensions: {
    spreadsheet: [".xlsx", ".xls", ".csv"],
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    document: [".pdf", ".doc", ".docx"],
  },
  
  // Maximale Dateigrößen (in Bytes)
  maxSizes: {
    spreadsheet: 10 * 1024 * 1024, // 10MB
    image: 5 * 1024 * 1024, // 5MB
    document: 20 * 1024 * 1024, // 20MB
    default: 5 * 1024 * 1024, // 5MB
  },
  
  // Gefährliche Dateiendungen (immer blockieren)
  dangerousExtensions: [
    ".exe", ".dll", ".bat", ".cmd", ".com", ".msi",
    ".js", ".vbs", ".ps1", ".sh", ".bash",
    ".php", ".asp", ".aspx", ".jsp",
    ".scr", ".pif", ".hta",
  ],
} as const;

// ============================================================================
// RATE LIMITING - Anfrage-Limits
// ============================================================================

export const RATE_LIMITS = {
  // Standard API-Aufrufe
  api: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 Minute
  },
  
  // AI-Anfragen (teurer/langsamer)
  ai: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 Minute
  },
  
  // Login-Versuche
  login: {
    maxAttempts: 5,
    lockoutMs: 5 * 60 * 1000, // 5 Minuten
  },
  
  // Datei-Uploads
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 Minute
  },
} as const;

// ============================================================================
// SESSION SECURITY - Session-Einstellungen
// ============================================================================

export const SESSION_CONFIG = {
  // Session-Timeout (Inaktivität)
  timeoutMs: 30 * 60 * 1000, // 30 Minuten
  
  // Warnung vor Timeout
  warningBeforeMs: 5 * 60 * 1000, // 5 Minuten vorher
  
  // Activity Events, die die Session verlängern
  activityEvents: [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
  ],
  
  // Check-Intervall
  checkIntervalMs: 60 * 1000, // Jede Minute
} as const;

// ============================================================================
// HELPER FUNCTIONS - Wiederverwendbare Sicherheitsfunktionen
// ============================================================================

/**
 * Prüft Input gegen alle Threat Patterns
 */
export function checkAllThreats(input: string): {
  isSafe: boolean;
  threats: string[];
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
} {
  const threats: string[] = [];
  
  for (const [category, patterns] of Object.entries(THREAT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        threats.push(category);
        break; // Eine Übereinstimmung pro Kategorie reicht
      }
    }
  }
  
  const uniqueThreats = [...new Set(threats)];
  
  let riskLevel: "none" | "low" | "medium" | "high" | "critical" = "none";
  if (uniqueThreats.length >= 3) riskLevel = "critical";
  else if (uniqueThreats.length === 2) riskLevel = "high";
  else if (uniqueThreats.length === 1) riskLevel = "medium";
  else if (uniqueThreats.length === 0) riskLevel = "none";
  
  return {
    isSafe: uniqueThreats.length === 0,
    threats: uniqueThreats,
    riskLevel,
  };
}

/**
 * Sanitiert Input nach allen Regeln
 */
export function sanitizeAll(input: string, maxLength?: number): string {
  let result = input;
  
  // Entferne gefährliche Patterns
  for (const pattern of SANITIZE_RULES.removePatterns) {
    result = result.replace(pattern, "");
  }
  
  // Trimmen und Längenbegrenzung
  result = result.trim();
  const limit = maxLength || SANITIZE_RULES.maxLengths.default;
  if (result.length > limit) {
    result = result.slice(0, limit);
  }
  
  return result;
}

/**
 * Escaped HTML-Zeichen für sichere Anzeige
 */
export function escapeHtml(input: string): string {
  let result = input;
  
  for (const { pattern, replacement } of SANITIZE_RULES.replacements) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

/**
 * Validiert Props gegen ein Schema
 */
export function validateProps<T>(
  props: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(props);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

/**
 * Prüft ob ein Dateiname sicher ist
 */
export function isSecureFilename(filename: string): boolean {
  // Keine Path Traversal
  if (/\.\.[\\/]/.test(filename)) return false;
  
  // Keine gefährlichen Endungen
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  const dangerousExts: readonly string[] = FILE_VALIDATION.dangerousExtensions;
  if (dangerousExts.includes(ext)) return false;
  
  // Keine Null-Bytes oder Control Characters
  if (/[\x00-\x1f]/.test(filename)) return false;
  
  // Nur erlaubte Zeichen
  if (!/^[a-zA-Z0-9äöüÄÖÜß\-_. ]+$/.test(filename)) return false;
  
  return true;
}

/**
 * Generiert einen sicheren Hash für IPs (für Logging ohne Datenschutz-Verletzung)
 */
export function hashForLogging(value: string): string {
  // Einfacher Hash für Logging-Zwecke
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16).slice(0, 8)}`;
}

// ============================================================================
// EXPORTS FÜR EINFACHE VERWENDUNG
// ============================================================================

export default {
  THREAT_PATTERNS,
  SANITIZE_RULES,
  VALIDATION_SCHEMAS,
  FILE_VALIDATION,
  RATE_LIMITS,
  SESSION_CONFIG,
  checkAllThreats,
  sanitizeAll,
  escapeHtml,
  validateProps,
  isSecureFilename,
  hashForLogging,
};
