/**
 * 深入分析紫微流日命宮計算邏輯 v2
 * 
 * 發現：1/6-1/14期間，每兩天命宮進一個地支
 * 1/6: 子 -> 1/8: 寅 -> 1/10: 辰 -> 1/12: 午 -> 1/14: 申
 */

import { KNOWN_FLOW_PALACE_DATA, getBranchIndex, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendarData2026 from '../src/data/calendar-2026.json';

const BENMING_PALACE = '戌';

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

async function analyzeV2() {
    console.log('=== 紫微流日命宮深度分析 v2 ===\n');

    // 只分析2026年1月的資料（我們有完整資料）
    const jan2026Data = KNOWN_FLOW_PALACE_DATA.filter(d => d.date.startsWith('2026-01'));

    console.log('日期\t\t西元日\t農曆日\t命宮\t與前日差距\t與本命宮距離');
    console.log('─'.repeat(70));

    let previousPalace = '';
    let previousGregorianDay = 0;

    for (const known of jan2026Data) {
        const calendarData = calendarData2026.find(d => d.gregorianDate === known.date);
        if (!calendarData) continue;

        const gregorianDay = parseInt(known.date.split('-')[2]);
        const lunarDay = extractLunarDay(calendarData.lunarDate);

        const currentPalaceIndex = getBranchIndex(known.palace);
        const benmingIndex = getBranchIndex(BENMING_PALACE);

        let gapFromPrevious = '';
        if (previousPalace) {
            const prevIndex = getBranchIndex(previousPalace);
            const gap = (currentPalaceIndex - prevIndex + 12) % 12;
            const dayGap = gregorianDay - previousGregorianDay;
            gapFromPrevious = `${gap}支/${dayGap}天`;
        }

        const distanceFromBenming = (currentPalaceIndex - benmingIndex + 12) % 12;

        console.log(`${known.date}\t${gregorianDay}\t${lunarDay}\t${known.palace}\t${gapFromPrevious}\t\t${distanceFromBenming}`);

        previousPalace = known.palace;
        previousGregorianDay = gregorianDay;
    }

    console.log('\n=== 分析結果 ===\n');
    console.log('觀察到的規律：');
    console.log('• 1/2: 申（十四日）');
    console.log('• 1/6: 子（十八日）-> 從申跳4支到子，間隔4天');
    console.log('• 1/8: 寅（二十日）-> 從子跳2支到寅，間隔2天');
    console.log('• 1/10: 辰（廿二日）-> 從寅跳2支到辰，間隔2天');
    console.log('• 1/12: 午（廿四日）-> 從辰跳2支到午，間隔2天');
    console.log('• 1/14: 申（廿六日）-> 從午跳2支到申，間隔2天');

    // 測試新假設
    console.log('\n新假設測試：');
    console.log('假設：流日命宮可能與「時辰」或「日柱地支」有關');

    for (const known of jan2026Data) {
        const calendarData = calendarData2026.find(d => d.gregorianDate === known.date);
        if (!calendarData) continue;

        const dayBranch = calendarData.dayPillar.charAt(1);
        const lunarDay = extractLunarDay(calendarData.lunarDate);

        // 新假設：每兩個農曆日命宮進一支？
        const hypothesis4 = getBranchIndex(BENMING_PALACE) + Math.floor(lunarDay / 2);
        const hypothesis4Palace = EARTHLY_BRANCHES[hypothesis4 % 12];

        const match = hypothesis4Palace === known.palace ? '✓' : '✗';

        console.log(`${known.date}: 農曆${lunarDay}日, 日支=${dayBranch}, 預測=${hypothesis4Palace}, 實際=${known.palace} ${match}`);
    }
}

analyzeV2().catch(console.error);
