/**
 * News-Feed Daten für das SalesCockpit
 * 
 * Mock-Daten für Entwicklung – später durch API ersetzt
 */

export type NewsType = "alert" | "info" | "training" | "promo" | "stock" | "urgent";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: NewsType;
  link?: string;
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Provisions-Booster: Cable Max",
    description: "Bis zum 31.10. erhalten Sie doppelte Provision auf alle Cable 1000 Abschlüsse.",
    date: "Heute",
    time: "09:41",
    type: "alert",
  },
  {
    id: "2",
    title: "iPhone 16 Pro Lagerbestand",
    description: "Die Modelle in Titanium Desert sind wieder voll verfügbar.",
    date: "Gestern",
    type: "info",
  },
  {
    id: "3",
    title: "Sales Guideline Q4/2024",
    description: "Der neue Leitfaden für die Geschäftskunden-Akquise verfügbar.",
    date: "23.10.2024",
    type: "training",
  },
  {
    id: "4",
    title: "GigaKombi Update",
    description: "Neue Konvergenz-Regeln ab Februar 2025",
    date: "18.12.2024",
    type: "info",
  },
  {
    id: "5",
    title: "Schulung: Prime Tarife",
    description: "Online-Webinar am 08.01.2025, 14:00 Uhr",
    date: "15.12.2024",
    type: "training",
  },
];

/**
 * Ticker-Nachrichten für Marquee-Animation (Dark Bar Style)
 */
export const TICKER_ITEMS: string[] = [
  "+++ Doppelte Provision auf GigaKombi Abschlüsse bis Freitag +++",
  "+++ Wartungsarbeiten im ePOS System heute Nacht 03:00 - 05:00 Uhr +++",
  "+++ iPhone 16 Pro Max in allen Farben lieferbar +++",
  "+++ Neue TeamDeal Staffelung ab 01.02.2025 +++",
];

/**
 * News-Typ Farben und Labels
 */
export const NEWS_TYPE_CONFIG: Record<NewsType, { color: string; bgColor: string; label: string }> = {
  alert: { 
    color: "text-red-600", 
    bgColor: "bg-red-100 text-red-700", 
    label: "ALERT" 
  },
  info: { 
    color: "text-muted-foreground", 
    bgColor: "bg-muted text-muted-foreground", 
    label: "INFO" 
  },
  training: { 
    color: "text-muted-foreground", 
    bgColor: "bg-muted text-muted-foreground", 
    label: "TRAINING" 
  },
  promo: { 
    color: "text-green-600", 
    bgColor: "bg-green-100 text-green-700", 
    label: "AKTION" 
  },
  stock: { 
    color: "text-blue-600", 
    bgColor: "bg-blue-100 text-blue-700", 
    label: "LAGER" 
  },
  urgent: { 
    color: "text-red-600", 
    bgColor: "bg-red-100 text-red-700", 
    label: "DRINGEND" 
  },
};

/**
 * Strategic Focus Data
 */
export const STRATEGIC_FOCUS = {
  title: "Fokus Q4: Digitalisierungsoffensive",
  description: 'Positionieren Sie "Business Professional" bei allen Neugründungen. Extra Bonus bei Buchung von Microsoft 365 Lizenzen.',
};

/**
 * Quick Tools Links
 */
export const QUICK_TOOLS = [
  { id: "provisions", label: "Provisions-Tabelle (PDF)", icon: "FileText" },
  { id: "marketing", label: "Marketing-Material", icon: "Download" },
  { id: "schulungen", label: "Schulungstermine", icon: "Calendar" },
];