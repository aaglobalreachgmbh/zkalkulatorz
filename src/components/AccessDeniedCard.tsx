// ============================================
// AccessDeniedCard - Einheitliche "Kein Zugriff" UI
// ============================================

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

interface AccessDeniedCardProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export function AccessDeniedCard({
  title = "Kein Zugriff",
  description = "Sie haben keine Berechtigung für diese Funktion. Kontaktieren Sie Ihren Administrator.",
  showBackButton = true,
  showHomeButton = true,
}: AccessDeniedCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full text-center border-destructive/20">
        <CardContent className="pt-8 pb-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            {description}
          </p>
          <div className="flex gap-3 justify-center">
            {showBackButton && (
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            )}
            {showHomeButton && (
              <Button variant="default" onClick={() => navigate("/")}>
                <Home className="h-4 w-4 mr-2" />
                Zur Startseite
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
