#!/usr/bin/env npx tsx
/**
 * Enhanced Tariff Import Script (Phase 8 Finale)
 * Usage:
 *   npx tsx scripts/importTariffs.ts --file data/sample_tariffs.csv
 *   npx tsx scripts/importTariffs.ts --file data/sample_tariffs.csv --dry-run
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';
import { TariffImportRowSchema, TariffImportBatchSchema, type TariffImportRow } from '../src/lib/tariff_import.schema';

// ============================================
// CLI Colors (Simple ANSI)
// ============================================
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(msg: string, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

// ============================================
// Configuration
// ============================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mexrgeafzvcestcccmiy.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/import-tariffs`;
const ADMIN_TOKEN = process.env.ADMIN_IMPORT_TOKEN;

// ============================================
// Main
// ============================================
async function main() {
    log("\n📦 TARIFF IMPORT SCRIPT (Enhanced)", colors.bold + colors.cyan);
    log("━".repeat(50), colors.cyan);

    // 1. Parse CLI Arguments
    const args = process.argv.slice(2);
    const fileArgIndex = args.indexOf('--file');
    const dryRun = args.includes('--dry-run');

    const filePath = fileArgIndex !== -1 && args[fileArgIndex + 1]
        ? args[fileArgIndex + 1]
        : 'data/sample_tariffs.csv';

    log(`📄 File: ${filePath}`, colors.cyan);
    log(`🧪 Dry Run: ${dryRun ? 'YES (no API call)' : 'NO (will upload)'}`, colors.yellow);

    // 2. Validate Environment
    if (!ADMIN_TOKEN && !dryRun) {
        log("\n❌ Error: ADMIN_IMPORT_TOKEN not set in .env", colors.red);
        log("   Set it in .env or .env.local, or use --dry-run to test parsing only.", colors.yellow);
        process.exit(1);
    }

    // 3. Read CSV
    if (!fs.existsSync(filePath)) {
        log(`\n❌ Error: File not found: ${filePath}`, colors.red);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');
    log(`\n📊 Parsing CSV...`);

    const rawRecords = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: (value, context) => {
            if (context.column === 'list_price_netto' || context.column === 'cost_price_netto') {
                return parseFloat(value);
            }
            if (context.column === 'duration_months') {
                return value ? parseInt(value, 10) : undefined;
            }
            return value || undefined;
        }
    });

    // 4. Validate with Zod
    const validRecords: TariffImportRow[] = [];
    const errors: { row: number; message: string }[] = [];

    rawRecords.forEach((record: unknown, index: number) => {
        const result = TariffImportRowSchema.safeParse(record);
        if (result.success) {
            validRecords.push(result.data);
        } else {
            const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            errors.push({ row: index + 2, message: errorMessages }); // +2 for header + 0-index
        }
    });

    // 5. Report Validation Results
    log("\n📋 VALIDATION RESULTS", colors.bold);
    log("━".repeat(50));
    log(`✅ Valid:   ${validRecords.length}`, colors.green);
    log(`❌ Invalid: ${errors.length}`, errors.length > 0 ? colors.red : colors.green);

    if (errors.length > 0) {
        log("\n⚠️  Invalid Rows:", colors.yellow);
        errors.slice(0, 5).forEach(e => {
            log(`   Row ${e.row}: ${e.message}`, colors.red);
        });
        if (errors.length > 5) {
            log(`   ... and ${errors.length - 5} more errors`, colors.yellow);
        }
    }

    // 6. Dry Run Exit
    if (dryRun) {
        log("\n🧪 DRY RUN COMPLETE - No API call made.", colors.yellow);
        log(`   Would have uploaded ${validRecords.length} records.`, colors.cyan);
        process.exit(0);
    }

    // 7. Upload to Edge Function
    if (validRecords.length === 0) {
        log("\n❌ No valid records to upload. Exiting.", colors.red);
        process.exit(1);
    }

    log(`\n🚀 Uploading ${validRecords.length} records to ${FUNCTION_URL}...`, colors.cyan);

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': ADMIN_TOKEN!
            },
            body: JSON.stringify({ tariffs: validRecords })
        });

        const result = await response.json();

        if (!response.ok) {
            log(`\n❌ Upload Failed: ${response.status} ${response.statusText}`, colors.red);
            log(`   ${JSON.stringify(result)}`, colors.red);
            process.exit(1);
        }

        log("\n✅ UPLOAD SUCCESSFUL!", colors.bold + colors.green);
        log("━".repeat(50), colors.green);
        log(`   Inserted: ${result.inserted || 0}`, colors.green);
        log(`   Updated:  ${result.updated || 0}`, colors.cyan);
        log(`   Errors:   ${result.errors?.length || 0}`, result.errors?.length > 0 ? colors.red : colors.green);

        if (result.errors && result.errors.length > 0) {
            log("\n⚠️  Server-side Errors:", colors.yellow);
            result.errors.slice(0, 5).forEach((e: { row: number; message: string }) => {
                log(`   Row ${e.row}: ${e.message}`, colors.red);
            });
        }

    } catch (error) {
        log(`\n❌ Fatal Network Error: ${error}`, colors.red);
        process.exit(1);
    }
}

main();
