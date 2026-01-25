# Knowledge Doc 10: Vodafone Portfolio Logic Matrix (Stand: Jan 2026)
**Context:** Fachhandel (Retail), Privatkunden & SOHO via TK World/Komsa.

## 1. The 3-Pillar Portfolio Structure
We must architect the Calculator to support three distinct product lines.

| Feature | **1. Smart Tarife** (Fachhandel Focus) | **2. GigaMobil** (Premium Private) | **3. Business Prime** (SOHO/SME) |
| :--- | :--- | :--- | :--- |
| **Zielgruppe** | Preisbewusste Privatkunden | Premium Privatkunden | Selbstständige & Kleinunternehmen |
| **Vertrieb** | **Exklusiv Reseller/Fachhandel** | Direkt & Fachhandel | B2B / Fachhandel |
| **Preisanzeige** | **BRUTTO** (inkl. MwSt) | **BRUTTO** (inkl. MwSt) | **NETTO** (exkl. MwSt) |
| **Struktur** | S (65GB), M (85GB), L (105GB), XL (125GB) | XS (7GB), S (25GB), M (50GB), L (280GB), XL (Unl.) | Prime Go, S, M, L, XL |
| **Speed** | Max 300 Mbit/s (5G/LTE) | Max Speed (500+ Mbit/s) | Max Speed |
| **GigaKombi** | **Eingeschränkt** (Max -10€) | **Voll** (bis -15€, Unl. Data) | **Business GK** (Unl. Data) |
| **Hardware** | Hohe Subvention (Bundle-Fokus) | Standard Subvention | Netto-Hardware |

---

## 2. Logic Rules per Pillar

### A. Smart Tarife (The "Bread & Butter" for Retail)
*   **Wichtig:** Diese Tarife sind oft *aggressiver* bepreist in Bundles.
*   **GigaDepot:** Ja, enthalten.
*   **Young Vorteil:** Smart Young oft verfügbar (mehr Daten/Rabatt).
*   **Calculation Logic:** `Base_Brutto - Fachhandels_Rabatt`.

### B. GigaMobil (The "Premium")
*   **GigaKombi:** If Fixed Net is present -> `-10€` AND `+Data` (often Unlimited for M/L).
*   **FamilyCard:** Red+ logic applies here.
*   **Calculation Logic:** `Base_Brutto - GigaKombi_Credit`.

### C. Business Prime (The "Professional")
*   **DGRV Rule:** `Vorlaufzeit >= 7 Monate` -> **12 Monate Basispreis-frei**.
*   **Promo 2025:** "50% Rabatt für 12 Monate" (Neukunden bis 30.06.2025).
*   **GigaDepot Business:** Neu ab April 2025 (Datenmitnahme).
*   **Calculation Logic:** `(Base_Netto - RV_Rabatt - Promo_Netto)`.

---

## 3. Architecture Requirements (Phase 13)
The Calculator requires a **Two-Stage Selector**:

1.  **Customer Type:**
    *   `Private` (Enables Smart & GigaMobil)
    *   `Business` (Enables Business Prime)

2.  **Tariff Family (If Private):**
    *   `Smart` (Retail Focus)
    *   `GigaMobil` (Premium Focus)

### Implementation Checklist
*   [ ] `src/data/private/smart_tariffs.ts` (NEW)
*   [ ] `src/data/private/gigamobil_tariffs.ts` (NEW)
*   [ ] `src/data/business/prime_tariffs.ts` (Update 2025)
*   [ ] **GigaKombi Logic Engine:** Needs to handle the "Limited vs Full" logic based on Tariff Family.
