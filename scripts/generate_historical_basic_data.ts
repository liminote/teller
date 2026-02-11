
import { Solar, Lunar } from 'lunar-javascript';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// --- Auth Helper ---
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

// --- Purple Month & Day Logic ---
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const FOUR_TRANSFORMATIONS: Record<string, any> = {
    '甲': { 祿: '廉貞', 權: '破軍', 科: '武曲', 忌: '太陽' },
    '乙': { 祿: '天機', 權: '天梁', 科: '紫微', 忌: '太陰' },
    '丙': { 祿: '天同', 權: '天機', 科: '文昌', 忌: '廉貞' },
    '丁': { 祿: '太陰', 權: '天同', 科: '天機', 忌: '巨門' },
    '戊': { 祿: '貪狼', 權: '太陰', 科: '右弼', 忌: '天機' },
    '己': { 祿: '武曲', 權: '貪狼', 科: '天梁', 忌: '文曲' },
    '庚': { 祿: '太陽', 權: '武曲', 科: '太陰', 忌: '天同' },
    '辛': { 祿: '巨門', 權: '太陽', 科: '文曲', 忌: '文昌' },
    '壬': { 祿: '天梁', 權: '紫微', 科: '左輔', 忌: '武曲' },
    '癸': { 祿: '破軍', 權: '巨門', 科: '太陰', 忌: '貪狼' },
};
const STAR_ABBREVIATIONS: Record<string, string> = {
    '廉貞': '廉', '破軍': '破', '武曲': '武', '太陽': '陽', '天機': '機', '天梁': '梁',
    '紫微': '紫', '太陰': '陰', '天同': '同', '文昌': '昌', '巨門': '巨', '貪狼': '貪',
    '右弼': '右', '文曲': '曲', '左輔': '左',
};
const LUNAR_MONTH_BRANCHES: Record<number, string> = {
    1: '寅', 2: '卯', 3: '辰', 4: '巳', 5: '午', 6: '未',
    7: '申', 8: '酉', 9: '戌', 10: '亥', 11: '子', 12: '丑',
};
const MONTH_MAP: Record<number, string> = {
    1: '正月', 2: '二月', 3: '三月', 4: '四月', 5: '五月', 6: '六月',
    7: '七月', 8: '八月', 9: '九月', 10: '十月', 11: '冬月', 12: '臘月'
};

function getBranchIndex(branch: string): number {
    return BRANCHES.indexOf(branch);
}

function getBranchByIndex(index: number): string {
    return BRANCHES[index % 12];
}

function calculateFlowMonthPalace(flowYearPalace: string, lunarMonth: number): string {
    const flowYearIndex = getBranchIndex(flowYearPalace);
    const monthBranch = LUNAR_MONTH_BRANCHES[lunarMonth];
    const monthBranchIndex = getBranchIndex(monthBranch);
    const flowMonthIndex = (flowYearIndex + monthBranchIndex + 2) % 12;
    return getBranchByIndex(flowMonthIndex);
}

function calculateFlowDayPalace(flowMonthPalace: string, lunarDay: number): string {
    const flowMonthIndex = getBranchIndex(flowMonthPalace);
    const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;
    return getBranchByIndex(flowDayIndex);
}

function getDailyFourTransformations(dayStem: string): string {
    const trans = FOUR_TRANSFORMATIONS[dayStem];
    if (!trans) return '';
    const luAbbr = STAR_ABBREVIATIONS[trans.祿] || trans.祿;
    const quanAbbr = STAR_ABBREVIATIONS[trans.權] || trans.權;
    const keAbbr = STAR_ABBREVIATIONS[trans.科] || trans.科;
    const jiAbbr = STAR_ABBREVIATIONS[trans.忌] || trans.忌;
    return `${luAbbr}${quanAbbr}${keAbbr}${jiAbbr}`;
}

// --- Main Generator ---
const START_DATE = new Date('2022-01-01');
const END_DATE = new Date('2024-12-31');
const BENMING_PALACE = '戌'; // Default to match app

async function main() {
    try {
        console.log(`Generating data from ${START_DATE.toISOString()} to ${END_DATE.toISOString()}...`);
        const rows: any[][] = [];

        for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
            const solar = Solar.fromDate(d);
            const lunar = solar.getLunar();

            const dateStr = solar.toYmd();
            const lunarMonth = lunar.getMonth();
            const lunarDay = lunar.getDay();
            const lunarStr = `${lunar.getYearInGanZhi()}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`; // e.g. 壬寅正月初一

            // Purple Month (e.g. 臘月)
            const purpleMonth = MONTH_MAP[Math.abs(lunarMonth)] || '';
            if (lunarMonth < 0) { // Leap month? Usually libraries handle map correctly, assume month number matches key
                // Use positive only
            }

            const dayStem = lunar.getDayGan();
            const dayBranch = lunar.getDayZhi();
            const monthPillar = lunar.getMonthInGanZhi();
            const yearPillar = lunar.getYearInGanZhi();

            // Solar Term
            const jq = lunar.getJieQi(); // If today is a JieQi day
            // If not, calculate the current term. Library has `getPrevJieQi` usually.
            // Let's rely on `lunar-javascript`'s `getJieQiTable()` or simply iterate.
            // Or use `solar.getPrevJieQi()`? No, `lunar.getPrevJieQi()` returns the name & date?
            // Actually, `lunar.getJieQiTable()` returns a map.
            // Let's use `lunar.getPrevJieQi(true)` which creates lookup relevant to the lunar date context.
            // Or use a simpler way: Check if today is JieQi. If not, find previous.

            let solarTerm = jq;
            if (!solarTerm) {
                // Find most recent one
                // lunar-javascript provides easy term calculation?
                // `lunar.getPrevJieQi(true)` includes today?
                // Let's stick to simple logic: Iterate `lunar.getJieQiTable()`? No that's for the year.
                // Just use explicit `lunar.getPrevJieQi(true).getName()`.
                const prevJQ = lunar.getPrevJieQi(true);
                solarTerm = prevJQ.getName();
            }

            // Flow Day Palace
            const flowMonthPalace = calculateFlowMonthPalace(BENMING_PALACE, Math.abs(lunarMonth));
            const flowDayPalace = calculateFlowDayPalace(flowMonthPalace, lunarDay);

            // Flow 4 Trans
            const fourTrans = getDailyFourTransformations(dayStem);

            /**
             * Columns:
             * '日期', '農曆', '天干', '地支', '月天干地支', 
             * '節氣', '八字流年', '八字流月', '紫微流月', '流日命宮地支', '流日四化'
             */
            rows.push([
                dateStr,        // 日期
                lunarStr,       // 農曆
                dayStem,        // 天干
                dayBranch,      // 地支
                monthPillar,    // 月天干地支
                solarTerm,      // 節氣
                yearPillar,     // 八字流年
                monthPillar,    // 八字流月 (Duplicated as per schema)
                purpleMonth,    // 紫微流月
                flowDayPalace,  // 流日命宮地支
                fourTrans       // 流日四化
            ]);
        }

        console.log(`Generated ${rows.length} rows.`);

        // --- Upload ---
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日基本資料';

        // Upload in chunks
        const chunkSize = 500;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            console.log(`Uploading chunk ${i / chunkSize + 1}...`);
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEETS_ID,
                range: `${SHEET_NAME}!A:K`, // A to K covers 11 columns
                valueInputOption: 'RAW',
                requestBody: { values: chunk }
            });
        }
        console.log('Upload complete.');

    } catch (e) {
        console.error(e);
    }
}

main();
