# MargenKalkulator - Information Hierarchy

> Zuletzt aktualisiert: 2026-01-06

## View Mode KPI-Mapping

Das System unterscheidet zwei Ansichtsmodi mit unterschiedlichen Informationsebenen.

---

## Customer Mode (Kundensicht)

### Sichtbare KPIs

| KPI | Position | Format |
|-----|----------|--------|
| Ø Monatspreis | Prominent oben | XX,XX €/Monat |
| Gesamtkosten 24M | Sekundär | X.XXX,XX € gesamt |
| Einmalkosten | Bei Bedarf | XX,XX € einmalig |

### Sichtbare Breakdown-Zeilen

| ruleId | Label | Kategorie |
|--------|-------|-----------|
| `base` | Tarif Grundpreis | monthly |
| `sub_add` | SUB-Variante Aufpreis | monthly |
| `promo_intro` | Einführungspreis | monthly |
| `promo_pct_off_base` | Rabatt auf Basis | monthly |
| `promo_abs_off_base` | Absoluter Rabatt | monthly |
| `gk_discount` | GigaKombi-Rabatt | monthly |
| `teamdeal_discount` | TeamDeal-Rabatt | monthly |
| `fixed_base` | Festnetz Grundpreis | monthly |
| `fixed_setup` | Anschlussgebühr | oneTime |
| `fixed_shipping` | Versandkosten | oneTime |
| `hw_amortized` | Hardware (mtl. Rate) | monthly |
| `hw_onetime` | Hardware (Einmalkauf) | oneTime |

### Versteckt im Customer Mode

- ❌ Provision (jegliche)
- ❌ Hardware-EK
- ❌ Marge
- ❌ OMO-Rate Selector
- ❌ FH-Partner Toggle
- ❌ Dealer-Economics Breakdown
- ❌ Push-Provision Status

---

## Dealer Mode (Händlersicht)

### Zusätzlich sichtbare KPIs

| KPI | Position | Format |
|-----|----------|--------|
| **Marge** | Prominent | ±XXX,XX € |
| Margin-Status | Traffic Light | 🟢🟡🔴 |
| Provision (brutto) | Detail | XXX,XX € |
| Provision (nach Abzug) | Detail | XXX,XX € |
| Hardware-EK | Detail | XXX,XX € |

### Zusätzliche Breakdown-Zeilen

| ruleId | Label | Kategorie | Visibility |
|--------|-------|-----------|------------|
| `provision_base` | Basis-Provision | dealer | dealer-only |
| `provision_fh` | FH-Partner Bonus | dealer | dealer-only |
| `provision_push` | Push-Provision | dealer | dealer-only |
| `deduction_omo` | OMO-Abzug | dealer | dealer-only |
| `deduction_employee` | Mitarbeiter-Abzug | dealer | dealer-only |
| `hw_ek` | Hardware Einkaufspreis | dealer | dealer-only |
| `margin` | Netto-Marge | dealer | dealer-only |

### Zusätzliche Controls

| Control | Funktion |
|---------|----------|
| OMO-Rate Selector | Wählt OMO-Rate (0%, 5%, ... 25%) |
| FH-Partner Toggle | Aktiviert FH-Partner Bonus |
| Push-Info Badge | Zeigt aktive Push-Provisionen |

---

## Kundensitzung (Customer Session Safety Lock)

### Aktivierung
```typescript
isCustomerSessionActive === true
```

### Auswirkungen

| Bereich | Effekt |
|---------|--------|
| ViewMode-Toggle | Zeigt **nur** "Kunde" |
| Dealer-Zeilen | **Vollständig versteckt** |
| OMO-Selector | **Ausgeblendet** |
| FH-Partner Toggle | **Ausgeblendet** |
| Margin-Badge | **Versteckt** |
| Header | 🔒 Badge sichtbar |

### Prioritäts-Kaskade

```
1. Kundensitzung ON     → IMMER Customer-Safe (höchste Priorität)
2. ViewMode "customer"  → Customer-Safe
3. ViewMode "dealer"    → Volle Dealer-Sicht (role-based)
```

### Visueller Indikator

```tsx
// In Header/Toolbar
{isCustomerSessionActive && (
  <Badge variant="destructive">
    <Lock className="h-3 w-3 mr-1" />
    Kundensitzung aktiv
  </Badge>
)}
```

---

## Breakdown-Zeilen Klassifizierung

### Schema

```typescript
type BreakdownRow = {
  ruleId: string;
  label: string;
  amount: number;
  category: "monthly" | "oneTime" | "dealer";
  visibility: "customer-safe" | "dealer-only";
  period?: number; // Monat 1-24, nur bei monthly
};
```

### Customer-Safe Rows

Diese Zeilen dürfen **immer** angezeigt werden:

```typescript
const CUSTOMER_SAFE_RULES = [
  "base",
  "sub_add", 
  "promo_intro",
  "promo_pct_off_base",
  "promo_abs_off_base",
  "gk_discount",
  "teamdeal_discount",
  "fixed_base",
  "fixed_setup",
  "fixed_shipping",
  "hw_amortized",
  "hw_onetime",
];
```

### Dealer-Only Rows

Diese Zeilen werden **nur im Dealer-Mode** angezeigt:

```typescript
const DEALER_ONLY_RULES = [
  "provision_base",
  "provision_fh",
  "provision_push",
  "deduction_omo",
  "deduction_employee",
  "hw_ek",
  "margin",
];
```

---

## UI-Komponenten Zuordnung

| Komponente | Customer Mode | Dealer Mode | Kundensitzung |
|------------|---------------|-------------|---------------|
| `LiveCalculationBar` | Monatspreis | + Marge | Nur Monatspreis |
| `SummarySidebar` | Kosten-Summary | + Dealer-Section | Nur Kosten |
| `BreakdownAccordion` | Customer-Rows | + Dealer-Rows | Nur Customer |
| `MarginBadge` | Hidden | Visible | Hidden |
| `OMORateSelector` | Hidden | Visible | Hidden |
| `FHPartnerToggle` | Hidden | Visible | Hidden |
| `ViewModeToggle` | Both Options | Both Options | Nur "Kunde" |

---

## Role-Based Access

| Rolle | Kann Dealer sehen? | Kann Kundensitzung beenden? |
|-------|-------------------|----------------------------|
| `sales` | ✅ (Standard) | ✅ |
| `manager` | ✅ | ✅ |
| `admin` | ✅ | ✅ |
| `subuser` | ⚠️ (abhängig von `can_view_margins`) | ❌ |

### Subuser-Einschränkungen

```typescript
// employee_settings Tabelle
{
  user_id: "...",
  can_view_margins: false, // → kein Dealer-Mode
  provision_deduction: 10, // → Abzug von Provision
  provision_deduction_type: "percent"
}
```

---

## Margin Traffic Light

| Marge | Farbe | Bedeutung |
|-------|-------|-----------|
| > 100€ | 🟢 Grün | Gutes Geschäft |
| 0-100€ | 🟡 Gelb | Marginal |
| < 0€ | 🔴 Rot | Verlust |

```typescript
function getMarginStatus(margin: number): "positive" | "warning" | "negative" {
  if (margin > 100) return "positive";
  if (margin >= 0) return "warning";
  return "negative";
}
```

---

## Implementation Checklist

- [x] `useSensitiveFieldsVisible` Hook vorhanden
- [x] `CustomerSessionContext` implementiert
- [x] `ViewModeToggle` Component
- [x] Breakdown mit `visibility` Flag
- [x] Margin Traffic Light Badge
- [x] OMO-Selector im Dealer-Mode
- [x] FH-Partner Toggle im Dealer-Mode
- [ ] Subuser `can_view_margins` Enforcement
- [ ] Kundensitzung Lock-Indikator in Header
