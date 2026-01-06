// ============================================
// Publisher/About Modal - allenetze.de
// ============================================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { PUBLISHER } from "@/margenkalkulator/publisherConfig";
import { useIdentity } from "@/contexts/IdentityContext";
import { useUserRole } from "@/hooks/useUserRole";

interface PublisherModalProps {
  trigger?: React.ReactNode;
}

export function PublisherModal({ trigger }: PublisherModalProps) {
  const { identity } = useIdentity();
  const { isAdmin, isTenantAdmin } = useUserRole();
  const showLicense = isAdmin || isTenantAdmin;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
            <span className="sr-only">Über diese App</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Über diese App</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          {/* Publisher */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Herausgeber
            </h4>
            <div className="pl-6 text-muted-foreground">
              <p className="font-medium text-foreground">{PUBLISHER.name}</p>
              <p>{PUBLISHER.address.street}</p>
              <p>{PUBLISHER.address.zipCity}, {PUBLISHER.address.country}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Kontakt
            </h4>
            <div className="pl-6 space-y-1 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <a 
                  href={`mailto:${PUBLISHER.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {PUBLISHER.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <a 
                  href={`tel:${PUBLISHER.phone}`}
                  className="hover:text-foreground transition-colors"
                >
                  {PUBLISHER.phone}
                </a>
              </p>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-1 text-muted-foreground text-xs border-t pt-3">
            <p>Vertreten durch: {PUBLISHER.representative}</p>
            <p>USt-IdNr.: {PUBLISHER.vatId}</p>
          </div>

          {/* License info (admin only) */}
          {showLicense && identity.tenantId && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Nutzungslizenz: <span className="font-medium">{identity.tenantId.slice(0, 8)}...</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
