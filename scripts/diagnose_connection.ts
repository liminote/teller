import { readSheet, SHEET_NAMES } from '../src/lib/google-sheets';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function diagnose() {
    console.log('🔍 開始診斷 Google Sheets 連線...');
    console.log('------------------------------------');
    console.log('環境變數檢查:');
    console.log('ID:', process.env.GOOGLE_SHEETS_ID ? '✅ 已設定' : '❌ 未設定');
    console.log('API Key:', process.env.GOOGLE_API_KEY ? '✅ 已設定' : '❌ 未設定');
    console.log('Service Account Key Path:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ? '✅ 已設定' : '❌ 未設定');
    console.log('Service Account Key JSON:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ 已項目 (Vercel Mode)' : '❌ 未設定');

    try {
        console.log('\n嘗試讀取「每日基本資料」...');
        const rows = await readSheet(SHEET_NAMES.DAILY_DATA);
        console.log(`✅ 成功取得資料！共 ${rows.length} 列。`);
        if (rows.length > 0) {
            console.log('第一列內容範例:', rows[0]);
        }
    } catch (error: any) {
        console.error('\n❌ 讀取失敗！');
        console.error('錯誤訊息:', error.message);
        if (error.message.includes('403') || error.message.includes('permission')) {
            console.log('💡 建議：請確認你的 Google Sheet 是否已共用給 Service Account 的 Email。');
        } else if (error.message.includes('404')) {
            console.log('💡 建議：請檢查 GOOGLE_SHEETS_ID 是否正確。');
        } else if (error.message.includes('JSON')) {
            console.log('💡 建議：Service Account JSON 格式似乎有誤。');
        }
    }
}

diagnose();
