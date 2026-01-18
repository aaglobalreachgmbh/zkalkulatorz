// ============================================
// Welcome Banner Widget with Prominent Logo
// ============================================

import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function WelcomeBanner() {
  const { user } = useAuth();
  const { branding } = useTenantBranding();

  // Extract username from email
  const userName = user?.email?.split("@")[0] || "Benutzer";

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 20%, ${branding.primaryColor || 'hsl(var(--primary))'} 0%, transparent 50%)`,
        }}
      />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">

          {/* Large Logo - Very Prominent */}
          <div className="flex-shrink-0">
            {branding.logoUrl ? (
              <div className="relative">
                <div
                  className="absolute inset-0 blur-2xl opacity-20 scale-110"
                  style={{ backgroundColor: branding.primaryColor || 'hsl(var(--primary))' }}
                />
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName || "Logo"}
                  className="relative h-20 md:h-28 lg:h-32 w-auto max-w-[280px] object-contain drop-shadow-lg"
                />
              </div>
            ) : (
              <div
                className="h-20 md:h-28 lg:h-32 flex items-center px-6 py-4 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${branding.primaryColor || 'hsl(var(--primary))'}15, ${branding.primaryColor || 'hsl(var(--primary))'}05)`,
                  borderLeft: `4px solid ${branding.primaryColor || 'hsl(var(--primary))'}`
                }}
              >
                <span
                  className="text-3xl md:text-4xl lg:text-5xl font-bold"
                  style={{ color: branding.primaryColor || 'hsl(var(--primary))' }}
                >
                  {branding.companyName || "MargenKalkulator"}
                </span>
              </div>
            )}
          </div>

          {/* Welcome Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles
                className="h-5 w-5"
                style={{ color: branding.primaryColor || 'hsl(var(--primary))' }}
              />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Dashboard
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Willkommen zurück!
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              {branding.companyName
                ? `${branding.companyName} — Bereit für den nächsten erfolgreichen Abschluss`
                : "Ihr MargenKalkulator — Bereit für den nächsten erfolgreichen Abschluss"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${branding.primaryColor || 'hsl(var(--primary))'}, transparent)`
        }}
      />
    </Card>
  );
}
