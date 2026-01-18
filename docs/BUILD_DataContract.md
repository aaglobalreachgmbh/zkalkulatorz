# MargenKalkulator - Data Contract

> Zuletzt aktualisiert: 2026-01-06

## Dataset Module

Die Datenbasis des MargenKalkulators besteht aus **7 Kernmodulen**:

| # | Modul | Technischer Name | Beschreibung |
|---|-------|------------------|--------------|
| 1 | Mobilfunk-Tarife | `mobile_tariffs` | Prime, Smart, TeamDeal Tarife |
| 2 | Festnetz-Produkte | `fixednet_products` | Cable, DSL, Fiber, Komfort |
| 3 | Hardware-Katalog | `hardware_catalog` | Smartphones, Tablets, EK-Preise |
| 4 | Provisionen | `provisions` | Basis-Provisionen pro Tarif |
| 5 | Aktionen/Promos | `promos` | Einführungspreise, Rabatte |
| 6 | OMO-Matrix | `omo_matrix` | OMO-Abzüge nach Rate |
| 7 | SUB-Varianten | `sub_variants` | SIM-Only, mit Smartphone, etc. |

---

## Pflichtfelder pro Modul

### 1. mobile_tariffs

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✅ | Unique Key, SCREAMING_SNAKE |
| `family` | enum | ✅ | `PRIME`, `SMART`, `TEAMDEAL` |
| `name` | string | ✅ | Anzeigename |
| `base_sim_only_net` | number | ✅ | Basispreis SIM-Only netto |
| `data_volume_gb` | number | ❌ | Datenvolumen in GB |
| `contract_months` | number | ✅ | Laufzeit (meist 24) |
| `is_teamdeal` | boolean | ❌ | TeamDeal-Tarif? |
| `requires_prime` | boolean | ❌ | Erfordert Prime auf Account |

### 2. fixednet_products

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✅ | Unique Key |
| `access_type` | enum | ✅ | `CABLE`, `DSL`, `FIBER`, `KOMFORT` |
| `name` | string | ✅ | Anzeigename |
| `speed_down_mbit` | number | ✅ | Download-Geschwindigkeit |
| `speed_up_mbit` | number | ❌ | Upload-Geschwindigkeit |
| `monthly_net` | number | ✅ | Monatspreis netto |
| `setup_fee_net` | number | ❌ | Anschlussgebühr |
| `router_included` | boolean | ❌ | Router inklusive? |

### 3. hardware_catalog

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✅ | Unique Key |
| `brand` | string | ✅ | Hersteller (Apple, Samsung, etc.) |
| `model` | string | ✅ | Modellname |
| `variant` | string | ❌ | Speicher/Farbe |
| `ek_net` | number | ✅ | Einkaufspreis netto |
| `category` | enum | ❌ | `smartphone`, `tablet`, `wearable` |
| `is_active` | boolean | ❌ | Noch verfügbar? |

### 4. provisions

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `tariff_id` | string | ✅ | Referenz auf mobile_tariffs.id |
| `provision_new_net` | number | ✅ | Provision Neuvertrag |
| `provision_renewal_net` | number | ❌ | Provision Verlängerung |
| `fh_partner_bonus` | number | ❌ | FH-Partner Zusatz |
| `sub_variant_id` | string | ❌ | Optional: SUB-spezifisch |

### 5. promos

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✅ | Unique Key |
| `type` | enum | ✅ | `intro_price`, `pct_off`, `abs_off` |
| `label` | string | ✅ | Anzeigename |
| `discount_value` | number | ✅ | Wert (€ oder %) |
| `duration_months` | number | ❌ | Gültigkeitsdauer |
| `valid_from` | date | ❌ | Gültig ab |
| `valid_until` | date | ❌ | Gültig bis |
| `applies_to` | string[] | ❌ | Tarif-IDs (leer = alle) |

### 6. omo_matrix

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `tariff_id` | string | ✅ | Referenz auf mobile_tariffs.id |
| `omo_0` | number | ❌ | Abzug bei 0% OMO |
| `omo_5` | number | ❌ | Abzug bei 5% OMO |
| `omo_10` | number | ❌ | Abzug bei 10% OMO |
| `omo_15` | number | ❌ | Abzug bei 15% OMO |
| `omo_17_5` | number | ❌ | Abzug bei 17.5% OMO |
| `omo_20` | number | ❌ | Abzug bei 20% OMO |
| `omo_25` | number | ❌ | Abzug bei 25% OMO |

### 7. sub_variants

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | string | ✅ | Unique Key |
| `label` | string | ✅ | Anzeigename |
| `monthly_add_net` | number | ✅ | Monatlicher Aufpreis |
| `requires_hardware` | boolean | ❌ | Hardware erforderlich? |

---

## ID-Normalisierung

### Format: `SCREAMING_SNAKE_CASE`

```
✅ PRIME_M
✅ CABLE_250
✅ IPHONE_16_128
✅ INTRO_6M_10EUR

❌ Prime M (Leerzeichen)
❌ cable-250 (Bindestrich, lowercase)
❌ iPhone16 (gemischt)
```

### Regeln:
- Keine Leerzeichen
- Keine Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)
- Keine Sonderzeichen außer `_`
- Zahlen erlaubt

---

## Preis-Normalisierung

| Regel | Beispiel |
|-------|----------|
| Immer **netto** (ohne MwSt) | 49.99 nicht 59.49 |
| Dezimaltrennzeichen: **Punkt** | 49.99 nicht 49,99 |
| Einheit: **EUR** (implizit) | Keine Spalte "currency" |
| Keine Tausender-Trenner | 1000 nicht 1.000 |

---

## Datums-Normalisierung

| Format | Beispiel |
|--------|----------|
| ISO 8601 | `2025-10-01` |
| Mit Zeit | `2025-10-01T00:00:00Z` |

---

## Import-Semantik: STRICT REPLACE

Bei Import eines Moduls werden **ALLE** bestehenden Einträge ersetzt:

```
1. DELETE FROM mobile_tariffs WHERE tenant_id = :tenant
2. INSERT INTO mobile_tariffs VALUES (...neue Daten...)
```

### Warum kein Merge?
- Vodafone-Daten sind "truth at point in time"
- Alte Daten bleiben über **Dataset-Versionen** erhalten
- Kein Risiko von Duplikaten oder Inkonsistenzen

---

## Dataset Metadata

Jedes Dataset trägt folgende Metadaten:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `datasetVersion` | string | Eindeutige ID, z.B. `v2025_10` |
| `sourceType` | enum | `xlsx`, `csv`, `pdf`, `manual` |
| `sourceFile` | string | Original-Dateiname |
| `sourceDate` | date | Datum der Quelle |
| `validFrom` | date | Gültig ab |
| `validUntil` | date | Gültig bis (optional) |
| `notes` | string | Freitext-Notizen |
| `publishedAt` | datetime | Wann veröffentlicht (null = draft) |
| `status` | enum | `draft`, `review`, `published`, `archived` |

### Status-Lifecycle

```
draft → review → published → archived
  ↑__________________|
     (zurück zu draft)
```

| Status | Bedeutung | Sichtbar für |
|--------|-----------|--------------|
| `draft` | In Bearbeitung | Nur Admin |
| `review` | Zur Prüfung | Admin + Manager |
| `published` | Aktiv | Alle |
| `archived` | Historisch | Nur Admin |

---

## Source Priority

Wenn mehrere Datenquellen existieren:

| Priorität | Quelle | Beschreibung |
|-----------|--------|--------------|
| 1 (höchste) | **Tenant-Import** | Vom Admin hochgeladene XLSX/CSV |
| 2 | **Cloud-Dataset** | Von Lovable Cloud synchronisiert |
| 3 (niedrigste) | **Bundled-Fallback** | Statische TS-Daten im Code |

### Auflösungslogik:
```typescript
const dataset = tenantDataset ?? cloudDataset ?? bundledFallback;
```
