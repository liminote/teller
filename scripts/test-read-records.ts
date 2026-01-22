/**
 * 測試讀取 Google Sheets 中的每日記錄
 * 
 * 執行方式：npx tsx scripts/test-read-records.ts
 */

import { readSheet, SHEET_NAMES } from '../src/lib/google-sheets';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 載入環境變數
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testRead() {
    console.log('=== 測試讀取每日記錄 ===\n');

    try {
        const records = await readSheet(SHEET_NAMES.DAILY_RECORD);

        if (records.length === 0) {
            console.log('⚠️  工作表是空的或讀取失敗。');
            return;
        }

        console.log(`✅ 成功讀取到 ${records.length} 列資料（含標題）\n`);

        // 顯示前 5 筆資料
        console.log('📋 前 5 筆記錄範例：');
        const header = records[0];
        for (let i = 1; i < Math.min(records.length, 6); i++) {
            const row = records[i];
            console.log(`[${i}] ${row[0] || '無日期'}: 分數=${row[1] || '?'}, 紫微四化=${row[2] || '無'}`);
        }

        console.log('\n🚀 如果以上資料正確，我們就可以開始實作前端儀表板了！');

    } catch (error) {
        console.error('❌ 讀取失敗。請檢查 .env.local 中的 GOOGLE_API_KEY 是否正確，以及工作表是否已開啟權限。');
        console.error(error);
    }
}

testRead();
