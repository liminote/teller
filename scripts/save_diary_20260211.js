
const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function getAuth() {
    const keyPath = path.join(process.cwd(), 'service-account-key.json');
    if (fs.existsSync(keyPath)) {
        return new google.auth.GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    }
    const keyVar = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (keyVar) {
        return new google.auth.GoogleAuth({ credentials: JSON.parse(keyVar), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    }
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
        return new google.auth.GoogleAuth({
            credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }
    throw new Error("No Service Account credentials found.");
}

async function saveDiary() {
    try {
        const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
        const SHEET_NAME = '每日記錄';
        const targetDate = '2026-02-11';

        // 日記內容 (移除青花菜細節，保留平靜與休息的核心感)
        const diaryContent = `今天沒想到，真的是平靜的一天。
起床後吃了阿腸芋頭粥，尚可。不知道在幹嘛。
晚上處理食物、聽直播（阿苗講林宅血案）、看馬世芳的文章、處理個人 AI admin，總之是休息的一天。`;

        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. 先確認是否有該日期的記錄
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: `${SHEET_NAME}!A:Z`,
        });

        const rows = res.data.values || [];
        const header = rows[0];
        const dateIndex = header.indexOf('日期');
        const baziExpIndex = header.indexOf('八字_體感');
        const scoreIndex = header.indexOf('今日分數');
        const workIndex = header.indexOf('紫微_工作');
        const healthIndex = header.indexOf('紫微_健康');
        const wealthIndex = header.indexOf('紫微_財運');
        const energyIndex = header.indexOf('紫微_能量');

        const existingRowIndex = rows.findIndex(r => r[dateIndex] === targetDate);

        const newRecord = new Array(header.length).fill('');
        newRecord[dateIndex] = targetDate;
        newRecord[scoreIndex] = '普通'; // 平靜休息的一天，給予普通或好（看體感，這裡暫定普通）
        newRecord[baziExpIndex] = diaryContent;
        newRecord[workIndex] = 2;
        newRecord[healthIndex] = 2;
        newRecord[wealthIndex] = 2;
        newRecord[energyIndex] = 2;

        if (existingRowIndex !== -1) {
            // 更新
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEETS_ID,
                range: `${SHEET_NAME}!A${existingRowIndex + 1}`,
                valueInputOption: 'RAW',
                requestBody: { values: [newRecord] }
            });
            console.log(`Updated diary for ${targetDate}`);
        } else {
            // 新增
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEETS_ID,
                range: `${SHEET_NAME}!A:A`,
                valueInputOption: 'RAW',
                requestBody: { values: [newRecord] }
            });
            console.log(`Appended diary for ${targetDate}`);
        }

    } catch (e) {
        console.error(e);
    }
}

saveDiary();
