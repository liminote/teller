/**
 * 分析紫微流日命宮計算邏輯
 * 
 * 執行方式: npx tsx scripts/analyze-purple-palace.ts
 */

import { KNOWN_FLOW_PALACE_DATA, getBranchIndex, getBranchDistance, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendarData2026 from '../src/data/calendar-2026.json';
import * as fs from 'fs';

interface AnalysisResult {
    date: string;
    expectedPalace: string;
    lunarDate: string;
    lunarDay: string;
    dayBranch: string;
    monthBranch: string;
    distanceFromBenming: number;
    notes: string;
}

// 本命命宮地支（用戶的命宮在戌）
const BENMING_PALACE = '戌';

function extractLunarDay(lunarDate: string): number {
    // 從農曆日期中提取日數
    // 例如：乙巳十二月初二 -> 2
    // 例如：乙巳十一月十三 -> 13

    if (lunarDate.includes('初一')) return 1;
    if (lunarDate.includes('初二')) return 2;
    if (lunarDate.includes('初三')) return 3;
    if (lunarDate.includes('初四')) return 4;
    if (lunarDate.includes('初五')) return 5;
    if (lunarDate.includes('初六')) return 6;
    if (lunarDate.includes('初七')) return 7;
    if (lunarDate.includes('初八')) return 8;
    if (lunarDate.includes('初九')) return 9;
    if (lunarDate.includes('初十')) return 10;

    if (lunarDate.includes('十一')) return 11;
    if (lunarDate.includes('十二')) return 12;
    if (lunarDate.includes('十三')) return 13;
    if (lunarDate.includes('十四')) return 14;
    if (lunarDate.includes('十五')) return 15;
    if (lunarDate.includes('十六')) return 16;
    if (lunarDate.includes('十七')) return 17;
    if (lunarDate.includes('十八')) return 18;
    if (lunarDate.includes('十九')) return 19;
    if (lunarDate.includes('二十')) return 20;

    if (lunarDate.includes('廿一')) return 21;
    if (lunarDate.includes('廿二')) return 22;
    if (lunarDate.includes('廿三')) return 23;
    if (lunarDate.includes('廿四')) return 24;
    if (lunarDate.includes('廿五')) return 25;
    if (lunarDate.includes('廿六')) return 26;
    if (lunarDate.includes('廿七')) return 27;
    if (lunarDate.includes('廿八')) return 28;
    if (lunarDate.includes('廿九')) return 29;
    if (lunarDate.includes('三十')) return 30;

    return 0;
}

async function analyzePattern() {
    console.log('=== 紫微流日命宮計算邏輯分析 ===\n');
    console.log(`本命命宮：${BENMING_PALACE}宮\n`);

    const results: AnalysisResult[] = [];

    // 載入2025年資料（需要先爬取）
    let calendar2025: any[] = [];
    try {
        calendar2025 = JSON.parse(fs.readFileSync('./src/data/calendar-2025.json', 'utf-8'));
    } catch (e) {
        console.log('⚠️  2025年資料尚未爬取，僅分析2026年資料\n');
    }

    const allCalendar = [...calendar2025, ...calendarData2026];

    for (const known of KNOWN_FLOW_PALACE_DATA) {
        const calendarData = allCalendar.find(d => d.gregorianDate === known.date);

        if (!calendarData) {
            console.log(`❌ 找不到 ${known.date} 的曆法資料`);
            continue;
        }

        const lunarDay = extractLunarDay(calendarData.lunarDate);
        const dayBranch = calendarData.dayPillar.charAt(1);
        const monthBranch = calendarData.monthPillar.charAt(1);

        // 計算從本命命宮到流日命宮的距離
        const distance = getBranchDistance(BENMING_PALACE, known.palace);

        // 嘗試找出規律
        let notes = '';

        // 假設1: 流日命宮 = 本命命宮 + (農曆日-1)
        const hypothesis1 = getBranchIndex(BENMING_PALACE) + (lunarDay - 1);
        const hypothesis1Palace = EARTHLY_BRANCHES[hypothesis1 % 12];
        if (hypothesis1Palace === known.palace) {
            notes += '[✓ 假設1成立: 本命宮+農曆日-1] ';
        }

        // 假設2: 流日命宮 = 日地支
        if (dayBranch === known.palace) {
            notes += '[✓ 假設2成立: 等於日地支] ';
        }

        // 假設3: 流日命宮 = 本命命宮 + 農曆日
        const hypothesis3 = getBranchIndex(BENMING_PALACE) + lunarDay;
        const hypothesis3Palace = EARTHLY_BRANCHES[hypothesis3 % 12];
        if (hypothesis3Palace === known.palace) {
            notes += '[✓ 假設3成立: 本命宮+農曆日] ';
        }

        results.push({
            date: known.date,
            expectedPalace: known.palace,
            lunarDate: calendarData.lunarDate,
            lunarDay: lunarDay.toString(),
            dayBranch,
            monthBranch,
            distanceFromBenming: distance,
            notes: notes || '[無明顯規律]',
        });
    }

    // 輸出結果表格
    console.log('日期\t\t命宮\t農曆\t日數\t日支\t距離\t分析');
    console.log('─'.repeat(80));

    for (const r of results) {
        console.log(`${r.date}\t${r.expectedPalace}\t${r.lunarDate.substring(2, 8)}\t${r.lunarDay}\t${r.dayBranch}\t${r.distanceFromBenming}\t${r.notes}`);
    }

    console.log('\n=== 統計分析 ===\n');

    // 統計哪個假設最準確
    let hypothesis1Count = 0;
    let hypothesis2Count = 0;
    let hypothesis3Count = 0;

    for (const r of results) {
        if (r.notes.includes('假設1成立')) hypothesis1Count++;
        if (r.notes.includes('假設2成立')) hypothesis2Count++;
        if (r.notes.includes('假設3成立')) hypothesis3Count++;
    }

    console.log(`假設1（本命宮+農曆日-1）命中率: ${hypothesis1Count}/${results.length} = ${(hypothesis1Count / results.length * 100).toFixed(1)}%`);
    console.log(`假設2（等於日地支）命中率: ${hypothesis2Count}/${results.length} = ${(hypothesis2Count / results.length * 100).toFixed(1)}%`);
    console.log(`假設3（本命宮+農曆日）命中率: ${hypothesis3Count}/${results.length} = ${(hypothesis3Count / results.length * 100).toFixed(1)}%`);

    console.log('\n=== 結論 ===\n');

    if (hypothesis1Count === results.length) {
        console.log('✅ 流日命宮計算公式：本命命宮 + (農曆日 - 1)');
    } else if (hypothesis2Count === results.length) {
        console.log('✅ 流日命宮計算公式：等於日柱地支');
    } else if (hypothesis3Count === results.length) {
        console.log('✅ 流日命宮計算公式：本命命宮 + 農曆日');
    } else {
        console.log('⚠️  規律尚未明確，需要更多資料或其他假設');
    }
}

analyzePattern().catch(console.error);
