

# Plan: Step 2 Mobilfunk - Kompakt-Optimierung

## Problem

Die Seite ist zu lang. Der Ablauf "Tarif auswaehlen -> unten scrollen -> Konfiguration -> wieder hoch" ist umstaendlich. Die InlineTariffConfig-Box erscheint ganz unten und macht die Seite unnoetig lang.

## Loesung: Zwei-Phasen-Ansicht

Wenn ein Tarif per "Zum Angebot" ausgewaehlt wird, ERSETZT die Konfigurations-Box (SUB-Klasse, OMO, Rabatte, Preis) das Tarif-Grid. Der User sieht dann NUR die Konfiguration fuer den gewaehlten Tarif. Nach Klick auf "Hinzufuegen" kehrt er zurueck zum Grid oder kann zur naechsten Phase wechseln.

```text
PHASE A: Tarif-Auswahl (kompakt)
================================
Tarifkonfiguration
Konfigurieren Sie Sprach- und Datentarife.

[Business Prime] [Business Smart] [GigaMobil]
[Anzahl SIMs: 25] [Neuvertrag] [Aktion: Keine]

Verfuegbare Tarife (3 Tarife)
[Prime Go 29.99] [Prime Pro 49.99] [Prime Max 79.99]
      [Zum Angebot]  [Zum Angebot]    [Zum Angebot]


PHASE B: Tarif-Konfiguration (ersetzt Grid)
============================================
Tarifkonfiguration
Konfigurieren Sie Sprach- und Datentarife.

[Business Prime] [Business Smart] [GigaMobil]
[Anzahl SIMs: 25] [Neuvertrag] [Aktion: Keine]

+--------------------------------------------------+
| < Zurueck zur Tarifauswahl                       |
|                                                  |
| Business Prime Pro ausgewaehlt          49.99 EUR|
|                                                  |
| Geraeteklasse (SUB): [SIM-Only] [Premium] [...]  |
| Rabatt: [Kein] [-20%] [3M gratis]                |
| OMO-Rate: [0%] [5%] [10%] [15%]                 |
|                                                  |
| Oe Monatspreis: 42.50 EUR    Marge: +120 EUR     |
|                                                  |
| [====== Zum Angebot hinzufuegen ======]          |
+--------------------------------------------------+
```

## Technische Umsetzung

### Phase 1: `MobileStep.tsx` - Zwei-Phasen-State einfuehren

- Neuer State: `configPhase: "select" | "configure"`
- Wenn `configPhase === "select"`: Tabs + Konfig-Box + TariffGrid anzeigen (wie jetzt)
- Wenn `configPhase === "configure"`: Tabs + Konfig-Box + InlineTariffConfig anzeigen (Grid wird NICHT gerendert)
- Klick auf "Zum Angebot" in TariffCard setzt `configPhase = "configure"` und waehlt den Tarif
- "Zurueck zur Tarifauswahl" Button setzt `configPhase = "select"` zurueck
- Nach erfolgreichem Hinzufuegen: `configPhase = "select"` zuruecksetzen

### Phase 2: `TariffCard.tsx` - Kompakter machen

- Padding und Margins reduzieren (p-4 statt p-5)
- Feature-Liste auf 2 Zeilen begrenzen statt 3
- Preis und CTA-Button in eine Zeile (nebeneinander statt uebereinander)
- Gesamthoehe der Karte deutlich reduziert

### Phase 3: `TariffGrid.tsx` - Kompakter

- Gap von 6 auf 4 reduzieren
- Ueberschrift kleiner (text-base statt text-lg)

### Phase 4: `ContractQuantitySelector.tsx` - Kompakter

- Padding reduzieren (p-4 statt p-6, gap-6 statt gap-8)
- Hilfstexte entfernen (weniger Platz)

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `MobileStep.tsx` | configPhase State, bedingte Anzeige Grid vs. Config |
| `TariffCard.tsx` | Kompakteres Layout, weniger Padding |
| `TariffGrid.tsx` | Kleinerer Gap und Ueberschrift |
| `ContractQuantitySelector.tsx` | Weniger Padding und Hilfstexte |

## Dateien die NICHT geaendert werden

- `InlineTariffConfig.tsx` (Black Box - wird weiterhin als Ganzes gerendert)
- Engine, Context, Wizard (Black Box)

## Ergebnis

Die Seite passt auf einen Bildschirm ohne Scrollen. Der Ablauf ist: Tarif waehlen -> Konfiguration erscheint AN GLEICHER STELLE -> Hinzufuegen -> Fertig. Keine lange Seite mehr.

