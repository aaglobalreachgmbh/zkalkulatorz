// ============================================
// Betreiberfokus + eigene Produkte – lokal, scoped (tenant+dept+user). Kein throw.
// ============================================
import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/contexts/IdentityContext";
import { DEFAULT_FOCUS, type FocusProfile } from "./suggestions";

export type CustomProductCategory = "Zubehör" | "Service" | "Energie" | "Versicherung" | "Festnetz" | "Mobilfunk" | "Sonstiges";

export interface CustomProduct {
  id: string;
  name: string;
  category: CustomProductCategory;
  monthlyNet: number;
  oneTimeNet: number;
  provision: number;
  note?: string;
  demo?: boolean;
}

export const CUSTOM_PRODUCT_CATEGORIES: CustomProductCategory[] = [
  "Zubehör", "Service", "Energie", "Versicherung", "Festnetz", "Mobilfunk", "Sonstiges",
];

export const DEMO_CUSTOM_PRODUCTS: CustomProduct[] = [
  { id: "demo-cp-1", name: "Displayschutz + Hülle Premium", category: "Zubehör", monthlyNet: 0, oneTimeNet: 29.9, provision: 12, demo: true },
  { id: "demo-cp-2", name: "Einrichtungsservice Smartphone", category: "Service", monthlyNet: 0, oneTimeNet: 39, provision: 39, demo: true },
  { id: "demo-cp-3", name: "Geräteversicherung Plus", category: "Versicherung", monthlyNet: 7.99, oneTimeNet: 0, provision: 45, demo: true },
  { id: "demo-cp-4", name: "Ökostrom Gewerbe 12M", category: "Energie", monthlyNet: 89, oneTimeNet: 0, provision: 80, note: "Beispielpartner", demo: true },
  { id: "demo-cp-5", name: "Erdgas Gewerbe 24M", category: "Energie", monthlyNet: 120, oneTimeNet: 0, provision: 95, demo: true },
  { id: "demo-cp-6", name: "Datenübertragung & Backup", category: "Service", monthlyNet: 0, oneTimeNet: 19, provision: 19, demo: true },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("business-focus-changed"));
  } catch (err) {
    console.warn("[useBusinessFocus] write failed", err);
  }
}

export function useBusinessFocus() {
  const { identity } = useIdentity();
  const scope = `${identity?.tenantId ?? "t"}:${identity?.departmentId ?? "d"}:${identity?.userId ?? "u"}`;
  const focusKey = `business-focus:${scope}`;
  const productsKey = `custom-products:${scope}`;

  const [focus, setFocusState] = useState<FocusProfile>(() => read(focusKey, DEFAULT_FOCUS));
  const [products, setProductsState] = useState<CustomProduct[]>(() => read(productsKey, [] as CustomProduct[]));

  useEffect(() => {
    const sync = () => {
      setFocusState(read(focusKey, DEFAULT_FOCUS));
      setProductsState(read(productsKey, [] as CustomProduct[]));
    };
    sync();
    window.addEventListener("business-focus-changed", sync);
    return () => window.removeEventListener("business-focus-changed", sync);
  }, [focusKey, productsKey]);

  const setFocus = useCallback((f: FocusProfile) => write(focusKey, f), [focusKey]);
  const setProducts = useCallback((p: CustomProduct[]) => write(productsKey, p), [productsKey]);

  return { focus, setFocus, products, setProducts };
}
