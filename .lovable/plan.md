
# Plan: Step 1 Hardware - Ultra-Kompakt CPQ-Redesign (identisch zu MobileStep)

## Ist-Zustand

`HardwareStep.tsx` verwendet noch das **alte Design** mit großen 200px-Karten (`HardwareProductCard`). Die Zwei-Phasen-Logik existiert nicht — es gibt nur ein "Collapsed"-State das das Grid ausblendet. Das widerspricht dem bereits implementierten MobileStep-Pattern.

Konkretes Problem:
- `HardwareProductCard` = 140x140px Bild + Badges + 2 Preise + voller CTA-Button → ~200px hoch
- 30+ Geräte × 200px = 6.000px Scrollhöhe
- Keine Kategorie-Tabs, keine echte Configure-Phase
- Amortisierungs-Toggle sitzt verloren oben rechts ohne Kontext
- Kein Brand-Grouping das auf einen Blick erkennbar macht, welcher Hersteller

## Ziel: Identisches Pattern wie MobileStep

```text
PHASE A — Gerät wählen (kompakt, ~300px gesamt)
══════════════════════════════════════════════════════
Hardware-Auswahl           [Smartphones][Tablets][SIM Only]  [🔍 Suche]
──────────────────────────────────────────────────────────────────────
 Apple         iPhone 16 Pro Max │ 256GB  5G │ 779,00 €  │ [Wählen]
               iPhone 16 Pro Max │ 512GB  5G │ 879,00 €  │ [Wählen]
               iPhone 16 Pro     │ 256GB  5G │ 689,00 €  │ [Wählen]
──────────────────────────────────────────────────────────────────────
 Samsung       Galaxy S25 Ultra  │ 256GB  5G │ 699,00 €  │ [Wählen]
══════════════════════════════════════════════════════

PHASE B — Hardware konfigurieren (ersetzt Liste)
══════════════════════════════════════════════════════
← Zurück zur Geräteauswahl

┌────────────────────────────────────────────────────┐
│ ✓ Apple iPhone 16 Pro Max 256GB      EK: 779,00 €  │
├────────────────────────────────────────────────────┤
│ Amortisation  [○ Einmalig] [● Im Monatspreis]       │
│ Laufzeit      [24 Monate ▾]   (nur wenn Amortize)  │
│ Monatsrate    +32,46 €/Monat über 24 Monate        │
├────────────────────────────────────────────────────┤
│        [══ Hardware übernehmen ══]                  │
└────────────────────────────────────────────────────┘
══════════════════════════════════════════════════
```

## Technische Architektur

### Neue State-Struktur in `HardwareStep.tsx`

```typescript
type ConfigPhase = "select" | "configure";
type ActiveCategory = "smartphone" | "tablet" | "simonly";

const [configPhase, setConfigPhase] = useState<ConfigPhase>("select");
const [activeCategory, setActiveCategory] = useState<ActiveCategory>("smartphone");
const [searchQuery, setSearchQuery] = useState("");
const [pendingConfig, setPendingConfig] = useState<{config: HardwareConfig; brand: string} | null>(null);
```

`pendingConfig` hält das gewählte Gerät bis der User in Phase B auf "Hardware übernehmen" klickt — dann erst wird `onChange` aufgerufen. Das entspricht exakt dem MobileStep-Pattern wo die `InlineTariffConfig` der letzte Schritt vor `onConfigComplete` ist.

### Neue `HardwareProductCard.tsx` — Horizontale Zeile (44px)

Von (200px Karte):
```text
[Bild 140x140] [Name] [Specs] [Badges] [Preis] [CTA Button]
```

Zu (44px Zeile — identisch zur TariffCard):
```text
[Brand-Pill] Modell-Name     │ Specs (Storage/5G) │ EK-Preis │ [Wählen]
```

Props bleiben identisch (rückwärtskompatibel), nur JSX wird ersetzt.

### Brand-Grouping in der Liste

Die flache Liste wird in Hersteller-Abschnitte unterteilt — visuell klar ohne extra Scroll:

```text
SPALTEN-HEADER: Gerät | Specs | Preis | Aktion

── Apple ──────────────────────────────────────
  iPhone 16 Pro Max  │ 256GB  5G │ 779€ │ [Wählen]
  iPhone 16 Pro Max  │ 512GB  5G │ 879€ │ [Wählen]
── Samsung ────────────────────────────────────
  Galaxy S25 Ultra   │ 256GB  5G │ 699€ │ [Wählen]
```

### `HardwareConfigBox` (inline in `HardwareStep.tsx`)

Kein eigenes File — direkt als JSX-Block in Phase B gerendert:

- Gerätename + EK gross dargestellt
- Amortisierungs-Segmented-Control: `[Einmalig] [Im Monatspreis]`
- Laufzeit-Dropdown (nur sichtbar wenn Amortize aktiv): 12 / 24 / 36 Monate
- Live-Berechnung: `+32,46 €/Monat über 24 Monate`
- Primär-Button `Hardware übernehmen` → ruft `onChange` + `onHardwareSelected` auf, setzt Phase zurück auf "select"

### Kategorie-Tabs + Suche (Header Row 2)

```text
[Smartphones (23)] [Tablets (4)] [SIM Only]     [🔍 iPhone...]
```

Kategorie-Tabs + Inline-Suche in einer Zeile — exakt wie MobileStep's Tab+Controls-Zeile.

### SIM-Only-Karte

Wenn `activeCategory === "simonly"`:
- Keine Liste, stattdessen direkt ein Confirm-Button
- "Kein Gerät — nur Tarif" → sofort `onChange({ name: "KEINE HARDWARE", ekNet: 0 })` und `onHardwareSelected()`
- Kein Configure-Phase nötig (keine Amortisierung bei 0€)

## Enterprise-Verbesserungen

1. **Keyboard-Shortcut Hint**: Kleine Info-Zeile wie bei MobileStep: `Tipp: Zifferntasten 1-9 zum Schnellwählen`
2. **Hover-Preview** (via `title`-Attr): Beim Hovern über eine Zeile zeigt Browser-Tooltip den vollen Modellnamen + EK
3. **Sofort-Preis-Feedback**: In Phase B wird der monatliche EK-Anteil sofort live berechnet beim Ändern der Laufzeit
4. **Kompakter "Bereits gewählt"-Hinweis**: Wenn User in Phase B auf "Zurück" geht, bleibt das Gerät in der Liste als vorausgewählt sichtbar (grüner Ring)
5. **Hardware-Manager Link** bleibt als kleiner Button oben rechts (nur für Dealer-Mode)

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `HardwareStep.tsx` | Komplett neu: Zwei-Phasen-State, Kategorie-Tabs, Brand-Gruppierung, HardwareConfigBox inline |
| `HardwareProductCard.tsx` | Von 200px-Karte zu 44px horizontaler Zeile (Props bleiben identisch) |

## Dateien die NICHT geändert werden

| Datei | Grund |
|-------|-------|
| `HardwareCard.tsx` | Black Box, nicht genutzt aber bleibt |
| `HardwareGrid.tsx` | Black Box, nicht genutzt aber bleibt |
| `CollapsedHardwareSelection.tsx` | Black Box, wird nicht mehr benötigt aber bleibt |
| `hardwareGrouping.ts` | Black Box — Daten-Logik unverändert |
| `catalogResolver.ts` | Black Box |
| Engine, Context, Basket | Black Box |

## Ergebnis

- Gesamthöhe Phase A bei 10 Geräten: ~330px (vorher 2.000px+)
- Kein Scrollen nötig auf 1366x768
- Hersteller auf einen Blick erkennbar durch Brand-Gruppen-Trennbalken
- Workflow: Gerät wählen (1 Klick) → Amortisierung bestätigen (Phase B) → Übernehmen → fertig
- Identisches Bedienkonzept wie Step 2 Mobilfunk (Zero Learning Curve)
