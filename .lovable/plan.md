

# Plan: Kompletter UI/UX-Neuaufbau der /wizard Seite

## Zusammenfassung

Die gesamte UI-Schicht der Kalkulator-Seite wird von Grund auf neu geschrieben, orientiert am hochgeladenen Design (clean product cards mit Bild, "Add to Offer" Buttons, Step-Navigation oben, rechte Sidebar mit Customer Totals + Dealer Margins + PDF-Buttons). Die Business-Logik (CalculatorContext, Engine, Hooks) bleibt komplett unangetastet.

---

## Design-Ziel (aus den Screenshots)

```text
+------------------------------------------------------------------+
| NAVBAR: Vodafone Logo | MargenKalkulator | Dashboard | New Offer  |
|        | Configuration | Basket | [Bell] [Avatar]                |
+------------------------------------------------------------------+
| Step 1: Hardware Selection  -  Step 1 Alt        [Search...]      |
+------------------------------------------------------------------+
|                                    |                              |
|  Smartphones                       |  CUSTOMER TOTALS             |
|  ┌────────────┐ ┌────────────┐    |  Avg. Monthly:    0.00 EUR   |
|  │  [Image]   │ │  [Image]   │    |  One-Time Costs:  0.00 EUR   |
|  │ iPhone 14  │ │ Galaxy S23 │    |  24-Month Total:  0.00 EUR   |
|  │ Specs...   │ │ Specs...   │    |  *Includes all discounts     |
|  │ MONTHLY    │ │ MONTHLY    │    |                              |
|  │ 79.99 EUR  │ │ 59.99 EUR  │    |  INTERNAL ONLY               |
|  │[Add to Off]│ │[Add to Off]│    |  DEALER MARGINS              |
|  └────────────┘ └────────────┘    |  Total Margin:    0.00 EUR   |
|                                    |  Total Provision: 0.00 EUR   |
|  Tablets                           |                              |
|  ┌────────────┐                    |  [Kundenangebot PDF]  (red)  |
|  │  [Image]   │                    |  [Haendler-Uebersicht PDF]   |
|  │ iPad Pro   │                    |                              |
|  │ 89.99 EUR  │                    |  Need help calculating?      |
|  │[Add to Off]│                    |                              |
|  └────────────┘                    |                              |
|                                    |                              |
|                  [Proceed to Step 2]                              |
+------------------------------------------------------------------+
```

### Kern-Design-Prinzipien (aus Screenshot):
- **Weisser Hintergrund** mit `bg-gray-50` fuer den Content-Bereich
- **Grosse Produkt-Karten** mit Bild links, Details rechts, roter "Add to Offer" Button
- **Gruppierung nach Kategorie** (Smartphones, Tablets, SIM-Only) statt Brand
- **Step-Indikator** oben links als einfacher Text (kein Stepper-Widget)
- **Suchfeld** oben rechts im Content-Bereich
- **Rechte Sidebar** mit zwei getrennten Boxen:
  1. "CUSTOMER TOTALS" (weiss, sauber)
  2. "DEALER MARGINS" (mit "INTERNAL ONLY" Badge rot)
- **PDF-Buttons** direkt in der Sidebar (rot fuer Kunde, outline fuer Haendler)
- **"Proceed to Step 2"** als roter Button unten rechts
- **Kein Akkordeon** - Steps sind volle Seiten mit Navigation

---

## Architektur-Entscheidung

```text
BLEIBT UNANGETASTET (Black Box):
  - CalculatorContext.tsx (State + Business Logic)
  - OfferBasketContext.tsx (Basket-State)
  - engine/* (Berechnungen, Katalog)
  - hooks/* (useEmployeeSettings, usePushProvisions, etc.)
  - steps/hardware/HardwareStep.tsx + Sub-Komponenten
  - steps/mobile/MobileStep.tsx + Sub-Komponenten
  - steps/FixedNetStep.tsx

WIRD VON GRUND AUF NEU GESCHRIEBEN:
  1. CalculatorShell.tsx (Layout)
  2. SummarySidebar.tsx (Rechte Seite: Totals + Margins + PDFs)
  3. OfferBasketPanel.tsx (Korb-Widget in Sidebar)
  4. ModeSelector.tsx (Header-Dropdown vereinfacht)
  5. Wizard.tsx (Hauptdatei - Step-basiert statt Akkordeon)
  6. MobileActionFooter.tsx (Mobile Footer vereinfacht)
```

---

## Phase 1: CalculatorShell.tsx - Neues Layout

**Aenderung:** Kompletter Neuschrieb

Neues Layout:
- Header: Nur Titel "Kalkulator" links, Actions rechts (flacher, 56px statt 64px)
- Content-Area: `bg-gray-50`, breiterer Main-Bereich
- Sidebar: `380px`, `bg-white`, mit eigenem internen Scroll
- Kein Akkordeon-Zwang mehr - Children werden direkt gerendert
- Step-Indikator als einfache Text-Zeile unter dem Header

---

## Phase 2: SummarySidebar.tsx - Kompletter Neuaufbau

**Design aus Screenshot:**

Box 1 - "CUSTOMER TOTALS":
- Titel in Caps, bold
- Drei Zeilen: "Avg. Monthly" / "One-Time Costs" / "24-Month Total"
- Werte rechtsbuendig, grau wenn 0, schwarz/rot wenn aktiv
- Fussnote: "*Includes all discounts and taxes"

Box 2 - "DEALER MARGINS" (mit "INTERNAL ONLY" Badge):
- Nur sichtbar wenn `showDealerEconomics`
- "Total Margin" und "Total Provision"
- Roter Badge "INTERNAL ONLY" oben rechts

Box 3 - PDF Buttons:
- "Kundenangebot PDF" - Volle Breite, roter Button
- "Haendler-Uebersicht PDF" - Volle Breite, Outline-Button
- "Need help calculating margins?" Link unten

---

## Phase 3: OfferBasketPanel.tsx - Vereinfacht

- Amber-Header bleibt (funktioniert gut)
- Schlichter gestaltet, weniger Animation
- Direkt unter der SummarySidebar in der rechten Spalte

---

## Phase 4: Wizard.tsx - Von Akkordeon zu Step-Pages

**Groesste Aenderung:** Statt Akkordeon werden Steps als volle Seiten gerendert.

```typescript
// Statt Accordion mit allen Steps gleichzeitig:
{activeSection === "hardware" && <HardwareStep ... />}
{activeSection === "mobile" && <MobileStep ... />}
{activeSection === "fixedNet" && <FixedNetStep ... />}
```

- Step-Indikator oben: `Step 1: Hardware Selection - Step 1 Alt`
- Suchfeld rechts neben Step-Indikator (fuer Hardware)
- "Proceed to Step 2" Button am Ende jeder Sektion (rot, prominent)
- Alle bestehenden Hooks und Callbacks bleiben identisch
- Nur der JSX-Return wird komplett neu geschrieben

---

## Phase 5: ModeSelector.tsx - Vereinfacht

- Einfacherer Dropdown-Style
- Gleiche Funktionalitaet (Haendler/Kunde/Kundensitzung)
- Visuell schlanker

---

## Phase 6: MobileActionFooter.tsx - Anpassung an neues Design

- Angepasst an das neue visuelle System
- Gleiche Funktionalitaet

---

## Phase 7: Knowledge-Update

Neuer Text fuer `.lovable/rules.md`:

```
# ANTI-LAZY DEVELOPMENT PROTOCOL V2

## Grundprinzip
Jede Code-Aenderung wird mit maximaler Praezision durchgefuehrt.
Keine Abkuerzungen, keine "// ... keep existing code" wenn der Code
tatsaechlich geaendert werden muss, keine TODO-Kommentare.

## Regeln
1. STOP-ON-FAIL: Bei Build-Fehlern sofort stoppen und beheben
2. NO-TOUCH-LOGIC: Engine/Berechnungen/Context sind eine Black Box
3. VOLLSTAENDIGKEIT: Jeder Plan wird zu 100% abgearbeitet
4. INKREMENTELL: Kleine Schritte, Build-Check nach jedem Schritt
5. PIXEL-GENAU: UI muss dem Referenz-Design entsprechen
6. IMPORT-CHECK: Jeder Import wird auf Existenz geprueft
7. PROP-CHECK: Jeder Prop wird gegen das Interface validiert
8. KEIN HALLUZINIEREN: Keine erfundenen Komponenten oder Props
9. ANTI-LAZY: Lieber 3 praezise Nachrichten als 1 schlampige
10. FEHLER-FREI: Jede Datei muss fehlerfrei kompilieren
```

---

## Ausfuehrungsreihenfolge

| Schritt | Datei | Beschreibung |
|---------|-------|-------------|
| 1 | `CalculatorShell.tsx` | Neues Layout-Grid |
| 2 | `SummarySidebar.tsx` | Customer Totals + Dealer Margins + PDFs |
| 3 | `OfferBasketPanel.tsx` | Vereinfachter Korb |
| 4 | `ModeSelector.tsx` | Schlanker Dropdown |
| 5 | `MobileActionFooter.tsx` | Angepasster Footer |
| 6 | `Wizard.tsx` | Step-Pages statt Akkordeon |
| 7 | `.lovable/rules.md` | Anti-Lazy Protocol V2 |

---

## Scope-Abgrenzung

- NUR die /wizard Route wird umgebaut
- KEINE Aenderungen an CalculatorContext, Engine, Hooks
- KEINE Aenderungen an HardwareStep/MobileStep/FixedNetStep Sub-Komponenten
- Die Sub-Komponenten (HardwareGrid, TariffGrid, etc.) werden als Black Box eingebunden
- Mehrere Nachrichten noetig - Phase 1-3 zuerst, dann 4-7

---

## Hinweis

Da dies ein umfangreicher Neuaufbau ist, wird die Implementierung ueber **mehrere aufeinanderfolgende Nachrichten** erfolgen. Jede Nachricht behandelt 2-3 Dateien mit Build-Validierung. Das ist der Anti-Lazy-Ansatz.

