
# Plan: Step 1 Hardware - Ultra-Kompakt Redesign (CPQ-Pattern)

## Problem-Analyse

Der aktuelle Hardware Step hat folgende kritische Probleme:

1. **Zu viele vertikale Ebenen**: Dealer-Options Row + 2-spaltige Produktkarten + Amortisierungs-Box = zu lang
2. **Karten zu groß**: `HardwareProductCard` ist 140px × 140px Bild + Details + CTA = ~200px pro Karte
3. **Kein Zwei-Phasen-Flow**: Auswählen und "Konfigurieren" (amortize/Monatsbetrag) sind nicht getrennt
4. **Kein visueller Hersteller-Kontext**: Schwierig auf einen Blick zu sehen welches Gerät von welchem Hersteller stammt
5. **CollapsedHardwareSelection blendet Grid aus** — aber es gibt keine echte "Configure"-Phase wie im MobileStep

## Ziel

Identisches Zwei-Phasen-Pattern wie der MobileStep: Kompakter Header + horizontale Geräte-Zeilen (statt große Karten) → bei Auswahl erscheint Konfig-Box AN GLEICHER STELLE → "Hinzufügen" schliesst die Phase.

---

## Neue Architektur: "Device Rapid Select" Pattern

```text
PHASE A: Gerät wählen (kompakt, alles auf einen Blick)
=========================================================
Hardware-Auswahl                          [Im Monatspreis ○] [Hardware-Manager]
[Smartphones] [Tablets] [SIM-Only]          [Suche: iPhone...]
──────────────────────────────────────────────────────────
[●] Apple iPhone 16 Pro Max    256GB  5G    779.00 €  [Wählen]
    Apple iPhone 16 Pro Max    512GB  5G    879.00 €  [Wählen]
    Apple iPhone 16 Pro        256GB  5G    689.00 €  [Wählen]
──────────────────────────────────────────────────────────
[●] Samsung Galaxy S25 Ultra   256GB  5G    699.00 €  [Wählen]
──────────────────────────────────────────────────────────
[○] Google Pixel 9 Pro         128GB  5G    499.00 €  [Wählen]
──────────────────────────────────────────────────────────
    Samsung Galaxy Tab S9       128GB  WiFi  499.00 €  [Wählen]


PHASE B: Hardware konfigurieren (ersetzt die Liste)
=========================================================
Hardware-Auswahl                          [Im Monatspreis ●] [Hardware-Manager]
[Smartphones] [Tablets] [SIM-Only]

< Zurück zur Geräteauswahl

┌─────────────────────────────────────────────────────────┐
│ ✓ Apple iPhone 16 Pro Max 256GB                         │
│   EK: 779.00 €  ·  Hardware-Klasse: Premium             │
│─────────────────────────────────────────────────────────│
│ Amortisation: [○ Einmalig] [● Im Monatspreis]           │
│ Laufzeit: [24 Monate ▾]                                 │
│─────────────────────────────────────────────────────────│
│ Monatlicher Anteil: +32.46 €/Monat (über 24 Monate)    │
│                                                         │
│ [══════════════ Hardware übernehmen ══════════════]     │
└─────────────────────────────────────────────────────────┘
```

---

## Neue UI-Features (Enterprise Best Practices)

1. **Brand-Grouping mit Hersteller-Badge**: Jede Gerätzeile zeigt einen kleinen Hersteller-Chip (Apple / Samsung / Google) — auf einen Blick erkennbar welcher Hersteller
2. **Horizontale Tabellenzeilen** statt großer Produktkarten: `[Brand-Badge] Modell | Speicher | 5G | Preis | [Wählen]`
3. **Kategorie-Tabs**: `[Smartphones] [Tablets] [SIM Only]` als kompakte Toggle-Buttons oben — kein 2x24px Kategorie-Header mehr
4. **Inlinesuch-Input**: Kompakt im Header-Bereich, spart eine ganze Zeile
5. **Zwei-Phasen-Flow** (identisch zu MobileStep): Phase A = Auswahl-Liste, Phase B = Konfig-Box
6. **Konfig-Box in Phase B**: Zeigt Amortisierungs-Toggle, Laufzeit-Selector, monatlichen Betrag — kompakt und final bevor man bestätigt
7. **Keyboard-Shortcut Hint**: Kleine Hilfe-Anzeige wie beim MobileStep

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `HardwareStep.tsx` | Komplett neu: Header-Bar mit Category-Tabs + Suche, Zwei-Phasen-State, horizontale Geräteliste |
| `HardwareProductCard.tsx` | Wird zur kompakten horizontalen Zeile: `[Brand] Modell | Specs | Preis | [Wählen]` |
| Neue Komponente direkt in HardwareStep | `HardwareConfigBox` inline: Amortisierungs-Panel für Phase B |

## Dateien die NICHT geändert werden

- `HardwareCard.tsx` (Popover-Karte, nicht mehr direkt genutzt aber bleibt)
- `HardwareGrid.tsx` (bleibt als Fallback)
- `CollapsedHardwareSelection.tsx` (wird nicht mehr genutzt, bleibt aber)
- `hardwareGrouping.ts` (Black Box)
- `catalogResolver.ts`, `types.ts` (Black Box)
- `CalculatorContext`, `OfferBasketContext` (Black Box)

---

## Technische Umsetzung im Detail

### Phase 1: `HardwareStep.tsx` komplett neu

Neuer State:
```typescript
const [configPhase, setConfigPhase] = useState<"select" | "configure">("select");
const [activeCategory, setActiveCategory] = useState<"smartphone" | "tablet" | "simonly">("smartphone");
const [searchQuery, setSearchQuery] = useState("");
```

Layout-Struktur:
```text
<div className="space-y-3">
  {/* HEADER: Titel + Amortize Toggle + Hardware-Manager Button */}
  {/* CATEGORY TABS + Suche in einer Zeile */}
  {/* PHASE A: Horizontale Geräteliste */}
  {/* PHASE B: HardwareConfigBox (ersetzt die Liste) */}
</div>
```

### Phase 2: `HardwareProductCard.tsx` → Horizontale Zeile

Von:
```text
Großes Bild 140x140 + Details Block + volle-Breite Button (ca. 200px hoch)
```

Zu:
```text
[Brand-Pill] Modell + Specs      [5G] [128GB]     779.00 €    [Wählen →]
(ca. 44px hoch pro Zeile)
```

Props bleiben identisch, nur JSX wird radikal vereinfacht.

### Phase 3: `HardwareConfigBox` (inline in HardwareStep, kein extra File)

Erscheint in Phase B und zeigt:
- Gerätename + EK (groß)
- Amortize Toggle (Einmalig / Im Monatspreis)
- Laufzeit Selector (12 / 24 / 36 Monate) — nur sichtbar wenn Amortize aktiv
- Monatlicher Betrag berechnet
- CTA-Button "Hardware übernehmen" → ruft `onChange` auf und setzt `configPhase = "select"`

### Phase 4: Kategorie-Tabs im Header

```text
[Smartphones (23)] [Tablets (4)] [SIM Only]    [🔍 Suche...]
```

Tabs steuern den `activeCategory` State und filtern die Geräteliste.

### Grouping: Hersteller-Abschnitte

Innerhalb der Kategorie werden Geräte nach Marke gruppiert mit einem kleinen Hersteller-Trennbalken:
```text
── Apple ─────────────────────────
  iPhone 16 Pro Max  256GB  5G   779€  [Wählen]
  iPhone 16 Pro Max  512GB  5G   879€  [Wählen]
── Samsung ───────────────────────
  Galaxy S25 Ultra   256GB  5G   699€  [Wählen]
```

---

## Ergebnis

- Gesamthöhe Phase A: ca. 300-350px (vorher 600px+)
- Auf einen Blick erkennbar: Hersteller, Modell, Speicher, Preis
- Kein Scrollen nötig auf 1366x768
- Workflow: Gerät wählen (1 Klick) → Amortisierung konfigurieren (Phase B, kompakt) → Übernehmen → Fertig
- Enterprise-Grade: Keyboard-Hint, Brand-Grouping, Category-Tabs, Inline-Search
