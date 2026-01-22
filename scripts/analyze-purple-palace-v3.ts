/**
 * 分析紫微流日命宮計算邏輯 v3
 * 使用連續日期資料進行分析
 */

import { KNOWN_FLOW_PALACE_DATA, getBranchIndex, EARTHLY_BRANCHES } from '../src/lib/purple-palace-data';
import calendarData2026 from '../src/data/calendar-2026.json';

// 本命命宮地支（用戶的命宮在戌）
const BENMING_PALACE = '戌';
const BENMING_INDEX = getBranchIndex(BENMING_PALACE); // 10

async function analyzeV3() {
    console.log('=== 紫微流日命宮計算邏輯分析 v3 ===\n');
    console.log(`本命命宮：${BENMING_PALACE}宮 (索引=${BENMING_INDEX})\n`);

    // 只分析2026年1月的資料
    const jan2026Data = KNOWN_FLOW_PALACE_DATA.filter(d => d.date.startsWith('2026-01'));

    console.log('觀察連續日期的流日命宮變化：\n');
    console.log('日期\t\t命宮\t命宮索引\t距本命宮距離');
    console.log('─'.repeat(60));

    for (const known of jan2026Data) {
        const palaceIndex = getBranchIndex(known.palace);
        const distance = (palaceIndex - BENMING_INDEX + 12) % 12;
        console.log(`${known.date}\t${known.palace}\t${palaceIndex}\t\t${distance}`);
    }

    console.log('\n=== 關鍵發現 ===\n');

    // 檢查是否每天命宮都前進一個地支
    let isSequential = true;
    for (let i = 1; i < jan2026Data.length; i++) {
        const prev = getBranchIndex(jan2026Data[i - 1].palace);
        const curr = getBranchIndex(jan2026Data[i].palace);
        const gap = (curr - prev + 12) % 12;

        if (gap !== 1) {
            isSequential = false;
            break;
        }
    }

    if (isSequential) {
        console.log('✅ 每天流日命宮順時針前進一個地支！');
        console.log('');
        console.log('計算公式：');
        console.log('流日命宮地支索引 = (本命命宮索引 + 距參考日的天數) % 12');
        console.log('');

        // 找出參考點
        // 2026-01-01 是「未」(7)，本命命宮是「戌」(10)
        // 距離 = (7 - 10 + 12) % 12 = 9
        console.log('參考點分析：');
        console.log('2026-01-01: 流日命宮=未(索引7), 本命宮=戌(索引10)');
        console.log('距離 = (7 - 10 + 12) % 12 = 9');
        console.log('');
        console.log('推導：如果流日命宮每天前進1支，那麼：');
        console.log('2026-01-01的命宮 = 本命宮 + 9');
        console.log('');
        console.log('需要找出「9」這個數字的來源...');
        console.log('');

        // 檢查農曆資料
        const jan1Data = calendarData2026.find(d => d.gregorianDate === '2026-01-01');
        if (jan1Data) {
            console.log('2026-01-01 的曆法資料：');
            console.log(`  農曆：${jan1Data.lunarDate}`);
            console.log(`  日柱：${jan1Data.dayPillar}`);
            console.log(`  月柱：${jan1Data.monthPillar}`);
            console.log(`  年柱：${jan1Data.yearPillar}`);

            // 提取農曆日數
            if (jan1Data.lunarDate.includes('十一月十三')) {
                const lunarDay = 13;
                console.log(`  農曆日數：${lunarDay}`);
                console.log('');
                console.log('測試假設：流日命宮 = 本命宮 + (農曆日 - 4)');
                const hypothesis = (BENMING_INDEX + lunarDay - 4 + 12) % 12;
                const hypothesisPalace = EARTHLY_BRANCHES[hypothesis];
                console.log(`  預測命宮：${hypothesisPalace} (索引${hypothesis})`);
                console.log(`  實際命宮：未 (索引7)`);
                console.log(`  ${hypothesisPalace === '未' ? '✅ 吻合！' : '❌ 不吻合'}`);
            }
        }
    } else {
        console.log('❌ 流日命宮不是每天順時針前進一個地支');
    }

    console.log('\n=== 驗證結論 ===\n');
    console.log('如果公式是：流日命宮 = 本命宮 + (農曆日 - 某個固定值)');
    console.log('讓我們用所有資料驗證...\n');

    // 驗證所有日期
    for (const known of jan2026Data) {
        const calData = calendarData2026.find(d => d.gregorianDate === known.date);
        if (!calData) continue;

        const lunarDateStr = calData.lunarDate;
        let lunarDay = 0;

        // 簡單提取（需要改進）
        if (lunarDateStr.includes('十三')) lunarDay = 13;
        else if (lunarDateStr.includes('十四')) lunarDay = 14;
        else if (lunarDateStr.includes('十五')) lunarDay = 15;
        else if (lunarDateStr.includes('十六')) lunarDay = 16;
        else if (lunarDateStr.includes('十七')) lunarDay = 17;
        else if (lunarDateStr.includes('十八')) lunarDay = 18;
        else if (lunarDateStr.includes('十九')) lunarDay = 19;
        else if (lunarDateStr.includes('二十')) lunarDay = 20;
        else if (lunarDateStr.includes('廿一')) lunarDay = 21;
        else if (lunarDateStr.includes('廿二')) lunarDay = 22;
        else if (lunarDateStr.includes('廿三')) lunarDay = 23;
        else if (lunarDateStr.includes('廿四')) lunarDay = 24;
        else if (lunarDateStr.includes('廿五')) lunarDay = 25;
        else if (lunarDateStr.includes('廿六')) lunarDay = 26;
        else if (lunarDateStr.includes('廿七')) lunarDay = 27;

        if (lunarDay > 0) {
            // 測試公式：流日命宮 = 本命宮 + (農曆日 - 4)
            const predicted = (BENMING_INDEX + lunarDay - 4 + 12) % 12;
            const predictedPalace = EARTHLY_BRANCHES[predicted];
            const match = predictedPalace === known.palace ? '✅' : '❌';

            console.log(`${known.date}: 農曆${lunarDay}日, 預測=${predictedPalace}, 實際=${known.palace} ${match}`);
        }
    }
}

analyzeV3().catch(console.error);
