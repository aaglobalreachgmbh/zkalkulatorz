
# Plan: Step 2 Mobilfunk - Komplett-Neuaufbau nach Screenshot-Vorlage

## Design-Referenz (aus Screenshots + HTML)

### Screenshot screen-10.png (Hauptreferenz):
- **Titel**: "Tariff Configuration" gross, darunter "Configure customer voice and data plans."
- **Tarif-Familie als Tabs**: "Business Prime" | "Business Smart" | "GigaMobil" als horizontale Tab-Leiste mit Icons, aktiver Tab hat rote Unterstreichung
- **Konfigurations-Box**: Weisser Container mit 3 Spalten:
  - **Spalte 1**: "Number of SIMs" mit Slider + Zahl-Input, Hilfstext "Drag to adjust quantity for volume discounts."
  - **Spalte 2**: "Contract Type" mit Radio-Buttons (New Contract + "High Margin" Badge gruen, Contract Renewal VVL, Porting DC Change)
  - **Spalte 3**: "Apply Promotion" mit Dropdown-Select + Tag-Icon, Hilfstext "Select applicable campaign code."
- **Tarif-Karten** darunter: "Available Plans" als Ueberschrift, dann 3 Karten nebeneinander:
  - Tarif-Name gross + bold, Daten-Badge rechts oben (z.B. "5GB Data", "Unlimited")
  - Subtitle ("For basic connectivity", "The all-rounder", "Maximum performance")
  - Feature-Liste mit gruenen Checkmarks und grauen X
  - "Monthly" Label + grosser Preis (29.99 EUR) + roter "Add to Offer" Button
  - Bestseller-Badge (roter Pill oben rechts) fuer hervorgehobenen Tarif mit rotem Border

### Screenshot screen-9.png (Alternative Variante):
- Drei separate Karten fuer Business Prime / Smart / GigaMobil nebeneinander
- Jede Karte hat: SIM-Only/Smartphone SUB Radio-Toggle, Quantity Slider, Promos Dropdown
- Feature-Liste unten in jeder Karte

## Kombination beider Designs

Wir implementieren das **screen-10.png Layout** als primaere Struktur (Tabs + Konfig-Box + Tarif-Karten), da es besser zum bestehenden Wizard-Flow passt.

## Dateien die komplett neu geschrieben werden

| Nr | Datei | Was passiert |
|----|-------|-------------|
| 1 | `MobileStep.tsx` | Komplett neuer JSX mit Tab-Layout, Konfig-Box, und Tarif-Karten |
| 2 | `TariffCard.tsx` | Komplett neu als vertikale Feature-Karte nach Screenshot |
| 3 | `TariffGrid.tsx` | Vereinfacht als 3-Spalten Grid fuer die neuen Karten |
| 4 | `ContractQuantitySelector.tsx` | Komplett neu als 3-Spalten Inline-Layout (SIMs + Contract Type + Promo) |

## Dateien die NICHT geaendert werden (Black Box)

- `CalculatorContext.tsx` (State)
- `InlineTariffConfig.tsx` (wird weiterhin nach Tarif-Auswahl angezeigt)
- `PortfolioSelector.tsx` (wird durch inline Tab-Leiste ERSETZT, nicht mehr importiert)
- `LeadTimeInput.tsx` (wird bei Business weiterhin angezeigt)
- `engine/*` (Berechnungslogik)
- `Wizard.tsx` (Orchestrator - keine Aenderung)

## Neues Layout

```text
Tarifkonfiguration
Konfigurieren Sie Sprach- und Datentarife.

[Business Prime]  [Business Smart]  [GigaMobil]     <- Tabs
=========================================================
| Anzahl SIMs      | Vertragsart          | Aktion     |
| [====]  25       | (o) Neuvertrag       | [Spring..] |
|                   |     High Margin      |            |
| Drag to adjust   | ( ) VVL              | Kampagnen- |
|                   | ( ) Portierung       | code       |
=========================================================

Verfuegbare Tarife
+-------------------+  +-------------------+  +-------------------+
| Business Prime Go |  | Business Prime    |  | Business Prime    |
|          [5GB]    |  |   Pro  [Unlim.]   |  |   Max [Unlim.+]   |
| Basis-Konnektivit.|  | Der Allrounder    |  | Maximum Leistung  |
|                   |  |     BESTSELLER    |  |                   |
| v 5G Enabled      |  | v Unlimited 5G    |  | v Unlimited Max   |
| v EU Roaming      |  | v EU & US Roaming |  | v Global Roaming  |
| x MultiSIM        |  | v 1x MultiSIM    |  | v 3x MultiSIM    |
|                   |  |                   |  |                   |
| Monatlich         |  | Monatlich         |  | Monatlich         |
| 29.99 EUR [Add]   |  | 49.99 EUR [Add]   |  | 79.99 EUR [Add]   |
+-------------------+  +-------------------+  +-------------------+

[InlineTariffConfig erscheint hier wenn Tarif ausgewaehlt]
```

## Technische Umsetzung

### Phase 1: `ContractQuantitySelector.tsx` komplett neu

Neues 3-Spalten Layout exakt nach Screenshot:
- Spalte 1: "Anzahl SIMs" mit `input[type=range]` (roter Thumb) + Number-Input rechts
- Spalte 2: "Vertragsart" mit 3 Radio-Buttons (Neuvertrag + gruener "High Margin" Badge, VVL, Portierung/DC Change)
- Spalte 3: "Aktion waehlen" mit Select-Dropdown + Tag-Icon, bekommt `promos` als neue Prop
- Props erweitert um: `promos`, `selectedPromoId`, `onPromoChange`

### Phase 2: `TariffCard.tsx` komplett neu

Vertikale Feature-Karte nach Screenshot:
- Header: Tarif-Name (bold, gross) + Daten-Badge rechts oben (z.B. "5GB Data")
- Subtitle: Kurzbeschreibung
- Feature-Liste: 3 Zeilen mit gruenen Check-Icons oder grauen X-Icons
- Footer: "Monatlich" Label + grosser Preis + roter "Zum Angebot" Button
- Optional: "Bestseller" Badge (roter Pill oben rechts, border-2 border-primary/20)
- Selected State: Gruener Border + Checkmark

### Phase 3: `TariffGrid.tsx` vereinfacht

- Einfaches `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Ueberschrift "Verfuegbare Tarife" davor
- Loading/Empty States beibehalten

### Phase 4: `MobileStep.tsx` komplett neu

Gesamtstruktur:
1. **Header**: "Tarifkonfiguration" (h1) + "Konfigurieren Sie Sprach- und Datentarife." (p)
2. **Portfolio-Tabs**: Eigene Tab-Leiste inline (ersetzt PortfolioSelector-Import), 3 Tabs mit Icons:
   - Business Prime (Briefcase Icon)
   - Business Smart (Smartphone Icon)
   - GigaMobil (Wifi Icon)
   - Aktiver Tab: `border-b-2 border-primary text-primary bg-white`
3. **Konfigurations-Box**: Weisser Container mit neuem ContractQuantitySelector (3-Spalten)
4. **LeadTimeInput**: Nur bei Business sichtbar (bestehendes Verhalten)
5. **TariffGrid**: Gefilterte Tarife als neue vertikale Karten
6. **InlineTariffConfig**: Erscheint weiterhin nach Tarif-Auswahl (unveraendert)
7. **TeamDeal-Warnung**: Bestehendes Verhalten beibehalten

### Phase 5: Sprache komplett Deutsch

Alle Texte auf Deutsch:
- "Tariff Configuration" -> "Tarifkonfiguration"
- "Configure customer voice and data plans." -> "Konfigurieren Sie Sprach- und Datentarife."
- "Number of SIMs" -> "Anzahl SIMs"
- "Contract Type" -> "Vertragsart"
- "New Contract" -> "Neuvertrag"
- "Contract Renewal (VVL)" -> "Vertragsverlaengerung (VVL)"
- "Porting (DC Change)" -> "Portierung (DC Change)"
- "Apply Promotion" -> "Aktion waehlen"
- "Available Plans" -> "Verfuegbare Tarife"
- "Add to Offer" -> "Zum Angebot"
- "Monthly" -> "Monatlich"
- "Bestseller" bleibt (internationaler Begriff)

## Ausfuehrungsreihenfolge

1. `ContractQuantitySelector.tsx` - Neues 3-Spalten Layout mit Promo-Integration
2. `TariffCard.tsx` - Vertikale Feature-Karte
3. `TariffGrid.tsx` - Vereinfachtes Grid
4. `MobileStep.tsx` - Komplett neuer Orchestrator mit Tabs

## Ergebnis

Step 2 wird komplett nach Screenshot-Vorlage aufgebaut: Tab-basierte Portfolio-Auswahl, 3-Spalten Konfigurations-Box (SIMs + Vertragsart + Aktion), und vertikale Tarif-Karten mit Feature-Listen und rotem CTA-Button. Das alte Design ist nicht mehr erkennbar.
