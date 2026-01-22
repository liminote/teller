import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';

async function analyzePattern(pattern: string) {
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
        if (rows.length <= 1) {
            console.log('No records found.');
            return;
        }

        const header = rows[0];
        const data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            header.forEach((key: string, index: number) => {
                obj[key] = row[index];
            });
            return obj;
        });

        const matches = data.filter(r =>
            (r['紫微_四化簡述'] && r['紫微_四化簡述'].includes(pattern)) ||
            (r['八字_體感'] && r['八字_體感'].includes(pattern))
        );

        console.log(`Found ${matches.length} matches for "${pattern}":\n`);

        matches.forEach(m => {
            console.log(`--- Date: ${m['日期']} (Score: ${m['今日分數']}) ---`);
            if (m['八字_體感']) console.log(`[Bazi]: ${m['八字_體感']}`);
            if (m['紫微_四化簡述']) console.log(`[Ziwei]: ${m['紫微_四化簡述']}`);
            console.log('\n');
        });

    } catch (error) {
        console.error('Error analyzing pattern:', error);
    }
}

analyzePattern('日遷天同忌');
