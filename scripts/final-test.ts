/**
 * 修復農曆日數提取邏輯
 */

import { getBranchIndex, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

// 正確的農曆日數提取（需要先匹配長的，避免"十一"被優先匹配）
function extractLunarDay(lunarDate: string): number {
    // 先處理20-30日
    if (lunarDate.includes('三十')) return 30;
    if (lunarDate.includes('廿九')) return 29;
    if (lunarDate.includes('廿八')) return 28;
    if (lunarDate.includes('廿七')) return 27;
    if (lunarDate.includes('廿六')) return 26;
    if (lunarDate.includes('廿五')) return 25;
    if (lunarDate.includes('廿四')) return 24;
    if (lunarDate.includes('廿三')) return 23;
    if (lunarDate.includes('廿二')) return 22;
    if (lunarDate.includes('廿一')) return 21;
    if (lunarDate.includes('二十')) return 20;

    // 再處理10-19日
    if (lunarDate.includes('十九')) return 19;
    if (lunarDate.includes('十八')) return 18;
    if (lunarDate.includes('十七')) return 17;
    if (lunarDate.includes('十六')) return 16;
    if (lunarDate.includes('十五')) return 15;
    if (lunarDate.includes('十四')) return 14;
    if (lunarDate.includes('十三')) return 13;
    if (lunarDate.includes('十二')) return 12;
    if (lunarDate.includes('十一')) return 11;
    if (lunarDate.includes('初十')) return 10;

    // 最後處理1-9日
    if (lunarDate.includes('初九')) return 9;
    if (lunarDate.includes('初八')) return 8;
    if (lunarDate.includes('初七')) return 7;
    if (lunarDate.includes('初六')) return 6;
    if (lunarDate.includes('初五')) return 5;
    if (lunarDate.includes('初四')) return 4;
    if (lunarDate.includes('初三')) return 3;
    if (lunarDate.includes('初二')) return 2;
    if (lunarDate.includes('初一')) return 1;

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

function extractLunarYearBranch(lunarDate: string): string {
    const match = lunarDate.match(/[甲乙丙丁戊己庚辛壬癸]([子丑寅卯辰巳午未申酉戌亥])/);
    return match ? match[1] : '';
}

// 擴大測試資料集
const TEST_DATA = [
    // 2026年1月
    { date: '2026-01-01', palace: '未' },
    { date: '2026-01-02', palace: '申' },
    { date: '2026-01-10', palace: '辰' },

    // 2025年9-10月
    { date: '2025-09-25', palace: '未' },
    { date: '2025-09-26', palace: '申' },
    { date: '2025-10-10', palace: '戌' },

    // 2025年12月
    { date: '2025-12-24', palace: '亥' },
    { date: '2025-12-31', palace: '午' },
];

async function finalTest() {
    console.log('=== 最終驗證：正確的紫微流日命宮計算 ===\n');

    const allCalendar = [...calendar2025, ...calendar2026];

    console.log('計算公式：');
    console.log('1. 流年命宮 = 農曆年地支');
    console.log('2. 流月命宮 = 流年命宮 + (農曆月 - 1)');
    console.log('3. 流日命宮 = 流月命宮 + (農曆日 - 1)\n');
    console.log('─'.repeat(110));
    console.log('日期\t\t農曆完整\t\t年支\t流年宮\t農月\t流月宮\t農日\t流日宮\t實際\t結果');
    console.log('─'.repeat(110));

    let correct = 0;
    let total = 0;
    const errors: string[] = [];

    for (const test of TEST_DATA) {
        const calData = allCalendar.find((d: any) => d.gregorianDate === test.date);
        if (!calData) {
            console.log(`${test.date}\t找不到資料`);
            continue;
        }

        total++;

        const lunarYearBranch = extractLunarYearBranch(calData.lunarDate);
        const lunarMonth = extractLunarMonth(calData.lunarDate);
        const lunarDay = extractLunarDay(calData.lunarDate);

        // 1. 流年命宮
        const flowYearIndex = getBranchIndex(lunarYearBranch);
        const flowYearPalace = EARTHLY_BRANCHES[flowYearIndex];

        // 2. 流月命宮
        const flowMonthIndex = (flowYearIndex + lunarMonth - 1) % 12;
        const flowMonthPalace = EARTHLY_BRANCHES[flowMonthIndex];

        // 3. 流日命宮
        const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;
        const flowDayPalace = EARTHLY_BRANCHES[flowDayIndex];

        const isCorrect = flowDayPalace === test.palace;
        const result = isCorrect ? '✅' : '❌';

        if (isCorrect) {
            correct++;
        } else {
            errors.push(`${test.date}: 預測=${flowDayPalace}, 實際=${test.palace}, 農曆=${calData.lunarDate}`);
        }

        const lunarShort = calData.lunarDate.substring(2);
        console.log(`${test.date}\t${lunarShort.padEnd(16)}\t${lunarYearBranch}\t${flowYearPalace}\t${lunarMonth}\t${flowMonthPalace}\t${lunarDay}\t${flowDayPalace}\t${test.palace}\t${result}`);
    }

    console.log('─'.repeat(110));
    console.log(`\n✨ 準確率：${correct}/${total} = ${(correct / total * 100).toFixed(1)}%\n`);

    if (errors.length > 0) {
        console.log('❌ 對不上的日期：');
        errors.forEach(err => console.log(`  ${err}`));
    } else {
        console.log('🎉 所有測試通過！公式100%正確！');
    }
}

finalTest().catch(console.error);
