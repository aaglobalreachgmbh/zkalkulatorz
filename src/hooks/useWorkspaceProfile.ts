// ============================================
// useWorkspaceProfile – Nutzertyp, Palette, Startseiten-Layout
// Persistiert pro Benutzer (scoped localStorage). Kein throw.
// ============================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PALETTES, type HomeLayout, type UserType } from "@/margenkalkulator/workspace/profiles";

export interface WorkspaceProfile {
  userType: UserType | null;
  paletteId: string;
  homeLayout: HomeLayout;
}

const DEFAULT_PROFILE: WorkspaceProfile = { userType: null, paletteId: "vodafone", homeLayout: "cockpit" };
const EVENT = "workspace-profile-changed";

function keyFor(userId: string | undefined) {
  return `workspace-profile:${userId ?? "anon"}`;
}

function read(userId: string | undefined): WorkspaceProfile {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<WorkspaceProfile>) };
  } catch (err) {
    console.warn("[useWorkspaceProfile] read failed", err);
    return DEFAULT_PROFILE;
  }
}

export function applyPalette(paletteId: string) {
  const palette = PALETTES.find((p) => p.id === paletteId);
  const root = document.documentElement;
  if (!palette || palette.id === "vodafone") {
    root.style.removeProperty("--tenant-primary-hsl");
    return;
  }
  root.style.setProperty("--tenant-primary-hsl", palette.primaryHsl);
}

export function useWorkspaceProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<WorkspaceProfile>(() => read(userId));

  useEffect(() => {
    setProfile(read(userId));
    const sync = () => setProfile(read(userId));
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [userId]);

  const update = useCallback(
    (patch: Partial<WorkspaceProfile>) => {
      const next = { ...read(userId), ...patch };
      try {
        localStorage.setItem(keyFor(userId), JSON.stringify(next));
      } catch (err) {
        console.warn("[useWorkspaceProfile] write failed", err);
      }
      if (patch.paletteId) applyPalette(patch.paletteId);
      window.dispatchEvent(new Event(EVENT));
    },
    [userId]
  );

  return { profile, update };
}
