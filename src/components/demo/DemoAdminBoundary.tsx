import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useDemoAccess } from "@/hooks/useDemoAccess";

interface DemoAdminBoundaryProps {
  children: React.ReactNode;
  scope: "shop" | "platform";
}

/**
 * Keeps administrative demo screens explorable while preventing every
 * write request to the application backend. Real authorization remains
 * server-side; this is the deliberate UX safety layer for the demo.
 */
export function DemoAdminBoundary({ children, scope }: DemoAdminBoundaryProps) {
  const demoAccess = useDemoAccess();
  const [armed, setArmed] = useState(!demoAccess);

  useEffect(() => {
    if (!demoAccess) return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const isBackendRequest = (
        url.includes("/rest/v1/") ||
        url.includes("/functions/v1/") ||
        url.includes("/storage/v1/")
      );

      if (isBackendRequest) {
        if (method !== "GET") toast.info("Demo-Vorschau: Diese Änderung wurde nicht an das echte System gesendet.");
        const body = method === "GET" ? [] : { demo: true, blocked: true };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json", "Content-Range": "0-0/0" },
        });
      }

      return originalFetch(input, init);
    };

    setArmed(true);
    return () => {
      window.fetch = originalFetch;
      setArmed(false);
    };
  }, [demoAccess]);

  if (!demoAccess) return <>{children}</>;
  if (!armed) {
    return <div className="p-6 text-sm text-muted-foreground">Demo-Verwaltung wird vorbereitet...</div>;
  }

  return (
    <div data-demo-admin-scope={scope}>
      <div className="m-3 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
        <FlaskConical className="h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong>{scope === "platform" ? "Superadmin-Demo" : "Shop-Verwaltung in der Demo"}.</strong>{" "}
          Alle Bereiche sind sichtbar. Änderungen bleiben eine Vorschau und werden nicht an das echte System gesendet.
        </span>
      </div>
      {children}
    </div>
  );
}