/**
 * Google Sheets API 整合模組
 * 支援兩種認證模式：
 * 1. API Key - 僅供讀取公開試算表
 * 2. Service Account - 支援讀寫操作
 */

import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 確保在非 Next.js 環境下也能讀到環境變數
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';

// 工作表名稱
export const SHEET_NAMES = {
    BAZI_CHART: '命盤資料_八字',
    PURPLE_CHART: '命盤資料_紫微',
    DAILY_DATA: '每日基本資料',
    DAILY_RECORD: '每日記錄',
    QUESTIONS: '題庫',
    ANSWERS: '答題記錄',
    SETTINGS: '設定',
    MAPPING: '運勢對照',
    KEYWORD_PREFERENCES: '標籤偏好',
} as const;

/**
 * 建立 Google Sheets 客戶端（優先使用 Service Account，次之使用 API Key）
 */
export function getSheetsClient() {
    // 試著建立 Service Account 客戶端
    try {
        const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (keyJson || fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
            return createSheetsClientWithAuth();
        }
    } catch (e) {
        console.warn('無法建立 Service Account 客戶端，嘗試使用 API Key...');
    }

    // 退而求其次使用 API Key
    return google.sheets({
        version: 'v4',
        auth: API_KEY,
    });
}

/**
 * 建立 Google Sheets 客戶端（API Key 模式，僅供讀取）
 */
export function createSheetsClient() {
    return google.sheets({
        version: 'v4',
        auth: API_KEY,
    });
}

/**
 * 建立 Google Sheets 客戶端（Service Account 模式，支援讀寫）
 */
export function createSheetsClientWithAuth() {
    try {
        // 全新方案：Base64 編碼的 JSON（最穩定，無特殊符號干擾）
        const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;

        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        let auth;
        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';

        // 方案 S：Base64 完整憑證（終極穩定的解決方案）
        if (base64Creds) {
            console.log('[Auth] Using Plan S (Base64 Credentials)');
            try {
                const jsonStr = Buffer.from(base64Creds, 'base64').toString('utf-8');
                const credentials = JSON.parse(jsonStr);
                auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            } catch (e) {
                console.error('Base64 解碼失敗:', e);
                throw new Error('GOOGLE_CREDENTIALS_BASE64 解碼或解析失敗');
            }
        }
        // 方案 A：使用分開的環境變數（終極重建版 - 嚴格 64 字元斷行）
        else if (clientEmail && privateKey) {
            console.log('[Auth] Using Plan A (Strict PEM Reconstruction)');
            let core = privateKey.trim().replace(/^['"]|['"]$/g, '');
            if (core.includes(header)) core = core.split(header)[1];
            if (core.includes(footer)) core = core.split(footer)[0];

            // 移除所有空白，拿到純粹的 base64 代碼
            const pureBase64 = core.replace(/\s+/g, '').replace(/\\n/g, '').trim();

            // 重要：強行每 64 字元斷行一次（標準 PEM 規範）
            const lines = pureBase64.match(/.{1,64}/g);
            const formattedBase64 = lines ? lines.join('\n') : pureBase64;

            const cleanKey = `${header}\n${formattedBase64}\n${footer}\n`;

            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: clientEmail.trim().replace(/^['"]|['"]$/g, ''),
                    private_key: cleanKey,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }
        // 方案 B：使用 JSON 塊 (同步套用嚴格斷行)
        else if (keyJson) {
            console.log('[Auth] Using Plan B (JSON Block Reconstruction)');
            try {
                const sanitizedJson = keyJson.trim().replace(/^['"]|['"]$/g, '');
                let credentials = JSON.parse(sanitizedJson);
                if (typeof credentials === 'string') credentials = JSON.parse(credentials);
                if (credentials.private_key) {
                    let core = credentials.private_key;
                    if (core.includes(header)) core = core.split(header)[1];
                    if (core.includes(footer)) core = core.split(footer)[0];
                    const pure = core.replace(/\s+/g, '').replace(/\\n/g, '').trim();
                    const lines = pure.match(/.{1,64}/g);
                    const formatted = lines ? lines.join('\n') : pure;
                    credentials.private_key = `${header}\n${formatted}\n${footer}\n`;
                }
                auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
            } catch (e) {
                throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 解析失敗');
            }
        }
        // 方案 C：本地檔案
        else {
            if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) throw new Error('找不到認證憑證 (Key file missing)');
            auth = new google.auth.GoogleAuth({
                keyFile: SERVICE_ACCOUNT_KEY_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }

        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('建立 Service Account 客戶端失敗:', error);
        throw error;
    }
}

/**
 * 讀取工作表資料
 */
export async function readSheet(sheetName: string, range?: string) {
    // 優先嘗試使用目前配置的客戶端
    try {
        const sheets = getSheetsClient();
        const fullRange = range ? `${sheetName}!${range}` : sheetName;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: fullRange,
        });

        return response.data.values || [];
    } catch (error) {
        console.warn(`使用主要客戶端讀取 ${sheetName} 失敗，嘗試使用 API Key 備援...`);

        // 如果原本就是用 Service Account 失敗，強行切換到 API Key 客戶端再試一次
        try {
            const backupSheets = google.sheets({
                version: 'v4',
                auth: API_KEY,
            });
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const response = await backupSheets.spreadsheets.values.get({
                spreadsheetId: SHEETS_ID,
                range: fullRange,
            });
            return response.data.values || [];
        } catch (fallbackError) {
            console.error(`所有讀取嘗試均失敗 (${sheetName}):`, fallbackError);
            throw error; // 拋出原始錯誤以便診斷
        }
    }
}

/**
 * 附加資料到工作表末尾（使用 Service Account）
 * @param sheetName 工作表名稱
 * @param values 要附加的資料（二維陣列）
 * @returns 寫入的範圍資訊
 */
export async function appendToSheet(sheetName: string, values: any[][]) {
    try {
        const sheets = createSheetsClientWithAuth();

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEETS_ID,
            range: `${sheetName}!A:Z`, // 自動找到最後一列並附加
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        console.log(`成功寫入 ${response.data.updates?.updatedRows} 列資料到 ${sheetName}`);
        return response.data;
    } catch (error) {
        console.error(`附加資料到工作表 ${sheetName} 失敗:`, error);
        throw error;
    }
}

/**
 * 更新工作表特定範圍的資料（使用 Service Account）
 */
export async function updateSheet(
    sheetName: string,
    values: any[][],
    range: string
) {
    try {
        const sheets = createSheetsClientWithAuth();
        const fullRange = `${sheetName}!${range}`;

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: fullRange,
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        console.log(`成功更新 ${response.data.updatedRows} 列資料到 ${sheetName}`);
        return response.data;
    } catch (error) {
        console.error(`更新工作表 ${sheetName} 失敗:`, error);
        throw error;
    }
}

/**
 * 批量寫入工作表資料（使用 Service Account）
 */
export async function batchWriteSheet(
    sheetName: string,
    values: any[][],
    startRow: number = 2
) {
    try {
        const sheets = createSheetsClientWithAuth();
        const range = `${sheetName}!A${startRow}`;

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range,
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        console.log(`成功批量寫入 ${response.data.updatedRows} 列資料到 ${sheetName}`);
        return response.data;
    } catch (error) {
        console.error(`批量寫入工作表 ${sheetName} 失敗:`, error);
        throw error;
    }
}

/**
 * 清空工作表資料（保留標題列）
 */
export async function clearSheet(sheetName: string, startRow: number = 2) {
    try {
        const sheets = createSheetsClientWithAuth();
        const range = `${sheetName}!A${startRow}:Z`;

        const response = await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEETS_ID,
            range,
        });

        console.log(`成功清空工作表 ${sheetName} 從第 ${startRow} 列開始的資料`);
        return response.data;
    } catch (error) {
        console.error(`清空工作表 ${sheetName} 失敗:`, error);
        throw error;
    }
}
