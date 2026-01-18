/**
 * Admin Script: upload_tariffs.ts
 * Usage: npx tsx scripts/upload_tariffs.ts --file data/sample_tariffs.csv
 * 
 * Purpose: Reads a local CSV file, converts it to JSON, and sends it to the 
 *          'import-tariffs' Edge Function in the live environment.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import 'dotenv/config'; // Load .env file

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mexrgeafzvcestcccmiy.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/import-tariffs`;
const ADMIN_TOKEN = process.env.ADMIN_IMPORT_TOKEN; // Must be set in .env or passed as arg

async function main() {
    // 1. Parse Arguments
    const args = process.argv.slice(2);
    const fileArgIndex = args.indexOf('--file');

    if (fileArgIndex === -1 || !args[fileArgIndex + 1]) {
        console.error("Usage: npx tsx scripts/upload_tariffs.ts --file <path_to_csv>");
        process.exit(1);
    }

    const filePath = args[fileArgIndex + 1];

    // 2. Validate Environment
    if (!ADMIN_TOKEN) {
        console.error("Error: ADMIN_IMPORT_TOKEN environment variable is missing.");
        console.error("Please set it in your .env file or export it in your shell.");
        process.exit(1);
    }

    try {
        // 3. Read & Parse CSV
        console.log(`Reading CSV file: ${filePath}`);
        const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
                if (context.column === 'list_price_netto' || context.column === 'cost_price_netto') {
                    return parseFloat(value);
                }
                if (context.column === 'duration_months') {
                    return parseInt(value, 10);
                }
                return value;
            }
        });

        console.log(`Parsed ${records.length} records.`);

        // 4. Send to Edge Function
        console.log(`Uploading to ${FUNCTION_URL}...`);

        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': ADMIN_TOKEN
            },
            body: JSON.stringify({ tariffs: records })
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${await response.text()}`);
        }

        const result = await response.json();
        console.log("Upload Successful!", result);

    } catch (error) {
        console.error("Fatal Error:", error);
        process.exit(1);
    }
}

main();
