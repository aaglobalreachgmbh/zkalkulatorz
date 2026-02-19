
# Plan: FixedNetStep — Enterprise CPQ Redesign

## Analyse der Referenz-Screenshots

Die zwei HTML-Mockups zeigen ein **zweistufiges Enterprise-Pattern**:

**Screen 1 (code-2.html / screen-13.png):**
- Schritt 1: Adressformular mit "Verfügbarkeit prüfen" Button
- Schritt 2-4: Gesperrt (lock-Icon), werden nach Prüfung freigeschaltet
- Rechte Sidebar: Live-Übersicht mit Standort, Tarif, Kosten

**Screen 2 (code-3.html / screen-14.png):**
- Ergebnisseite nach Verfügbarkeitsprüfung
- Technologie-Wahl (Kabel / Glasfaser / DSL) als 3 Karten nebeneinander
- Tarif-Auswahl als Karten mit Preis, Speed, Telefonie
- Router & Hardware als Radio-Liste
- Rechte Sidebar: Zusammenfassung mit "Zum Angebot hinzufügen"

## Wie es in den bestehenden Kalkulator passt

Der `FixedNetStep.tsx` ist ein **Sub-Component** innerhalb des Wizard-Steps. Er hat:
- `value: FixedNetState` (enabled, accessType, productId, fixedIpEnabled, etc.)
- `onChange: (value: FixedNetState) => void`
- `datasetVersion: DatasetVersion`
- `onFixedNetEnabled?: () => void`

Das Ziel ist: Den gesamten Inhalt von `FixedNetStep.tsx` neu zu gestalten nach dem Referenz-Design — ohne die Props oder Engine-Logik zu ändern.

## Neue UX-Architektur: Drei-Phasen-Flow

```text
PHASE 0: Toggle deaktiviert
════════════════════════════════════════════
[Router Icon] Festnetz & Internet    [Toggle OFF]
Für GigaKombi Vorteil aktivieren

PHASE A: Adresseingabe (nach Toggle)
════════════════════════════════════════════
[1] Installationsadresse         [In Bearbeitung]
    Straße + Nr. | PLZ | Ort
    [Adresse speichern ☐]       [✓ Verfügbarkeit prüfen]

[2] Technologie                  [🔒 gesperrt]
[3] Tarifdetails                 [🔒 gesperrt]

PHASE B: Auswahl (nach "Verfügbarkeit prüfen")
════════════════════════════════════════════
[1] Installationsadresse         [✓ Musterstr. 1, 12345 Berlin]

[2] Technologie wählen
    [● Kabel] [○ Glasfaser] [○ DSL]

[3] Tarif auswählen (Kabel)
    [EMPFOHLEN]  [Standard]  [Basic]
    Produkt 1     Produkt 2   Produkt 3
    49,99€        39,99€      34,99€
    1000 Mbit     500 Mbit    250 Mbit
    [Ausgewählt]  [Wählen]    [Wählen]

[4] Router & Hardware
    [●] FRITZ!Box 6690    +6,99€/mtl.
    [○] Vodafone Station  +0,00€ inkl.
    [○] Kein Router       0,00€

[Festnetz zum Angebot hinzufügen →]
════════════════════════════════════════════
```

## Technische Umsetzung

### Neuer State in `FixedNetStep.tsx`

```typescript
type FixedNetPhase = "disabled" | "address" | "selection";

const [phase, setPhase] = useState<FixedNetPhase>(
  value.enabled ? "selection" : "disabled"
);
const [address, setAddress] = useState({
  street: "", houseNumber: "", zip: "", city: ""
});
const [checkedAddress, setCheckedAddress] = useState(
  value.enabled ? "Musterstraße 1, Berlin" : "" // wenn schon aktiv, simulieren
);
const [selectedRouterId, setSelectedRouterId] = useState<"premium" | "standard" | "none">("standard");
```

### Phase 0 — Toggle Karte (value.enabled === false)
- Identisch zum aktuellen Design (Toggle OFF)
- Bei Aktivierung: Übergang zu Phase A

### Phase A — Adress-Formular
Inspiriert von code-2.html:
- Nummerierter Step-Header (1, 2, 3) — Step 2/3/4 gesperrt mit lock-Icon
- Step 1 aktiv: Grid-Formular mit Straße, Nr., PLZ, Ort
- Checkbox "Adresse im Adressbuch speichern"
- CTA Button "Verfügbarkeit prüfen" → setzt Phase auf "selection"
- Note: Da echte Verfügbarkeits-API nicht vorhanden, simulieren wir Erfolg (alle 3 Technologien verfügbar)

### Phase B — Auswahl-Flow
Inspiriert von code-3.html, angepasst an bestehende Daten:

**Technologie-Karten (3 nebeneinander):**
```typescript
const ACCESS_TYPES = [
  { id: "CABLE", label: "Kabel", icon: Router, maxSpeed: "1000 Mbit/s", available: true },
  { id: "FIBER", label: "Glasfaser", icon: Zap, maxSpeed: "1000 Mbit/s", available: true },
  { id: "DSL",   label: "DSL",      icon: Phone, maxSpeed: "250 Mbit/s",  available: false },
]
```
DSL als "Nicht verfügbar" simuliert (greyed out, wie im Screenshot) — aber technisch kann man es doch wählen wenn die anderen nicht passen. Wir zeigen DSL als "eingeschränkt verfügbar" statt komplett gesperrt, da die Daten es haben.

**Tarif-Karten:**
- Produkte aus `productsForAccessType` (echte Katalogdaten)
- Erste 3 nebeneinander als Karten (wie im Screenshot)
- Erste Karte = "Empfohlen" Badge
- Preis + Speed + includesPhone (Telefonie Flatrate) als Specs
- Button: "Ausgewählt" (primary) / "Auswählen" (secondary)

**Router & Hardware Radio-Liste:**
```typescript
const routerOptions = [
  {
    id: "premium",
    name: "FRITZ!Box 6690 Cable",
    description: "Premium WLAN AX, 2x Telefon, 4x LAN",
    monthlyExtra: 6.99,
    label: "mtl. Miete"
  },
  {
    id: "standard", 
    name: "Vodafone Station",
    description: "Standard WLAN AC, 2x Telefon",
    monthlyExtra: 0,
    label: "Inklusive"
  },
  {
    id: "none",
    name: "Kein Router (Eigene Hardware)",
    description: "Kundeneigenes Gerät verwenden",
    monthlyExtra: 0,
    label: ""
  }
]
```
Router-Wahl wird als optionales State gespeichert (beeinflusst nicht `FixedNetState` Engine-seitig, da die Engine den Router auto-assigned — aber für die UI-Zusammenfassung und spätere Erweiterbarkeit sinnvoll).

**CTA am Ende:**
- Roter "Festnetz zum Angebot hinzufügen" Button
- Ruft `onChange({...value, enabled: true, accessType, productId})` auf
- Ruft `onFixedNetEnabled()` auf

### GigaKombi-Info-Box
Kompakte grüne Info am Ende der Auswahl:
- "GigaKombi Business: -5€/mtl. auf Mobilfunk + Unlimited für bis zu 10 SIMs"

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/margenkalkulator/ui/steps/FixedNetStep.tsx` | Komplett neu: Drei-Phasen-Flow, Adressformular, Technologie-Karten, Tarif-Karten, Router-Liste, CTA |

## Dateien die NICHT geändert werden

- Engine (`catalogResolver.ts`, `types.ts`, `benefitsEngine.ts`) — Black Box
- `CalculatorContext` — Black Box
- Andere Steps — unverändert

## Ergebnis

- Professioneller Enterprise-Look (identisch zu den Screenshots)
- Klarer 3-Phasen-Flow: Toggle → Adresse → Auswahl
- Tarife als visuelle Karten (nicht mehr Dropdown)
- Router-Auswahl als Radio-Liste (nicht mehr implizit)
- GigaKombi-Vorteil prominent kommuniziert
- Kompakt und kein unnötiges Scrollen (Karten statt langer Liste)
