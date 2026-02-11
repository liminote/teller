
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';

async function inspectHeaders() {
    try {
        const sheets = google.sheets({
            version: 'v4',
            auth: API_KEY,
        });

        // The sheet name from google-sheets.ts
        const sheetName = '每日記錄';

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${sheetName}!A1:Z1`,
        });

        const rows = response.data.values;
        if (rows && rows.length > 0) {
            console.log(`Headers for '${sheetName}':`, rows[0]);
        } else {
            console.log('No headers found or empty sheet.');
        }

    } catch (error) {
        console.error('Error inspecting headers:', error);
    }
}

inspectHeaders();
