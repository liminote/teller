/**
 * 驗證新的流日命宮計算邏輯
 * 
 * 計算步驟：
 * 1. 找流年命宮：流年地支對應的宮位（例如：乙巳年→巳宮）
 * 2. 找流月命宮：從流年命宮開始，順時針數到該農曆月份
 * 3. 找流日命宮：從流月命宮開始，順時針數到該農曆日
 */

import { getBranchIndex, EARTHLY_BRANCHES, getBranchByIndex } from '../src/lib/purple-palace-data';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

function extractLunarDay(lunarDate: string): number {
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

// 測試資料：用戶提供的圖片
const TEST_DATA = [
    // 2025年2月（正月）
    { date: '2025-02-01', palace: '子' },
    { date: '2025-02-05', palace: '辰' },
    { date: '2025-02-10', palace: '酉' },

    // 2025年5月（四月）  
    { date: '2025-05-20', palace: '戌' },
    { date: '2025-05-25', palace: '卯' },

    // 2026年1月（十二月）
    { date: '2026-01-01', palace: '未' },
    { date: '2026-01-02', palace: '申' },
    { date: '2026-01-10', palace: '辰' },
];

async function testNewLogic() {
    console.log('=== 測試新的流日命宮計算邏輯 ===\n');

    const allCalendar = [...calendar2025, ...calendar2026];

    console.log('計算步驟：');
    console.log('1. 流年命宮 = 年地支對應的宮位');
    console.log('2. 流月命宮 = 流年命宮 + (農曆月 - 1)');
    console.log('3. 流日命宮 = 流月命宮 + (農曆日 - 1)');
    console.log('');
    console.log('─'.repeat(100));
    console.log('日期\t\t年地支\t流年宮\t農曆月\t流月宮\t農曆日\t預測\t實際\t結果');
    console.log('─'.repeat(100));

    let correct = 0;
    let total = 0;

    for (const test of TEST_DATA) {
        const calData = allCalendar.find((d: any) => d.gregorianDate === test.date);
        if (!calData) {
            console.log(`${test.date}\t找不到資料`);
            continue;
        }

        total++;

        // 1. 找流年命宮（年地支）
        const yearBranch = calData.yearPillar.charAt(1); // 例如：乙巳 → 巳
        const flowYearPalaceIndex = getBranchIndex(yearBranch);
        const flowYearPalace = EARTHLY_BRANCHES[flowYearPalaceIndex];

        // 2. 找流月命宮
        const lunarMonth = extractLunarMonth(calData.lunarDate);
        const flowMonthPalaceIndex = (flowYearPalaceIndex + lunarMonth - 1) % 12;
        const flowMonthPalace = EARTHLY_BRANCHES[flowMonthPalaceIndex];

        // 3. 找流日命宮
        const lunarDay = extractLunarDay(calData.lunarDate);
        const flowDayPalaceIndex = (flowMonthPalaceIndex + lunarDay - 1) % 12;
        const flowDayPalace = EARTHLY_BRANCHES[flowDayPalaceIndex];

        const isCorrect = flowDayPalace === test.palace;
        const result = isCorrect ? '✅' : '❌';

        if (isCorrect) correct++;

        console.log(`${test.date}\t${yearBranch}\t${flowYearPalace}\t${lunarMonth}月\t${flowMonthPalace}\t${lunarDay}日\t${flowDayPalace}\t${test.palace}\t${result}`);
    }

    console.log('─'.repeat(100));
    console.log(`\n準確率：${correct}/${total} = ${(correct / total * 100).toFixed(1)}%`);
}

testNewLogic().catch(console.error);
