

# Plan: Step 2 Mobilfunk - Ultra-Kompakt Redesign

## Ziel

Die Mobilfunk-Seite wird radikal komprimiert, damit der gesamte Workflow (Tarif suchen, auswaehlen, konfigurieren, hinzufuegen) auf einem Bildschirm ohne Scrollen funktioniert. Eigene Verbesserungsvorschlaege aus Enterprise-SaaS-Kalkulatoren (Salesforce CPQ, DealHub, PandaDoc) fliessen ein.

## Aktueller Zustand

Die Zwei-Phasen-Logik (select/configure) existiert bereits. Probleme:
- TariffCards sind zu hoch (Features, Badges, Padding)
- ContractQuantitySelector nutzt zu viel vertikalen Platz
- InlineTariffConfig ist 500+ Zeilen und belegt den gesamten Bildschirm
- Header + Tabs + Config-Box + Grid = zu viele vertikale Ebenen

## Neue Architektur: "Rapid Config" Pattern

Inspiration aus Enterprise CPQ-Tools:

```text
+------------------------------------------------------------------+
| Tarifkonfiguration                                                |
| [Business Prime] [Business Smart] [GigaMobil]   [1x SIM] [NV|VVL]|
+------------------------------------------------------------------+
| Prime Go    5GB   29.99  [Waehlen]                                |
| Prime Pro   Unlim 49.99  [Waehlen]  <- Bestseller                 |
| Prime Max   Unlim 79.99  [Waehlen]                                |
+------------------------------------------------------------------+

Nach Klick auf "Waehlen":

+------------------------------------------------------------------+
| Tarifkonfiguration                                                |
| [Business Prime] [Business Smart] [GigaMobil]   [1x SIM] [NV|VVL]|
+------------------------------------------------------------------+
| < Zurueck | Prime Pro ausgewaehlt           Basis: 49.99 EUR/mtl. |
|------------------------------------------------------------------|
| SUB: [SIM-Only] [Standard] [Premium]    Aktion: [Keine v]        |
| OMO: [0%] [5%] [10%] [15%]             FH-Partner: [ ]           |
|------------------------------------------------------------------|
| Oe Monatspreis: 42.50 EUR    Marge: +120 EUR    [Hinzufuegen ->] |
+------------------------------------------------------------------+
```

## Aenderungen im Detail

### Phase 1: `MobileStep.tsx` - Inline Header-Bar

Tabs und Konfigurations-Controls (SIM-Anzahl, Vertragsart) werden in EINE horizontale Leiste zusammengefasst statt als separate Bloecke:

- Portfolio-Tabs links
- SIM-Anzahl (kompakt: nur Number-Input, kein Slider) + Vertragsart (Segmented Control statt Radio-Buttons) rechts
- Aktions-Dropdown nur in der Configure-Phase sichtbar (nicht im Grid)
- LeadTimeInput nur als kleines Inline-Badge sichtbar
- Spart ca. 80px vertikalen Platz

### Phase 2: `TariffCard.tsx` - Horizontale Zeile statt Karte

Enterprise-CPQ-Pattern: Tarife als kompakte Tabellenzeilen statt als grosse Karten:

- EINE Zeile pro Tarif: Name | Datenvolumen | Preis | CTA-Button
- Kein Feature-Listing, keine Subtitles (diese Infos kommen erst in der Configure-Phase)
- Bestseller-Badge als kleiner Dot/Pill inline
- Hoehe pro Tarif: ca. 48px statt 180px
- Gesamthoehe fuer 5 Tarife: ~250px statt ~600px

### Phase 3: `TariffGrid.tsx` - Tabellen-Layout

- Von Card-Grid zu kompakter Tabelle/Liste
- Keine grid-cols, sondern vertikale Liste mit Trennlinien
- Optional: Kompakter Header mit Spaltennamen (Tarif | Daten | Preis)

### Phase 4: `ContractQuantitySelector.tsx` - Wird aufgeloest

Die 3-Spalten-Box wird abgeschafft. Stattdessen werden die Controls direkt in den MobileStep-Header integriert:
- SIM-Anzahl: Kompakter Number-Stepper (- [1] +) inline
- Vertragsart: Zwei kleine Segment-Buttons (NV | VVL) inline
- Aktion: Dropdown nur in Configure-Phase

### Phase 5: Eigene Verbesserungen (Enterprise Best Practices)

1. **Keyboard Shortcuts**: Zifferntasten 1-5 zum schnellen Tarif-Auswaehlen (wie Salesforce CPQ)
2. **Hover-Preview**: Beim Hovern ueber einen Tarif zeigt ein Tooltip die Features + geschaetzte Marge
3. **Quick-Add**: Doppelklick auf Tarif fuegt direkt mit Default-Einstellungen hinzu (fuer Power-User)
4. **Visueller Fortschritt**: Kleine Anzahl-Badge neben "Tarifkonfiguration" zeigt bereits hinzugefuegte Tarife
5. **Auto-Scroll-to-Top**: Nach Hinzufuegen automatisch zurueck zur Auswahl ohne manuellen Klick

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `MobileStep.tsx` | Komplett neu: Inline-Header-Bar, schlankere Struktur |
| `TariffCard.tsx` | Von vertikaler Karte zu horizontaler Zeile |
| `TariffGrid.tsx` | Von Grid zu Tabellen-Liste |
| `ContractQuantitySelector.tsx` | Wird stark vereinfacht oder inline aufgeloest |

## Dateien die NICHT geaendert werden

- `InlineTariffConfig.tsx` (Black Box - wird weiterhin in Configure-Phase gerendert)
- Engine, Context, Wizard, OfferBasket (Black Box)

## Technische Details

### TariffCard als Zeile:
```text
[Signal-Icon] Business Prime Pro    [Unlimited Badge]    49.99 EUR/mtl.    [Waehlen ->]
```

### Header-Bar Layout:
```text
[Briefcase] Business Prime | [Phone] Smart | [Wifi] GigaMobil    [-] 1 [+] SIM    [NV|VVL]
```

### Vertragsart als Segmented Control:
Zwei nebeneinanderliegende Buttons mit Toggle-Verhalten statt Radio-Buttons. Der aktive Button ist rot hinterlegt.

## Ergebnis

- Gesamthoehe der Select-Phase: ca. 350px (vorher 600+)
- Kein Scrollen noetig auf 1366x768
- Schnellerer Workflow: 2 Klicks statt 4 zum Hinzufuegen
- Enterprise-Grade UX mit Keyboard-Shortcuts und Hover-Previews

