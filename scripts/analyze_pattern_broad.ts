import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';

async function analyzePatternSimple() {
    try {
        const sheets = google.sheets({
            version: 'v4',
            auth: API_KEY,
        });

        const sheetName = '每日記錄';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: sheetName,
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) return;

        const header = rows[0];
        const data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            header.forEach((key: string, index: number) => {
                obj[key] = row[index];
            });
            return obj;
        });

        // Search for anything containing both "天同" and "忌"
        const matches = data.filter(r => {
            const text = (r['紫微_四化簡述'] || '') + (r['八字_體感'] || '');
            return text.includes('天同') && text.includes('忌');
        });

        console.log(`Found ${matches.length} matches for Tian Tong + Hua Ji:\n`);

        matches.forEach(m => {
            console.log(`--- Date: ${m['日期']} (Score: ${m['今日分數']}) ---`);
            const ziwei = m['紫微_四化簡述'] || '';
            const bazi = m['八字_體感'] || '';
            console.log(`Content: ${ziwei} ${bazi}`);
            console.log('\n');
        });

    } catch (error) {
        console.error('Error analyzing pattern:', error);
    }
}

analyzePatternSimple();
