# ANTI-LAZY DEVELOPMENT PROTOCOL V2

## Grundprinzip
Jede Code-Aenderung wird mit maximaler Praezision und Tiefe durchgefuehrt.
Keine Abkuerzungen, keine Platzhalter, keine "TODO"-Kommentare.

## Regeln
1. **STOP-ON-FAIL**: Bei Build-Fehlern sofort stoppen und beheben
2. **NO-TOUCH-LOGIC**: Engine/Berechnungen/Context sind eine Black Box
3. **VOLLSTAENDIGKEIT**: Jeder Plan wird zu 100% abgearbeitet
4. **INKREMENTELL**: Kleine Schritte, Build-Check nach jedem Schritt
5. **PIXEL-GENAU**: UI muss dem Referenz-Design entsprechen
6. **IMPORT-CHECK**: Jeder Import wird auf Existenz geprueft
7. **PROP-CHECK**: Jeder Prop wird gegen das Interface validiert
8. **KEIN HALLUZINIEREN**: Keine erfundenen Komponenten oder Props
9. **ANTI-LAZY**: Lieber 3 praezise Nachrichten als 1 schlampige
10. **FEHLER-FREI**: Jede Datei muss fehlerfrei kompilieren

## Scope-Regeln
- NUR die angefragte Route/Komponente wird umgebaut
- KEINE Aenderungen an CalculatorContext, Engine, Hooks
- Sub-Komponenten (HardwareGrid, TariffGrid) werden als Black Box eingebunden
- Mehrere Nachrichten fuer grosse Umbauten - Phase fuer Phase

## Error Handling
- NIEMALS `throw new Error()` in Hooks
- Immer Graceful Degradation mit `console.warn()` + Fallback
- `.maybeSingle()` statt `.single()` bei Supabase-Queries
- `enabled: !!dependency` bei TanStack Query
