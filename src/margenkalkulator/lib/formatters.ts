// ============================================
// Central Formatting Utilities
// Ensures consistent display across entire UI
// ============================================

export type ProfitabilityStatus = "positive" | "warning" | "critical";

/**
 * Format currency in German locale
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Format margin with sign prefix
 */
export const formatMargin = (amount: number): string =>
  `${amount >= 0 ? "+" : ""}${formatCurrency(amount)}`;

/**
 * Format percentage with sign prefix
 */
export const formatPercent = (value: number): string =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

/**
 * Determine profitability status based on margin per contract
 */
export const getProfitabilityStatus = (marginPerContract: number): ProfitabilityStatus => {
  if (marginPerContract >= 50) return "positive";
  if (marginPerContract >= 0) return "warning";
  return "critical";
};

/**
 * Get status colors for Tailwind classes
 */
export const getStatusColors = (status: ProfitabilityStatus) => ({
  bg: status === "positive" ? "bg-emerald-500/10" : status === "warning" ? "bg-amber-500/10" : "bg-red-500/10",
  text: status === "positive" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-red-600",
  border: status === "positive" ? "border-emerald-500/30" : status === "warning" ? "border-amber-500/30" : "border-red-500/30",
  ring: status === "positive" ? "ring-emerald-500/20" : status === "warning" ? "ring-amber-500/20" : "ring-red-500/20",
});

/**
 * Get status label in German
 */
export const getStatusLabel = (status: ProfitabilityStatus): string => {
  switch (status) {
    case "positive": return "Profitabel";
    case "warning": return "Optimierbar";
    case "critical": return "Kritisch";
  }
};

/**
 * Get status icon name for Lucide
 */
export const getStatusIcon = (status: ProfitabilityStatus): "check-circle" | "alert-triangle" | "x-circle" => {
  switch (status) {
    case "positive": return "check-circle";
    case "warning": return "alert-triangle";
    case "critical": return "x-circle";
  }
};

/**
 * Format compact number (e.g., 1.2k, 3.5M)
 */
export const formatCompact = (value: number): string =>
  new Intl.NumberFormat("de-DE", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);

/**
 * Calculate margin percentage
 */
export const calculateMarginPercent = (margin: number, revenue: number): number => {
  if (revenue === 0) return 0;
  return (margin / revenue) * 100;
};
