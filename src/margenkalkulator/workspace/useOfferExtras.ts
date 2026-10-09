// ============================================
// Zusatzleistungen (eigene Produkte) im aktuellen Angebot.
// Lokal, scoped (tenant+dept+user), außerhalb der Preis-Engine. Kein throw.
// ============================================
import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/contexts/IdentityContext";
import type { CustomProduct } from "./useBusinessFocus";

const EVENT = "offer-extras-changed";

function read(key: string): CustomProduct[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CustomProduct[]) : [];
  } catch {
    return [];
  }
}

export function useOfferExtras() {
  const { identity } = useIdentity();
  const key = `offer-extras:${identity?.tenantId ?? "t"}:${identity?.departmentId ?? "d"}:${identity?.userId ?? "u"}`;
  const [extras, setState] = useState<CustomProduct[]>(() => read(key));

  useEffect(() => {
    const sync = () => setState(read(key));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [key]);

  const save = useCallback((next: CustomProduct[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.warn("[useOfferExtras] write failed", err);
    }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);

  const add = useCallback((p: CustomProduct) => save([...read(key), { ...p, id: `${p.id}-${Date.now()}` }]), [key, save]);
  const remove = useCallback((id: string) => save(read(key).filter((e) => e.id !== id)), [key, save]);
  const clear = useCallback(() => save([]), [save]);

  const monthlyNet = extras.reduce((s, e) => s + (Number(e.monthlyNet) || 0), 0);
  const oneTimeNet = extras.reduce((s, e) => s + (Number(e.oneTimeNet) || 0), 0);

  return { extras, add, remove, clear, monthlyNet, oneTimeNet };
}
