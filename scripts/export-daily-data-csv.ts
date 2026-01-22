/**
 * 生成每日基本資料並匯出為 CSV
 * 可直接匯入 Google Sheets
 * 
 * 執行方式：npx tsx scripts/export-daily-data-csv.ts
 */

import { generateYearlyBasicData } from '../src/lib/calendar-utils';
import * as fs from 'fs';
import * as path from 'path';

// 農曆2025年的流年命宮（用戶提供）
const FLOW_YEAR_2025 = '巳';

function exportToCSV() {
    console.log('=== 生成每日基本資料CSV ===\n');

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

        // 4. 轉換為CSV格式（移除農曆月和農曆日欄位）
        const headers = [
            '日期',
            '農曆',
            '天干',
            '地支',
            '月天干地支',
            '節氣',
            '八字流年',
            '八字流月',
            '紫微流月',
            '流日命宮地支',
            '流日四化',
        ];

        const csvLines = [
            headers.join('\t'), // 使用 Tab 分隔，方便直接貼到試算表
            ...allData.map(d => [
                d.日期,
                d.農曆,
                d.天干,
                d.地支,
                d.月天干地支,
                d.節氣 || '',
                d.八字流年,
                d.八字流月,
                d.紫微流月,
                d.流日命宮地支,
                d.流日四化,
            ].join('\t'))
        ];

        const csvContent = csvLines.join('\n');

        // 5. 儲存檔案
        const outputPath = path.join(process.cwd(), 'output', 'daily-data-2025-2026.tsv');
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, csvContent, 'utf-8');
        console.log(`✅ CSV 檔案已儲存至：${outputPath}\n`);

        // 6. 顯示範例資料
        console.log('📋 範例資料（2026-01-20）：');
        const today = allData.find(d => d.日期 === '2026-01-20');
        if (today) {
            console.log(JSON.stringify(today, null, 2));
        }

        console.log('\n📝 使用方式：');
        console.log('1. 開啟檔案：output/daily-data-2025-2026.tsv');
        console.log('2. 全選內容（Cmd+A）並複製（Cmd+C）');
        console.log('3. 在試算表「每日基本資料」工作表的 A1 儲存格貼上（Cmd+V）');
        console.log('4. 資料會自動分欄！');

        console.log('\n🎉 完成！');

    } catch (error) {
        console.error('❌ 發生錯誤：', error);
        throw error;
    }
}

exportToCSV();
