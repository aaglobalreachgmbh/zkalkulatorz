// ============================================
// Beispieldaten für Demo-Module (keine echten Kunden)
// ============================================

export interface DemoCustomer {
  id: string;
  name: string;
  contact: string;
  mobileLines: number;
  hasFixedNet: boolean;
  vvlInDays: number;
  tariff: string;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: "c1", name: "Bäckerei Schmidt GmbH", contact: "Anna Schmidt", mobileLines: 4, hasFixedNet: false, vvlInDays: 21, tariff: "Business Prime M" },
  { id: "c2", name: "Autohaus Keller", contact: "Tim Keller", mobileLines: 12, hasFixedNet: true, vvlInDays: 75, tariff: "Business Prime L" },
  { id: "c3", name: "Praxis Dr. Yilmaz", contact: "Dr. Yilmaz", mobileLines: 3, hasFixedNet: false, vvlInDays: 160, tariff: "Business Prime S" },
  { id: "c4", name: "Malerbetrieb Huber", contact: "Lisa Huber", mobileLines: 6, hasFixedNet: true, vvlInDays: 9, tariff: "Smart Business M" },
  { id: "c5", name: "Kanzlei Wagner & Partner", contact: "Jan Wagner", mobileLines: 8, hasFixedNet: false, vvlInDays: 45, tariff: "Business Prime XL" },
];

export interface DemoProvisionRow {
  contractId: string;
  customer: string;
  tariff: string;
  expected: number;
  received: number;
}

export const DEMO_PROVISIONS: DemoProvisionRow[] = [
  { contractId: "V-10231", customer: "Bäckerei Schmidt GmbH", tariff: "Business Prime M", expected: 160, received: 160 },
  { contractId: "V-10232", customer: "Autohaus Keller", tariff: "Business Prime L", expected: 175, received: 125 },
  { contractId: "V-10233", customer: "Praxis Dr. Yilmaz", tariff: "Business Prime S", expected: 120, received: 0 },
  { contractId: "V-10234", customer: "Malerbetrieb Huber", tariff: "Smart Business M", expected: 140, received: 140 },
  { contractId: "V-10235", customer: "Kanzlei Wagner & Partner", tariff: "Business Prime XL", expected: 182, received: 182 },
];

export interface DemoAppointment {
  id: string;
  time: string;
  customer: string;
  address: string;
  topic: string;
}

export const DEMO_APPOINTMENTS: DemoAppointment[] = [
  { id: "a1", time: "09:00", customer: "Autohaus Keller", address: "Industriestr. 4, Köln", topic: "VVL 12 Karten + Festnetz" },
  { id: "a2", time: "11:30", customer: "Kanzlei Wagner & Partner", address: "Ring 18, Köln", topic: "GigaKombi prüfen" },
  { id: "a3", time: "14:00", customer: "Praxis Dr. Yilmaz", address: "Hauptstr. 2, Bonn", topic: "Neukunde Festnetz" },
];

export const DEMO_ACCESSORIES = [
  { id: "p1", name: "Schutzhülle", price: 19.99 },
  { id: "p2", name: "Panzerglas", price: 14.99 },
  { id: "p3", name: "Ladegerät 25W", price: 24.99 },
  { id: "p4", name: "Kopfhörer", price: 49.0 },
];
