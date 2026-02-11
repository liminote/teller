
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

async function getAuth() {
    // Try file first
    const keyPath = path.join(process.cwd(), 'service-account-key.json');
    if (fs.existsSync(keyPath)) {
        return new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // Try Env Var (JSON string)
    const keyVar = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (keyVar) {
        return new google.auth.GoogleAuth({
            credentials: JSON.parse(keyVar),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // Try Env Vars (Individual fields)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    throw new Error("No Service Account credentials found.");
}

async function writeFeedback(date: string, score: string, fullLog: string) {
    try {
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const sheetName = '每日記錄';

        // 1. Read existing dates to find the row
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${sheetName}!A:A`,
        });

        const rows = getRes.data.values || [];
        const normalizedDate = date.trim(); // Ensure format matches roughly

        let targetRow = -1;
        // Simple search (assuming dates are in standardized format like YYYY-MM-DD)
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === normalizedDate) {
                targetRow = i + 1; // 1-based index
                break;
            }
        }

        // Summary logic: First 50 chars of the log
        const summary = fullLog.length > 50 ? fullLog.substring(0, 50) + '...' : fullLog;

        if (targetRow > 0) {
            console.log(`Updating existing row ${targetRow} for ${date}`);

            // Update Score (Col B)
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEETS_ID,
                range: `${sheetName}!B${targetRow}`,
                valueInputOption: 'RAW',
                requestBody: { values: [[score]] }
            });

            // Update Bazi Feeling (Col H) - Use Summary
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEETS_ID,
                range: `${sheetName}!H${targetRow}`,
                valueInputOption: 'RAW',
                requestBody: { values: [[summary]] }
            });

            // Update Memo (Col J) - Use Full Log
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEETS_ID,
                range: `${sheetName}!J${targetRow}`,
                valueInputOption: 'RAW',
                requestBody: { values: [[fullLog]] }
            });

        } else {
            console.log(`Date ${date} not found. Appending new row.`);
            // Append new row: 
            // A: Date, B: Score, C-G: Empty, H: Summary, I: Empty, J: Full Log
            const newRow = [
                date,
                score,
                '', '', '', '', '', // C, D, E, F, G
                summary, // H
                '',      // I
                fullLog  // J
            ];
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEETS_ID,
                range: `${sheetName}!A:J`,
                valueInputOption: 'RAW',
                requestBody: { values: [newRow] }
            });
        }
        console.log('Write successful');

    } catch (err) {
        console.error('Failed to write to sheet:', err);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length >= 3) {
    writeFeedback(args[0], args[1], args[2]);
} else {
    // If running without args (just checking), do nothing
}
