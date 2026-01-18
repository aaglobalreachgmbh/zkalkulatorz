# Changelog

Alle wesentlichen Änderungen am MargenKalkulator werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unreleased]

### Hinzugefügt
- **Modulare Engine-Struktur** (`engine/calculators/`)
  - `promo.ts` – Promo-Validierung, TeamDeal-Fallback-Logik
  - `mobile.ts` – Mobile Tarifberechnungen (Base, Monthly)
  - `fixedNet.ts` – Festnetz-Berechnungen (Monthly, OneTime)
  - `hardware.ts` – Hardware-Amortisation
  - `dealer.ts` – Dealer Economics, OMO-Deduction
  - `index.ts` – Barrel-Export für alle Calculator-Module

- **Zentrale Konfiguration** (`config.ts`)
  - `TAX.VAT_RATE` (0.19) – Deutsche Mehrwertsteuer
  - `TERM.DEFAULT_MONTHS` (24) – Standard-Vertragslaufzeit
  - `TERM.AMORT_MONTHS` (24) – Hardware-Amortisationszeitraum
  - `FIXED_NET_FEES.*` – Bereitstellung, Versand, Experten-Setup, Feste IP
  - `GIGAKOMBI.DISCOUNT_NET` (5.00) – Konvergenz-Rabatt
  - `TEAMDEAL_FALLBACK.*` – Fallback-Konditionen ohne Prime
  - `DATASETS.*` – Versionierte Datensatz-Referenzen

- **Barrel-Exports** (`src/margenkalkulator/index.ts`)
  - Zentraler Public API Export für das gesamte Modul
  - Ermöglicht: `import { calculateOffer, type MobileTariff } from "@/margenkalkulator"`

- **Breakdown & Offer Module**
  - `engine/breakdown.ts` – Extrahierte Breakdown-Generierung
  - `engine/offer.ts` – Extrahierter Haupt-Orchestrator (`calculateOffer`)

### Geändert
- **Magic Numbers eliminiert**
  - Alle hardcodierten Werte durch Config-Konstanten ersetzt
  - `0.19` → `TAX.VAT_RATE`
  - `24` → `TERM.DEFAULT_MONTHS`
  - `19.90`, `8.40`, `89.99`, `5.00` → `FIXED_NET_FEES.*`
  
- **Engine-Struktur refaktoriert**
  - `pricing.ts` (725 Zeilen) aufgeteilt in 7 fokussierte Module
  - Bessere Testbarkeit durch isolierte Calculator-Funktionen
  - Klare Verantwortlichkeiten pro Modul

- **Import-Pfade vereinfacht**
  - Tests importieren nun von `../engine` statt `../engine/pricing`
  - Abwärtskompatibilität durch Re-Exports gewährleistet

### Entfernt
- `engine/pricing.ts` – Ersetzt durch modulare Struktur

---

## [Phase 2 / Slice C] - 2025-12

### Hinzugefügt
- **TeamDeal-Fallback-Logik**
  - `resolveTeamDealPricing()` – Berechnet effektiven Preis basierend auf Prime-Status
  - Fallback auf Smart Business Plus (13€/1GB) ohne Prime
  - `primeOnAccount` Flag in `MobileState`

- **GigaKombi-Berechtigung**
  - `checkGKEligibility()` – Prüft Konvergenz-Berechtigung
  - `gkEligible` Flag im `CalculationResult`
  - Prime + Festnetz (Cable/DSL/Fiber) = Unlimited-Upgrade möglich

- **Erneuerungs-Provisionen**
  - `provisionRenewal` in `MobileTariff`
  - Unterschiedliche Provisionen für Neuvertrag vs. Verlängerung

### Geändert
- `calculateMobileMonthlyForMonth()` unterstützt `primeOnAccount` Parameter
- `calculateDealerEconomics()` berücksichtigt `contractType`

---

## [Phase 2 / Slice B] - 2025-12

### Hinzugefügt
- **Zeitbasierte Promo-Validierung**
  - `isPromoValid()` – Prüft Promo gegen `asOfISO` Datum
  - `isFixedPromoValid()` – Für Festnetz-Promos
  - `validFromISO`, `validUntilISO` in Promo-Typen

- **ABS_OFF_BASE Promo-Typ**
  - Absoluter Rabatt auf Grundpreis (z.B. −10€/Monat)
  - `amountNetPerMonth` Feld in Promo

- **Deterministische Berechnungen**
  - `asOfISO` in `OfferOptionMeta` für reproduzierbare Ergebnisse
  - Keine `new Date()` Aufrufe in Berechnungen

- **Period-Merging**
  - `mergePeriodsWithSamePrice()` – Vermeidet unnötige Perioden-Splits

### Geändert
- Breakdown zeigt "Promo abgelaufen" wenn Aktion nicht mehr gültig

---

## [Phase 2] - 2025-11

### Hinzugefügt
- **Business-Datensatz 2025-09**
  - Vollständige Prime-Tarife (XS, S, M, L, XL)
  - TeamDeal-Tarife mit Staffelrabatten
  - Smart Business Tarife
  - Cable, DSL, Fiber, Komfort Festnetz-Produkte

- **Catalog Resolver**
  - `getCatalog()` – Versionierte Katalog-Auswahl
  - `getActiveDataset()` – localStorage-Override für Custom-Daten
  - `listFixedNetByAccessType()` – Gefilterte Produktlisten

- **Data Manager**
  - XLSX/CSV Import für Hardware-Preise
  - Canonical Format für Datennormalisierung
  - Diff-Berechnung für Import-Vorschau
  - localStorage-Persistenz

- **Hardware-Katalog**
  - `HardwareItem` Typ mit EK-Preisen
  - Import aus Excel-Dateien
  - Sortierung nach `sortOrder`

### Geändert
- `OfferOptionMeta.datasetVersion` steuert Katalog-Auswahl
- Festnetz-Breakdown aufgeteilt in Bereitstellung + Versand

---

## [Phase 1] - 2025-10

### Hinzugefügt
- **Basis-Engine**
  - `calculateOffer()` – Hauptberechnungsfunktion
  - `Period`-basierte Kostenberechnung
  - `BreakdownItem` für Transparenz

- **Dummy-Katalog**
  - Test-Tarife für Entwicklung
  - Einfache Promos (PCT_OFF_BASE, INTRO_PRICE)

- **Wizard UI**
  - 4-Schritt-Prozess: Hardware → Mobilfunk → Festnetz → Vergleich
  - Kunden- und Dealer-Ansicht
  - KPI-Zusammenfassung

- **Typsystem**
  - Vollständige TypeScript-Typen für alle Domänen
  - `OfferOptionState` als zentrale Eingabe
  - `CalculationResult` als strukturierte Ausgabe
