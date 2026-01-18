# ARCHITECTURE BLUEPRINT: MARGENKALKULATOR

## 1. DAS FUNDAMENT (The Core)

### Architektur-Typ: Event-Driven Serverless Architecture
Wir setzen auf eine **Event-Driven Serverless Architecture** [Doc 3]. Das System reagiert auf Zustandsänderungen (Events) und verarbeitet diese asynchron über skalierbare Edge Functions. Dies entkoppelt die Komponenten und verhindert monolithische Blockaden.

### Black Box Prinzip
Die Berechnungslogik ("The Engine") ist eine **Black Box** für den Client [Doc 2].
*   **Keine Berechnung im Browser**: Der Client (Frontend) ist ein reines Anzeige-Instrument. Er kennt keine Margen-Formeln, keine Rabatt-Logiken und keine Business-Regeln.
*   **Sicherheit durch Unwissenheit**: Selbst wenn der Client kompromittiert wird, liegt der "Secret Sauce" (die Kalkulationslogik) sicher auf dem Server.

### Tech Stack [Doc 1]
*   **Frontend**: Next.js 14 (App Router) für Server-Side Rendering und statische Generierung.
*   **Styling**: Tailwind CSS für Utility-First Styling.
*   **Backend**: Supabase als Backend-as-a-Service.
*   **Logic**: Deno Edge Functions für performante, serverlose Logik-Ausführung.

## 2. DATEN-SICHERHEIT (The Vault)

### Split-Table Strategie
Wir trennen strikt zwischen öffentlichen und kommerziellen Daten [Doc 2 & 3]:
*   **`products_public`**: Enthält unkritische Daten wie Produktnamen, Beschreibungen und öffentliche Listenpreise. Zugänglich (Read-Only) für authentifizierte Nutzer.
*   **`products_commercial`**: Enthält hochsensible Einkaufspreise, Margen und interne Kalkulatoren. **Niemals** direkt zugänglich für den Client. Zugriff ausschließlich über Edge Functions (Service Role).

### RLS-Regel: "Default Deny"
Es gilt das Prinzip der minimalen Rechte [Doc 4].
*   Startzustand: **Kein Zugriff**.
*   Explizite Freigabe: RLS Policies (Row Level Security) öffnen Datenkanäle nur für Nutzer mit spezifischen `auth.jwt()` Claims oder Rollen.
*   Niemand "sieht alles".

### Active Defense: Honeytokens
Wir implementieren aktive Verteidigungsmechanismen [Doc 4].
*   **Honeytokens**: Wir platzieren Fake-Datensätze (z.B. verlockende Admin-User oder "geheime" Preistabellen) in der Datenbank.
*   **Alarm**: Jeder Versuch, diese Datensätze zu lesen oder zu schreiben (was ein legitimes Frontend niemals tun würde), löst sofortigen Alarm aus und blockiert die Session (Sliding Window Rate Limiting).

## 3. DAS DESIGN-SYSTEM (The Face)

### Marke
Wir folgen strikt der **Vodafone Enterprise Aesthetic** [Doc 7]. Das Design ist "Clean, Corporate, High-Performance".

### Farbe [Doc 7]
*   **Basis**: Serious Blue (`#0F172A`) – für Hintergründe, Header und strukturelle Elemente. Vermittelt Stabilität und Seriosität.
*   **Akzent**: Vodafone Rot (`#E60000`) – gezielt eingesetzt für Call-to-Actions, Warnungen und wichtige Highlights.

### Typografie [Doc 7]
*   **Body/UI**: `Inter` – für optimale Lesbarkeit auf allen Screens.
*   **Finanzen/Daten**: `Geist Sans` mit `font-variant-numeric: tabular-nums`. Dies stellt sicher, dass Zahlen in Tabellen perfekt untereinander stehen und vergleichbar bleiben.

### UI-Library [Doc 7]
*   **Komponenten**: Shadcn UI als Basis für zugängliche, anpassbare Komponenten.
*   **Layout**: Bento Grids für das Dashboard-Layout. Eine modulare Kachel-Struktur, die komplexe Informationen übersichtlich ordnet.

## 4. ORCHESTRIERUNG (The Brain)

### Ordner-Struktur [Doc 8]
Das Projekt folgt zwingend der **Quad-Folder Struktur**:
```text
/
├── directives/      # SOPs, Regelwerke und Markdown-Pläne (The Manager)
├── execution/       # Python-Skripte und Tools für Automation (The Employee)
├── knowledge/       # Die 9 PDF/MD Dokumente (The Brain)
└── .env             # Secrets und Konfiguration (The Vault)
```

### Self-Annealing [Doc 8]
Das System repariert sich selbst durch eine evolutionäre Schleife:
1.  **Fehler (Detect)**: Ein Build schlägt fehl oder ein Test misslingt.
2.  **Analyse**: Der Agent analysiert den Fehlercode und den Kontext.
3.  **Fix**: Der Agent schreibt das Skript oder den Code neu.
4.  **Regel-Update**: Der Agent aktualisiert die `directives/`, um den Fehler in Zukunft zu vermeiden (Lernen aus Fehlern).

### Qualitätssicherung [Doc 6 & 9]
*   **Methodik**: Property-Based Testing. Wir testen nicht nur einzelne Beispiele, sondern Invarianten (Gesetze, die immer gelten müssen).
*   **Tool**: `pgTAP` für Datenbank-Tests.
*   **Pflicht**: Kein Feature geht live ohne den Beweis seiner Korrektheit.
