
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

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

async function main() {
    try {
        console.log("Starting Lunar Date Format Fix...");
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日基本資料';

        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Read all '日期' and '農曆' columns (A and B)
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${SHEET_NAME}!A:B`,
        });

        const rows = res.data.values || [];
        const updates = [];

        // 2. Iterate and identify rows to fix
        for (let i = 1; i < rows.length; i++) { // Skip header
            const date = rows[i][0];
            let lunar = rows[i][1];

            if (!date || !lunar) continue;

            // Only fix historical data (< 2025-01-01)
            // Existing data starts 2025-01-01. My generated data is 2022-2024.
            // Check if date is before 2025
            if (date >= '2025-01-01') continue;

            let original = lunar;
            let modified = false;

            // Fix 1: Remove Year GanZhi Prefix (e.g., '辛丑...')
            // Detect if it starts with GanZhi chars? 
            // Simplified: If length > 5 (e.g. '辛丑冬月廿九' is 6 chars, normal '十一月廿九' is 5. '十二月初一' is 5)
            // Actually '冬月廿九' is 4 chars. '十一月廿九' is 5 chars.
            // If I stripped prefix, '辛丑冬月廿九' -> '冬月廿九' (4 chars).

            // Safe heuristic: If the string starts with a Year Pillar matching the year?
            // Or just: If the length is at least 6? 
            // "甲辰十二月初二" (7 chars). The existing data in JSON had 7 chars, but Utils stripped it.
            // But in SHEET, existing data for 2026 is "十一月廿三" (5 chars).
            // My data "辛丑冬月廿九" (6 chars).

            // Let's assume ANY row < 2025 needs the prefix stripped if present.
            // How to detect prefix? 
            // GanZhi are standard. 
            // Start char is in [甲...癸].
            const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
            if (HEAVENLY_STEMS.includes(lunar.charAt(0))) {
                lunar = lunar.substring(2);
                modified = true;
            }

            // Fix 2: Replace '冬月' with '十一月', '臘月' with '十二月'
            if (lunar.includes('冬月')) {
                lunar = lunar.replace('冬月', '十一月');
                modified = true;
            }
            if (lunar.includes('臘月')) {
                lunar = lunar.replace('臘月', '十二月');
                modified = true;
            }

            if (modified) {
                // console.log(`Fixing row ${i+1}: ${original} -> ${lunar}`);
                updates.push({
                    range: `${SHEET_NAME}!B${i + 1}`,
                    values: [[lunar]]
                });
            }
        }

        console.log(`Found ${updates.length} rows to fix.`);

        if (updates.length > 0) {
            // Batch Update
            // Split into chunks if too many? 
            // batchUpdate accepts data array.
            const chunkSize = 500;
            for (let k = 0; k < updates.length; k += chunkSize) {
                const chunk = updates.slice(k, k + chunkSize);
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SHEETS_ID,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data: chunk
                    }
                });
                console.log(`Updated chunk ${k / chunkSize + 1}`);
            }
            console.log("Formatting fixed.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
