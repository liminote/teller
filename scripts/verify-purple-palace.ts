/**
 * 驗證紫微流日命宮計算公式
 * 使用用戶提供的 2025 年 9-10 月資料
 */

import { calculateFlowDayPalaceFromLunarDate } from '../src/lib/purple-palace-calculator';
import calendar2025 from '../src/data/calendar-2025.json';

const BENMING_PALACE = '戌'; // 本命命宮

// 用戶提供的 2025 年 9-10 月流日命宮資料
const VERIFICATION_DATA = [
    { date: '2025-09-25', palace: '未' },
    { date: '2025-09-26', palace: '申' },
    { date: '2025-09-27', palace: '酉' },
    { date: '2025-09-28', palace: '戌' },
    { date: '2025-09-29', palace: '亥' },
    { date: '2025-09-30', palace: '子' },
    { date: '2025-10-01', palace: '丑' },
    { date: '2025-10-02', palace: '寅' },
    { date: '2025-10-03', palace: '卯' },
    { date: '2025-10-04', palace: '辰' },
    { date: '2025-10-05', palace: '巳' },
    { date: '2025-10-06', palace: '午' },
    { date: '2025-10-07', palace: '未' },
    { date: '2025-10-08', palace: '申' },
    { date: '2025-10-09', palace: '酉' },
    { date: '2025-10-10', palace: '戌' },
    { date: '2025-10-11', palace: '亥' },
    { date: '2025-10-12', palace: '子' },
    { date: '2025-10-13', palace: '丑' },
    { date: '2025-10-14', palace: '寅' },
    { date: '2025-10-15', palace: '卯' },
    { date: '2025-10-16', palace: '辰' },
    { date: '2025-10-17', palace: '巳' },
];

async function verify() {
    console.log('=== 紫微流日命宮計算公式驗證 ===\n');
    console.log(`本命命宮：${BENMING_PALACE}宮`);
    console.log(`驗證資料：2025年9月-10月 (${VERIFICATION_DATA.length}筆)\n`);
    console.log(`計算公式：流日命宮 = 本命命宮 + (農曆日 - 4)\n`);
    console.log('─'.repeat(80));
    console.log('日期\t\t農曆\t\t預測命宮\t實際命宮\t結果');
    console.log('─'.repeat(80));

    let correctCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const known of VERIFICATION_DATA) {
        const calData = calendar2025.find((d: any) => d.gregorianDate === known.date);

        if (!calData) {
            console.log(`${known.date}\t找不到農曆資料`);
            errorCount++;
            continue;
        }

        let predicted = '';
        try {
            predicted = calculateFlowDayPalaceFromLunarDate(BENMING_PALACE, calData.lunarDate);
        } catch (error) {
            console.log(`${known.date}\t${calData.lunarDate}\t計算失敗\t${known.palace}\t❌`);
            errorCount++;
            errors.push(`${known.date}: 計算失敗 - ${error}`);
            continue;
        }

        const isCorrect = predicted === known.palace;
        const result = isCorrect ? '✅' : '❌';

        if (isCorrect) {
            correctCount++;
        } else {
            errorCount++;
            errors.push(`${known.date}: 預測=${predicted}, 實際=${known.palace}, 農曆=${calData.lunarDate}`);
        }

        // 簡化農曆顯示
        const lunarShort = calData.lunarDate.substring(2);
        console.log(`${known.date}\t${lunarShort}\t${predicted}\t\t${known.palace}\t\t${result}`);
    }

    console.log('─'.repeat(80));
    console.log(`\n總計：${VERIFICATION_DATA.length}筆`);
    console.log(`✅ 正確：${correctCount}筆 (${(correctCount / VERIFICATION_DATA.length * 100).toFixed(1)}%)`);
    console.log(`❌ 錯誤：${errorCount}筆 (${(errorCount / VERIFICATION_DATA.length * 100).toFixed(1)}%)`);

    if (errors.length > 0) {
        console.log('\n錯誤詳情：');
        errors.forEach(err => console.log(`  - ${err}`));
    } else {
        console.log('\n🎉 所有測試通過！計算公式 100% 準確！');
    }
}

verify().catch(console.error);
