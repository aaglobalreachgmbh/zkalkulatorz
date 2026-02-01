// ============================================
// Central Formatting Utilities
// Ensures consistent display across entire UI
// ============================================

export type ProfitabilityStatus = "positive" | "warning" | "critical";

/**
 * Format currency in German locale (e.g., "49,99 €")
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Format price with optional decimals (e.g., "49,99 €" or "50 €")
 */
export const formatPrice = (
  amount: number, 
  options?: { decimals?: number; showCurrency?: boolean }
): string => {
  const { decimals = 2, showCurrency = true } = options ?? {};
  const formatted = amount.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return showCurrency ? `${formatted} €` : formatted;
};

/**
 * Format monthly price with /mtl. suffix (e.g., "49,99 €/mtl.")
 */
export const formatMonthlyPrice = (amount: number): string => 
  `${formatPrice(amount)}/mtl.`;

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
  bg: status === "positive" ? "bg-[hsl(var(--status-success)/0.1)]" : status === "warning" ? "bg-[hsl(var(--status-warning)/0.1)]" : "bg-[hsl(var(--status-error)/0.1)]",
  text: status === "positive" ? "text-[hsl(var(--status-success))]" : status === "warning" ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-error))]",
  border: status === "positive" ? "border-[hsl(var(--status-success)/0.3)]" : status === "warning" ? "border-[hsl(var(--status-warning)/0.3)]" : "border-[hsl(var(--status-error)/0.3)]",
  ring: status === "positive" ? "ring-[hsl(var(--status-success)/0.2)]" : status === "warning" ? "ring-[hsl(var(--status-warning)/0.2)]" : "ring-[hsl(var(--status-error)/0.2)]",
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
