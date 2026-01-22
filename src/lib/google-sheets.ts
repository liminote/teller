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
        const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        let auth;

        if (keyJson) {
            try {
                // 處理可能的雙重編碼或額外的引號
                let credentials = JSON.parse(keyJson);
                if (typeof credentials === 'string') {
                    credentials = JSON.parse(credentials);
                }

                auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
            } catch (parseError) {
                console.error('解析 GOOGLE_SERVICE_ACCOUNT_KEY 失敗:', parseError);
                throw new Error(`認證資料格式錯誤: ${parseError instanceof Error ? parseError.message : '未知錯誤'}`);
            }
        } else {
            if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
                throw new Error('找不到 Service Account 憑證');
            }
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
    try {
        const sheets = getSheetsClient();
        const fullRange = range ? `${sheetName}!${range}` : sheetName;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_ID,
            range: fullRange,
        });

        return response.data.values || [];
    } catch (error) {
        console.error(`讀取工作表 ${sheetName} 失敗:`, error);
        throw error;
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
