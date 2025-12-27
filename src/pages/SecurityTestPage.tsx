/**
 * Security Test Page
 * 
 * Demonstrates all security guards and encrypted storage functionality.
 * Admin-only access for testing security features.
 */

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Zap,
  Users,
  Gauge,
} from "lucide-react";

// Security imports
import { useAuth } from "@/hooks/useAuth";
import { useIdentity } from "@/contexts/IdentityContext";
import { useServerRateLimit, type RateLimitCategory } from "@/hooks/useServerRateLimit";
import {
  isCryptoAvailable,
  encryptValue,
  decryptValue,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  listSecureKeys,
  clearSecureStorage,
  hasSessionKey,
  rotateSessionKey,
} from "@/lib/secureStorage";

// =====================================================
// Types
// =====================================================

interface TestResult {
  name: string;
  status: "success" | "error" | "pending" | "warning";
  message: string;
  timestamp: Date;
}

// =====================================================
// Test Panel Components
// =====================================================

function StatusBadge({ status }: { status: TestResult["status"] }) {
  const variants = {
    success: { className: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
    error: { className: "bg-red-500/10 text-red-600", icon: XCircle },
    warning: { className: "bg-amber-500/10 text-amber-600", icon: AlertTriangle },
    pending: { className: "bg-blue-500/10 text-blue-600", icon: Clock },
  };
  
  const { className, icon: Icon } = variants[status];
  
  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {status === "success" && "Erfolgreich"}
      {status === "error" && "Fehlgeschlagen"}
      {status === "warning" && "Warnung"}
      {status === "pending" && "Ausstehend"}
    </Badge>
  );
}

function TestResultItem({ result }: { result: TestResult }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex-1">
        <p className="font-medium text-sm">{result.name}</p>
        <p className="text-xs text-muted-foreground">{result.message}</p>
      </div>
      <StatusBadge status={result.status} />
    </div>
  );
}

// =====================================================
// Auth Guard Test Panel
// =====================================================

function AuthGuardPanel() {
  const { user, isLoading } = useAuth();
  const { identity, isAuthenticated, isSupabaseAuth } = useIdentity();
  
  const results: TestResult[] = [
    {
      name: "Authentifizierungsstatus",
      status: isAuthenticated ? "success" : "warning",
      message: isAuthenticated 
        ? `Eingeloggt als ${user?.email || identity.displayName}`
        : "Nicht authentifiziert (Gast-Modus)",
      timestamp: new Date(),
    },
    {
      name: "Auth-Provider",
      status: isSupabaseAuth ? "success" : "warning",
      message: isSupabaseAuth ? "Supabase Auth aktiv" : "Mock Identity aktiv",
      timestamp: new Date(),
    },
    {
      name: "Session-Status",
      status: isLoading ? "pending" : user ? "success" : "warning",
      message: isLoading ? "Wird geprüft..." : user ? "Session aktiv" : "Keine aktive Session",
      timestamp: new Date(),
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Auth Guard (ProtectedRoute)
        </CardTitle>
        <CardDescription>
          Prüft ob Benutzer authentifiziert sind
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result, i) => (
          <TestResultItem key={i} result={result} />
        ))}
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Aktuelle Identität:</p>
          <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
            {JSON.stringify({
              displayName: identity.displayName,
              role: identity.role,
              tenantId: identity.tenantId,
              departmentId: identity.departmentId,
            }, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Admin Guard Test Panel
// =====================================================

function AdminGuardPanel() {
  const { identity, canAccessAdmin, isSupabaseAuth } = useIdentity();
  
  const results: TestResult[] = [
    {
      name: "Admin-Berechtigung",
      status: canAccessAdmin ? "success" : "error",
      message: canAccessAdmin 
        ? `Zugriff erlaubt (Rolle: ${identity.role})`
        : `Zugriff verweigert (Rolle: ${identity.role})`,
      timestamp: new Date(),
    },
    {
      name: "Rollen-Check",
      status: identity.role === "admin" || identity.role === "manager" ? "success" : "warning",
      message: `Aktuelle Rolle: ${identity.role}`,
      timestamp: new Date(),
    },
    {
      name: "Admin-Bereiche",
      status: canAccessAdmin ? "success" : "error",
      message: canAccessAdmin 
        ? "Zugang zu /admin/*, /security/* möglich"
        : "Admin-Bereiche gesperrt",
      timestamp: new Date(),
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Guard (AdminRoute)
        </CardTitle>
        <CardDescription>
          Prüft Admin- oder Manager-Berechtigungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result, i) => (
          <TestResultItem key={i} result={result} />
        ))}
        
        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertTitle>Rollenbasierte Zugriffskontrolle</AlertTitle>
          <AlertDescription>
            AdminRoute erlaubt Zugriff für <code>admin</code> und <code>manager</code> Rollen.
            Die aktuelle Rolle ist <code>{identity.role}</code>.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Rate Limit Guard Test Panel
// =====================================================

function RateLimitGuardPanel() {
  const { checkLimit, getStatus, isChecking, error, clearCache } = useServerRateLimit();
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RateLimitCategory>("api");
  
  const categories: RateLimitCategory[] = ["api", "ai", "login", "upload", "pdf", "calculation"];
  
  const runRateLimitTest = async (category: RateLimitCategory) => {
    const newResult: TestResult = {
      name: `Rate-Limit Check: ${category}`,
      status: "pending",
      message: "Wird geprüft...",
      timestamp: new Date(),
    };
    setResults(prev => [...prev, newResult]);
    
    try {
      const status = await checkLimit(category);
      
      setResults(prev => prev.map((r, i) => 
        i === prev.length - 1 
          ? {
              ...r,
              status: status.allowed ? "success" : "error",
              message: `${status.allowed ? "Erlaubt" : "Blockiert"} - ${status.remaining} verbleibend, Reset: ${status.resetAt.toLocaleTimeString()}`,
            }
          : r
      ));
      
      toast[status.allowed ? "success" : "error"](
        status.allowed ? "Rate-Limit OK" : "Rate-Limit erreicht",
        { description: `${status.remaining} Anfragen verbleibend` }
      );
    } catch (err) {
      setResults(prev => prev.map((r, i) => 
        i === prev.length - 1 
          ? {
              ...r,
              status: "error",
              message: `Fehler: ${err instanceof Error ? err.message : String(err)}`,
            }
          : r
      ));
    }
  };
  
  const getStatusCheck = async () => {
    try {
      const status = await getStatus(selectedCategory);
      toast.info(`Status für ${selectedCategory}`, {
        description: `${status.remaining} Anfragen verbleibend, Server: ${status.fromServer ? "Ja" : "Nein (Client-Fallback)"}`,
      });
    } catch (err) {
      toast.error("Status-Abfrage fehlgeschlagen");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Rate Limit Guard
        </CardTitle>
        <CardDescription>
          Server-seitiges Rate-Limiting mit Client-Fallback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => runRateLimitTest(selectedCategory)}
            disabled={isChecking}
          >
            {isChecking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Test ausführen
          </Button>
          <Button variant="outline" onClick={getStatusCheck} disabled={isChecking}>
            Status prüfen
          </Button>
          <Button variant="ghost" onClick={clearCache}>
            Cache leeren
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {results.slice(-10).reverse().map((result, i) => (
              <TestResultItem key={i} result={result} />
            ))}
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Tests ausgeführt
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Encrypted Storage Test Panel
// =====================================================

function EncryptedStoragePanel() {
  const [testKey, setTestKey] = useState("test_secure_item");
  const [testValue, setTestValue] = useState('{"message": "Geheime Daten", "count": 42}');
  const [results, setResults] = useState<TestResult[]>([]);
  const [storedKeys, setStoredKeys] = useState<string[]>([]);
  const [lastRetrieved, setLastRetrieved] = useState<string | null>(null);
  
  // Initial checks
  useEffect(() => {
    const cryptoAvailable = isCryptoAvailable();
    const hasKey = hasSessionKey();
    
    setResults([
      {
        name: "Web Crypto API",
        status: cryptoAvailable ? "success" : "error",
        message: cryptoAvailable ? "Verfügbar" : "Nicht verfügbar",
        timestamp: new Date(),
      },
      {
        name: "Session Key",
        status: hasKey ? "success" : "warning",
        message: hasKey ? "Vorhanden" : "Wird bei Bedarf erstellt",
        timestamp: new Date(),
      },
    ]);
    
    refreshKeyList();
  }, []);
  
  const refreshKeyList = () => {
    setStoredKeys(listSecureKeys());
  };
  
  const testEncryption = async () => {
    const newResult: TestResult = {
      name: "Verschlüsselung",
      status: "pending",
      message: "Wird getestet...",
      timestamp: new Date(),
    };
    setResults(prev => [...prev, newResult]);
    
    try {
      const encrypted = await encryptValue(testValue);
      const decrypted = await decryptValue(encrypted);
      
      const success = decrypted === testValue;
      
      setResults(prev => prev.map((r, i) => 
        i === prev.length - 1 
          ? {
              ...r,
              status: success ? "success" : "error",
              message: success 
                ? `Verschlüsselt (${encrypted.length} Bytes) und entschlüsselt`
                : "Entschlüsselung stimmte nicht überein",
            }
          : r
      ));
      
      toast.success("Verschlüsselung erfolgreich");
    } catch (err) {
      setResults(prev => prev.map((r, i) => 
        i === prev.length - 1 
          ? {
              ...r,
              status: "error",
              message: `Fehler: ${err instanceof Error ? err.message : String(err)}`,
            }
          : r
      ));
      toast.error("Verschlüsselung fehlgeschlagen");
    }
  };
  
  const storeSecureItem = async () => {
    try {
      const parsed = JSON.parse(testValue);
      await setSecureItem(testKey, parsed);
      
      setResults(prev => [...prev, {
        name: `Speichern: ${testKey}`,
        status: "success",
        message: "Verschlüsselt in localStorage gespeichert",
        timestamp: new Date(),
      }]);
      
      refreshKeyList();
      toast.success("Sicher gespeichert");
    } catch (err) {
      toast.error("Speichern fehlgeschlagen", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };
  
  const retrieveSecureItem = async () => {
    try {
      const value = await getSecureItem(testKey);
      
      setResults(prev => [...prev, {
        name: `Abrufen: ${testKey}`,
        status: value !== null ? "success" : "warning",
        message: value !== null 
          ? "Entschlüsselt und abgerufen"
          : "Kein Wert gefunden",
        timestamp: new Date(),
      }]);
      
      setLastRetrieved(value !== null ? JSON.stringify(value, null, 2) : null);
      toast.success("Sicher abgerufen");
    } catch (err) {
      toast.error("Abrufen fehlgeschlagen", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };
  
  const deleteSecureItem = async () => {
    removeSecureItem(testKey);
    
    setResults(prev => [...prev, {
      name: `Löschen: ${testKey}`,
      status: "success",
      message: "Aus localStorage entfernt",
      timestamp: new Date(),
    }]);
    
    refreshKeyList();
    toast.success("Gelöscht");
  };
  
  const rotateKey = () => {
    rotateSessionKey();
    
    setResults(prev => [...prev, {
      name: "Key-Rotation",
      status: "warning",
      message: "Session-Key rotiert. Alte Daten sind jetzt unlesbar!",
      timestamp: new Date(),
    }]);
    
    toast.warning("Session-Key rotiert", {
      description: "Alle verschlüsselten Daten sind jetzt unzugänglich",
    });
  };
  
  const clearAll = () => {
    const count = clearSecureStorage();
    
    setResults(prev => [...prev, {
      name: "Storage geleert",
      status: "success",
      message: `${count} verschlüsselte Einträge gelöscht`,
      timestamp: new Date(),
    }]);
    
    refreshKeyList();
    toast.success(`${count} Einträge gelöscht`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Encrypted Storage (AES-256-GCM)
        </CardTitle>
        <CardDescription>
          Verschlüsselter localStorage mit Session-basiertem Key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Schlüssel</label>
            <Input
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="Key name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Wert (JSON)</label>
            <Input
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={testEncryption} size="sm">
            <Key className="h-4 w-4 mr-2" />
            Verschlüsselung testen
          </Button>
          <Button onClick={storeSecureItem} size="sm" variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button onClick={retrieveSecureItem} size="sm" variant="outline">
            <Unlock className="h-4 w-4 mr-2" />
            Abrufen
          </Button>
          <Button onClick={deleteSecureItem} size="sm" variant="outline">
            Löschen
          </Button>
        </div>
        
        <Separator />
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={rotateKey} size="sm" variant="destructive">
            <RefreshCw className="h-4 w-4 mr-2" />
            Key rotieren
          </Button>
          <Button onClick={clearAll} size="sm" variant="ghost">
            Alles löschen
          </Button>
        </div>
        
        {storedKeys.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Gespeicherte Keys ({storedKeys.length}):</p>
            <div className="flex flex-wrap gap-1">
              {storedKeys.map((key) => (
                <Badge key={key} variant="secondary">{key}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {lastRetrieved && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Zuletzt abgerufen:</p>
            <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto">
              {lastRetrieved}
            </pre>
          </div>
        )}
        
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {results.slice(-10).reverse().map((result, i) => (
              <TestResultItem key={i} result={result} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Main Component
// =====================================================

export default function SecurityTestPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Security Test Dashboard
          </h1>
          <p className="text-muted-foreground">
            Teste alle Security Guards und Encrypted Storage Funktionen
          </p>
        </div>
        
        <Alert className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Nur für Entwickler</AlertTitle>
          <AlertDescription>
            Diese Seite ist nur für Entwickler und Administratoren gedacht.
            Hier können Security-Features getestet werden, ohne produktive Daten zu beeinflussen.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="guards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="guards">Security Guards</TabsTrigger>
            <TabsTrigger value="storage">Encrypted Storage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guards" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <AuthGuardPanel />
              <AdminGuardPanel />
            </div>
            <RateLimitGuardPanel />
          </TabsContent>
          
          <TabsContent value="storage">
            <EncryptedStoragePanel />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
