
const { Solar, Lunar } = require('lunar-javascript');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// --- Logic from purple-palace-calculator.ts ported to JS ---
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const LUNAR_MONTH_BRANCHES = {
    1: '寅', 2: '卯', 3: '辰', 4: '巳', 5: '午', 6: '未',
    7: '申', 8: '酉', 9: '戌', 10: '亥', 11: '子', 12: '丑',
};

function getBranchIndex(branch) {
    return BRANCHES.indexOf(branch);
}

function getBranchByIndex(index) {
    return BRANCHES[(index % 12 + 12) % 12]; // Handle negative safely though math logic here is additive
}

function calculateFlowMonthPalace(flowYearPalace, lunarMonth) {
    const flowYearIndex = getBranchIndex(flowYearPalace); // e.g. '丑' -> 1
    const monthBranch = LUNAR_MONTH_BRANCHES[lunarMonth]; // Month 11 -> '子'
    const monthBranchIndex = getBranchIndex(monthBranch); // '子' -> 0

    // Formula: (Year + MonthBranch + 2) % 12
    // Ex: 2022-01-01 (Ox Year '丑', Month 11 '子')
    // Index: 1 + 0 + 2 = 3 -> '卯'
    const flowMonthIndex = (flowYearIndex + monthBranchIndex + 2) % 12;
    return getBranchByIndex(flowMonthIndex);
}

function calculateFlowDayPalace(flowMonthPalace, lunarDay) {
    const flowMonthIndex = getBranchIndex(flowMonthPalace); // '卯' -> 3
    // Formula: FlowM + Day - 1
    // Ex: Day 29
    // 3 + 29 - 1 = 31. 31 % 12 = 7 -> '未'
    const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;
    return getBranchByIndex(flowDayIndex);
}

// --- Auth ---
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
        console.log("Correcting Historical Flow Palaces...");
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日基本資料';

        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Read Date (A)
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${SHEET_NAME}!A:A`,
        });

        const rows = res.data.values || [];
        const updates = [];

        for (let i = 1; i < rows.length; i++) {
            const dateStr = rows[i][0];
            if (!dateStr || dateStr >= '2025-01-01') continue;

            // Recalculate
            const date = new Date(dateStr);
            const solar = Solar.fromDate(date);
            const lunar = solar.getLunar();

            const lunarMonth = Math.abs(lunar.getMonth());
            const lunarDay = lunar.getDay();

            // KEY FIX: Use the actual Lunar Year Branch as Flow Year Palace
            const flowYearPalace = lunar.getYearZhi(); // e.g. '丑' for 2021/11/29

            const flowMonthPalace = calculateFlowMonthPalace(flowYearPalace, lunarMonth);
            const flowDayPalace = calculateFlowDayPalace(flowMonthPalace, lunarDay);

            // Column J is 10th column (Index 9, but in A1 notation it's J)
            updates.push({
                range: `${SHEET_NAME}!J${i + 1}`,
                values: [[flowDayPalace]]
            });
        }

        console.log(`Found ${updates.length} rows to correct.`);

        // Batch Update
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
            console.log(`Corrected chunk ${k / chunkSize + 1}`);
        }
        console.log("Correction complete.");

    } catch (e) {
        console.error(e);
    }
}

main();
