/**
 * 正確的紫微流日命宮計算邏輯
 * 使用農曆年地支（而非八字年柱地支）
 */

import { getBranchIndex, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

function extractLunarDay(lunarDate: string): number {
    const patterns = [
        { regex: /初一/, value: 1 }, { regex: /初二/, value: 2 }, { regex: /初三/, value: 3 },
        { regex: /初四/, value: 4 }, { regex: /初五/, value: 5 }, { regex: /初六/, value: 6 },
        { regex: /初七/, value: 7 }, { regex: /初八/, value: 8 }, { regex: /初九/, value: 9 },
        { regex: /初十/, value: 10 }, { regex: /十一/, value: 11 }, { regex: /十二/, value: 12 },
        { regex: /十三/, value: 13 }, { regex: /十四/, value: 14 }, { regex: /十五/, value: 15 },
        { regex: /十六/, value: 16 }, { regex: /十七/, value: 17 }, { regex: /十八/, value: 18 },
        { regex: /十九/, value: 19 }, { regex: /二十/, value: 20 }, { regex: /廿一/, value: 21 },
        { regex: /廿二/, value: 22 }, { regex: /廿三/, value: 23 }, { regex: /廿四/, value: 24 },
        { regex: /廿五/, value: 25 }, { regex: /廿六/, value: 26 }, { regex: /廿七/, value: 27 },
        { regex: /廿八/, value: 28 }, { regex: /廿九/, value: 29 }, { regex: /三十/, value: 30 },
    ];
    for (const p of patterns) {
        if (p.regex.test(lunarDate)) return p.value;
    }
    return 0;
}

function extractLunarMonth(lunarDate: string): number {
    if (lunarDate.includes('正月')) return 1;
    if (lunarDate.includes('二月')) return 2;
    if (lunarDate.includes('三月')) return 3;
    if (lunarDate.includes('四月')) return 4;
    if (lunarDate.includes('五月')) return 5;
    if (lunarDate.includes('六月')) return 6;
    if (lunarDate.includes('七月')) return 7;
    if (lunarDate.includes('八月')) return 8;
    if (lunarDate.includes('九月')) return 9;
    if (lunarDate.includes('十月')) return 10;
    if (lunarDate.includes('十一月')) return 11;
    if (lunarDate.includes('十二月')) return 12;
    return 0;
}

// 從農曆日期字串提取農曆年地支
function extractLunarYearBranch(lunarDate: string): string {
    // 格式：乙巳正月初四 -> 提取「巳」
    const match = lunarDate.match(/[甲乙丙丁戊己庚辛壬癸]([子丑寅卯辰巳午未申酉戌亥])/);
    return match ? match[1] : '';
}

// 測試資料
const TEST_DATA = [
    // 2026年1月（原本有效的資料）
    { date: '2026-01-01', palace: '未' },
    { date: '2026-01-02', palace: '申' },
    { date: '2026-01-10', palace: '辰' },

    // 2025年9-10月（原本失敗的資料）
    { date: '2025-09-25', palace: '未' },
    { date: '2025-09-26', palace: '申' },
    { date: '2025-10-10', palace: '戌' },
];

async function test() {
    console.log('=== 使用農曆年地支的流日命宮計算 ===\n');

    const allCalendar = [...calendar2025, ...calendar2026];

    console.log('─'.repeat(120));
    console.log('日期\t\t農曆全文\t\t\t農曆年支\t流年宮\t農曆月\t流月宮\t農曆日\t流日宮\t實際\t結果');
    console.log('─'.repeat(120));

    let correct = 0;
    let total = 0;

    for (const test of TEST_DATA) {
        const calData = allCalendar.find((d: any) => d.gregorianDate === test.date);
        if (!calData) continue;

        total++;

        // 提取農曆年地支（非八字年柱）
        const lunarYearBranch = extractLunarYearBranch(calData.lunarDate);

        // 1. 流年命宮 = 農曆年地支
        const flowYearIndex = getBranchIndex(lunarYearBranch);
        const flowYearPalace = EARTHLY_BRANCHES[flowYearIndex];

        // 2. 流月命宮 = 流年命宮 + (農曆月 - 1)
        const lunarMonth = extractLunarMonth(calData.lunarDate);
        const flowMonthIndex = (flowYearIndex + lunarMonth - 1) % 12;
        const flowMonthPalace = EARTHLY_BRANCHES[flowMonthIndex];

        // 3. 流日命宮 = 流月命宮 + (農曆日 - 1)
        const lunarDay = extractLunarDay(calData.lunarDate);
        const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;
        const flowDayPalace = EARTHLY_BRANCHES[flowDayIndex];

        const isCorrect = flowDayPalace === test.palace;
        const result = isCorrect ? '✅' : '❌';

        if (isCorrect) correct++;

        console.log(`${test.date}\t${calData.lunarDate.padEnd(20)}\t${lunarYearBranch}\t${flowYearPalace}\t${lunarMonth}月\t${flowMonthPalace}\t${lunarDay}日\t${flowDayPalace}\t${test.palace}\t${result}`);
    }

    console.log('─'.repeat(120));
    console.log(`\n✨ 準確率：${correct}/${total} = ${(correct / total * 100).toFixed(1)}%`);

    if (correct === total) {
        console.log('\n🎉 所有測試通過！找到正確的計算公式了！');
    }
}

test().catch(console.error);
