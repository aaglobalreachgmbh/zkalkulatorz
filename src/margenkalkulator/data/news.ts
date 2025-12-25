/**
 * News-Feed Daten für das SalesCockpit
 * 
 * Mock-Daten für Entwicklung – später durch API ersetzt
 */

export type NewsType = "promo" | "stock" | "info" | "training" | "urgent";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: NewsType;
  link?: string;
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Provisions-Booster Q1",
    description: "Prime XL Neuverträge +75€ Extra-Provision",
    date: "Heute",
    type: "promo",
  },
  {
    id: "2",
    title: "iPhone 16 Pro verfügbar",
    description: "Alle Farben wieder lieferbar, Lieferzeit 2-3 Tage",
    date: "Gestern",
    type: "stock",
  },
  {
    id: "3",
    title: "⚠️ OMO-Rate-Änderung",
    description: "Neue Staffelung ab 01.02.2025 – bitte Angebote prüfen",
    date: "20.12.2024",
    type: "urgent",
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
 * Ticker-Nachrichten für Marquee-Animation
 */
export const TICKER_ITEMS: string[] = [
  "🔥 Prime XL +75€ Bonus",
  "📱 iPhone 16 Pro lieferbar",
  "🎓 Schulung am 08.01.",
  "⚠️ OMO-Rate-Änderung ab 01.02.",
  "📊 TeamDeal ab 5 Verträgen",
];

/**
 * News-Typ Farben und Labels
 */
export const NEWS_TYPE_CONFIG: Record<NewsType, { color: string; label: string }> = {
  promo: { color: "bg-green-500/10 text-green-700 dark:text-green-400", label: "Aktion" },
  stock: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", label: "Lager" },
  info: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400", label: "Info" },
  training: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-400", label: "Schulung" },
  urgent: { color: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Dringend" },
};
