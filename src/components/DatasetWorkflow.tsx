// ============================================
// Dataset Workflow Component - Phase 3B.3
// Status badges and transition buttons
// ============================================

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  FileEdit, 
  Eye, 
  CheckCircle, 
  Archive,
  ArrowRight,
  Clock,
  User,
  Zap,
} from "lucide-react";
import { useIdentity } from "@/contexts/IdentityContext";
import { useFeature } from "@/hooks/useFeature";
import {
  type ManagedDataset,
  type DatasetStatus,
  canSetReview,
  canPublish,
  canTransition,
} from "@/lib/datasetGovernance";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

// ============================================
// Status Badge
// ============================================

interface StatusBadgeProps {
  status: DatasetStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    draft: { 
      label: "Entwurf", 
      variant: "secondary" as const, 
      icon: FileEdit 
    },
    review: { 
      label: "In Prüfung", 
      variant: "outline" as const, 
      icon: Eye 
    },
    published: { 
      label: "Aktiv", 
      variant: "default" as const, 
      icon: CheckCircle 
    },
    archived: { 
      label: "Archiviert", 
      variant: "secondary" as const, 
      icon: Archive 
    },
  };
  
  const { label, variant, icon: Icon } = config[status];
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ============================================
// Dataset Card
// ============================================

interface DatasetCardProps {
  dataset: ManagedDataset;
  isActive?: boolean;
  onTransition: (datasetId: string, newStatus: DatasetStatus) => void;
  onPreview: (datasetId: string) => void;
}

export function DatasetCard({ dataset, isActive, onTransition, onPreview }: DatasetCardProps) {
  const { identity } = useIdentity();
  const { enabled: canBypassApproval } = useFeature("adminBypassApproval");
  
  const canReview = canSetReview(identity.role) && dataset.status === "draft";
  const canPub = canPublish(identity.role) && dataset.status === "review";
  const canReject = canPublish(identity.role) && dataset.status === "review";
  const canArchive = canPublish(identity.role) && dataset.status === "published";
  
  // Admin bypass: can publish directly from draft
  const canBypassToPublish = canBypassApproval && dataset.status === "draft";
  
  const createdAgo = formatDistanceToNow(new Date(dataset.createdAt), { 
    addSuffix: true, 
    locale: de 
  });
  
  return (
    <div className={`p-4 rounded-lg border ${isActive ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={dataset.status} />
            {isActive && (
              <Badge variant="default" className="bg-green-600">
                Aktiv
              </Badge>
            )}
          </div>
          <p className="font-mono text-sm mb-1">{dataset.datasetVersion}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {dataset.createdByName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {createdAgo}
            </span>
          </div>
          {dataset.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {dataset.notes}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => onPreview(dataset.datasetId)}>
            <Eye className="w-3 h-3 mr-1" />
            Vorschau
          </Button>
          
          {canReview && !canBypassToPublish && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onTransition(dataset.datasetId, "review")}
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Zur Prüfung
            </Button>
          )}
          
          {canBypassToPublish && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Zap className="w-3 h-3 mr-1" />
                  Direkt freigeben
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Direkt freigeben (Admin-Bypass)?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sie überspringen den normalen Approval-Workflow. Dieses Dataset wird sofort 
                    für alle Berechnungen aktiv. Nur für Notfälle empfohlen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onTransition(dataset.datasetId, "published")}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Direkt freigeben
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {canPub && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Freigeben
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dataset freigeben?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dieses Dataset wird für alle Berechnungen in dieser Abteilung aktiv.
                    Das aktuelle aktive Dataset wird automatisch archiviert.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onTransition(dataset.datasetId, "published")}>
                    Freigeben
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {canReject && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onTransition(dataset.datasetId, "draft")}
            >
              Ablehnen
            </Button>
          )}
          
          {canArchive && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onTransition(dataset.datasetId, "archived")}
            >
              <Archive className="w-3 h-3 mr-1" />
              Archivieren
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Workflow Legend
// ============================================

export function WorkflowLegend() {
  const { identity } = useIdentity();
  const { enabled: canBypassApproval } = useFeature("adminBypassApproval");
  
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
      <span className="font-medium">Workflow:</span>
      <div className="flex items-center gap-1">
        <StatusBadge status="draft" />
        <ArrowRight className="w-3 h-3" />
        <StatusBadge status="review" />
        <ArrowRight className="w-3 h-3" />
        <StatusBadge status="published" />
      </div>
      <span className="ml-auto">
        {canBypassApproval && (
          <Badge variant="outline" className="mr-2 text-amber-600 border-amber-600">
            <Zap className="w-3 h-3 mr-1" />
            Bypass aktiv
          </Badge>
        )}
        {identity.role === "admin" && "Sie können: Prüfen, Freigeben, Archivieren"}
        {identity.role === "manager" && "Sie können: Zur Prüfung senden"}
        {identity.role === "sales" && "Sie können: Importieren (als Entwurf)"}
      </span>
    </div>
  );
}
