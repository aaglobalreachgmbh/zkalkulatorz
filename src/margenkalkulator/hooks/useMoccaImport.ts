// ============================================
// Mocca Import Hook with Batch Processing
// ============================================

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  MoccaCustomerRow,
  toCustomerInput,
  validateMoccaImport,
  ValidationResult,
} from "@/margenkalkulator/dataManager/schemas/moccaSchema";

const BATCH_SIZE = 50;

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  skipped: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface ColumnMapping {
  id?: string;
  mapping_name: string;
  source_type: string;
  column_mapping: Record<string, string>;
  field_transformations?: Record<string, unknown>;
  is_default?: boolean;
}

export function useMoccaImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // ============================================
  // Load saved mappings
  // ============================================
  const mappingsQuery = useQuery({
    queryKey: ["customer-import-mappings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("customer_import_mappings")
        .select("*")
        .order("is_default", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ColumnMapping[];
    },
    enabled: !!user,
  });

  // ============================================
  // Save mapping
  // ============================================
  const saveMapping = useMutation({
    mutationFn: async (mapping: Omit<ColumnMapping, "id">) => {
      if (!user) throw new Error("Nicht eingeloggt");

      // If this should be default, unset other defaults first
      if (mapping.is_default) {
        await supabase
          .from("customer_import_mappings")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("source_type", mapping.source_type);
      }

      const { data, error } = await supabase
        .from("customer_import_mappings")
        .insert([{
          user_id: user.id,
          mapping_name: mapping.mapping_name,
          source_type: mapping.source_type,
          column_mapping: mapping.column_mapping as unknown as Record<string, string>,
          field_transformations: (mapping.field_transformations ?? {}) as unknown as Record<string, string>,
          is_default: mapping.is_default ?? false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-import-mappings"] });
      toast.success("Mapping gespeichert");
    },
    onError: (error) => {
      toast.error("Fehler beim Speichern: " + error.message);
    },
  });

  // ============================================
  // Check for existing customers (duplicates)
  // ============================================
  const checkExistingCustomers = useCallback(
    async (moccaNumbers: string[]): Promise<Set<string>> => {
      if (!user || moccaNumbers.length === 0) return new Set();

      const { data, error } = await supabase
        .from("customers")
        .select("mocca_customer_number")
        .eq("user_id", user.id)
        .in("mocca_customer_number", moccaNumbers);

      if (error) {
        console.error("Error checking existing customers:", error);
        return new Set();
      }

      return new Set(
        data
          .map((c) => c.mocca_customer_number)
          .filter((n): n is string => n !== null)
      );
    },
    [user]
  );

  // ============================================
  // Import customers in batches
  // ============================================
  const importCustomers = useCallback(
    async (
      validatedRows: MoccaCustomerRow[],
      options: { skipDuplicates?: boolean } = {}
    ): Promise<ImportResult> => {
      if (!user) {
        return {
          success: false,
          totalProcessed: 0,
          imported: 0,
          skipped: 0,
          failed: 0,
          errors: [{ row: 0, message: "Nicht eingeloggt" }],
        };
      }

      setIsImporting(true);
      const totalBatches = Math.ceil(validatedRows.length / BATCH_SIZE);
      const errors: { row: number; message: string }[] = [];
      let imported = 0;
      let skipped = 0;
      let failed = 0;

      try {
        // Check for existing customers if skipDuplicates is enabled
        const existingNumbers = options.skipDuplicates
          ? await checkExistingCustomers(validatedRows.map((r) => r.kundennummer))
          : new Set<string>();

        // Process in batches
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, validatedRows.length);
          const batch = validatedRows.slice(start, end);

          setProgress({
            total: validatedRows.length,
            processed: start,
            successful: imported,
            skipped,
            failed,
            currentBatch: batchIndex + 1,
            totalBatches,
          });

          // Filter out duplicates
          const rowsToInsert = batch.filter((row, idx) => {
            if (existingNumbers.has(row.kundennummer)) {
              skipped++;
              return false;
            }
            return true;
          });

          if (rowsToInsert.length === 0) continue;

          // Convert to database format
          const inserts = rowsToInsert.map((row) => ({
            user_id: user.id,
            ...toCustomerInput(row),
          }));

          // Insert batch
          const { data, error } = await supabase
            .from("customers")
            .insert(inserts)
            .select();

          if (error) {
            // Handle partial failures
            failed += rowsToInsert.length;
            errors.push({
              row: start + 1,
              message: `Batch ${batchIndex + 1} fehlgeschlagen: ${error.message}`,
            });
          } else {
            imported += data.length;
          }
        }

        // Final progress update
        setProgress({
          total: validatedRows.length,
          processed: validatedRows.length,
          successful: imported,
          skipped,
          failed,
          currentBatch: totalBatches,
          totalBatches,
        });

        // Invalidate customers query
        queryClient.invalidateQueries({ queryKey: ["customers"] });

        return {
          success: errors.length === 0,
          totalProcessed: validatedRows.length,
          imported,
          skipped,
          failed,
          errors,
        };
      } finally {
        setIsImporting(false);
      }
    },
    [user, checkExistingCustomers, queryClient]
  );

  // ============================================
  // Full import pipeline
  // ============================================
  const runImport = useCallback(
    async (
      rawRows: Record<string, unknown>[],
      columnMapping: Record<string, string>,
      options: { skipDuplicates?: boolean; saveMapping?: boolean; mappingName?: string } = {}
    ): Promise<{ validation: ValidationResult; import?: ImportResult }> => {
      // Step 1: Validate
      const validation = validateMoccaImport(rawRows, columnMapping);

      if (!validation.isValid) {
        return { validation };
      }

      // Step 2: Optionally save mapping
      if (options.saveMapping && options.mappingName && user) {
        await saveMapping.mutateAsync({
          mapping_name: options.mappingName,
          source_type: "mocca",
          column_mapping: columnMapping,
          is_default: true,
        });
      }

      // Step 3: Import
      const importResult = await importCustomers(validation.validRows, {
        skipDuplicates: options.skipDuplicates ?? true,
      });

      return {
        validation,
        import: importResult,
      };
    },
    [user, saveMapping, importCustomers]
  );

  return {
    // State
    progress,
    isImporting,
    
    // Mappings
    savedMappings: mappingsQuery.data ?? [],
    isLoadingMappings: mappingsQuery.isLoading,
    saveMapping: saveMapping.mutate,
    
    // Import functions
    validateImport: validateMoccaImport,
    importCustomers,
    runImport,
    checkExistingCustomers,
  };
}
