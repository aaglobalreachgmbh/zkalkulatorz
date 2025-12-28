# PERFORMANCE MANIFEST

> Dieses Dokument definiert die Performance-Architektur und Optimierungsregeln für den MargenKalkulator.
> **Ziel:** Lighthouse-Score von 100/100 in Performance, Accessibility und Best Practices.

---

## 🎯 Rolle & Denkweise

**Du handelst als Senior Performance Engineer und Frontend-Architekt.**

### Chain of Thought
Bevor du Code schreibst:
1. Analysiere die Auswirkung auf den "Critical Rendering Path"
2. Frage bei jeder neuen Bibliothek: "Ist diese Dependency wirklich nötig oder kann ich das nativ lösen?"
3. Prüfe, ob das Feature die Performance verschlechtert → schlage Alternativen vor

---

## 📦 Strategie 1: Assets & Media Optimierung

### Bilder
```tsx
// ✅ RICHTIG: Moderne Formate mit expliziten Dimensionen
<img 
  src="/hero.webp" 
  alt="Hero" 
  width={1200} 
  height={600} 
  loading="lazy"  // Für Bilder below the fold
/>

// ❌ FALSCH: Keine Dimensionen = Layout Shift (CLS)
<img src="/hero.png" alt="Hero" />
```

**Regeln:**
- Nutze strikt moderne Formate: **WebP, AVIF**
- Erzwinge `width` und `height` Attribute → verhindert Layout Shifts (CLS)
- Implementiere `loading="lazy"` für alle Bilder "below the fold"
- Bilder im Hero/Above-the-fold: KEIN lazy loading

### Fonts
```html
<!-- ✅ RICHTIG: Lokale Fonts mit font-display: swap -->
<style>
  @font-face {
    font-family: 'CustomFont';
    src: url('/fonts/custom.woff2') format('woff2');
    font-display: swap;
  }
</style>

<!-- ⚠️ AKZEPTABEL: Google Fonts mit display=swap -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Regeln:**
- Bevorzuge lokale Fonts (woff2)
- Nutze `font-display: swap` → Text sofort sichtbar (FOUT vermeiden)
- Lade nur benötigte Schriftstärken

### Icons
```tsx
// ✅ RICHTIG: Tree-Shaking-freundliche Imports
import { Menu, X, ChevronDown } from 'lucide-react';

// ❌ FALSCH: Gesamte Bibliothek importieren
import * as Icons from 'lucide-react';
```

---

## 🧩 Strategie 2: Code Splitting & Bundling

### Component Lazy Loading

**Kandidaten für Lazy Loading in diesem Projekt:**

| Komponente | Grund | Import-Pattern |
|------------|-------|----------------|
| `Reporting` | recharts (~200KB) | `lazy(() => import('./pages/Reporting'))` |
| `DataManager` | xlsx (~300KB) | `lazy(() => import('./pages/DataManager'))` |
| `PdfDownloadButton` | @react-pdf (~500KB) | Dynamic import bei Click |
| `SecurityDashboard` | Selten genutzt | `lazy(() => import('./pages/SecurityDashboard'))` |
| `Admin*` Seiten | Nur für Admins | `lazy(() => import('./pages/Admin'))` |
| `MoccaImport` | xlsx | `lazy(() => import('./pages/MoccaImport'))` |
| `HardwareManager` | xlsx | `lazy(() => import('./pages/HardwareManager'))` |

```tsx
// ✅ RICHTIG: Lazy Loading mit Suspense und Skeleton
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Reporting = lazy(() => import('./pages/Reporting'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Reporting />
    </Suspense>
  );
}

// Skeleton-Komponente für konsistente Loading-States
function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### Dynamic Import für schwere Libraries
```tsx
// ✅ RICHTIG: xlsx nur bei Bedarf laden
const handleExport = async () => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  // ...
};

// ✅ RICHTIG: PDF nur bei Bedarf laden
const handleDownloadPdf = async () => {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<OfferPdf />).toBlob();
  // ...
};
```

### Dependency Diet

| ❌ Vermeiden | ✅ Alternative | Bundle-Ersparnis |
|--------------|----------------|------------------|
| `moment.js` | `date-fns` | ~200KB |
| `lodash` (komplett) | Natives ES6+ oder einzelne Imports | ~70KB |
| `axios` | Native `fetch` | ~15KB |

**Projekt-Status:**
- ✅ `date-fns` statt `moment.js` → bereits umgesetzt
- ✅ `lucide-react` mit Tree-Shaking → bereits umgesetzt
- ⚠️ `xlsx` → Dynamic Import implementieren
- ⚠️ `@react-pdf/renderer` → Dynamic Import implementieren

---

## 🗄️ Strategie 3: Datenbank & Backend (Supabase)

### RLS Performance

**KRITISCH:** Alle Spalten in RLS-Policies MÜSSEN indexiert sein!

```sql
-- ✅ RICHTIG: Indizes für RLS-relevante Spalten
CREATE INDEX idx_calculation_history_user_id ON calculation_history(user_id);
CREATE INDEX idx_calculation_history_tenant_id ON calculation_history(tenant_id);
CREATE INDEX idx_saved_offers_user_id ON saved_offers(user_id);
CREATE INDEX idx_saved_offers_team_id ON saved_offers(team_id);
CREATE INDEX idx_offer_drafts_user_id ON offer_drafts(user_id);
CREATE INDEX idx_offer_drafts_tenant_id ON offer_drafts(tenant_id);
```

**Checkliste für neue Tabellen:**
- [ ] `user_id` indexiert?
- [ ] `tenant_id` indexiert?
- [ ] `team_id` indexiert (falls vorhanden)?
- [ ] Foreign Keys indexiert?

### TanStack Query Best Practices

```tsx
// ✅ RICHTIG: Globale Defaults mit aggressivem Caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 Minuten - Daten gelten als "frisch"
      gcTime: 1000 * 60 * 30,        // 30 Minuten - Cache behalten
      refetchOnWindowFocus: false,   // Kein Re-Fetch bei Tab-Wechsel
      retry: 1,                      // Nur 1 Retry bei Fehler
    },
  },
});
```

**Strategie nach Datentyp:**

| Datentyp | staleTime | refetchOnWindowFocus | Beispiel |
|----------|-----------|---------------------|----------|
| Statisch | 30min+ | false | Tarif-Katalog, Hardware-Liste |
| Semi-statisch | 5min | false | Eigene Angebote, Templates |
| Dynamisch | 0-30s | true | Live-Dashboard, Team-Updates |

```tsx
// Beispiel: Hardware-Katalog (ändert sich selten)
const { data: hardware } = useQuery({
  queryKey: ['hardware-catalog'],
  queryFn: fetchHardware,
  staleTime: 1000 * 60 * 60,  // 1 Stunde
  gcTime: 1000 * 60 * 60 * 24, // 24 Stunden Cache
});

// Beispiel: Eigene Angebote (ändert sich gelegentlich)
const { data: offers } = useQuery({
  queryKey: ['my-offers', userId],
  queryFn: () => fetchOffers(userId),
  staleTime: 1000 * 60 * 5,   // 5 Minuten
});
```

### Edge Functions für Latenz

```tsx
// ✅ RICHTIG: Edge Function für externe APIs
// supabase/functions/ai-consultant/index.ts
// → Läuft global verteilt, minimiert Latenz

// ❌ FALSCH: Direkte API-Calls vom Client
// → Routing über zentralen Server, höhere Latenz
```

---

## ⚡ Strategie 4: User Experience (Core Web Vitals)

### LCP (Largest Contentful Paint) < 2.5s

**Ziel:** Haupt-Content in unter 2.5 Sekunden sichtbar

```tsx
// ✅ RICHTIG: Kritische Ressourcen preloaden
// In index.html:
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://mexrgeafzvcestcccmiy.supabase.co">

// ✅ RICHTIG: Hero-Content priorisieren
<img src="/hero.webp" fetchpriority="high" />
```

### INP (Interaction to Next Paint) < 200ms

**Ziel:** Interaktionen fühlen sich sofort an

```tsx
// ✅ RICHTIG: Teure State-Updates mit useTransition
import { useTransition } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (value: string) => {
    setQuery(value);  // Sofort aktualisieren (high priority)
    
    startTransition(() => {
      // Teure Berechnung (low priority)
      setResults(filterResults(value));
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}

// ✅ RICHTIG: Verzögerte Werte für teure Renders
import { useDeferredValue } from 'react';

function ExpensiveList({ items }) {
  const deferredItems = useDeferredValue(items);
  
  return <HeavyComponent items={deferredItems} />;
}
```

### CLS (Cumulative Layout Shift) < 0.1

**Ziel:** Kein "Springen" der Seite

```tsx
// ✅ RICHTIG: Skeleton mit festen Dimensionen
<Skeleton className="h-64 w-full" />  // Exakte Größe des finalen Contents

// ✅ RICHTIG: Bilder mit Dimensionen
<img width={400} height={300} />

// ❌ FALSCH: Dynamische Höhe ohne Platzhalter
{isLoading ? null : <Content />}
```

### Skeleton Loading Pattern

```tsx
// ✅ RICHTIG: Sofort Skeletons anzeigen
function OffersList() {
  const { data, isLoading } = useQuery({ queryKey: ['offers'], queryFn: fetchOffers });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <OfferCards data={data} />;
}
```

---

## 🔧 Projektspezifische Patterns

### Aktuelle Optimierungskandidaten

```tsx
// In App.tsx: Lazy Loading implementieren
const Reporting = lazy(() => import('./pages/Reporting'));
const DataManager = lazy(() => import('./pages/DataManager'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const MoccaImport = lazy(() => import('./pages/MoccaImport'));
const HardwareManager = lazy(() => import('./pages/HardwareManager'));

// PageSkeleton für konsistente Loading-States
function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### Query Caching für dieses Projekt

```tsx
// hooks/useHardwareCatalog.ts
export function useHardwareCatalog() {
  return useQuery({
    queryKey: ['hardware-catalog'],
    queryFn: getHardwareCatalog,
    staleTime: 1000 * 60 * 60,      // 1 Stunde
    gcTime: 1000 * 60 * 60 * 24,    // 24 Stunden
  });
}

// hooks/useTariffs.ts
export function useTariffs() {
  return useQuery({
    queryKey: ['tariffs'],
    queryFn: getTariffs,
    staleTime: 1000 * 60 * 60,      // 1 Stunde
    gcTime: 1000 * 60 * 60 * 24,    // 24 Stunden
  });
}

// hooks/useMyOffers.ts
export function useMyOffers(userId: string) {
  return useQuery({
    queryKey: ['my-offers', userId],
    queryFn: () => fetchUserOffers(userId),
    staleTime: 1000 * 60 * 5,       // 5 Minuten
    enabled: !!userId,
  });
}
```

---

## ✅ Performance Go-Live Checkliste

### Bundle & Assets
- [ ] Lazy Loading für alle schweren Seiten (Reporting, DataManager, Admin, etc.)
- [ ] Dynamic Import für xlsx bei Export-Funktionen
- [ ] Dynamic Import für @react-pdf bei PDF-Download
- [ ] Alle Bilder haben width/height Attribute
- [ ] Bilder im WebP/AVIF Format
- [ ] Fonts mit font-display: swap geladen

### Database & API
- [ ] Alle RLS-Spalten (user_id, tenant_id, team_id) indexiert
- [ ] TanStack Query mit staleTime konfiguriert
- [ ] refetchOnWindowFocus: false für statische Daten
- [ ] Edge Functions für externe API-Calls

### Core Web Vitals
- [ ] LCP unter 2.5s (prüfen mit Lighthouse)
- [ ] INP unter 200ms (useTransition für teure Updates)
- [ ] CLS unter 0.1 (Skeletons mit festen Dimensionen)
- [ ] Keine Layout Shifts bei Datenladung

### Monitoring
- [ ] Lighthouse CI in GitHub Actions
- [ ] Bundle-Analyse bei jedem Build
- [ ] Performance-Budget definiert

---

## 📊 Performance-Metriken (Ziele)

| Metrik | Ziel | Aktuell | Status |
|--------|------|---------|--------|
| Lighthouse Performance | 100 | TBD | 🔄 |
| LCP | < 2.5s | TBD | 🔄 |
| INP | < 200ms | TBD | 🔄 |
| CLS | < 0.1 | TBD | 🔄 |
| Bundle Size (gzipped) | < 200KB | TBD | 🔄 |
| First Load JS | < 100KB | TBD | 🔄 |

---

## 🚨 Anti-Patterns (Verboten)

```tsx
// ❌ VERBOTEN: Gesamte Library importieren
import * as XLSX from 'xlsx';
import * as Icons from 'lucide-react';

// ❌ VERBOTEN: Synchrone schwere Operationen im Render
function Component() {
  const result = heavyCalculation();  // Blockiert Main Thread!
  return <div>{result}</div>;
}

// ❌ VERBOTEN: Bilder ohne Dimensionen
<img src="/photo.jpg" />

// ❌ VERBOTEN: Keine Skeletons bei Loading
{isLoading ? null : <Content />}

// ❌ VERBOTEN: refetchOnMount: true für statische Daten
useQuery({ queryKey: ['static'], queryFn: fetch, refetchOnMount: true });
```

---

*Letzte Aktualisierung: 2025-06-28*
*Kann in Lovable → Project Settings → Manage Knowledge kopiert werden*
