import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

interface SheetDefinition {
  name: string;
  headers: string[];
  exampleRows?: Record<string, string | number>[];
}

const TEMPLATE_SHEETS: SheetDefinition[] = [
  {
    name: "Hardware",
    headers: ["id", "hersteller", "modell", "speicher_gb", "ek_netto", "aktiv"],
    exampleRows: [
      { id: "IPHONE_16_128", hersteller: "Apple", modell: "iPhone 16", speicher_gb: 128, ek_netto: 779, aktiv: "ja" },
      { id: "SAMSUNG_S24_256", hersteller: "Samsung", modell: "Galaxy S24", speicher_gb: 256, ek_netto: 649, aktiv: "ja" },
    ],
  },
  {
    name: "Mobilfunk",
    headers: [
      "id", "name", "familie", "tier", "basis_netto", "provision_neu", "provision_vvl",
      "datenvolumen_gb", "omo_0", "omo_5", "omo_10", "omo_15", "omo_17_5", "omo_20", "omo_25", "aktiv"
    ],
    exampleRows: [
      {
        id: "PRIME_M", name: "Business Prime M", familie: "prime", tier: "M",
        basis_netto: 42.02, provision_neu: 450, provision_vvl: 220, datenvolumen_gb: 50,
        omo_0: 450, omo_5: 427.50, omo_10: 405, omo_15: 382.50, omo_17_5: 371.25, omo_20: 360, omo_25: 337.50, aktiv: "ja"
      },
    ],
  },
  {
    name: "TeamDeal",
    headers: [
      "id", "tier", "datenvolumen_gb", "preis_sim_only", "preis_sub5", "preis_sub10",
      "provision_sim_only", "provision_sub5", "provision_sub10", "aktiv"
    ],
    exampleRows: [
      {
        id: "TEAMDEAL_XS", tier: "XS", datenvolumen_gb: 10,
        preis_sim_only: 9.50, preis_sub5: 14.50, preis_sub10: 19.50,
        provision_sim_only: 55, provision_sub5: 120, provision_sub10: 170, aktiv: "ja"
      },
    ],
  },
  {
    name: "Festnetz",
    headers: [
      "id", "name", "zugangsart", "speed_mbit", "mtl_netto",
      "provision_neu", "provision_vvl", "router_inkl", "aktiv"
    ],
    exampleRows: [
      {
        id: "CABLE_250", name: "Red Internet & Phone 250 Cable", zugangsart: "CABLE",
        speed_mbit: 250, mtl_netto: 29.99, provision_neu: 150, provision_vvl: 75, router_inkl: "ja", aktiv: "ja"
      },
      {
        id: "DSL_100", name: "Red Internet & Phone 100 DSL", zugangsart: "DSL",
        speed_mbit: 100, mtl_netto: 34.99, provision_neu: 120, provision_vvl: 60, router_inkl: "ja", aktiv: "ja"
      },
    ],
  },
  {
    name: "OMO_Matrix",
    headers: ["tarif_id", "vertragsart", "omo_0", "omo_5", "omo_10", "omo_15", "omo_17_5", "omo_20", "omo_25"],
    exampleRows: [
      { tarif_id: "PRIME_M", vertragsart: "neu", omo_0: 450, omo_5: 427.50, omo_10: 405, omo_15: 382.50, omo_17_5: 371.25, omo_20: 360, omo_25: 337.50 },
      { tarif_id: "PRIME_M", vertragsart: "vvl", omo_0: 220, omo_5: 209, omo_10: 198, omo_15: 187, omo_17_5: 181.50, omo_20: 176, omo_25: 165 },
    ],
  },
  {
    name: "Aktionen",
    headers: ["id", "name", "typ", "wert", "dauer_monate", "gueltig_von", "gueltig_bis", "gilt_fuer", "aktiv"],
    exampleRows: [
      {
        id: "INTRO_6M", name: "6 Monate 0€", typ: "INTRO_PRICE", wert: 0,
        dauer_monate: 6, gueltig_von: "2025-01-01", gueltig_bis: "2025-12-31", gilt_fuer: "PRIME_*", aktiv: "ja"
      },
      {
        id: "OMO25", name: "25% Online-Rabatt", typ: "PCT_OFF_BASE", wert: 0.25,
        dauer_monate: 24, gueltig_von: "2025-01-01", gueltig_bis: "2025-12-31", gilt_fuer: "*", aktiv: "ja"
      },
    ],
  },
];

export function TemplateGenerator() {
  const handleDownloadXLSX = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      for (const sheetDef of TEMPLATE_SHEETS) {
        const sheet = workbook.addWorksheet(sheetDef.name);

        // Define columns
        sheet.columns = sheetDef.headers.map(h => ({
          header: h,
          key: h,
          width: Math.max(h.length + 5, 12)
        }));

        // Add example rows
        if (sheetDef.exampleRows) {
          sheetDef.exampleRows.forEach(row => sheet.addRow(row));
        } else {
          // Just headers already added by 'columns' def
        }
      }

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "margenkalkulator_vorlage.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("XLSX-Vorlage heruntergeladen");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vorlage konnte nicht erstellt werden");
    }
  }, []);

  const handleDownloadCSV = useCallback((sheetName: string) => {
    const sheet = TEMPLATE_SHEETS.find(s => s.name === sheetName);
    if (!sheet) return;

    const csvContent = sheet.headers.join(";") + "\n" +
      (sheet.exampleRows?.map(row => sheet.headers.map(h => row[h] ?? "").join(";")).join("\n") ?? "");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheetName.toLowerCase()}_vorlage.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import-Vorlagen
        </CardTitle>
        <CardDescription>
          Laden Sie Vorlagen mit korrekten Spaltenüberschriften herunter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Full XLSX Template */}
        <Button onClick={handleDownloadXLSX} className="w-full" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Komplette XLSX-Vorlage (alle Sheets)
        </Button>

        {/* Individual CSV Templates */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {TEMPLATE_SHEETS.map(sheet => (
            <Button
              key={sheet.name}
              variant="outline"
              size="sm"
              onClick={() => handleDownloadCSV(sheet.name)}
            >
              <Download className="h-3 w-3 mr-1" />
              {sheet.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
