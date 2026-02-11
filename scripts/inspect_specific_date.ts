
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

async function inspectDate() {
    try {
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日基本資料';
        const targetDate = '2022-01-01';

        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${SHEET_NAME}!A:K`, // Read A to K
        });

        const rows = res.data.values || [];
        const header = rows[0];

        const row = rows.find(r => r[0] === targetDate);

        if (row) {
            console.log(`Data for ${targetDate}:`);
            header.forEach((h, i) => {
                console.log(`${h}: ${row[i]}`);
            });
        } else {
            console.log(`Row for ${targetDate} not found.`);
        }

    } catch (e) {
        console.error(e);
    }
}

inspectDate();
