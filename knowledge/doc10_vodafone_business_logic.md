# Knowledge Doc 10: Vodafone Business Logic & DGRV
**Status:** DRAFT (Derived from Expert Interview)
**Date:** 2026-01-25

## 1. DGRV (Dauerrabatt-Gewähr-Vertrag)
Special framework for associations/cooperatives (Verbände, Genossenschaften).

### Rules of Engagement
*   **Trigger:** Lead Time (Vorlaufzeit)
*   **Threshold:** `Vorlaufzeit >= 7 Monate`
*   **Benefit:** 12 Monate Basispreis-Befreiung (BP-frei).
*   **Calculation:** 
    *   Standard BP-frei: 1-6 Months (configurable).
    *   DGRV Mandatory: 12 Months if Lead Time >= 7 Months.

### Commercial Logic
*   **Lead Time 1-6 Months:** User can select 0-6 months free.
*   **Lead Time 7+ Months:** SYSTEM MUST enforce "DGRV Mode" (12 months free).

## 2. Discount Valuation (The "145€ Rule")
*   **Scenario:** Red Business Prime S 2025.
*   **Value:** 145€ Discount Value.
*   **Application:** This value is applied as a monthly credit distributed over the contract term (Laufzeit), effectively reducing the monthly price further on top of other discounts.
*   **Formula:** `Monthly_Discount_Adder = 145€ / Contract_Term_Months`

## 3. Hardware Provisioning
*   **EK Netto (Hardware Cost):** Critical input.
*   **Margin Calculation:** 
    *   `Margin = (Provision + Tariffs + OnTops) - (Hardware EK)`
    *   Excess is profit (Provision).

## 4. Output / Template
*   **Requirement:** Dynamic PDF Offering.
*   **Structure:** Single page overview.
*   **Content:** Selected options, applied discounts, final prices. 
