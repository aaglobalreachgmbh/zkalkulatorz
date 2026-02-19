

# Plan: Hardware-Seite (Step 1) komplett neu gestalten

## Design-Referenz (aus Screenshots)

Das neue Design zeigt zwei Varianten, die wir kombinieren:

### Screenshot 1 (screen-5.png) - Hauptreferenz:
- **Gruppierung nach Marke**: "Apple", "Samsung", "SIM-Only" als grosse, fette Ueberschriften
- **Horizontale Produkt-Karten**: Bild LINKS (ca. 100-120px), Details RECHTS
- **Karten-Layout**: 2 Karten pro Zeile, weisser Hintergrund, hellgrauer Rand, abgerundete Ecken
- **Karten-Inhalt**: Produktname (bold), Specs-Zeile (Farbe, Speicher, Datenvolumen), "Monthly" Label + Preis (bold), roter "Add to Offer" Button rechts unten
- **Suchfeld**: Oben rechts neben Step-Indicator, schlicht mit Lupe-Icon
- **Titel**: "Hardware Selection" gross, darunter "Configure customer devices and SIMs."
- **Step-Bar**: Dunkler Pill-Button "Step 1: Hardware Selection - Step 1 Alt"

### Screenshot 2 (screen-6.png) - Ergaenzung:
- **Gruppierung nach Kategorie**: "Smartphones", "Tablets" als Ueberschriften
- **Groessere Karten**: Bild links (ca. 150px hoch), Produktname rechts, Specs in Rot/Orange
- **Badges**: Gruener "Stock Available", grauer "24 Month Contract"
- **Zwei Preise**: "MONTHLY 79.99 EUR" links, "ONE-TIME 1.00 EUR" rechts
- **Voller roter "Add to Offer" Button** unter jedem Produkt

## Was wird neu geschrieben

| Datei | Aenderung |
|-------|-----------|
| `HardwareStep.tsx` | Komplett neuer JSX - Gruppierung nach Brand statt Grid |
| `HardwareGrid.tsx` | Wird NICHT mehr verwendet - ersetzt durch inline-Rendering |
| `HardwareCard.tsx` | Wird NICHT mehr verwendet - ersetzt durch neue horizontale Karte |
| `HardwareFilters.tsx` | Wird entfernt/vereinfacht - Suchfeld wird in den Wizard-Header integriert |
| `CollapsedHardwareSelection.tsx` | Bleibt, wird visuell angepasst |

## Was NICHT geaendert wird (Black Box)

- `hardwareGrouping.ts` (Gruppierungs-Logik)
- `catalogResolver.ts` (Hardware-Katalog)
- `useHardwareImages.ts` (Bild-Hook)
- `CalculatorContext.tsx` (State)
- `Wizard.tsx` (nur minimale Anpassung der Props)

## Neues Hardware-Layout

```text
Hardware Selection
Configure customer devices and SIMs.

Apple
+---------------------------+  +---------------------------+
| [Bild]  iPhone 16 Pro     |  | [Bild]  iPhone 16        |
|         Black, 128GB, 5G  |  |         Blue, 128GB, 5G  |
|         Monthly           |  |         Monthly           |
|         79.99 EUR  [Add]  |  |         59.99 EUR  [Add] |
+---------------------------+  +---------------------------+

Samsung
+---------------------------+  +---------------------------+
| [Bild]  Galaxy S24 Ultra  |  | [Bild]  Galaxy A55       |
|         256GB, 5G         |  |         128GB, LTE       |
|         Monthly           |  |         Monthly           |
|         84.99 EUR  [Add]  |  |         39.99 EUR  [Add] |
+---------------------------+  +---------------------------+

SIM-Only
+---------------------------+  +---------------------------+
| [SIM]   Smart Business S  |  | [SIM]   Business Data L  |
|         10GB, EU Roaming  |  |         Unlimited, 5G    |
|         Monthly           |  |         Monthly           |
|         19.99 EUR  [Add]  |  |         49.99 EUR  [Add] |
+---------------------------+  +---------------------------+
```

## Technische Umsetzung

### Phase 1: Neue `HardwareProductCard` Komponente erstellen

Neue Datei: `src/margenkalkulator/ui/steps/hardware/HardwareProductCard.tsx`

- Horizontale Karte: Bild links (100px), Details rechts
- Produktname bold, Specs-Zeile (Storage, Connectivity) darunter
- "Monthly" Label + Preis links unten
- Roter "Add to Offer" Button rechts unten
- Ausgewaehlter Zustand: Gruener Checkmark-Badge, leichter gruener Rand
- Props: `config: HardwareConfig`, `brand: string`, `familyName: string`, `imageUrl: string`, `isSelected: boolean`, `onSelect: () => void`

### Phase 2: `HardwareStep.tsx` komplett neu schreiben

- Header: "Hardware Selection" als h1, "Configure customer devices and SIMs." als Subtext
- Gruppierung: Items nach `family.brand` gruppieren, jede Brand-Gruppe als Sektion mit fetter Ueberschrift
- Grid pro Brand: `grid-cols-1 md:grid-cols-2` mit den neuen horizontalen Karten
- SIM-Only Sektion: Eigene Gruppe am Ende mit SIM-Karten-Icon
- Suchfeld bleibt als einfaches Input oben
- Keine Popover/Accordion mehr fuer Varianten-Auswahl - stattdessen wird jede Konfiguration als eigene Karte angezeigt (flach, wie im Screenshot)
- Filter-Tabs (Alle/Smartphones/Tablets) als einfache Buttons ueber dem Content
- Brand-Filter als Chips unter den Tabs

### Phase 3: `CollapsedHardwareSelection.tsx` visuell anpassen

- Gleiche horizontale Karten-Aesthetik
- Gruener Hintergrund-Akzent statt Primary-Farbe
- "Andere Hardware" Button bleibt

### Phase 4: Aufraeum-Arbeiten

- `HardwareGrid.tsx` und `HardwareCard.tsx` bleiben als Dateien bestehen (fuer potenzielle Rueckwaertskompatibilitaet), werden aber nicht mehr von HardwareStep importiert
- `HardwareFilters.tsx` wird vereinfacht oder durch inline-Filter im neuen HardwareStep ersetzt

## Wichtige Design-Details

- **Karten-Styling**: `bg-white border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-sm transition-all`
- **Bild-Container**: `w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center`
- **Brand-Ueberschrift**: `text-xl font-bold text-gray-900 mb-4`
- **Produktname**: `text-base font-semibold text-gray-900`
- **Specs**: `text-sm text-gray-500`
- **Monthly-Label**: `text-xs text-gray-400 uppercase tracking-wide`
- **Preis**: `text-lg font-bold text-gray-900`
- **Add-Button**: `bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg`
- **Selected-State**: `border-green-400 bg-green-50` mit gruener Checkmark

## Ergebnis

Die Hardware-Seite wird exakt dem Screenshot-Design entsprechen: Horizontale Karten gruppiert nach Marke, mit Bild links, Details rechts, und rotem "Add to Offer" Button. Keine Popovers, keine Akkordeons, keine verschachtelten Auswahl-Dialoge - jede Variante ist direkt sichtbar und mit einem Klick waehlbar.

