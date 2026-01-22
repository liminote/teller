const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

async function listSheets() {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId: SHEETS_ID,
        });
        console.log('Sheets found:');
        res.data.sheets.forEach(s => console.log(`- ${s.properties.title}`));
    } catch (err) {
        console.error('Error listing sheets:', err.message);
    }
}

listSheets();
