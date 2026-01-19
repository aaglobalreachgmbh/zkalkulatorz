// ============================================
// Phase 3B Tests
// Organisation, Policies, Dataset Governance, Audit Log
// ============================================

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ============================================
// Organisation Tests (Slice 3B.1)
// ============================================

describe("Phase 3B.1: Organisation & Scopes", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Department Scoping", () => {
    it("departments are tenant-scoped with correct storage key", async () => {
      const { loadDepartments, saveDepartments } = await import("@/lib/organisation");
      
      const deptsTenantA = [{ id: "d1", name: "Dept A", description: "", createdAt: "2025-01-01" }];
      const deptsTenantB = [{ id: "d2", name: "Dept B", description: "", createdAt: "2025-01-01" }];
      
      saveDepartments("tenant_a", deptsTenantA);
      saveDepartments("tenant_b", deptsTenantB);
      
      const loadedA = loadDepartments("tenant_a");
      const loadedB = loadDepartments("tenant_b");
      
      expect(loadedA[0].id).toBe("d1");
      expect(loadedB[0].id).toBe("d2");
    });

    it("createDepartment adds to correct tenant", async () => {
      const { createDepartment, loadDepartments } = await import("@/lib/organisation");
      
      const newDept = createDepartment("test_tenant", "Test Abteilung", "Beschreibung");
      
      expect(newDept.name).toBe("Test Abteilung");
      expect(newDept.id).toMatch(/^dept_\d+$/);
      
      const allDepts = loadDepartments("test_tenant");
      expect(allDepts.some(d => d.id === newDept.id)).toBe(true);
    });

    it("deleteDepartment removes from correct tenant", async () => {
      const { createDepartment, deleteDepartment, loadDepartments } = await import("@/lib/organisation");
      
      const dept = createDepartment("test_tenant", "To Delete");
      expect(deleteDepartment("test_tenant", dept.id)).toBe(true);
      
      const remaining = loadDepartments("test_tenant");
      expect(remaining.some(d => d.id === dept.id)).toBe(false);
    });
  });

  describe("Access Control", () => {
    it("admin can access all departments", async () => {
      const { canAccessDepartment } = await import("@/lib/organisation");
      
      const adminIdentity = {
        userId: "admin_1",
        displayName: "Admin",
        role: "admin" as const,
        departmentId: "hq",
        tenantId: "test_tenant",
      };
      
      expect(canAccessDepartment(adminIdentity, "hq")).toBe(true);
      expect(canAccessDepartment(adminIdentity, "store_berlin")).toBe(true);
      expect(canAccessDepartment(adminIdentity, "any_dept")).toBe(true);
    });

    it("sales can only access own department", async () => {
      const { canAccessDepartment } = await import("@/lib/organisation");
      
      const salesIdentity = {
        userId: "sales_1",
        displayName: "Sales",
        role: "sales" as const,
        departmentId: "store_berlin",
        tenantId: "test_tenant",
      };
      
      expect(canAccessDepartment(salesIdentity, "store_berlin")).toBe(true);
      expect(canAccessDepartment(salesIdentity, "hq")).toBe(false);
      expect(canAccessDepartment(salesIdentity, "store_munich")).toBe(false);
    });

    it("manager can access all departments", async () => {
      const { canAccessDepartment } = await import("@/lib/organisation");
      
      const managerIdentity = {
        userId: "manager_1",
        displayName: "Manager",
        role: "manager" as const,
        departmentId: "store_berlin",
        tenantId: "test_tenant",
      };
      
      expect(canAccessDepartment(managerIdentity, "store_berlin")).toBe(true);
      expect(canAccessDepartment(managerIdentity, "hq")).toBe(true);
    });
  });
});

// ============================================
// Policies Tests (Slice 3B.2)
// ============================================

describe("Phase 3B.2: Policies & Defaults", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Policy Precedence", () => {
    it("dept override beats tenant default", async () => {
      const { 
        saveTenantPolicy, 
        saveDeptPolicy, 
        getEffectivePolicy,
        DEFAULT_POLICY 
      } = await import("@/lib/policies");
      
      saveTenantPolicy("test_tenant", { defaultViewMode: "customer" });
      saveDeptPolicy("test_tenant", "store_berlin", { defaultViewMode: "dealer" });
      
      const effective = getEffectivePolicy("test_tenant", "store_berlin");
      expect(effective.defaultViewMode).toBe("dealer"); // Dept wins
    });

    it("missing dept policy falls back to tenant", async () => {
      const { 
        saveTenantPolicy, 
        getEffectivePolicy 
      } = await import("@/lib/policies");
      
      saveTenantPolicy("test_tenant", { 
        defaultViewMode: "customer",
        marginWarningThreshold: 50 
      });
      
      const effective = getEffectivePolicy("test_tenant", "store_berlin");
      expect(effective.defaultViewMode).toBe("customer");
      expect(effective.marginWarningThreshold).toBe(50);
    });

    it("missing both falls back to DEFAULT_POLICY", async () => {
      const { getEffectivePolicy, DEFAULT_POLICY } = await import("@/lib/policies");
      
      const effective = getEffectivePolicy("nonexistent_tenant", "nonexistent_dept");
      
      expect(effective.defaultViewMode).toBe(DEFAULT_POLICY.defaultViewMode);
      expect(effective.showCustomerSessionToggle).toBe(DEFAULT_POLICY.showCustomerSessionToggle);
      expect(effective.sensitiveFieldKeys).toEqual(DEFAULT_POLICY.sensitiveFieldKeys);
    });

    it("tenant policy overrides DEFAULT_POLICY", async () => {
      const { 
        saveTenantPolicy, 
        getEffectivePolicy,
        DEFAULT_POLICY 
      } = await import("@/lib/policies");
      
      saveTenantPolicy("test_tenant", { showCustomerSessionToggle: false });
      
      const effective = getEffectivePolicy("test_tenant", "any_dept");
      expect(effective.showCustomerSessionToggle).toBe(false);
      expect(effective.defaultViewMode).toBe(DEFAULT_POLICY.defaultViewMode); // Unchanged
    });
  });

  describe("Sensitive Fields", () => {
    it("sensitiveFieldKeys is centralized in policy", async () => {
      const { DEFAULT_POLICY, isSensitiveField } = await import("@/lib/policies");
      
      expect(DEFAULT_POLICY.sensitiveFieldKeys).toContain("hardwareEk");
      expect(DEFAULT_POLICY.sensitiveFieldKeys).toContain("dealerMargin");
      expect(isSensitiveField(DEFAULT_POLICY, "hardwareEk")).toBe(true);
      expect(isSensitiveField(DEFAULT_POLICY, "customerName")).toBe(false);
    });
  });
});

// ============================================
// Dataset Governance Tests (Slice 3B.3)
// ============================================

describe("Phase 3B.3: Dataset Governance", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Governance Flow", () => {
    it("only PUBLISHED dataset becomes active", async () => {
      const { 
        createDraftDataset,
        transitionDatasetStatus,
        getActiveDatasetId,
        loadDatasetRegistry
      } = await import("@/lib/datasetGovernance");
      
      const mockPayload = {
        meta: { datasetVersion: "test_v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
        mobileTariffs: [],
        fixedNetProducts: [],
      };
      
      // Create draft
      const draft = createDraftDataset(
        "test_tenant", "store_berlin", mockPayload as any,
        "admin_1", "Admin"
      );
      
      // Draft should NOT be active
      expect(getActiveDatasetId("test_tenant", "store_berlin")).toBeNull();
      
      // Transition to review
      transitionDatasetStatus(
        "test_tenant", "store_berlin", draft.datasetId,
        "review", "admin_1", "Admin"
      );
      expect(getActiveDatasetId("test_tenant", "store_berlin")).toBeNull();
      
      // Transition to published
      transitionDatasetStatus(
        "test_tenant", "store_berlin", draft.datasetId,
        "published", "admin_1", "Admin"
      );
      expect(getActiveDatasetId("test_tenant", "store_berlin")).toBe(draft.datasetId);
    });

    it("draft does not affect calculations", async () => {
      const { 
        createDraftDataset,
        getActiveDataset
      } = await import("@/lib/datasetGovernance");
      
      const mockPayload = {
        meta: { datasetVersion: "draft_v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
        mobileTariffs: [],
        fixedNetProducts: [],
      };
      
      createDraftDataset(
        "test_tenant", "store_berlin", mockPayload as any,
        "sales_1", "Sales"
      );
      
      // Active dataset should be null (draft not active)
      const active = getActiveDataset("test_tenant", "store_berlin");
      expect(active).toBeNull();
    });
  });

  describe("Role Gating", () => {
    it("sales cannot publish", async () => {
      const { canPublish, canTransition } = await import("@/lib/datasetGovernance");
      
      expect(canPublish("sales")).toBe(false);
      expect(canTransition("sales", "review", "published")).toBe(false);
    });

    it("manager cannot publish", async () => {
      const { canPublish, canTransition } = await import("@/lib/datasetGovernance");
      
      expect(canPublish("manager")).toBe(false);
      expect(canTransition("manager", "review", "published")).toBe(false);
    });

    it("admin can publish", async () => {
      const { canPublish, canTransition } = await import("@/lib/datasetGovernance");
      
      expect(canPublish("admin")).toBe(true);
      expect(canTransition("admin", "review", "published")).toBe(true);
    });

    it("manager can set review", async () => {
      const { canSetReview, canTransition } = await import("@/lib/datasetGovernance");
      
      expect(canSetReview("manager")).toBe(true);
      expect(canTransition("manager", "draft", "review")).toBe(true);
    });

    it("sales cannot set review", async () => {
      const { canSetReview, canTransition } = await import("@/lib/datasetGovernance");
      
      expect(canSetReview("sales")).toBe(false);
      expect(canTransition("sales", "draft", "review")).toBe(false);
    });

    it("all roles can import (create draft)", async () => {
      const { canImport } = await import("@/lib/datasetGovernance");
      
      expect(canImport("sales")).toBe(true);
      expect(canImport("manager")).toBe(true);
      expect(canImport("admin")).toBe(true);
    });
  });

  describe("Dataset Scoping", () => {
    it("datasets are scoped to tenant+department", async () => {
      const { createDraftDataset, loadDatasetRegistry } = await import("@/lib/datasetGovernance");
      
      const mockPayload = {
        meta: { datasetVersion: "v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
        mobileTariffs: [],
        fixedNetProducts: [],
      };
      
      createDraftDataset("tenant_a", "dept_1", mockPayload as any, "u1", "User1");
      createDraftDataset("tenant_a", "dept_2", mockPayload as any, "u2", "User2");
      createDraftDataset("tenant_b", "dept_1", mockPayload as any, "u3", "User3");
      
      expect(loadDatasetRegistry("tenant_a", "dept_1")).toHaveLength(1);
      expect(loadDatasetRegistry("tenant_a", "dept_2")).toHaveLength(1);
      expect(loadDatasetRegistry("tenant_b", "dept_1")).toHaveLength(1);
      expect(loadDatasetRegistry("tenant_b", "dept_2")).toHaveLength(0);
    });
  });
});

// ============================================
// Audit Log Tests (Slice 3B.4)
// ============================================

describe("Phase 3B.4: Audit Log", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Audit Event Logging", () => {
    it("logs policy change with actor info", async () => {
      const { logPolicyChange, loadAuditLog } = await import("@/lib/auditLog");
      
      const event = logPolicyChange(
        "test_tenant",
        "store_berlin",
        "admin_1",
        "Max Admin",
        "admin",
        "tenant",
        { defaultViewMode: { from: "dealer", to: "customer" } }
      );
      
      expect(event.action).toBe("policy_change");
      expect(event.actorUserId).toBe("admin_1");
      expect(event.actorDisplayName).toBe("Max Admin");
      expect(event.actorRole).toBe("admin");
      expect(event.meta?.changes).toBeDefined();
      
      const log = loadAuditLog("test_tenant", "store_berlin");
      expect(log).toHaveLength(1);
    });

    it("logs dataset status change", async () => {
      const { logDatasetStatusChange, loadAuditLog } = await import("@/lib/auditLog");
      
      logDatasetStatusChange(
        "test_tenant",
        "store_berlin",
        "admin_1",
        "Max Admin",
        "admin",
        "ds_123",
        "review",
        "published",
        "Alle Prüfungen bestanden"
      );
      
      const log = loadAuditLog("test_tenant", "store_berlin");
      expect(log[0].action).toBe("dataset_status_change");
      expect(log[0].meta?.fromStatus).toBe("review");
      expect(log[0].meta?.toStatus).toBe("published");
    });

    it("logs department actions", async () => {
      const { logDepartmentAction, loadAuditLog } = await import("@/lib/auditLog");
      
      logDepartmentAction(
        "test_tenant",
        "hq",
        "admin_1",
        "Max Admin",
        "admin",
        "department_create",
        "store_hamburg",
        { name: "Store Hamburg" }
      );
      
      const log = loadAuditLog("test_tenant", "hq");
      expect(log[0].action).toBe("department_create");
      expect(log[0].target).toBe("department:store_hamburg");
    });
  });

  describe("Audit Log Scoping", () => {
    it("audit logs are scoped to tenant+dept", async () => {
      const { logPolicyChange, loadAuditLog } = await import("@/lib/auditLog");
      
      logPolicyChange("tenant_a", "dept_1", "u1", "U1", "admin", "tenant", {});
      logPolicyChange("tenant_a", "dept_2", "u2", "U2", "admin", "tenant", {});
      logPolicyChange("tenant_b", "dept_1", "u3", "U3", "admin", "tenant", {});
      
      expect(loadAuditLog("tenant_a", "dept_1")).toHaveLength(1);
      expect(loadAuditLog("tenant_a", "dept_2")).toHaveLength(1);
      expect(loadAuditLog("tenant_b", "dept_1")).toHaveLength(1);
      expect(loadAuditLog("tenant_b", "dept_2")).toHaveLength(0);
    });

    it("audit log trims to max 100 events", async () => {
      const { logPolicyChange, loadAuditLog } = await import("@/lib/auditLog");
      
      // Add 105 events
      for (let i = 0; i < 105; i++) {
        logPolicyChange("test_tenant", "test_dept", `user_${i}`, `User ${i}`, "admin", "tenant", {});
      }
      
      const log = loadAuditLog("test_tenant", "test_dept");
      expect(log.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Query Functions", () => {
    it("getRecentAuditEvents returns most recent first", async () => {
      const { logPolicyChange, getRecentAuditEvents } = await import("@/lib/auditLog");
      
      logPolicyChange("t", "d", "u1", "First", "admin", "tenant", {});
      logPolicyChange("t", "d", "u2", "Second", "admin", "tenant", {});
      logPolicyChange("t", "d", "u3", "Third", "admin", "tenant", {});
      
      const recent = getRecentAuditEvents("t", "d", 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].actorDisplayName).toBe("Third");
      expect(recent[1].actorDisplayName).toBe("Second");
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe("Phase 3B Integration", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("full governance flow with audit trail", async () => {
    const { createDraftDataset, transitionDatasetStatus, getActiveDatasetId } = await import("@/lib/datasetGovernance");
    const { loadAuditLog, logDatasetImport, logDatasetStatusChange } = await import("@/lib/auditLog");
    
    const mockPayload = {
      meta: { datasetVersion: "full_flow_v1", validFromISO: "2025-01-01", verifiedAtISO: "2025-01-01" },
      mobileTariffs: [],
      fixedNetProducts: [],
    };
    
    // 1. Sales imports draft
    const draft = createDraftDataset("t", "d", mockPayload as any, "sales_1", "Tom Verkäufer");
    logDatasetImport("t", "d", "sales_1", "Tom Verkäufer", "sales", draft.datasetId, "full_flow_v1");
    
    // 2. Manager sends to review
    transitionDatasetStatus("t", "d", draft.datasetId, "review", "manager_1", "Lisa Manager");
    logDatasetStatusChange("t", "d", "manager_1", "Lisa Manager", "manager", draft.datasetId, "draft", "review");
    
    // 3. Admin publishes
    transitionDatasetStatus("t", "d", draft.datasetId, "published", "admin_1", "Max Admin");
    logDatasetStatusChange("t", "d", "admin_1", "Max Admin", "admin", draft.datasetId, "review", "published");
    
    // Verify active
    expect(getActiveDatasetId("t", "d")).toBe(draft.datasetId);
    
    // Verify audit trail
    const auditLog = loadAuditLog("t", "d");
    expect(auditLog.length).toBe(3);
    expect(auditLog[0].action).toBe("dataset_import");
    expect(auditLog[1].action).toBe("dataset_status_change");
    expect(auditLog[2].action).toBe("dataset_status_change");
  });
});
