// ============================================
// QR Code Generator for Shared Offers
// ============================================

import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_OPTIONS: QrCodeOptions = {
  width: 150,
  margin: 1,
  darkColor: '#1f2937',
  lightColor: '#ffffff',
  errorCorrectionLevel: 'H', // High error correction for reliable scanning
};

/**
 * Generates a QR code data URL for a shared offer
 * @param offerId - The unique offer ID (e.g., "AN-20260109-X7KP")
 * @param accessToken - Secure access token for the offer
 * @param options - Optional QR code styling options
 * @returns Promise<string> - Base64 data URL of the QR code image
 */
export async function generateOfferQrCode(
  offerId: string, 
  accessToken: string,
  options: QrCodeOptions = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Build the share URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/share/offer/${encodeURIComponent(offerId)}?token=${encodeURIComponent(accessToken)}`;
  
  try {
    const dataUrl = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
      margin: mergedOptions.margin,
      width: mergedOptions.width,
      color: {
        dark: mergedOptions.darkColor!,
        light: mergedOptions.lightColor!,
      },
    });
    
    return dataUrl;
  } catch (error) {
    console.error('[QR Generator] Failed to generate QR code:', error);
    throw new Error('QR-Code konnte nicht generiert werden');
  }
}

/**
 * Generates a unique offer ID in the format AN-YYYYMMDD-XXXX
 * @returns string - Unique offer ID
 */
export function generateOfferId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AN-${dateStr}-${randomPart}`;
}

/**
 * Generates a secure access token for shared offers
 * @returns string - Secure random token
 */
export function generateAccessToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
