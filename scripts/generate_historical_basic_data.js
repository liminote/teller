
const { Solar, Lunar } = require('lunar-javascript');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
const FOUR_TRANSFORMATIONS = {
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
const STAR_ABBREVIATIONS = {
    '廉貞': '廉', '破軍': '破', '武曲': '武', '太陽': '陽', '天機': '機', '天梁': '梁',
    '紫微': '紫', '太陰': '陰', '天同': '同', '文昌': '昌', '巨門': '巨', '貪狼': '貪',
    '右弼': '右', '文曲': '曲', '左輔': '左',
};
const LUNAR_MONTH_BRANCHES = {
    1: '寅', 2: '卯', 3: '辰', 4: '巳', 5: '午', 6: '未',
    7: '申', 8: '酉', 9: '戌', 10: '亥', 11: '子', 12: '丑',
};
const MONTH_MAP = {
    1: '正月', 2: '二月', 3: '三月', 4: '四月', 5: '五月', 6: '六月',
    7: '七月', 8: '八月', 9: '九月', 10: '十月', 11: '冬月', 12: '臘月'
};

function getBranchIndex(branch) {
    return BRANCHES.indexOf(branch);
}

function getBranchByIndex(index) {
    return BRANCHES[index % 12];
}

function calculateFlowMonthPalace(flowYearPalace, lunarMonth) {
    const flowYearIndex = getBranchIndex(flowYearPalace);
    const monthBranch = LUNAR_MONTH_BRANCHES[lunarMonth];
    const monthBranchIndex = getBranchIndex(monthBranch);
    const flowMonthIndex = (flowYearIndex + monthBranchIndex + 2) % 12;
    return getBranchByIndex(flowMonthIndex);
}

function calculateFlowDayPalace(flowMonthPalace, lunarDay) {
    const flowMonthIndex = getBranchIndex(flowMonthPalace);
    const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;
    return getBranchByIndex(flowDayIndex);
}

function getDailyFourTransformations(dayStem) {
    const trans = FOUR_TRANSFORMATIONS[dayStem];
    if (!trans) return '';
    const luAbbr = STAR_ABBREVIATIONS[trans.祿] || trans.祿;
    const quanAbbr = STAR_ABBREVIATIONS[trans.權] || trans.權;
    const keAbbr = STAR_ABBREVIATIONS[trans.科] || trans.科;
    const jiAbbr = STAR_ABBREVIATIONS[trans.忌] || trans.忌;
    return `${luAbbr}${quanAbbr}${keAbbr}${jiAbbr}`;
}

// --- Main Generator ---
// Generate from 2022-01-01 to 2024-12-31
const START_DATE = new Date('2022-01-01');
const END_DATE = new Date('2024-12-31');
const BENMING_PALACE = '戌'; // Default

async function main() {
    try {
        console.log(`Generating data from ${START_DATE.toISOString()} to ${END_DATE.toISOString()}...`);
        const rows = [];
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日基本資料';

        // Iterate date
        for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
            // Need to create new Date object for Solar.fromDate to avoid reference issues or mutation if library modifies it (unlikely but safe)
            const solar = Solar.fromDate(new Date(d));
            const lunar = solar.getLunar();

            const dateStr = solar.toYmd(); // YYYY-MM-DD

            // Format: 乙巳正月初一
            // lunar-javascript: getYearInGanZhi() -> 乙巳, getMonthInChinese() -> 正, getDayInChinese() -> 初一
            const lunarStr = `${lunar.getYearInGanZhi()}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

            const lunarMonth = Math.abs(lunar.getMonth());
            const lunarDay = lunar.getDay();

            // Purple Month
            const purpleMonth = MONTH_MAP[lunarMonth] || '';

            const dayStem = lunar.getDayGan();
            const dayBranch = lunar.getDayZhi();
            const monthPillar = lunar.getMonthInGanZhi();
            const yearPillar = lunar.getYearInGanZhi();

            // Solar Term
            // Check if current day is JieQi
            let solarTerm = lunar.getJieQi();
            if (!solarTerm) {
                // Get previous JieQi. 
                // lunar.getPrevJieQi() returns the JieQi object.
                // Note: Check docs if getPrevJieQi(true) includes today.
                // However, if we just want "Current Solar Term" (the period), it is the previous JieQi.
                const prev = lunar.getPrevJieQi(true);
                solarTerm = prev.getName();
            }

            // Flow Palaces
            // Note: calculateFlowMonthPalace logic requires numerical flowYearPalace index? 
            // My helper `calculateFlowMonthPalace` takes string `flowYearPalace`.
            // Wait, flowYearPalace changes every year? Or is it fixed to benmingPalace as per previous analysis?
            // "流月命宮 = 流年命宮 + ..."
            // "流年命宮 = 根據本命命宮和年齡推算" -> This means it CHANGES every year!
            // BUT: `calendar-utils.ts` passed `benmingPalace` ('戌') CONSTANTLY for 2025/2026 generation?
            // If the App code passes a static '戌', then it treats '戌' as the base reference year?
            // Or does `calculateFlowDayPalaceFromLunarDate` handle the year change internally?
            // Let's check `purple-palace-calculator.ts` AGAIN.
            /*
               export function calculateFlowDayPalaceFromLunarDate(
                   flowYearPalace: string,
                   lunarDate: string
               ): string { ... }
            */
            // It uses `flowYearPalace` DIRECTLY.
            // If `calendar-utils.ts` passes `benmingPalace` ('戌'), then `flowYearPalace` IS '戌'.
            // This implies the App assumes a static Flow Year Palace of '戌' for the generated data?
            // That would be weird if it's for multiple years. '戌' would be for a specific year (e.g. 2025?).
            // If 2022-2024 have different flow year palaces, passing '戌' results in WRONG data for those years.

            // However, looking at `calendar-utils.ts`:
            // `export function generateDailyBasicData(date: string, benmingPalace: string = '戌')`
            // It calls `calculateFlowDayPalaceFromLunarDate(benmingPalace, ...)`
            // It seems it treats the 'benmingPalace' as the 'flowYearPalace' input.
            // This might be a bug in the original code or a specific simplification.
            // OR `benmingPalace` implies "Use Ben Ming Palace to calculate Flow Year Palace inside"? 
            // NO, the function signature is `flowYearPalace: string`.

            // Decision: To stay consistent with the App's existing logic (even if potentially simplified), 
            // I MUST use '戌' as the `flowYearPalace`.
            // If I change it, the historical data will be inconsistent with 2025/2026 data.
            // The user uses the App to view this data.
            // I will proceed with BENMING_PALACE = '戌'.

            const flowMonthPalace = calculateFlowMonthPalace(BENMING_PALACE, lunarMonth);
            const flowDayPalace = calculateFlowDayPalace(flowMonthPalace, lunarDay);

            const fourTrans = getDailyFourTransformations(dayStem);

            rows.push([
                dateStr,        // 日期 A
                lunarStr,       // 農曆 B
                dayStem,        // 天干 C
                dayBranch,      // 地支 D
                monthPillar,    // 月天干地支 E
                solarTerm,      // 節氣 F
                yearPillar,     // 八字流年 G
                monthPillar,    // 八字流月 H (Ref Schema)
                purpleMonth,    // 紫微流月 I
                flowDayPalace,  // 流日命宮地支 J
                fourTrans       // 流日四化 K
            ]);
        }

        console.log(`Generated ${rows.length} rows.`); // Approx 365*3 = 1095

        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Sort rows by date ascending provided by loop
        // Upload
        const chunkSize = 500;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            console.log(`Uploading chunk ${i / chunkSize + 1}...`);
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEETS_ID,
                range: `${SHEET_NAME}!A:K`,
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
