
# Plan: SUB-Stufe in die Filter-Leiste verschieben (Step 2: Mobilfunk)

## Problem

Die SUB-Stufe (Geräteklasse: SIM Only, Basic Phone, Smartphone, Premium, Special Premium) erscheint aktuell erst **nach** der Tarifauswahl in Phase B (InlineTariffConfig). Das ist ein unnötiger Schritt — der User muss erst den Tarif wählen, dann wieder nach unten scrollen und die SUB-Stufe anpassen.

## Lösung: SUB-Stufe in die Header-Filterleiste (Phase A)

Der User wählt die SUB-Stufe **bevor** er den Tarif wählt — direkt in der Filterleiste oben. Beim Klick auf einen Tarif ist die SUB-Stufe bereits gesetzt. Phase B (InlineTariffConfig) zeigt sie dann nur noch als **Bestätigung** (read-only oder minimal), spart also einen kompletten Interaktionsschritt.

```text
VORHER:
[Tabs] [SIMs] [NV|VVL] [Aktion]        ← Header
[Tarif wählen]                          ← Phase A
[SUB-Stufe auswählen]                   ← Phase B (erst nach Tarifwahl sichtbar!)
[Preis & Hinzufügen]                    ← Phase B

NACHHER:
[Tabs] [SIMs] [NV|VVL] [Aktion] [SUB▾] ← Header (SUB direkt hier!)
[Tarif wählen]                          ← Phase A (SUB schon gesetzt)
[Bestätigung + Preis & Hinzufügen]      ← Phase B (kürzer, da SUB schon bekannt)
```

## Herausforderung: `allowedSubVariants` ist tariff-abhängig

Jeder Tarif hat unterschiedliche erlaubte SUB-Stufen:
- Business Prime S/M/L/XL → alle 5 Stufen erlaubt
- Smart Business / Smart Business Plus → nur 3 Stufen (SIM_ONLY, BASIC_PHONE, SMARTPHONE)
- TeamDeal → keine SUB-Auswahl (wird intern anders gehandhabt)

**Lösung**: Die SUB-Auswahl im Header zeigt die **gemeinsamen SUB-Stufen** aller Tarife im aktiven Portfolio-Tab. Wenn kein Tarif gewählt ist, zeigen wir alle verfügbaren Stufen des Tabs. Nach Tarifauswahl können wir ggf. die Auswahl korrigieren wenn die gewählte SUB nicht erlaubt ist.

**Konkret:**
- Bei `activeTab === "business"` (Prime + TeamDeal): alle 5 Stufen anzeigen
- Bei `activeTab === "smart"` (Smart Business): nur 3 Stufen anzeigen (SIM_ONLY, BASIC_PHONE, SMARTPHONE)
- Bei `activeTab === "consumer"` (GigaMobil): SUB-Selector **ausblenden** (nicht relevant)

## Technische Umsetzung

### Änderung 1: `MobileStep.tsx` — SUB-Selector im Header

Im Header-Bereich (Row 2 mit den Controls) wird ein SUB-Dropdown direkt nach dem NV/VVL-Control eingebaut:

```typescript
// Berechne erlaubte SUBs für den aktiven Tab
const tabAllowedSubVariants = useMemo(() => {
  if (activeTab === "consumer") return []; // kein SUB bei Consumer
  if (activeTab === "smart") return ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE"];
  return ["SIM_ONLY", "BASIC_PHONE", "SMARTPHONE", "PREMIUM_SMARTPHONE", "SPECIAL_PREMIUM_SMARTPHONE"];
}, [activeTab]);
```

Als kompaktes Segmented-Control oder Dropdown im Header — passend zum bestehenden Stil (wie NV|VVL-Control):

```text
[SIM Only] [Basic] [Smart] [Premium] [Spec.Prem.]
```

Für Business (5 Optionen) → Dropdown wegen Platzmangel
Für Smart (3 Optionen) → könnte auch als 3-Button-Segmented-Control dargestellt werden

### Änderung 2: `MobileStep.tsx` — Tab-Wechsel reset

Beim Tab-Wechsel wird die SUB-Auswahl auf den sinnvollen Default zurückgesetzt:
- Business tab → `SIM_ONLY` (oder letzter gültiger Wert)
- Smart tab → `SIM_ONLY` (Smart Business erlaubt kein Premium)
- Consumer tab → `SIM_ONLY` (irrelevant, aber neutral)

### Änderung 3: `InlineTariffConfig.tsx` — SUB-Anzeige vereinfachen

Da die SUB-Stufe nun bereits im Header gewählt wird, wird der SUB-Block in `InlineTariffConfig` auf ein **kompaktes Read-Only-Display** reduziert:

```text
Geräteklasse: [Smartphone +10€/mtl.]  [Ändern ↗]
```

"Ändern" öffnet keinen Modal, sondern scrollt/fokussiert den Header-Selector. Alternativ: bleibt als kleines inline Dropdown zur schnellen Korrektur, aber **nicht mehr als dominanter Block**.

Das spart ~80px in Phase B und macht den Konfig-Flow schlanker.

### Änderung 4: Auto-Korrektur bei Tarifwahl

Wenn der User eine SUB-Stufe gewählt hat, die der gewählte Tarif nicht erlaubt (z.B. "Premium" aber Smart Business erlaubt nur bis "Smartphone"), wird **automatisch auf das Maximum des Tarifs zurückgesetzt** — mit einem kleinen Toast-Hinweis:

```typescript
const handleTariffSelect = (tariffId: string) => {
  const tariff = getMobileTariffFromCatalog(datasetVersion, tariffId);
  const allowed = tariff?.allowedSubVariants;
  if (allowed && !allowed.includes(value.subVariantId as SubVariantId)) {
    // Fallback auf höchste erlaubte Stufe
    const bestAllowed = allowed[allowed.length - 1];
    onChange({ ...value, tariffId, subVariantId: bestAllowed });
    toast.info(`SUB-Stufe auf ${bestAllowed} angepasst`);
  } else {
    updateField("tariffId", tariffId);
  }
  setConfigPhase("configure");
};
```

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `MobileStep.tsx` | SUB-Selector im Header, Tab-abhängige SUB-Optionen, Auto-Korrektur bei Tarifwahl |
| `InlineTariffConfig.tsx` | SUB-Block auf kompaktes Read-Only/Mini-Dropdown reduzieren |

## Dateien die NICHT geändert werden

- `TariffCard.tsx` (unverändert)
- `TariffGrid.tsx` (unverändert)
- `SubVariantSelector.tsx` (bleibt als Komponente, wird aber weniger prominent eingesetzt)
- Engine, Types, Catalog-Resolver (Black Box)

## Ergebnis

- SUB-Stufe wird **vor** der Tarifauswahl festgelegt → ein Klick weniger
- Der Konfigurationsflow ist kürzer und klarer
- Beim Tab-Wechsel passt sich die SUB-Auswahl automatisch an die erlaubten Stufen an
- Phase B (InlineTariffConfig) ist schlanker, da SUB-Block entfernt/minimiert
- Konsistentes Bedienkonzept: Alle globalen Filter oben, tarifspezifisches unten
