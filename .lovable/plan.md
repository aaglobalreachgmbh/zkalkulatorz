

# Plan: Kompletter visueller Neuaufbau /wizard nach Screenshot-Vorlage

## Analyse: Was stimmt nicht?

Das aktuelle Layout hat zwar die richtige Grundstruktur (Shell + Sidebar + Steps), aber die visuelle Ausfuehrung weicht stark vom Screenshot-Design ab. Das gesamte Styling muss von Grund auf neu geschrieben werden - nicht angepasst, sondern ersetzt.

## Design-Referenz (aus Screenshots)

### Screenshot 1 (screen-3.png):
- Weisse, grossflaechige Produktkarten mit Bild LINKS (ca. 150px) und Details RECHTS
- Gruppierung: "Smartphones" / "Tablets" als grosse Ueberschriften
- Badges: Gruener "Stock Available", grauer "24 Month Contract"
- Preise: "MONTHLY 79.99 EUR" links, "ONE-TIME 1.00 EUR" rechts
- Roter "Add to Offer" Button volle Breite unter jedem Produkt
- Rechte Sidebar: Zwei getrennte weisse Boxen (Customer Totals + Dealer Margins)
- Step-Bar: Einfacher Text "Step 1: Hardware Selection - Step 1 Alt"

### Screenshot 2 (screen-4.png):
- Kompaktere Karten: Bild links (80px), Name + Specs + Monthly + "Add to Offer" Button rechts
- Gruppierung nach Marke: Apple, Samsung, SIM-Only
- Step-Indicator als dunkler Pill-Button
- Sidebar: "DEALER MODE OVERVIEW" mit Lock-Icon, "INTERNAL ONLY"
- "Proceed to Step 2" roter Button unten rechts

## Dateien die komplett neu geschrieben werden

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1 | `CalculatorShell.tsx` | Komplett neues Layout mit Top-Navigation-Bar im Vodafone-Stil |
| 2 | `SummarySidebar.tsx` | Exakt nach Screenshot: Customer Totals Box + Dealer Margins Box + PDF Buttons |
| 3 | `OfferBasketPanel.tsx` | Schlanker, weniger dominant |
| 4 | `Wizard.tsx` | Nur der JSX-Return - Step-Content mit neuem Card-Layout |
| 5 | `ModeSelector.tsx` | Minimale visuelle Anpassung |
| 6 | `MobileActionFooter.tsx` | An neues System angepasst |

## Dateien die NICHT geaendert werden (Black Box)

- `CalculatorContext.tsx`
- `OfferBasketContext.tsx`
- `engine/*`
- `steps/hardware/*` (Sub-Komponenten)
- `steps/mobile/*` (Sub-Komponenten)
- `FixedNetStep.tsx`
- `ActionMenu.tsx`
- `PdfDownloadButton.tsx`
- `AnimatedCurrency.tsx`

## Technische Details

### Phase 1: CalculatorShell.tsx
Neues Layout-Grid exakt nach Screenshot:
- Header 64px: Logo-Bereich links, Nav-Links mitte (Dashboard, New Offer, Configuration, Basket), Icons rechts
- Step-Bar darunter: Dunkler Pill "Step 1: Hardware Selection" links, Search-Input rechts
- Content Grid: `grid-cols-[1fr_340px]` - Main scrollbar, Sidebar fixed
- Kein border-radius auf dem Hauptcontainer, clean flat design

### Phase 2: SummarySidebar.tsx
Exakt nach Screenshot aufgebaut:
- Box 1 "CUSTOMER TOTALS": Caps-Titel, drei Zeilen (Avg. Monthly / One-Time Costs / 24-Month Total), Werte rechts, 24-Month Total in Rot und groesser, Fussnote
- Box 2 "DEALER MARGINS": Lock-Icon + "INTERNAL ONLY" Badge rot oben rechts, Total Margin + Total Provision
- PDF Buttons: Roter "Kundenangebot PDF" Button, Outline "Haendler-Uebersicht PDF"
- Help-Link: "Need help calculating margins?"

### Phase 3: Wizard.tsx JSX-Neuschrieb
- Step-Content ohne Card-Wrapper (die Steps selbst liefern ihre Karten)
- "Proceed to Step 2" Button am Ende, rot, rechtsbuendig
- PricePeriodBreakdown und ValidationWarning bleiben

### Phase 4: Build-Fehler beheben
- Die Test-Dateien `AdminGuard.test.tsx` und `ViewModeGuards.test.tsx` haben Import-Fehler (`screen` aus `@testing-library/react`). Diese werden geloescht oder der Import korrigiert.

### Phase 5: Anti-Lazy Knowledge Update
- `.lovable/rules.md` wird aktualisiert mit dem V2 Protokoll

## Ausfuehrungsreihenfolge

1. `CalculatorShell.tsx` - Layout-Grundgeruest
2. `SummarySidebar.tsx` - Rechte Sidebar
3. `OfferBasketPanel.tsx` - Korb-Widget
4. `Wizard.tsx` - Hauptdatei JSX
5. `MobileActionFooter.tsx` - Mobile Footer
6. Test-Dateien Build-Fehler beheben
7. `.lovable/rules.md` - Knowledge Update

## Ergebnis

Die /wizard Seite wird visuell komplett dem Screenshot-Design entsprechen: Clean, flat, weiss-dominiert, mit prominenten Produktkarten und einer klaren rechten Sidebar fuer Preise und Margen. Das alte Design wird nicht mehr erkennbar sein.

