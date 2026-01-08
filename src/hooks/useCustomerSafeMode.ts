// ============================================
// Customer Safe Mode Hook - Single Source of Truth
// HOTFIX: Security Lock for Customer/POS Mode
// ============================================

import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { usePOSMode } from "@/contexts/POSModeContext";

/**
 * Single source of truth for customer-safe mode.
 * Returns true if ANY of these conditions are met:
 * - Customer session is active (customer physically present)
 * - POS mode is enabled (quick sale mode)
 * 
 * When this returns true, NO dealer-sensitive data should be rendered.
 * This includes: EK prices, margins, provisions, OMO rates, etc.
 */
export function useCustomerSafeMode(): boolean {
  const { session } = useCustomerSession();
  const { isPOSMode } = usePOSMode();
  
  return session.isActive || isPOSMode;
}
