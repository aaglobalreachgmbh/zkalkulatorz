import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2 } from "lucide-react";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { PublisherModal } from "@/components/PublisherModal";

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <Card className="w-full shadow-elevated animate-fade-in">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">MargenKalkulator</CardTitle>
              <CardDescription className="text-muted-foreground">
                Vodafone Business Partner Portal
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Text */}
            <p className="text-sm text-center text-muted-foreground">
              Anmeldung ist derzeit deaktiviert.
            </p>

            {/* Security Note */}
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                🔒 Kontaktieren Sie den Administrator für Zugang
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publisher Info */}
        <div className="mt-6 text-center">
          <PublisherModal
            trigger={
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {PUBLISHER.getCopyright()}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
