// ============================================
// Demo-Firma – erfundene Beispieldaten für den "Betrieb"-Eindruck.
// Deterministisch erzeugt, keine echten Kunden, Tarife oder Preise.
// ============================================

export interface DemoCompanyCustomer {
  id: string;
  name: string;
  industry: string;
  city: string;
  contact: string;
  mobileLines: number;
  hasFixedNet: boolean;
  hasEnergy: boolean;
  vvlInDays: number;
  monthlyNet: number;
}
export type OfferStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";
export interface DemoOffer { id: string; customer: string; title: string; monthlyNet: number; margin: number; status: OfferStatus; date: string }
export interface DemoContract { id: string; customer: string; product: string; type: "Neuvertrag" | "VVL" | "Festnetz" | "Energie"; start: string; end: string; provision: number }
export interface DemoEvent { id: string; day: string; time: string; customer: string; topic: string; kind: "Termin" | "Rückruf" | "Shop" }

const INDUSTRIES = ["Handwerk", "Arztpraxis", "Kanzlei", "Einzelhandel", "Gastronomie", "Logistik", "Immobilien", "Autohaus"];
const CITIES = ["Köln", "Bonn", "Düsseldorf", "Leverkusen", "Bergisch Gladbach"];
const NAMES = [
  "Bäckerei Schmidt", "Autohaus Keller", "Praxis Dr. Yilmaz", "Malerbetrieb Huber", "Kanzlei Wagner & Partner",
  "Elektro Brandt", "Café Lindenblatt", "Spedition Arslan", "Immobilien Becker", "Physio am Ring",
  "Dachdecker Wolf", "Blumen Krause", "Steuerbüro Neumann", "Zahnarzt Dr. Roth", "Pizzeria Bella Napoli",
  "Optik Hoffmann", "Sanitär König", "Fahrschule Yildiz", "Kfz Werkstatt Lang", "Architekten Vogel",
  "Friseur Haarwerk", "Tischlerei Frank", "Pflegedienst Sonnenschein", "Getränke Müller", "IT-Service Demir",
];
const CONTACTS = ["A. Schmidt", "T. Keller", "Dr. Yilmaz", "L. Huber", "J. Wagner", "M. Brandt", "S. Lind", "E. Arslan", "K. Becker", "N. Kaya"];
const TARIFFS = ["Business Prime S", "Business Prime M", "Business Prime L", "Smart Business M", "Business Prime XL"];

// Einfacher deterministischer Zufall
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const r = rng(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

export const DEMO_COMPANY_CUSTOMERS: DemoCompanyCustomer[] = NAMES.map((name, i) => {
  const lines = 1 + Math.floor(r() * 14);
  return {
    id: `dc${i + 1}`,
    name,
    industry: INDUSTRIES[i % INDUSTRIES.length],
    city: pick(CITIES),
    contact: CONTACTS[i % CONTACTS.length],
    mobileLines: lines,
    hasFixedNet: r() > 0.45,
    hasEnergy: r() > 0.8,
    vvlInDays: Math.floor(r() * 400) - 20,
    monthlyNet: round2(lines * (25 + r() * 30)),
  };
});

const STATUSES: OfferStatus[] = ["Entwurf", "Gesendet", "Gesendet", "Angenommen", "Angenommen", "Abgelehnt"];
export const DEMO_COMPANY_OFFERS: DemoOffer[] = Array.from({ length: 40 }, (_, i) => {
  const c = DEMO_COMPANY_CUSTOMERS[i % DEMO_COMPANY_CUSTOMERS.length];
  const qty = 1 + Math.floor(r() * 8);
  const tariff = pick(TARIFFS);
  return {
    id: `A-${2026}${String(100 + i)}`,
    customer: c.name,
    title: `${qty}× ${tariff}${r() > 0.5 ? " + Festnetz" : ""}`,
    monthlyNet: round2(qty * (29 + r() * 25)),
    margin: round2(qty * (40 + r() * 140) - (r() > 0.85 ? 300 : 0)),
    status: pick(STATUSES),
    date: iso(addDays(-Math.floor(r() * 45))),
  };
});

const TYPES: DemoContract["type"][] = ["Neuvertrag", "VVL", "Neuvertrag", "Festnetz", "Energie"];
export const DEMO_COMPANY_CONTRACTS: DemoContract[] = Array.from({ length: 60 }, (_, i) => {
  const c = DEMO_COMPANY_CUSTOMERS[i % DEMO_COMPANY_CUSTOMERS.length];
  const type = pick(TYPES);
  const start = addDays(-Math.floor(r() * 700));
  const end = new Date(start); end.setMonth(end.getMonth() + 24);
  return {
    id: `V-${30000 + i}`,
    customer: c.name,
    product: type === "Festnetz" ? "Business Internet 250" : type === "Energie" ? "Gewerbestrom (Demo)" : pick(TARIFFS),
    type,
    start: iso(start),
    end: iso(end),
    provision: round2(type === "Energie" ? 60 + r() * 60 : 90 + r() * 160),
  };
});

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const TOPICS = ["VVL besprechen", "GigaKombi vorstellen", "Neukunde Festnetz", "Strom/Gas-Check", "Hardware-Tausch", "Angebot nachfassen"];
export const DEMO_COMPANY_EVENTS: DemoEvent[] = Array.from({ length: 14 }, (_, i) => ({
  id: `e${i}`,
  day: WEEKDAYS[i % 5],
  time: `${String(9 + (i % 8)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  customer: DEMO_COMPANY_CUSTOMERS[(i * 3) % DEMO_COMPANY_CUSTOMERS.length].name,
  topic: TOPICS[i % TOPICS.length],
  kind: i % 4 === 0 ? "Rückruf" : i % 5 === 0 ? "Shop" : "Termin",
}));

export const DEMO_MONTH_GOALS = [
  { label: "Neuverträge", current: 23, target: 35 },
  { label: "VVL", current: 18, target: 25 },
  { label: "Festnetz", current: 6, target: 10 },
  { label: "Energie (Demo)", current: 2, target: 5 },
];

export const DEMO_DUE_VVL = DEMO_COMPANY_CUSTOMERS.filter((c) => c.vvlInDays <= 90).sort((a, b) => a.vvlInDays - b.vvlInDays);
export const DEMO_CROSS_CHANCES = DEMO_COMPANY_CUSTOMERS
  .map((c) => ({ c, chances: [!c.hasFixedNet && "Festnetz / GigaKombi", !c.hasEnergy && "Strom/Gas-Check", c.mobileLines >= 5 && "Mengenbonus"].filter(Boolean) as string[] }))
  .filter((x) => x.chances.length >= 2);
