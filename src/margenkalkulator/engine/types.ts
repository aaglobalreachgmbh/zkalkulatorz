// ============================================
// MargenKalkulator Types - Phase 2
// ============================================
//
// ZWECK DIESES MODULS:
// Zentrale TypeScript-Definitionen für den gesamten MargenKalkulator.
// Diese Types bilden die Brücke zwischen UI, Engine und Daten.
//
// ARCHITEKTUR-ÜBERSICHT:
// 1. Input-Types (OfferOptionState) → Was der Nutzer konfiguriert
// 2. Catalog-Types (MobileTariff, etc.) → Stammdaten aus XLSX/Datenbank
// 3. Output-Types (CalculationResult) → Berechnungsergebnisse für UI
//
// ============================================

// ============================================
// Grundtypen - Währung, Vertragsarten, Ansichten
// ============================================

/**
 * Unterstützte Währungen.
 * 
 * WARUM NUR EUR?
 * Der MargenKalkulator ist exklusiv für Vodafone Deutschland.
 * Alle Preise, Provisionen und Margen sind in Euro.
 * 
 * VERWENDUNG: Wird in OfferOptionMeta gesetzt, um Berechnungen zu konfigurieren.
 */
export type Currency = "EUR";

/**
 * Vertragsart - Neuvertrag oder Verlängerung.
 * 
 * GESCHÄFTSLOGIK:
 * - "new" = Neuvertrag (Neukunde oder neue SIM): Höhere Provision
 * - "renewal" = Verlängerung (VVL): Geringere Provision (ca. 50% von new)
 * 
 * AUSWIRKUNG AUF BERECHNUNG:
 * - Steuert welche Provisions-Spalte verwendet wird (provisionBase vs provisionRenewal)
 * - Beispiel Prime M: Neuvertrag 450€, VVL 220€
 * 
 * @example
 * const state: MobileState = { contractType: "new", ... }; // → 450€ Provision
 */
export type ContractType = "new" | "renewal";

/**
 * Anzeigemodus - Kunden- oder Händlersicht.
 * 
 * ZWECK:
 * Im Kundengespräch zeigt der Mitarbeiter die Kundenansicht auf dem Bildschirm.
 * Die Händleransicht (mit Marge) sieht nur der Mitarbeiter.
 * 
 * UI-UNTERSCHIEDE:
 * - "customer": Zeigt nur monatliche Kosten, Einmalkosten, Gesamtkosten
 * - "dealer": Zeigt zusätzlich Provision, Hardware-EK, Marge
 * 
 * HINWEIS: Der Wechsel erfolgt über ViewModeToggle-Komponente.
 */
export type ViewMode = "customer" | "dealer";

/**
 * Dataset-Version - Identifiziert die verwendeten Tarifdaten.
 * 
 * WARUM VERSIONEN?
 * - Vodafone ändert Tarife regelmäßig (alle 6-12 Monate)
 * - Alte Angebote müssen mit historischen Daten nachvollziehbar sein
 * - Import neuer XLSX-Dateien erstellt neue Versionen
 * 
 * WERTE:
 * - "dummy-v0": Entwicklungs-Testdaten
 * - "business-2025-09": Produktivdaten ab September 2025
 * 
 * VERWENDUNG: In OfferOptionMeta.datasetVersion und Catalog.version
 */
export type DatasetVersion = "dummy-v0" | "business-2025-09";

// ============================================
// Geld- und Periodentypen
// ============================================

/**
 * Geldbetrag mit Netto/Brutto-Trennung.
 * 
 * WARUM BEIDES?
 * - Netto: Für interne Berechnungen und B2B-Kommunikation
 * - Brutto: Für Endkunden-Anzeige (inkl. 19% MwSt)
 * 
 * FORMEL: gross = net * (1 + vatRate)  → Bei 19%: gross = net * 1.19
 * 
 * @example
 * const monatspreis: Money = { net: 49.00, gross: 58.31 };
 */
export type Money = {
  /** Nettobetrag in EUR (ohne MwSt) */
  net: number;
  /** Bruttobetrag in EUR (inkl. 19% MwSt) */
  gross: number;
};

/**
 * Zeitperiode mit monatlichen Kosten.
 * 
 * WARUM PERIODEN?
 * Promos ändern den Preis nach X Monaten. Beispiel:
 * - Monate 1-6: Einführungspreis 0€
 * - Monate 7-24: Regulärer Preis 49€
 * 
 * Die Engine teilt die Laufzeit automatisch in Perioden auf,
 * wenn sich der Preis ändert. So ist die Berechnung exakt.
 * 
 * @example
 * const introPhase: Period = {
 *   fromMonth: 1,
 *   toMonth: 6,
 *   monthly: { net: 0, gross: 0 },
 *   label: "Monat 1–6 (Einführungspreis)"
 * };
 */
export type Period = {
  /** Startmonat (1-indiziert, 1 = erster Vertragsmonat) */
  fromMonth: number;
  /** Endmonat (inklusive, z.B. 6 = bis einschließlich Monat 6) */
  toMonth: number;
  /** Monatliche Kosten in dieser Periode */
  monthly: Money;
  /** Anzeigelabel für UI, z.B. "Monat 1–6" */
  label?: string;
};

// ============================================
// Breakdown für Nachvollziehbarkeit
// ============================================

/**
 * Einzelposten der Kostenaufschlüsselung.
 * 
 * ZWECK:
 * Der Breakdown erklärt dem Nutzer (und der AI), wie sich die
 * Gesamtkosten zusammensetzen. Jeder Posten hat eine eindeutige ruleId.
 * 
 * KATEGORIEN (appliesTo):
 * - "monthly": Wiederkehrende Kosten (Tarif, SUB-Aufschlag, etc.)
 * - "oneTime": Einmalige Kosten (Anschlussgebühr, Hardware-EK bei Einmalkauf)
 * - "dealer": Händler-relevante Posten (Provision, Abzüge, Marge)
 * 
 * TYPISCHE RULE-IDS:
 * - "base": Tarif-Basispreis
 * - "sub_add": SUB-Varianten-Aufschlag
 * - "promo_intro": Einführungspreis-Rabatt
 * - "promo_pct_off": Prozent-Rabatt auf Basis
 * - "gk_discount": GigaKombi-Rabatt (5€)
 * - "hw_amortized": Amortisierte Hardware-Kosten
 * - "provision_base": Basis-Provision
 * - "deduction_omo25": OMO25-Provisionsabzug
 */
export type BreakdownItem = {
  /** Technischer Schlüssel für Gruppierung/Filterung */
  key: string;
  /** Anzeige-Label in der UI */
  label: string;
  /** Kategorie: monatlich, einmalig oder Händler */
  appliesTo: "monthly" | "oneTime" | "dealer";
  /** Referenz auf betroffene Periode (z.B. "1-6") */
  periodRef?: string;
  /** Nettobetrag dieses Postens */
  net: number;
  /** Bruttobetrag (optional, wird meist aus net berechnet) */
  gross?: number;
  /** Regel-Identifikator für Debugging und Nachvollziehbarkeit */
  ruleId: string;
};

// ============================================
// Angebots-Zustand (Input für Berechnung)
// ============================================

/**
 * Meta-Daten für ein Angebot.
 * 
 * ZWECK: Steuert globale Berechnungsparameter.
 * 
 * @example
 * const meta: OfferOptionMeta = {
 *   currency: "EUR",
 *   vatRate: 0.19,          // 19% MwSt
 *   termMonths: 24,         // Standardlaufzeit
 *   datasetVersion: "business-2025-09",
 *   asOfISO: "2025-12-17"   // Datum für Promo-Gültigkeitsprüfung
 * };
 */
export type OfferOptionMeta = {
  /** Währung (immer EUR) */
  currency: Currency;
  /** MwSt-Satz als Dezimalzahl (0.19 = 19%) */
  vatRate: number;
  /** Vertragslaufzeit in Monaten (Standard: 24) */
  termMonths: number;
  /** Version der verwendeten Tarifdaten */
  datasetVersion: DatasetVersion;
  /**
   * Referenzdatum für Promo-Gültigkeit (ISO-Format).
   * 
   * WARUM?
   * Promos haben validFromISO/validUntilISO. Mit asOfISO wird
   * deterministisch geprüft, ob eine Promo am "virtuellen Heute" gültig ist.
   * 
   * VERWENDUNG:
   * - Leer: Aktuelles Datum (new Date())
   * - Gesetzt: Simuliert ein bestimmtes Datum (für Tests, historische Angebote)
   */
  asOfISO?: string;
};

/**
 * Hardware-Auswahl im Angebot.
 * 
 * GESCHÄFTSLOGIK:
 * Hardware-Kosten (EK) reduzieren die Händlermarge direkt.
 * Die Amortisation ist eine Anzeigeoptionen – sie verteilt
 * die Kosten optisch auf die Laufzeit, ändert aber nichts an der Marge.
 * 
 * MARGENBERECHNUNG:
 * Marge = Provision - Hardware-EK
 * Bei SIM-Only (ekNet = 0): Marge = Provision (maximale Marge)
 * 
 * @example
 * // SIM-Only (maximale Marge)
 * const simOnly: HardwareState = { name: "SIM Only", ekNet: 0, amortize: false, amortMonths: 24 };
 * 
 * // iPhone 16 (reduziert Marge um 779€)
 * const iphone: HardwareState = { name: "iPhone 16 128GB", ekNet: 779, amortize: true, amortMonths: 24 };
 */
export type HardwareState = {
  /** Gerätename (Freitext, z.B. "iPhone 16 Pro 256GB") */
  name: string;
  /** 
   * Einkaufspreis netto in EUR.
   * WICHTIG: Muss ≥ 0 sein. 0 = SIM-Only.
   */
  ekNet: number;
  /**
   * Amortisation aktiviert?
   * - true: Hardware-Kosten werden über Laufzeit verteilt angezeigt
   * - false: Hardware-Kosten als Einmalkosten
   * 
   * HINWEIS: Ändert nur die Anzeige, nicht die Marge!
   */
  amortize: boolean;
  /** Amortisationszeitraum in Monaten (Standard: 24, min: 1) */
  amortMonths: number;
};

/**
 * Mobilfunk-Konfiguration im Angebot.
 * 
 * ZUSAMMENSPIEL DER IDs:
 * 1. tariffId → Bestimmt Basis-Tarif (z.B. "PRIME_M")
 * 2. subVariantId → Addiert Geräte-Klassen-Aufschlag (z.B. "SMARTPHONE" = +10€)
 * 3. promoId → Modifiziert den Basispreis (z.B. "INTRO_6M" = 6 Monate 0€)
 * 
 * MONATS-KOSTEN-FORMEL:
 * Monatlich = Tarif.baseNet + SubVariant.monthlyAddNet - Promo-Rabatt
 * 
 * @example
 * const mobile: MobileState = {
 *   tariffId: "PRIME_M",           // 49€ Basispreis
 *   subVariantId: "SMARTPHONE",    // +10€ Aufschlag
 *   promoId: "NONE",               // Kein Rabatt
 *   contractType: "new",           // Neuvertrag → 450€ Provision
 *   quantity: 3                    // 3 Verträge
 * };
 * // → Monatlich: 59€ × 3 = 177€
 * // → Provision: 450€ × 3 = 1.350€
 */
export type MobileState = {
  /** Tarif-ID aus dem Katalog (z.B. "PRIME_M", "SMART_BUSINESS_PLUS") */
  tariffId: string;
  /**
   * SUB-Varianten-ID (Geräte-Klasse).
   * 
   * WERTE UND AUFSCHLÄGE (typisch):
   * - "SIM_ONLY": 0€ (kein Gerät, nur SIM)
   * - "BASIC_PHONE": 5€ (einfaches Handy)
   * - "SMARTPHONE": 10€ (Mid-Range)
   * - "PREMIUM_SMARTPHONE": 20€ (Flaggschiff)
   * - "SPECIAL_PREMIUM_SMARTPHONE": 30€ (Ultra-Premium)
   * 
   * WICHTIG: Unabhängig von tatsächlicher Hardware-Auswahl!
   */
  subVariantId: string;
  /**
   * Promo-ID für Rabattaktionen.
   * 
   * WERTE:
   * - "NONE": Kein Rabatt
   * - "INTRO_6M": 6 Monate Basispreis 0€
   * - "PCT_10_12M": 10% Rabatt für 12 Monate
   * - "OMO25": 25% Dauerrabatt (aber mit Provisionsabzug!)
   */
  promoId: string;
  /** Vertragsart (Neuvertrag/VVL) - steuert Provisionshöhe */
  contractType: ContractType;
  /** Anzahl identischer Verträge (für Volumen-Angebote) */
  quantity: number;
  /**
   * Erweiterte Vertragsvariante (Slice C).
   * 
   * UNTERSCHIED ZU subVariantId:
   * - subVariantId: Aufschlag für Geräte-Klasse
   * - contractVariant: Komplette Preisspalte im Tarif
   */
  contractVariant?: ContractVariant;
  /**
   * Hat Kunde bereits Prime auf dem Account?
   * 
   * RELEVANT FÜR TEAMDEAL:
   * TeamDeal-Tarife erfordern mindestens einen Prime-Tarif.
   * - true: TeamDeal-Preise gelten
   * - false: Fallback auf Smart Business Plus
   */
  primeOnAccount?: boolean;
  /**
   * OMO-Rabattstufe in Prozent (0-25%).
   * 
   * STUFEN:
   * 0, 5, 10, 15, 17.5, 20, 25
   * 
   * AUSWIRKUNG:
   * Reduziert die Provision um den angegebenen Prozentsatz.
   * WICHTIG: Wenn Tarif eine OMO-Matrix hat, wird der absolute Wert verwendet.
   */
  omoRate?: number;
  /**
   * FH-Partner (Fachhändler) aktiviert?
   * 
   * GESCHÄFTSLOGIK:
   * - true: Zusätzliche FH-Partner-Provision wird addiert
   * - false: Standard-Provision
   * 
   * Wert kommt aus tariff.fhPartnerNet (falls vorhanden)
   */
  isFHPartner?: boolean;
};

/**
 * Festnetz-Zugangsart für UI-Gruppierung.
 * 
 * TECHNISCHE UNTERSCHIEDE:
 * - CABLE: Koax-Kabel, bis 1000 Mbit, Router: Vodafone Station
 * - DSL: Kupferleitung, bis 250 Mbit, Router: FritzBox
 * - FIBER: Glasfaser (FTTH), bis 1000 Mbit, Router: FritzBox
 * - KOMFORT_REGIO: Regionale Lösung, feste IP, geschäftskritisch
 * - KOMFORT_FTTH: Glasfaser Komfort, höchste Geschwindigkeit
 */
export type FixedNetAccessType = "CABLE" | "DSL" | "FIBER" | "KOMFORT_REGIO" | "KOMFORT_FTTH";

/**
 * Festnetz-Konfiguration im Angebot.
 * 
 * GIGAKOMBI-LOGIK:
 * Wenn Festnetz aktiviert UND Prime-Tarif gewählt:
 * → 5€ Rabatt auf Mobilfunk
 * → Prime-Tarife erhalten "Unlimited" Upgrade
 * 
 * @example
 * const fixedNet: FixedNetState = {
 *   enabled: true,
 *   accessType: "CABLE",
 *   productId: "CABLE_100",
 *   fixedIpEnabled: true,       // +5€ für feste IP
 *   expertSetupEnabled: false   // Kein Experten-Setup
 * };
 */
export type FixedNetState = {
  /** Festnetz aktiviert? Steuert GigaKombi-Berechtigung */
  enabled: boolean;
  /** Gewählte Zugangsart (für UI-Filterung) */
  accessType?: FixedNetAccessType;
  /** Produkt-ID aus dem Katalog */
  productId: string;
  /** Fixed-IP Add-on aktiviert (typisch +5€/Monat) */
  fixedIpEnabled?: boolean;
  /** Experten-Setup aktiviert (nur Cable, einmalig ~100€) */
  expertSetupEnabled?: boolean;
  /** Komfort-Telefonie-Stufe (M/L/XL/XXL) */
  phoneTierId?: string;
  /** Komfort-Internet-Option */
  internetOptionId?: string;
};

/**
 * Vollständiger Angebots-Zustand (Input für calculateOffer).
 * 
 * DATENFLUSS:
 * 1. UI sammelt Auswahl → OfferOptionState
 * 2. Engine berechnet → CalculationResult
 * 3. UI zeigt Ergebnis an
 * 
 * WIZARD-SCHRITTE:
 * 1. Hardware → hardware: HardwareState
 * 2. Mobilfunk → mobile: MobileState
 * 3. Festnetz → fixedNet: FixedNetState
 * 4. Vergleich → Berechnung ausführen
 */
export type OfferOptionState = {
  /** Globale Berechnungsparameter */
  meta: OfferOptionMeta;
  /** Hardware-Auswahl (Gerät oder SIM-Only) */
  hardware: HardwareState;
  /** Mobilfunk-Tarif-Konfiguration */
  mobile: MobileState;
  /** Festnetz-Konfiguration (optional) */
  fixedNet: FixedNetState;
};

// ============================================
// Berechnungsergebnis (Output)
// ============================================

/**
 * Händler-Wirtschaftlichkeit.
 * 
 * MARGENFORMEL:
 * margin = provisionAfter - hardwareEkNet
 * 
 * BEISPIEL (Prime M mit iPhone 16):
 * - provisionBase: 450€ (Brutto-Provision Neuvertrag)
 * - deductions: 0€ (keine OMO25-Aktion)
 * - provisionAfter: 450€
 * - hardwareEkNet: 779€ (iPhone 16 EK)
 * - margin: 450 - 779 = -329€ (Händler subventioniert!)
 * 
 * BEISPIEL (Prime M SIM-Only):
 * - provisionBase: 450€
 * - hardwareEkNet: 0€
 * - margin: 450€ (volle Marge)
 */
export type DealerEconomics = {
  /** Brutto-Provision vom Netzbetreiber (Mobilfunk) */
  provisionBase: number;
  /** Abzüge (z.B. OMO25 = -50€ pauschal) */
  deductions: number;
  /** Netto-Provision nach Abzügen (Mobilfunk) */
  provisionAfter: number;
  /** Hardware-Einkaufspreis netto */
  hardwareEkNet: number;
  /** 
   * Händler-Marge (kann negativ sein!).
   * Negativ = Händler subventioniert das Gerät.
   */
  margin: number;
  /** Festnetz-Provision (optional, Phase 2.3) */
  fixedNetProvision?: number;
  /** FH-Partner Bonus (optional) */
  fhPartnerBonus?: number;
  /** OMO-Rabattstufe in Prozent (0-25) */
  omoRate?: number;
  /** OMO-Quelle: "matrix" = aus XLSX, "calculated" = prozentual berechnet */
  omoSource?: "matrix" | "calculated";
  /** Mengen-Staffel Bonus (Cross-Selling On-Top) */
  quantityBonus?: number;
  /** Name der aktiven Staffel (z.B. "Gold Staffel") */
  quantityBonusTierName?: string;
};

/**
 * Kostensummen über die Vertragslaufzeit.
 * 
 * BERECHNUNG:
 * - avgTermNet: Durchschnittliche monatliche Kosten netto
 * - sumTermNet: Gesamtkosten netto über Laufzeit
 * - sumTermGross: Gesamtkosten brutto über Laufzeit
 * 
 * VERWENDUNG: Hauptanzeige im Vergleichs-Schritt
 */
export type CalculationTotals = {
  /** Durchschnittlicher Monatspreis netto */
  avgTermNet: number;
  /** Summe aller Kosten netto über Laufzeit */
  sumTermNet: number;
  /** Summe aller Kosten brutto über Laufzeit */
  sumTermGross: number;
};

/**
 * Vollständiges Berechnungsergebnis.
 * 
 * STRUKTUR:
 * - periods: Zeiträume mit unterschiedlichen Preisen
 * - oneTime: Einmalige Kosten (Anschluss, ggf. Hardware)
 * - totals: Zusammenfassung für Anzeige
 * - dealer: Händler-Wirtschaftlichkeit
 * - breakdown: Detaillierte Aufschlüsselung aller Posten
 * 
 * META-FLAGS:
 * - gkEligible: GigaKombi-Rabatt anwendbar?
 * - convergenceEligible: Festnetz aktiv?
 * - primeUnlimitedUpgradeEligible: Prime + Festnetz = Unlimited?
 */
export type CalculationResult = {
  /** Zeitperioden mit monatlichen Kosten (für Promo-Phasen) */
  periods: Period[];
  /** Einmalige Kosten (Anschluss, Hardware bei Einmalkauf) */
  oneTime: Money[];
  /** Aggregierte Summen für UI-Anzeige */
  totals: CalculationTotals;
  /** Händler-Wirtschaftlichkeit (nur in Dealer-View) */
  dealer: DealerEconomics;
  /** Detaillierte Aufschlüsselung für Nachvollziehbarkeit */
  breakdown: BreakdownItem[];
  /** GigaKombi-Berechtigung (5€ Rabatt auf Mobilfunk) */
  gkEligible: boolean;
  /** Meta-Informationen über Konvergenz-Vorteile */
  meta: {
    /** Festnetz aktiv (Grundvoraussetzung für GK) */
    convergenceEligible: boolean;
    /** Prime-Tarif mit berechtigtem Festnetz = Unlimited Upgrade */
    primeUnlimitedUpgradeEligible: boolean;
  };
};

// ============================================
// Katalog-Typen - Stammdaten
// ============================================

/**
 * SUB-Varianten-IDs (Geräte-Klassen).
 * 
 * GESCHÄFTSMODELL:
 * Vodafone bietet Tarife mit unterschiedlichen Geräte-Aufschlägen an.
 * Der Aufschlag reflektiert die Subventionskosten für Geräte.
 * 
 * AUFSCHLAG-STAFFELUNG (typisch):
 * - SIM_ONLY: 0€ - Kein Gerät
 * - BASIC_PHONE: 5€ - Einfaches Handy (Feature Phone)
 * - SMARTPHONE: 10€ - Mid-Range Smartphone
 * - PREMIUM_SMARTPHONE: 20€ - Flaggschiff (iPhone, Galaxy S)
 * - SPECIAL_PREMIUM_SMARTPHONE: 30€ - Ultra-Premium (Pro Max, Ultra)
 * 
 * WICHTIG:
 * Der SUB-Aufschlag ist UNABHÄNGIG von der tatsächlichen Hardware!
 * Kunde kann SIM_ONLY buchen und trotzdem ein iPhone kaufen.
 * Der Unterschied liegt in der Raten-Finanzierung vs. Einmalkauf.
 */
export type SubVariantId = 
  | "SIM_ONLY" 
  | "BASIC_PHONE" 
  | "SMARTPHONE" 
  | "PREMIUM_SMARTPHONE" 
  | "SPECIAL_PREMIUM_SMARTPHONE";

/**
 * SUB-Variante mit Aufschlag.
 * 
 * @example
 * const smartphone: SubVariant = {
 *   id: "SMARTPHONE",
 *   label: "Smartphone",
 *   monthlyAddNet: 10.00  // +10€ auf Basispreis
 * };
 */
export type SubVariant = {
  /** Eindeutige ID (SubVariantId oder custom) */
  id: SubVariantId | string;
  /** Anzeigename in der UI */
  label: string;
  /** Monatlicher Aufschlag netto in EUR */
  monthlyAddNet: number;
};

/** Tarif-Größe (für Sortierung und Filterung) */
export type TariffTier = "XS" | "S" | "M" | "L" | "XL";

/**
 * Produktlinie (interne Bezeichnung).
 * 
 * HIERARCHIE:
 * - PRIME: Premium-Linie, höchste Provision, alle Features
 * - BUSINESS_SMART: Budget-Linie, keine Anschlussgebühr
 * - SMART_BUSINESS: Mittlere Linie
 * - SMART_BUSINESS_PLUS: Erweiterte Smart-Linie
 * - TEAMDEAL: Zusatz-SIMs, erfordert Prime auf Account
 */
export type ProductLine = "PRIME" | "BUSINESS_SMART" | "SMART_BUSINESS" | "SMART_BUSINESS_PLUS" | "TEAMDEAL";

/**
 * Tarif-Familie (für UI-Gruppierung).
 * 
 * ENTSPRICHT ProductLine in Kleinbuchstaben mit Unterstrichen.
 */
export type TariffFamily = "prime" | "business_smart" | "smart_business" | "teamdeal";

/**
 * Vertragsvariante (erweiterte Preislogik, Slice C).
 * 
 * UNTERSCHIED ZU SubVariantId:
 * - SubVariantId: Additiver Aufschlag auf Basispreis
 * - ContractVariant: Komplette Preisspalte im Tarif
 */
export type ContractVariant = "SIM_ONLY" | "BASIC" | "SMARTPHONE";

/**
 * GigaDepot-Status für Prime-Tarife.
 * 
 * FEATURE:
 * GigaDepot überträgt ungenutztes Datenvolumen in den Folgemonat.
 * 
 * BEI PRIME-TARIFEN:
 * - Prime S: Optional buchbar (+5€)
 * - Prime M/L/XL: Inklusive
 */
export type GigaDepotStatus = 
  | { status: "included" }
  | { status: "optional"; priceNet: number };

/**
 * Mobilfunk-Tarif aus dem Katalog.
 * 
 * WICHTIGE FELDER:
 * - baseNet: Basispreis SIM-Only (ohne SUB-Aufschlag)
 * - provisionBase: Neuvertrag-Provision
 * - provisionRenewal: VVL-Provision (ca. 50% von provisionBase)
 * - deductionRate: Prozentsatz für Provisionsabzug (z.B. OMO25)
 * 
 * TEAMDEAL-SPEZIAL:
 * - teamDealBase: Fallback-Tarif wenn kein Prime vorhanden
 * - teamDealDelta: Preisdifferenz zum Fallback (negativ = günstiger)
 * 
 * @example
 * const primeM: MobileTariff = {
 *   id: "PRIME_M",
 *   name: "Business Prime M",
 *   baseNet: 42.02,            // Netto-Basispreis
 *   tier: "M",
 *   productLine: "PRIME",
 *   provisionBase: 450,        // Neuvertrag-Provision
 *   provisionRenewal: 220,     // VVL-Provision
 *   dataVolumeGB: 50,
 *   allowedSubVariants: ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE", "PREMIUM_SMARTPHONE"]
 * };
 */
export type MobileTariff = {
  /** Eindeutige ID (z.B. "PRIME_M", "SMART_S") */
  id: string;
  /** Anzeigename (z.B. "Business Prime M") */
  name: string;
  /** Monatlicher Basispreis netto (SIM-Only, ohne SUB) */
  baseNet: number;
  /** Feature-Liste für Anzeige */
  features: string[];
  /** Neuvertrag-Provision (brutto, vom Netzbetreiber) */
  provisionBase: number;
  /** VVL-Provision (typisch 50% von provisionBase) */
  provisionRenewal?: number;
  /** 
   * Provisionsabzugs-Rate (0-1).
   * 
   * ANWENDUNG:
   * Bei bestimmten Promos (z.B. OMO25) wird ein Prozentsatz
   * der Provision abgezogen. deductionRate = 0.25 → 25% Abzug.
   */
  deductionRate: number;
  /** Tarif-Größe für Sortierung */
  tier?: TariffTier;
  /** Produktlinie für Gruppierung */
  productLine?: ProductLine;
  /** OneNumber-Feature inklusive? */
  oneNumberIncluded?: boolean;
  /** OMO-spezifischer Abzugsbetrag (absolut) */
  omoDeduction?: number;
  /** Tarif-Familie für UI-Tabs */
  family?: TariffFamily;
  /** Datenvolumen in GB oder "unlimited" */
  dataVolumeGB?: number | "unlimited";
  /**
   * Preise nach Vertragsvariante.
   * 
   * STRUKTUR:
   * - SIM_ONLY: Preis ohne Gerät
   * - BASIC: Preis mit Basic-Gerät
   * - SMARTPHONE: Preis mit Smartphone
   */
  pricesByVariant?: {
    SIM_ONLY: number;
    BASIC?: number;
    SMARTPHONE?: number;
  };
  /** Mindestlaufzeit in Monaten (24 = Standard, 1 = Flex) */
  minTermMonths?: number;
  /** Einmalige Anschlussgebühr (0 bei Business Smart) */
  setupFeeNet?: number;
  /**
   * Fallback-Tarif für TeamDeal ohne Prime.
   * 
   * LOGIK:
   * TeamDeal erfordert Prime auf dem Account.
   * Ohne Prime → Fallback auf diesen Tarif (z.B. "SMART_BUSINESS_PLUS").
   */
  teamDealBase?: string;
  /**
   * Preisdifferenz TeamDeal vs. Fallback.
   * 
   * BEISPIEL:
   * TeamDeal XS: 6,50€, Smart Business Plus: 10€
   * → teamDealDelta = -3,50
   */
  teamDealDelta?: number;
  /** EU-Roaming Highspeed-Volumen in GB */
  euRoamingHighspeedGB?: number;
  /** EU-Roaming Hinweis (z.B. "wie in DE") */
  euRoamingNote?: string;
  /** Roaming-Paket Zone 1 in GB */
  roamingPacketZone1GB?: number;
  /** Anzahl inkludierter OneNumber-Nummern */
  oneNumberIncludedCount?: number;
  /** GigaDepot-Status */
  gigaDepot?: GigaDepotStatus;
  /** Erlaubte SUB-Varianten (für UI-Filterung) */
  allowedSubVariants?: SubVariantId[];
  /**
   * FH-Partner-Preis (Vertriebskanal).
   * 
   * ZWECK:
   * Spezialpreis für FH-Partner (Fachhändler-Partner).
   * Falls vorhanden, wird dieser statt baseNet verwendet.
   */
  fhPartnerNet?: number;
  /**
   * Push-Preis (Aktions-Preis).
   * 
   * ZWECK:
   * Temporärer Aktionspreis bei speziellen Kampagnen.
   * Falls vorhanden, kann dieser statt baseNet verwendet werden.
   */
  pushNet?: number;
  /**
   * OMO-Matrix: Provisionswerte nach Rabattstufe (Neuvertrag).
   * 
   * STRUKTUR:
   * Key = Prozentsatz (0, 5, 10, 15, 17.5, 20, 25)
   * Value = Provision nach diesem Abzug (null = gesperrt)
   */
  omoMatrix?: Record<number, number | null>;
  /**
   * OMO-Matrix für Verlängerungen (VVL).
   * 
   * Falls nicht vorhanden, wird bei Verlängerungen omoMatrix
   * mit provisionRenewal/provisionBase skaliert.
   */
  omoMatrixRenewal?: Record<number, number | null>;
  /**
   * Provisionen nach SUB-Variante (für TeamDeal).
   * 
   * STRUKTUR:
   * - SIM_ONLY: Provision für SIM-only
   * - BASIC: Provision mit Basic/SUB5
   * - SMARTPHONE: Provision mit Smartphone/SUB10
   * 
   * WICHTIG: Diese Werte überschreiben provisionBase wenn vorhanden.
   */
  provisionsByVariant?: {
    SIM_ONLY?: number;
    BASIC?: number;
    SMARTPHONE?: number;
  };
};

/**
 * Promo-Typ (Art der Rabattierung).
 * 
 * TYPEN UND FORMELN:
 * - NONE: Kein Rabatt
 * - INTRO_PRICE: Fester Einführungspreis (ersetzt baseNet für X Monate)
 * - PCT_OFF_BASE: Prozent-Rabatt (baseNet × (1 - value) für X Monate)
 * - ABS_OFF_BASE: Absoluter Rabatt (baseNet - amountNetPerMonth für X Monate)
 * 
 * @example
 * // 6 Monate 0€
 * type: "INTRO_PRICE", durationMonths: 6, value: 0
 * 
 * // 25% Dauerrabatt
 * type: "PCT_OFF_BASE", durationMonths: 24, value: 0.25
 */
export type PromoType = "NONE" | "INTRO_PRICE" | "PCT_OFF_BASE" | "ABS_OFF_BASE";

/**
 * Promotion/Rabattaktion.
 * 
 * GÜLTIGKEITSPRÜFUNG:
 * Die Engine prüft validFromISO/validUntilISO gegen asOfISO.
 * Abgelaufene Promos werden ignoriert oder als "expired" markiert.
 * 
 * @example
 * const intro6m: Promo = {
 *   id: "INTRO_6M",
 *   type: "INTRO_PRICE",
 *   label: "6 Monate 0€ Grundgebühr",
 *   durationMonths: 6,
 *   value: 0,                    // Einführungspreis = 0€
 *   validFromISO: "2025-09-01",
 *   validUntilISO: "2025-12-31",
 *   eligibilityNote: "Nur für Neukunden"
 * };
 */
export type Promo = {
  /** Eindeutige ID (z.B. "INTRO_6M", "OMO25") */
  id: string;
  /** Promo-Typ (steuert Berechnungslogik) */
  type: PromoType;
  /** Anzeigename */
  label: string;
  /** Anwendungsbereich (mobile, fixed, oder beides) */
  appliesTo?: "mobile" | "fixed" | "both";
  /**
   * Tarif-IDs, für die diese Promo gilt.
   * 
   * WERTE:
   * - undefined oder "*": Gilt für alle Tarife
   * - string[]: Gilt nur für die angegebenen Tarif-IDs
   * 
   * BEISPIEL:
   * - appliesToTariffs: ["PRIME_S"] → Nur für Prime S
   * - appliesToTariffs: ["PRIME_S", "PRIME_M", "PRIME_L", "PRIME_XL"] → Alle Prime
   * - appliesToTariffs: "*" → Alle Tarife
   */
  appliesToTariffs?: string[] | "*";
  /** Dauer in Monaten (0 = Dauerrabatt bis Laufzeitende) */
  durationMonths: number;
  /**
   * Wert der Promo.
   * 
   * INTERPRETATION JE NACH TYPE:
   * - INTRO_PRICE: Fester Preis in EUR (z.B. 0 = kostenlos)
   * - PCT_OFF_BASE: Prozentsatz als Dezimal (0.25 = 25%)
   * - ABS_OFF_BASE: Ignoriert, nutzt amountNetPerMonth
   */
  value: number;
  /** Absoluter Rabattbetrag pro Monat (nur bei ABS_OFF_BASE) */
  amountNetPerMonth?: number;
  /** Gültig ab (ISO-Datum) */
  validFromISO?: string;
  /** Gültig bis (ISO-Datum, inklusive) */
  validUntilISO?: string;
  /** Berechtigungshinweis für UI */
  eligibilityNote?: string;
  /** Quellen-Referenz (URL oder Dokument) */
  sourceRef?: string;
};

/** Festnetz-Produktlinie */
export type FixedNetProductLine = "RBI" | "RBIP" | "DSL" | "FIBER" | "KOMFORT";

/** Router-Typ (abhängig von Zugangsart) */
export type RouterType = "FRITZBOX" | "VODAFONE_STATION";

/**
 * Festnetz-Produkt aus dem Katalog.
 * 
 * ZUGANGSARTEN UND ROUTER:
 * - Cable: Vodafone Station (bis 1000 Mbit)
 * - DSL: FritzBox (bis 250 Mbit)
 * - Fiber: FritzBox (bis 1000 Mbit)
 * - Komfort: Je nach Region
 * 
 * @example
 * const cable100: FixedNetProduct = {
 *   id: "CABLE_100",
 *   name: "Red Business Internet & Phone 100 Cable",
 *   accessType: "CABLE",
 *   speed: 100,
 *   monthlyNet: 29.32,
 *   oneTimeNet: 69.90,
 *   setupWaived: false,
 *   routerType: "VODAFONE_STATION",
 *   includesRouter: true,
 *   includesPhone: true
 * };
 */
export type FixedNetProduct = {
  /** Eindeutige ID (z.B. "CABLE_100", "DSL_250") */
  id: string;
  /** Anzeigename */
  name: string;
  /** Monatlicher Preis netto */
  monthlyNet: number;
  /** Einmalige Kosten netto (Anschluss, Setup) */
  oneTimeNet: number;
  /** Feature-Liste für Anzeige */
  features: string[];
  /** Produkt-spezifische Promo (optional) */
  promo?: {
    type: PromoType;
    durationMonths: number;
    value: number;
    validFromISO?: string;
    validUntilISO?: string;
  };
  /** Produktlinie für Filterung */
  productLine?: FixedNetProductLine;
  /** Zugangsart für Gruppierung */
  accessType?: FixedNetAccessType;
  /** Download-Geschwindigkeit in Mbit/s */
  speed?: number;
  /** Anschlussgebühr erlassen? */
  setupWaived?: boolean;
  /** Router-Typ (abhängig von Zugangsart) */
  routerType?: RouterType;
  /** Telefon-Flatrate inklusive? */
  includesPhone?: boolean;
  /** Router-Hardware inklusive? */
  includesRouter?: boolean;
  /** Standard-Router-Modell */
  routerModelDefault?: string;
  /** Feste IP inklusive? */
  fixedIpIncluded?: boolean;
  /** Preis für feste IP als Add-on */
  fixedIpAddonNet?: number;
  /** Experten-Setup buchbar? */
  expertSetupAvailable?: boolean;
  /** Komfort-Telefon-Stufe */
  komfortTier?: "M" | "L" | "XL" | "XXL";
  /** Quellen für Nachvollziehbarkeit */
  sources?: {
    title: string;
    url: string;
    versionDate: string;
  }[];
};

/**
 * Hardware-Artikel aus dem Katalog.
 * 
 * KATEGORIEN:
 * - smartphone: Mobiltelefone
 * - tablet: Tablets
 * - accessory: Zubehör (Kopfhörer, Cases, etc.)
 * - none: SIM-Only (ekNet = 0)
 * - custom: Vom Nutzer manuell eingegeben
 * 
 * @example
 * const iphone16: HardwareItem = {
 *   id: "IPHONE_16_128",
 *   brand: "Apple",
 *   model: "iPhone 16 128GB",
 *   category: "smartphone",
 *   ekNet: 779.00,
 *   sortOrder: 10
 * };
 */
export type HardwareItem = {
  /** Eindeutige ID */
  id: string;
  /** Hersteller (Apple, Samsung, Google, etc.) */
  brand: string;
  /** Modellbezeichnung */
  model: string;
  /** Kategorie für Filterung */
  category: "smartphone" | "tablet" | "accessory" | "none" | "custom";
  /** Einkaufspreis netto in EUR */
  ekNet: number;
  /** Bild-URL (optional) */
  imageUrl?: string;
  /** Sortierreihenfolge für UI */
  sortOrder?: number;
};

/**
 * Vollständiger Produkt-Katalog.
 * 
 * QUELLEN:
 * - Wird aus XLSX-Import geladen (DataManager)
 * - Fallback auf dummy-Daten wenn kein Import vorhanden
 * 
 * VERWENDUNG:
 * Die Engine holt sich alle benötigten Stammdaten aus dem Catalog.
 * 
 * @example
 * const catalog: Catalog = {
 *   version: "business-2025-09",
 *   validFrom: "2025-09-01",
 *   subVariants: [...],
 *   mobileTariffs: [...],
 *   promos: [...],
 *   fixedNetProducts: [...],
 *   hardwareCatalog: [...]
 * };
 */
// ============================================
// IoT / M2M Typen (NEU)
// ============================================

/**
 * IoT/M2M-Tarif aus dem Katalog.
 * 
 * ANWENDUNGSFÄLLE:
 * - Telematik (Fahrzeug-Tracking)
 * - Smart Meter (Strom/Gas/Wasser)
 * - Industrie 4.0 (Maschinen-Kommunikation)
 * - POS-Terminals (Kartenzahlung)
 */
export type IoTTariff = {
  /** Eindeutige ID */
  id: string;
  /** Anzeigename */
  name: string;
  /** Kategorie */
  category: "standard" | "enterprise" | "automotive";
  /** Datenvolumen in MB */
  dataVolumeMB: number;
  /** Datenvolumen als Text */
  dataVolumeText?: string;
  /** Monatspreis netto */
  monthlyNet: number;
  /** Mindestlaufzeit */
  minTermMonths: number;
  /** Überverbrauch pro MB */
  overagePerMBNet?: number;
  /** Neuvertrag-Provision */
  provisionNew: number;
  /** VVL-Provision */
  provisionRenewal?: number;
  /** Features */
  features: string[];
  /** Typische Anwendungsfälle */
  useCases: string[];
  /** Sortierreihenfolge */
  sortOrder?: number;
};

// ============================================
// VoIP / RingCentral Typen (NEU)
// ============================================

/** VoIP-Produktstufe */
export type VoIPTier = "essentials" | "standard" | "premium" | "ultimate";

/**
 * VoIP-Produkt aus dem Katalog (RingCentral).
 * 
 * LIZENZMODELL:
 * - Preis pro Benutzer pro Monat
 * - Staffelpreise bei größeren Teams
 */
export type VoIPProduct = {
  /** Eindeutige ID */
  id: string;
  /** Anzeigename */
  name: string;
  /** Produktstufe */
  tier: VoIPTier;
  /** Preis pro Benutzer netto */
  pricePerUserNet: number;
  /** Mindestanzahl Benutzer */
  minUsers: number;
  /** Maximalanzahl Benutzer */
  maxUsers?: number;
  /** Mindestlaufzeit */
  minTermMonths: number;
  /** Abrechnungszyklus */
  billingCycle: "monthly" | "annual";
  /** Inklusivminuten Deutschland */
  includedMinutesDE?: number | "unlimited";
  /** Inklusivminuten International */
  includedMinutesIntl?: number;
  /** Features */
  features: {
    videoConferencing: boolean;
    teamMessaging: boolean;
    smsEnabled: boolean;
  };
  /** Kompatible Hardware-IDs */
  hardwareOptions: string[];
  /** Provision pro Benutzer */
  provisionPerUser: number;
  /** Einmalige Setup-Provision */
  provisionSetup?: number;
  /** Sortierreihenfolge */
  sortOrder?: number;
};

/**
 * VoIP-Hardware aus dem Katalog.
 */
export type VoIPHardware = {
  /** Eindeutige ID */
  id: string;
  /** Hersteller */
  brand: string;
  /** Modell */
  model: string;
  /** Kategorie */
  category: "desk_phone" | "conference_phone" | "headset" | "accessory";
  /** Einkaufspreis netto */
  ekNet: number;
  /** UVP netto */
  uvpNet?: number;
  /** Kompatible Tier-Level */
  compatibleTiers: VoIPTier[];
  /** Features */
  features: string[];
  /** Bild-URL */
  imageUrl?: string;
  /** Sortierreihenfolge */
  sortOrder?: number;
};

// ============================================
// Provisions-Typen (NEU)
// ============================================

/**
 * Provisions-Eintrag aus der Matrix.
 */
export type ProvisionEntry = {
  /** Referenz auf Tarif-ID */
  tariffId: string;
  /** Tarif-Typ */
  tariffType: "mobile" | "fixednet" | "iot" | "voip";
  /** Neuvertrag-Provision netto */
  provisionNewNet: number;
  /** VVL-Provision netto */
  provisionRenewalNet?: number;
  /** VVL als Prozent von Neu */
  provisionRenewalPct?: number;
  /** FH-Partner Modifikator */
  fhPartnerModifier?: number;
  /** Push-Modifikator */
  pushModifier?: number;
};

// ============================================
// OMO-Matrix Typen (NEU)
// ============================================

/** OMO-Rabattstufen */
export type OMOLevel = 0 | 5 | 10 | 15 | 17.5 | 20 | 25;

/**
 * OMO-Matrix-Eintrag.
 * 
 * LOGIK:
 * OMO = Dauerrabatt für Kunden
 * → Reduziert Tarifpreis um X%
 * → Reduziert Händler-Provision um festen Betrag
 */
export type OMOMatrixEntry = {
  /** Referenz auf Tarif-ID */
  tariffId: string;
  /** Abzugsbeträge nach OMO-Stufe */
  deductions: Record<OMOLevel, number | null>;
};

// ============================================
// Vollständiger Katalog (erweitert)
// ============================================

export type Catalog = {
  /** Dataset-Version */
  version: DatasetVersion;
  /** Gültig ab (für historische Angebote) */
  validFrom?: string;
  
  // MOBILFUNK
  /** SUB-Varianten (Geräte-Klassen) */
  subVariants: SubVariant[];
  /** Mobilfunk-Tarife */
  mobileTariffs: MobileTariff[];
  /** Promos/Rabattaktionen */
  promos: Promo[];
  
  // FESTNETZ
  /** Festnetz-Produkte */
  fixedNetProducts: FixedNetProduct[];
  
  // HARDWARE
  /** Hardware-Katalog (optional) */
  hardwareCatalog?: HardwareItem[];
  
  // IoT (NEU)
  /** IoT/M2M-Tarife */
  iotTariffs?: IoTTariff[];
  
  // VoIP (NEU)
  /** VoIP-Produkte (RingCentral) */
  voipProducts?: VoIPProduct[];
  /** VoIP-Hardware */
  voipHardware?: VoIPHardware[];
  
  // PROVISIONEN & OMO (NEU)
  /** Provisions-Matrix */
  provisions?: ProvisionEntry[];
  /** OMO-Matrix */
  omoMatrix?: OMOMatrixEntry[];
};

/** Legacy-Alias für Abwärtskompatibilität */
export type DummyCatalog = Catalog;

// ============================================
// Wizard-Typen
// ============================================

/**
 * Wizard-Schritt für Navigation.
 * 
 * REIHENFOLGE:
 * 1. hardware: Geräteauswahl (beeinflusst Marge)
 * 2. mobile: Tarifauswahl (Kernkosten + Provision)
 * 3. fixedNet: Festnetz (optional, aktiviert GigaKombi)
 * 4. compare: Vergleich und Zusammenfassung
 */
export type WizardStep = "hardware" | "mobile" | "fixedNet" | "compare";

/**
 * Validierungsergebnis für einen Wizard-Schritt.
 * 
 * VERWENDUNG:
 * Jeder Schritt wird vor "Weiter" validiert.
 * Bei Fehlern wird der Nutzer informiert.
 */
export type WizardValidation = {
  /** Schritt gültig? */
  isValid: boolean;
  /** Fehlermeldungen (leer wenn gültig) */
  errors: string[];
};
