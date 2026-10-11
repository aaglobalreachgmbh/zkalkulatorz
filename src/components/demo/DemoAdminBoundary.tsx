import { useEffect } from "react";
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

  useEffect(() => {
    if (!demoAccess) return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const isBackendWrite = method !== "GET" && (
        url.includes("/rest/v1/") ||
        url.includes("/functions/v1/") ||
        url.includes("/storage/v1/")
      );

      if (isBackendWrite) {
        toast.info("Demo-Vorschau: Diese Änderung wurde nicht an das echte System gesendet.");
        return new Response(JSON.stringify({ demo: true, blocked: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [demoAccess]);

  if (!demoAccess) return <>{children}</>;

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