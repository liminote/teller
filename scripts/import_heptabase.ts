
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const HEPTABASE_DIR = '/Users/vannyma/antigravity/01_Personal_OS/Heptabase/Heptabase-Data-Backup-2026-01-27T17-43-39-326Z/Journal';
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = '每日記錄';

// --- Auth Helper (Same as before) ---
async function getAuth() {
    const keyPath = path.join(process.cwd(), 'service-account-key.json');
    if (fs.existsSync(keyPath)) {
        return new google.auth.GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    }
    const keyVar = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (keyVar) {
        return new google.auth.GoogleAuth({ credentials: JSON.parse(keyVar), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    }
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
        return new google.auth.GoogleAuth({
            credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }
    throw new Error("No Service Account credentials found.");
}

// --- Main Logic ---

async function main() {
    try {
        console.log(`Scanning directory: ${HEPTABASE_DIR}`);
        const files = fs.readdirSync(HEPTABASE_DIR)
            .filter(f => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}/.test(f)); // Only YYYY-MM-DD.md

        console.log(`Found ${files.length} journal files.`);

        const rowsToAppend: any[][] = [];
        const cutoffDate = '2025-02-01'; // Import only BEFORE this date

        for (const file of files) {
            const dateStr = file.replace('.md', '');
            if (dateStr >= cutoffDate) continue; // Skip if >= 2025-02-01

            const content = fs.readFileSync(path.join(HEPTABASE_DIR, file), 'utf8');

            // simple frontmatter parsing
            const sections = content.split('---');
            let body = content;
            let metadata = '';

            if (sections.length >= 3) {
                // Has frontmatter
                const frontmatter = sections[1];
                body = sections.slice(2).join('---').trim();

                // Extract interesting fields from frontmatter to append to body
                const lines = frontmatter.split('\n');
                const metaLines = [];
                for (const line of lines) {
                    if (line.includes('小成就:') || line.includes('今日感謝:') || line.includes('什麼讓我充滿活力:')) {
                        metaLines.push(line.trim());
                    }
                }
                if (metaLines.length > 0) {
                    metadata = '\n\n【每日回顧】\n' + metaLines.join('\n');
                }
            }

            const cleanBody = body.replace(/!\[.*?\]\(.*?\)/g, '[圖片]'); // Replace images with [圖片]
            const fullLog = (cleanBody + metadata).trim();
            const summary = fullLog.split('\n')[0].substring(0, 50) + (fullLog.length > 50 ? '...' : '');

            // Construct Row
            // A: Date, B: Score, C-G: Empty, H: Summary, I: Emotion, J: Memo
            // Score: default empty or maybe 3? Let's leave empty.
            if (fullLog.length > 0) {
                rowsToAppend.push([
                    dateStr,
                    '', // Score
                    '', '', '', '', '', // C-G
                    summary, // H
                    '',      // I
                    fullLog  // J
                ]);
            }
        }

        console.log(`Prepared ${rowsToAppend.length} rows to import (older than ${cutoffDate}).`);

        if (rowsToAppend.length === 0) {
            console.log("No new rows to import.");
            return;
        }

        // --- Batch Upload ---
        console.log("Starting batch upload to Google Sheets...");
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Sort by date mostly for neatness before uploading, 
        // though we are appending to the bottom.
        rowsToAppend.sort((a, b) => a[0].localeCompare(b[0]));

        // Split into chunks of 500 to be safe
        const chunkSize = 500;
        for (let i = 0; i < rowsToAppend.length; i += chunkSize) {
            const chunk = rowsToAppend.slice(i, i + chunkSize);
            console.log(`Uploading chunk ${i / chunkSize + 1} (${chunk.length} rows)...`);

            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEETS_ID,
                range: `${SHEET_NAME}!A:J`,
                valueInputOption: 'RAW',
                requestBody: { values: chunk }
            });
        }

        console.log("Import complete!");

        // Optional: Sort the sheet by Date (Column A) after import
        // This requires a different API call (batchUpdate) but it's nice to have.
        // Let's prompt user or just leave it appended. 
        // Given user asked "Can you add them back", appending is the first step.
        // The App sorts automatically, so physical order in sheet is less critical.

    } catch (error) {
        console.error("Import failed:", error);
    }
}

main();
