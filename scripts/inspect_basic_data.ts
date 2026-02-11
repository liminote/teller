
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
/* Reusing auth logic */
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

async function inspectBasicDataHeader() {
    try {
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const sheetName = '每日基本資料';
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

inspectBasicDataHeader();
