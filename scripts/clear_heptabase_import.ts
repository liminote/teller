
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = '每日記錄';

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
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Read all data to find rows before 2025-02-01
        // We assume ANY row before 2025-02-01 is one of the imported ones we just added
        // since the user said the sheet started from 2025-02-01.

        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${SHEET_NAME}!A:J`,
        });

        const rows = getRes.data.values || [];
        const cutoffDate = '2025-02-01';

        // Find indices of rows to clear (where Date < 2025-02-01)
        // AND specifically where Column H (index 7) has content we want to clear?
        // Actually, user might want to remove them completely OR just move content.
        // User said "don't put it in Bazi_Feeling". 
        // So for these rows, we should CLEAR Column H (index 7).
        // But Column J (Memo) should stay.

        const requests: any[] = [];

        for (let i = 1; i < rows.length; i++) { // Skip header
            const date = rows[i][0];
            if (date && date < cutoffDate) {
                // This is an imported historical row.
                // We want to clear Cell H(i+1).
                // H is 8th column, index 7.

                // Instead of clearing cell by cell which is slow, let's just re-upload the corrected data?
                // Or use batchClear?
                // Actually, the previous script APPENDED them. 
                // So they are likely at the bottom of the sheet now?
                // Wait, logic says "if date matches, update; else append".
                // But since sheet started 2025-02-01, all < 2025-02-01 were appended.

                // Let's just update Column H to be empty for these rows.
                // We can do this by sending a batchUpdate with repeatCell clearing the content?
                // Or just value update.

                // Better yet, let's delete these rows and re-import properly?
                // User might have modified them? Unlikely in 2 minutes.
                // Re-importing is safer to get the 'right' state.

                // Let's find the range of rows that are < 2025-02-01.
            }
        }

        // Strategy: 
        // 1. Read all data.
        // 2. Filter out the ones < 2025-02-01.
        // 3. Re-write the sheet with only >= 2025-02-01? 
        // No, user wants them, just NOT in Bazi_Feeling.

        // Strategy: 
        // Update Column H to empty string for all rows where Date < 2025-02-01.

        const dataToUpdate: any[] = [];

        // We will build a ValueRange for the whole sheet, but that's risky.
        // Let's iterate and build a batchUpdate.

        // Actually, `sheets.spreadsheets.values.batchUpdate` is good.
        // We need to construct data ranges.

        const updates = [];
        for (let i = 1; i < rows.length; i++) {
            const date = rows[i][0];
            if (date && date < cutoffDate) {
                // Row index is i+1
                // Col H is H
                updates.push({
                    range: `${SHEET_NAME}!H${i + 1}`,
                    values: [['']] // Clear it
                });
            }
        }

        if (updates.length > 0) {
            console.log(`Found ${updates.length} rows to clear Bazi_Feeling column.`);
            // Batch update has limits, but 900 should be fine in chunks?
            // Actually values.batchUpdate takes data array.

            const chunkSize = 100;
            for (let k = 0; k < updates.length; k += chunkSize) {
                const chunk = updates.slice(k, k + chunkSize);
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SHEETS_ID,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data: chunk
                    }
                });
                console.log(`Cleared chunk ${k / chunkSize + 1}`);
            }
            console.log("Cleared Bazi_Feeling for historical rows.");
        } else {
            console.log("No historical rows found to clear.");
        }

    } catch (err) {
        console.error(err);
    }
}

main();
