/**
 * 深入分析紫微流日命宮計算邏輯
 * 比較不同月份的資料
 */

import { getBranchIndex, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

const BENMING_PALACE = '戌';
const BENMING_INDEX = getBranchIndex(BENMING_PALACE);

// 所有已知資料
const ALL_KNOWN_DATA = [
    // 2025年9-10月（八月）
    ...Array.from({ length: 23 }, (_, i) => {
        const date = new Date(2025, 8, 25 + i); // 9月是索引8
        const dateStr = date.toISOString().split('T')[0];
        const palaces = ['未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳'];
        return { date: dateStr, palace: palaces[i], month: '八月' };
    }),

    // 2025年12月-2026年1月
    { date: '2025-12-24', palace: '亥', month: '十一月' },
    { date: '2025-12-25', palace: '子', month: '十一月' },
    { date: '2025-12-26', palace: '丑', month: '十一月' },
    { date: '2025-12-27', palace: '寅', month: '十一月' },
    { date: '2025-12-28', palace: '卯', month: '十一月' },
    { date: '2025-12-29', palace: '辰', month: '十一月' },
    { date: '2025-12-30', palace: '巳', month: '十一月' },
    { date: '2025-12-31', palace: '午', month: '十一月' },
    { date: '2026-01-01', palace: '未', month: '十一月' },
    { date: '2026-01-02', palace: '申', month: '十一月' },
    { date: '2026-01-06', palace: '子', month: '十一月' },
    { date: '2026-01-08', palace: '寅', month: '十一月' },
    { date: '2026-01-10', palace: '辰', month: '十一月' },
    { date: '2026-01-12', palace: '午', month: '十一月' },
    { date: '2026-01-14', palace: '申', month: '十一月' },
];

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

async function deepAnalyze() {
    console.log('=== 深度分析紫微流日命宮計算邏輯 ===\n');

    const allCalendar = [...calendar2025, ...calendar2026];

    // 按月份分組
    const byMonth: Record<string, any[]> = {};

    for (const known of ALL_KNOWN_DATA) {
        const calData = allCalendar.find((d: any) => d.gregorianDate === known.date);
        if (!calData) continue;

        const lunarDay = extractLunarDay(calData.lunarDate);
        const actualPalaceIndex = getBranchIndex(known.palace);

        // 計算距離本命宮的距離
        const distanceFromBenming = (actualPalaceIndex - BENMING_INDEX + 12) % 12;

        // 反推需要的偏移量
        const offset = distanceFromBenming - lunarDay;
        const normalizedOffset = ((offset % 12) + 12) % 12;

        const lunarMonth = calData.lunarDate.match(/(正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)/)?.[0] || '未知';

        if (!byMonth[lunarMonth]) byMonth[lunarMonth] = [];
        byMonth[lunarMonth].push({
            date: known.date,
            lunarDay,
            palace: known.palace,
            offset: normalizedOffset,
            distanceFromBenming,
        });
    }

    console.log('按農曆月份分組分析：\n');

    for (const [month, data] of Object.entries(byMonth)) {
        console.log(`【${month}】`);
        console.log(`  樣本數：${data.length}筆`);

        // 統計offset
        const offsets = data.map(d => d.offset);
        const uniqueOffsets = [...new Set(offsets)];

        if (uniqueOffsets.length === 1) {
            console.log(`  ✅ 偏移量一致：${uniqueOffsets[0]}`);
            console.log(`  計算公式：流日命宮 = 本命宮 + (農曆日 + ${uniqueOffsets[0]})`);
        } else {
            console.log(`  ⚠️  偏移量不一致：${uniqueOffsets.join(', ')}`);
            // 顯示詳細資料
            data.slice(0, 3).forEach(d => {
                console.log(`    ${d.date}: 農曆${d.lunarDay}日, 命宮=${d.palace}, offset=${d.offset}`);
            });
        }
        console.log('');
    }

    console.log('=== 結論 ===\n');
    console.log('觀察：不同農曆月份可能有不同的偏移量！');
    console.log('八月：offset = 8 (12 - 4)');
    console.log('十一月：offset = 8 (12 - 4)');
    console.log('');
    console.log('等等...讓我重新計算...');
}

deepAnalyze().catch(console.error);
