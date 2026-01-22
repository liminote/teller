/**
 * 生成每日基本資料並寫入 Google Sheets
 * 
 * 執行方式：npx tsx scripts/generate-daily-data.ts
 */

import { generateYearlyBasicData } from '../src/lib/calendar-utils';
import { batchWriteSheet, SHEET_NAMES, clearSheet } from '../src/lib/google-sheets';
import calendar2025 from '../src/data/calendar-2025.json';
import calendar2026 from '../src/data/calendar-2026.json';

// 農曆2025年的流年命宮（用戶提供）
const FLOW_YEAR_2025 = '巳';

async function generateAndUpload() {
    console.log('=== 生成每日基本資料並上傳至 Google Sheets ===\n');

    try {
        // 1. 生成2025年資料
        console.log('📅 生成 2025 年資料...');
        const data2025 = generateYearlyBasicData(2025, FLOW_YEAR_2025);
        console.log(`✅ 已生成 ${data2025.length} 天的資料\n`);

        // 2. 生成2026年資料
        console.log('📅 生成 2026 年資料...');
        const data2026 = generateYearlyBasicData(2026, FLOW_YEAR_2025);
        console.log(`✅ 已生成 ${data2026.length} 天的資料\n`);

        // 3. 合併資料
        const allData = [...data2025, ...data2026];
        console.log(`📊 總計：${allData.length} 天的資料\n`);

        // 4. 轉換為試算表格式（二維陣列）
        const rows = allData.map(d => [
            d.日期,
            d.農曆,
            '', // 農曆月（可選）
            '', // 農曆日（可選）
            d.天干,
            d.地支,
            d.月天干地支,
            d.節氣 || '',
            d.八字流年,
            d.八字流月,
            d.紫微流月,
            d.流日命宮地支,
            d.流日四化,
        ]);

        // 5. 清空現有資料（保留標題列）
        console.log('🗑️  清空現有資料...');
        await clearSheet(SHEET_NAMES.DAILY_DATA);
        console.log('✅ 已清空\n');

        // 6. 批量寫入資料
        console.log('📝 寫入資料到試算表...');
        await batchWriteSheet(SHEET_NAMES.DAILY_DATA, rows, 2);
        console.log('✅ 寫入完成！\n');

        // 7. 顯示範例資料
        console.log('📋 範例資料（2026-01-20）：');
        const today = allData.find(d => d.日期 === '2026-01-20');
        if (today) {
            console.log(JSON.stringify(today, null, 2));
        }

        console.log('\n🎉 完成！請查看試算表：');
        console.log('https://docs.google.com/spreadsheets/d/1KwP8CxfnnJ0O33AVbh9GH4g8Tx8c6SUmWjZM1b03TRA/edit');

    } catch (error) {
        console.error('❌ 發生錯誤：', error);
        throw error;
    }
}

generateAndUpload().catch(console.error);
