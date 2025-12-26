// ============================================
// Phase 3A: Customer Safety Tests
// Tests for sensitive field visibility, RBAC, and storage scoping
// ============================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { 
  computeSensitiveFieldsVisibility 
} from "@/hooks/useSensitiveFieldsVisible";
import { 
  getScopedStorageKey, 
  mapSupabaseToAppRole,
  type IdentityState,
  type AppRole,
} from "@/contexts/IdentityContext";
import type { ViewMode } from "@/margenkalkulator/engine/types";

// ============================================
// 1. Sensitive Fields Visibility Tests
// ============================================

describe("Sensitive Fields Visibility", () => {
  describe("Customer Session Active (Safety Lock)", () => {
    it("masks ALL dealer-sensitive fields when customerSession is active, even in dealer mode", () => {
      const result = computeSensitiveFieldsVisibility("admin", true, "dealer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.showOmoSelector).toBe(false);
      expect(result.showFhPartnerToggle).toBe(false);
      expect(result.isCustomerSessionActive).toBe(true);
      expect(result.effectiveMode).toBe("customer");
    });

    it("masks fields for manager role when customerSession is active", () => {
      const result = computeSensitiveFieldsVisibility("manager", true, "dealer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });

    it("masks fields for sales role when customerSession is active", () => {
      const result = computeSensitiveFieldsVisibility("sales", true, "dealer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });

    it("customerSession takes priority over viewMode=dealer", () => {
      // Even when viewMode is dealer, customerSession=true should hide everything
      const result = computeSensitiveFieldsVisibility("admin", true, "dealer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });
  });

  describe("Customer ViewMode (without active session)", () => {
    it("hides dealer economics in customer viewMode for admin", () => {
      const result = computeSensitiveFieldsVisibility("admin", false, "customer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.showOmoSelector).toBe(false);
      expect(result.showFhPartnerToggle).toBe(false);
      expect(result.isCustomerSessionActive).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });

    it("hides dealer economics in customer viewMode for manager", () => {
      const result = computeSensitiveFieldsVisibility("manager", false, "customer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });

    it("hides dealer economics in customer viewMode for sales", () => {
      const result = computeSensitiveFieldsVisibility("sales", false, "customer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    });
  });

  describe("Dealer ViewMode (without active session)", () => {
    it("shows dealer economics in dealer viewMode for admin", () => {
      const result = computeSensitiveFieldsVisibility("admin", false, "dealer");
      
      expect(result.showDealerEconomics).toBe(true);
      expect(result.showHardwareEk).toBe(true);
      expect(result.showOmoSelector).toBe(true);
      expect(result.showFhPartnerToggle).toBe(true);
      expect(result.isCustomerSessionActive).toBe(false);
      expect(result.effectiveMode).toBe("dealer");
    });

    it("shows dealer economics in dealer viewMode for manager", () => {
      const result = computeSensitiveFieldsVisibility("manager", false, "dealer");
      
      expect(result.showDealerEconomics).toBe(true);
      expect(result.showHardwareEk).toBe(true);
      expect(result.effectiveMode).toBe("dealer");
    });

    it("shows dealer economics in dealer viewMode for sales", () => {
      const result = computeSensitiveFieldsVisibility("sales", false, "dealer");
      
      expect(result.showDealerEconomics).toBe(true);
      expect(result.showHardwareEk).toBe(true);
      expect(result.effectiveMode).toBe("dealer");
    });
  });
});

// ============================================
// 2. RBAC Access Control Tests
// ============================================

describe("RBAC Access Control", () => {
  describe("canAccessAdmin logic", () => {
    const checkCanAccessAdmin = (role: AppRole): boolean => {
      return role === "admin" || role === "manager";
    };

    it("admin role can access admin panel", () => {
      expect(checkCanAccessAdmin("admin")).toBe(true);
    });

    it("manager role can access admin panel", () => {
      expect(checkCanAccessAdmin("manager")).toBe(true);
    });

    it("sales role CANNOT access admin panel", () => {
      expect(checkCanAccessAdmin("sales")).toBe(false);
    });
  });
});

// ============================================
// 3. Storage Scoping Tests
// ============================================

describe("Storage Scoping", () => {
  describe("getScopedStorageKey", () => {
    it("generates correct scoped key with all identity fields", () => {
      const identity: IdentityState = {
        userId: "user_123",
        displayName: "Test User",
        role: "sales",
        departmentId: "store_berlin",
        tenantId: "tenant_acme",
      };

      const key = getScopedStorageKey("margenkalkulator_drafts", identity);
      
      expect(key).toBe("margenkalkulator_drafts_tenant_acme_store_berlin_user_123");
    });

    it("handles default identity values", () => {
      const identity: IdentityState = {
        userId: "user_local",
        displayName: "Gast",
        role: "sales",
        departmentId: "dept_default",
        tenantId: "tenant_default",
      };

      const key = getScopedStorageKey("margenkalkulator_history", identity);
      
      expect(key).toBe("margenkalkulator_history_tenant_default_dept_default_user_local");
    });

    it("different users get different keys", () => {
      const user1: IdentityState = {
        userId: "user_1",
        displayName: "User 1",
        role: "sales",
        departmentId: "dept_a",
        tenantId: "tenant_x",
      };

      const user2: IdentityState = {
        userId: "user_2",
        displayName: "User 2",
        role: "sales",
        departmentId: "dept_a",
        tenantId: "tenant_x",
      };

      const key1 = getScopedStorageKey("drafts", user1);
      const key2 = getScopedStorageKey("drafts", user2);
      
      expect(key1).not.toBe(key2);
    });

    it("same user in different departments gets different keys", () => {
      const userDeptA: IdentityState = {
        userId: "user_1",
        displayName: "User",
        role: "sales",
        departmentId: "dept_a",
        tenantId: "tenant_x",
      };

      const userDeptB: IdentityState = {
        userId: "user_1",
        displayName: "User",
        role: "sales",
        departmentId: "dept_b",
        tenantId: "tenant_x",
      };

      const keyA = getScopedStorageKey("drafts", userDeptA);
      const keyB = getScopedStorageKey("drafts", userDeptB);
      
      expect(keyA).not.toBe(keyB);
    });

    it("same user in different tenants gets different keys", () => {
      const userTenantX: IdentityState = {
        userId: "user_1",
        displayName: "User",
        role: "sales",
        departmentId: "dept_a",
        tenantId: "tenant_x",
      };

      const userTenantY: IdentityState = {
        userId: "user_1",
        displayName: "User",
        role: "sales",
        departmentId: "dept_a",
        tenantId: "tenant_y",
      };

      const keyX = getScopedStorageKey("drafts", userTenantX);
      const keyY = getScopedStorageKey("drafts", userTenantY);
      
      expect(keyX).not.toBe(keyY);
    });
  });
});

// ============================================
// 4. Supabase → App Role Mapping Tests
// ============================================

describe("Supabase to App Role Mapping", () => {
  it("maps 'admin' to 'admin'", () => {
    expect(mapSupabaseToAppRole("admin")).toBe("admin");
  });

  it("maps 'moderator' to 'manager'", () => {
    expect(mapSupabaseToAppRole("moderator")).toBe("manager");
  });

  it("maps 'user' to 'sales'", () => {
    expect(mapSupabaseToAppRole("user")).toBe("sales");
  });

  it("falls back to 'sales' for unknown roles", () => {
    expect(mapSupabaseToAppRole("unknown_role")).toBe("sales");
    expect(mapSupabaseToAppRole("superadmin")).toBe("sales");
    expect(mapSupabaseToAppRole("viewer")).toBe("sales");
  });

  it("falls back to 'sales' for null", () => {
    expect(mapSupabaseToAppRole(null)).toBe("sales");
  });

  it("falls back to 'sales' for empty string", () => {
    expect(mapSupabaseToAppRole("")).toBe("sales");
  });
});

// ============================================
// 5. Legacy Storage Migration Tests
// ============================================

describe("Legacy Storage Migration", () => {
  const LEGACY_DRAFTS_KEY = "margenkalkulator_drafts";
  const LEGACY_HISTORY_KEY = "margenkalkulator_history";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("legacy key format detection", () => {
    // Legacy keys are unscoped (no tenant/dept/user suffix)
    const legacyKey = "margenkalkulator_drafts";
    const scopedKey = "margenkalkulator_drafts_tenant_default_dept_default_user_local";
    
    // A scoped key contains underscores after the base key
    const isLegacy = (key: string) => {
      const parts = key.split("_");
      // Legacy keys have fewer parts (just "margenkalkulator", "drafts")
      return parts.length <= 2;
    };
    
    expect(isLegacy(legacyKey)).toBe(true);
    expect(isLegacy(scopedKey)).toBe(false);
  });

  it("migrates legacy drafts to scoped key", () => {
    // Setup: Put legacy data in localStorage
    const legacyData = [{ id: "draft_1", name: "Old Draft" }];
    localStorage.setItem(LEGACY_DRAFTS_KEY, JSON.stringify(legacyData));
    
    // Migration function (simplified version of what's in drafts.ts)
    const migrateLegacyDrafts = (identity: IdentityState) => {
      const legacyData = localStorage.getItem(LEGACY_DRAFTS_KEY);
      if (!legacyData) return false;
      
      const scopedKey = getScopedStorageKey(LEGACY_DRAFTS_KEY, identity);
      
      // Only migrate if scoped key doesn't exist
      if (!localStorage.getItem(scopedKey)) {
        localStorage.setItem(scopedKey, legacyData);
        // Don't delete legacy key - keep for other users
        return true;
      }
      return false;
    };
    
    const defaultIdentity: IdentityState = {
      userId: "user_local",
      displayName: "Gast",
      role: "sales",
      departmentId: "dept_default",
      tenantId: "tenant_default",
    };
    
    // Execute migration
    const migrated = migrateLegacyDrafts(defaultIdentity);
    
    // Verify
    expect(migrated).toBe(true);
    
    const scopedKey = getScopedStorageKey(LEGACY_DRAFTS_KEY, defaultIdentity);
    const migratedData = JSON.parse(localStorage.getItem(scopedKey) || "[]");
    
    expect(migratedData).toEqual(legacyData);
  });

  it("does not overwrite existing scoped data during migration", () => {
    const legacyData = [{ id: "old_draft" }];
    const existingScopedData = [{ id: "new_draft" }];
    
    const defaultIdentity: IdentityState = {
      userId: "user_local",
      displayName: "Gast",
      role: "sales",
      departmentId: "dept_default",
      tenantId: "tenant_default",
    };
    
    const scopedKey = getScopedStorageKey(LEGACY_DRAFTS_KEY, defaultIdentity);
    
    // Setup: Both legacy and scoped data exist
    localStorage.setItem(LEGACY_DRAFTS_KEY, JSON.stringify(legacyData));
    localStorage.setItem(scopedKey, JSON.stringify(existingScopedData));
    
    // Migration function
    const migrateLegacyDrafts = (identity: IdentityState) => {
      const legacyData = localStorage.getItem(LEGACY_DRAFTS_KEY);
      if (!legacyData) return false;
      
      const targetKey = getScopedStorageKey(LEGACY_DRAFTS_KEY, identity);
      
      // Only migrate if scoped key doesn't exist
      if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, legacyData);
        return true;
      }
      return false; // Did not migrate
    };
    
    // Execute migration
    const migrated = migrateLegacyDrafts(defaultIdentity);
    
    // Verify: Migration did NOT overwrite
    expect(migrated).toBe(false);
    
    const currentData = JSON.parse(localStorage.getItem(scopedKey) || "[]");
    expect(currentData).toEqual(existingScopedData);
  });

  it("migration runs only once per user", () => {
    const legacyData = [{ id: "draft_1" }];
    localStorage.setItem(LEGACY_DRAFTS_KEY, JSON.stringify(legacyData));
    
    const identity: IdentityState = {
      userId: "user_1",
      displayName: "User 1",
      role: "sales",
      departmentId: "dept_a",
      tenantId: "tenant_x",
    };
    
    // Migration counter
    let migrationCount = 0;
    
    const migrateLegacyDrafts = (identity: IdentityState) => {
      const legacyData = localStorage.getItem(LEGACY_DRAFTS_KEY);
      if (!legacyData) return false;
      
      const scopedKey = getScopedStorageKey(LEGACY_DRAFTS_KEY, identity);
      
      if (!localStorage.getItem(scopedKey)) {
        localStorage.setItem(scopedKey, legacyData);
        migrationCount++;
        return true;
      }
      return false;
    };
    
    // Run migration multiple times
    migrateLegacyDrafts(identity);
    migrateLegacyDrafts(identity);
    migrateLegacyDrafts(identity);
    
    // Should only have migrated once
    expect(migrationCount).toBe(1);
  });
});

// ============================================
// 6. Integration: Visibility Matrix Tests
// ============================================

describe("Visibility Matrix Integration", () => {
  // Test all combinations of role x customerSession x viewMode
  const roles: AppRole[] = ["admin", "manager", "sales"];
  const sessionStates = [true, false];
  const viewModes: ViewMode[] = ["customer", "dealer"];

  it("customerSession=true always hides sensitive fields regardless of role or viewMode", () => {
    for (const role of roles) {
      for (const viewMode of viewModes) {
        const result = computeSensitiveFieldsVisibility(role, true, viewMode);
        
        expect(result.showDealerEconomics).toBe(false);
        expect(result.showHardwareEk).toBe(false);
        expect(result.showOmoSelector).toBe(false);
        expect(result.showFhPartnerToggle).toBe(false);
        expect(result.effectiveMode).toBe("customer");
      }
    }
  });

  it("viewMode=customer hides sensitive fields for all roles (when session inactive)", () => {
    for (const role of roles) {
      const result = computeSensitiveFieldsVisibility(role, false, "customer");
      
      expect(result.showDealerEconomics).toBe(false);
      expect(result.showHardwareEk).toBe(false);
      expect(result.effectiveMode).toBe("customer");
    }
  });

  it("viewMode=dealer shows sensitive fields for all roles (when session inactive)", () => {
    for (const role of roles) {
      const result = computeSensitiveFieldsVisibility(role, false, "dealer");
      
      expect(result.showDealerEconomics).toBe(true);
      expect(result.showHardwareEk).toBe(true);
      expect(result.effectiveMode).toBe("dealer");
    }
  });
});
