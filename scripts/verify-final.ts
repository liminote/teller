/**
 * 最终验证：使用正确的流日命宫计算公式
 */

import { calculateFlowDayPalaceFromLunarDate } from '../src/lib/purple-palace-calculator';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

// 2025农历年的流年命宫
const FLOW_YEAR_2025 = '巳';

// 所有测试数据
const TEST_DATA = [
    // 2026年1月（农历2025年十二月）
    { date: '2026-01-01', palace: '未' },
    { date: '2026-01-02', palace: '申' },
    { date: '2026-01-10', palace: '辰' },
    { date: '2026-01-20', palace: '酉' },

    // 2025年9-10月（农历2025年八月）
    { date: '2025-09-25', palace: '未' },
    { date: '2025-09-26', palace: '申' },
    { date: '2025-10-10', palace: '戌' },

    // 2025年12月（农历2025年十一月）
    { date: '2025-12-24', palace: '亥' },
    { date: '2025-12-31', palace: '午' },
];

async function verify() {
    console.log('=== 最终验证：正确的紫微流日命宫计算 ===\n');
    console.log(`流年命宫（农历2025年）：${FLOW_YEAR_2025}宫\n`);
    console.log('计算公式：');
    console.log('1. 流月命宫 = 流年命宫 + 当月地支索引 + 2');
    console.log('2. 流日命宫 = 流月命宫 + (农历日 - 1)\n');
    console.log('─'.repeat(100));
    console.log('日期\t\t农历日期\t\t\t预测命宫\t实际命宫\t结果');
    console.log('─'.repeat(100));

    const allCalendar = [...calendar2025, ...calendar2026];

    let correct = 0;
    let total = 0;
    const errors: string[] = [];

    for (const test of TEST_DATA) {
        const calData = allCalendar.find((d: any) => d.gregorianDate === test.date);
        if (!calData) {
            console.log(`${test.date}\t找不到农历资料`);
            continue;
        }

        total++;

        try {
            const predicted = calculateFlowDayPalaceFromLunarDate(FLOW_YEAR_2025, calData.lunarDate);
            const isCorrect = predicted === test.palace;
            const result = isCorrect ? '✅' : '❌';

            if (isCorrect) {
                correct++;
            } else {
                errors.push(`${test.date}: 预测=${predicted}, 实际=${test.palace}, 农历=${calData.lunarDate}`);
            }

            const lunarShort = calData.lunarDate.substring(2);
            console.log(`${test.date}\t${lunarShort.padEnd(20)}\t${predicted}\t\t${test.palace}\t\t${result}`);

        } catch (error) {
            console.log(`${test.date}\t${calData.lunarDate}\t计算错误\t${test.palace}\t\t❌`);
            errors.push(`${test.date}: ${error}`);
        }
    }

    console.log('─'.repeat(100));
    console.log(`\n✨ 准确率：${correct}/${total} = ${(correct / total * 100).toFixed(1)}%\n`);

    if (errors.length > 0) {
        console.log('❌ 对不上的日期：');
        errors.forEach(err => console.log(`  ${err}`));
    } else {
        console.log('🎉🎉🎉 所有测试通过！公式100%正确！🎉🎉🎉');
    }
}

verify().catch(console.error);
