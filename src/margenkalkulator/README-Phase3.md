# MargenKalkulator Phase 3 - User Guide

## Features

### 1. Auto-Save Drafts
Your work is automatically saved to browser storage every few seconds.

- **Status indicator**: Shows when draft was last saved
- **Load draft**: Click "Entwurf" → "Letzten Entwurf laden"
- **Reset**: Click "Entwurf" → "Entwurf zurücksetzen" to clear saved data
- **Disable auto-save**: Toggle "Auto-Speichern" in the dropdown

### 2. Export/Import

#### Export
1. Click "Export/Import" button in header
2. Select "Export" tab
3. Click "Als JSON herunterladen"
4. Save the `.json` file

#### Import
1. Click "Export/Import" button
2. Select "Import" tab
3. Click "JSON-Datei auswählen"
4. Select your previously exported file
5. Review any warnings (e.g., version mismatch)
6. Click "Angebot übernehmen"

### 3. Offer Preview

View a print-friendly version of your offer:

1. Click "Vorschau" button in header
2. Select view mode:
   - **Option 1**: Show only Option 1
   - **Option 2**: Show only Option 2
   - **Vergleich**: Side-by-side comparison
3. Toggle **Kunde/Händler** view:
   - Customer view hides dealer-specific info (EK, margins, provisions)
   - Dealer view shows all financial details
4. Click "Drucken / PDF" to print or save as PDF

### 4. Validation

The wizard validates your inputs:

- **Hardware**: Optional, but warns if EK set without name
- **Mobile**: Requires tariff and variant selection
- **Festnetz**: Requires product selection when enabled
- **Compare**: Shows warnings for incomplete options

Navigation is free - you can jump between steps anytime, but the "Weiter" button is disabled if current step has errors.

## File Format

Exported JSON structure:
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "datasetVersion": "dummy-v0",
  "option1": { ... },
  "option2": { ... }
}
```

The `datasetVersion` field helps identify if tariff data may have changed since export.
