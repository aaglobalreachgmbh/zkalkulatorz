# MargenKalkulator - Business Purpose

> Zuletzt aktualisiert: 2026-01-06

## Problem Statement

Vodafone Business Partner (allenetze.de) benötigen ein internes Tool zur:
- **Transparenten Kalkulation** von Geschäftskunden-Angeboten
- **Echtzeit-Berechnung** während Kundengesprächen
- **Marge-Kontrolle** vor Angebotsabgabe

### Kernversprechen
Ein Mitarbeiter kann innerhalb von **2-3 Minuten** ein vollständiges Angebot kalkulieren, dem Kunden transparent präsentieren und gleichzeitig seine eigene Marge im Blick behalten.

---

## User Personas

| Persona | Rolle | Primäre Nutzung | Zugriff |
|---------|-------|-----------------|---------|
| **Sales Agent** | `sales` | Erstellt Angebote im Kundengespräch, Vergleich von Optionen | Wizard, Kunden-Modus |
| **Team Lead** | `manager` | Prüft Margen bei Sonderkonditionen, Coaching, Freigaben | Dealer-Modus, Reports |
| **Shop Owner** | `admin` | Strategische Preisgestaltung, Datenimport, Team-Verwaltung | Admin-Bereich, Imports |

---

## "10-Sekunden-Regel"

> Was muss die UI **sofort** zeigen, wenn ein Angebot konfiguriert ist?

### Customer Mode (Kundensicht)

| Priorität | KPI | Erklärung |
|-----------|-----|-----------|
| 1 | **Ø Monatspreis** | Durchschnitt über 24 Monate (brutto) |
| 2 | **Einmalkosten** | Anschluss + Hardware (falls nicht amortisiert) |
| 3 | **Gesamtkosten 24M** | Summe aller Kosten über Laufzeit |

### Dealer Mode (Händlersicht)

| Priorität | KPI | Erklärung |
|-----------|-----|-----------|
| 1 | **Marge** | Netto-Ertrag nach Hardware-EK und Abzügen |
| 2 | **Margin-Status** | Traffic Light (🟢 gut / 🟡 knapp / 🔴 Verlust) |
| 3 | **Provision** | Basis-Provision vor/nach Abzügen |
| 4 | **Ø Monatspreis** | Für Kundenreferenz |

---

## Success Criteria

| Kriterium | Messung | Zielwert |
|-----------|---------|----------|
| Angebotserstellung | Zeit von Start bis "Speichern" | < 3 Minuten |
| Keine falschen Rabatte | Validation Engine Warnungen | 0 unbehandelte |
| Marge immer sichtbar | UI-Hierarchie im Dealer-Mode | 100% der Screens |
| Kundensicherheit | Customer Safety Lock aktiv | Keine Dealer-Daten sichtbar |
| Datenaktualität | Dataset-Status "published" | Immer aktuell |

---

## Failure States (Explizite Warnungen)

Die UI muss bei folgenden Zuständen **klar und unmissverständlich** warnen:

| Zustand | Schwere | UI-Reaktion |
|---------|---------|-------------|
| **Negative Marge** | 🔴 Error | Rot-Badge, Warnung "Verlustgeschäft" |
| **TeamDeal ohne Prime** | 🟠 Warn | "TeamDeal erfordert Prime auf Account" |
| **Promo abgelaufen** | 🟠 Warn | "Aktion seit DD.MM.YYYY nicht mehr gültig" |
| **OMO ohne Matrix-Wert** | 🟡 Info | "Fallback auf %-Berechnung" |
| **Hardware ohne SUB** | 🟡 Info | "SUB-Variante empfohlen für Hardware" |
| **Dataset nicht published** | 🟡 Info | "Entwurfs-Daten – nicht für Kunden" |
| **Kein Tarif gewählt** | ⚪ Block | "Bitte Tarif auswählen" |

---

## Scope v1

### In Scope ✅

| Modul | Beschreibung |
|-------|--------------|
| **Hardware** | Smartphones, Tablets, Wearables (EK-Kalkulation) |
| **Mobile** | Business Prime, Business Smart, TeamDeal |
| **Fixed Net** | Cable, DSL, Fiber, Komfort (Internet) |
| **Compare** | Option A vs Option B nebeneinander |
| **GigaKombi** | Automatischer Rabatt bei Festnetz + Mobilfunk |

### Explizit NOT in Scope ❌

| Modul | Grund | Geplant |
|-------|-------|---------|
| **UC (Unified Communications)** | Separate Komplexität | Phase 2 |
| **IoT/M2M** | Andere Zielgruppe | Phase 2 |
| **VoIP (RingCentral)** | Separate Provisionierung | Phase 2 |
| **Private Tarife** | Nur Business | Nie |

---

## Entscheidungsprinzipien

### 1. Customer Safety First
Wenn Kundensitzung aktiv → **ALLE** sensiblen Dealer-Daten versteckt. Keine Ausnahmen.

### 2. Explainability
Jeder Rabatt/Aufschlag erscheint als eigene Zeile im Breakdown. Keine "magischen" Endsummen.

### 3. Vodafone "Latest Truth"
Zahlen kommen aus:
1. Hochgeladenen Datasets (SalesWorld/E-Mail)
2. Cloud-synchronisierten Daten
3. Bundled Fallback (nur wenn nichts anderes)

**InfoDok/vodafone.de sind Referenz, nicht Source!**

### 4. No UI Clutter
- Minimale Seiten
- Starke visuelle Hierarchie
- "3rd-grade usability" – jeder muss es verstehen

### 5. Responsive First
- Kein horizontaler Scroll auf Desktop (≥1024px)
- Tabellen scrollen innerhalb ihrer Container
