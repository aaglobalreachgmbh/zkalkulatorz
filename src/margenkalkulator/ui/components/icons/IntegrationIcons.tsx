// ============================================
// Integration Icons - Brand SVG Icons for integrations
// ============================================

import { Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

// Gmail Icon with authentic Google colors
export function GmailIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none">
      <path d="M22 6L12 13L2 6V4L12 11L22 4V6Z" fill="#EA4335"/>
      <path d="M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6L12 13L22 6Z" fill="#FBBC05"/>
      <path d="M22 6L12 13V20H20C21.1 20 22 19.1 22 18V6Z" fill="#34A853"/>
      <path d="M2 6L12 13V20H4C2.9 20 2 19.1 2 18V6Z" fill="#4285F4"/>
    </svg>
  );
}

// IONOS Icon with brand blue
export function IonosIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#003D8F"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">
        IONOS
      </text>
    </svg>
  );
}

// Google Calendar Icon with authentic colors
export function GoogleCalendarIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none">
      {/* Calendar background */}
      <rect x="3" y="4" width="18" height="18" rx="2" fill="#FFFFFF" stroke="#4285F4" strokeWidth="2"/>
      {/* Calendar header */}
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#4285F4"/>
      {/* Date text */}
      <text x="12" y="17" textAnchor="middle" fill="#4285F4" fontSize="8" fontWeight="bold" fontFamily="system-ui">
        31
      </text>
      {/* Color dots */}
      <circle cx="7" cy="6.5" r="1" fill="#EA4335"/>
      <circle cx="12" cy="6.5" r="1" fill="#FBBC05"/>
      <circle cx="17" cy="6.5" r="1" fill="#34A853"/>
    </svg>
  );
}

// Microsoft Outlook Icon
export function OutlookIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
      <ellipse cx="9" cy="12" rx="4" ry="4.5" fill="white"/>
      <path d="M14 7L22 11V17L14 13V7Z" fill="white" fillOpacity="0.8"/>
    </svg>
  );
}

// Generic Mail Icon (fallback)
export function GenericMailIcon({ className }: IconProps) {
  return <Mail className={cn("w-6 h-6 text-muted-foreground", className)} />;
}

// Generic Calendar Icon (fallback)
export function GenericCalendarIcon({ className }: IconProps) {
  return <Calendar className={cn("w-6 h-6 text-muted-foreground", className)} />;
}

// Apple iCloud Calendar Icon
export function AppleCalendarIcon({ className }: IconProps) {
  return (
    <svg className={cn("w-6 h-6", className)} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="4" fill="url(#appleCalGradient)"/>
      <rect x="3" y="4" width="18" height="6" rx="4" fill="#FF3B30"/>
      <text x="12" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="system-ui">
        31
      </text>
      <defs>
        <linearGradient id="appleCalGradient" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3B30"/>
          <stop offset="0.3" stopColor="#FFFFFF"/>
          <stop offset="1" stopColor="#F5F5F5"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Export all icons as a map for dynamic usage
export const IntegrationIcons = {
  gmail: GmailIcon,
  ionos: IonosIcon,
  "google-calendar": GoogleCalendarIcon,
  outlook: OutlookIcon,
  "apple-calendar": AppleCalendarIcon,
  mail: GenericMailIcon,
  calendar: GenericCalendarIcon,
} as const;

export type IntegrationType = keyof typeof IntegrationIcons;
