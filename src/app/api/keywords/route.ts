import { createSheetsClientWithAuth, SHEET_NAMES } from '@/lib/google-sheets';
import { NextResponse } from 'next/server';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function readSheetWithAuth(sheetName: string) {
    try {
        const sheets = createSheetsClientWithAuth();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
        });
        return response.data.values || [];
    } catch (error: any) {
        if (error.response?.status === 400 || error.message?.includes('not found')) {
            console.warn(`工作表 ${sheetName} 不存在，將視為空。`);
            return [];
        }
        throw error;
    }
}

export async function GET() {
    try {
        const rows = await readSheetWithAuth(SHEET_NAMES.KEYWORD_PREFERENCES);
        if (!rows || rows.length <= 1) {
            return NextResponse.json([]);
        }

        const header = rows[0];
        const data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            header.forEach((key: string, index: number) => {
                obj[key] = row[index];
            });
            return obj;
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('獲取標籤偏好失敗:', error);
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { keyword, status, star, mapping } = await request.json();
        const rows = await readSheetWithAuth(SHEET_NAMES.KEYWORD_PREFERENCES);

        // 更新標題列，加入「映射」
        const header = ['標籤', '狀態', '星曜', '更新時間', '映射'];

        let data: any[] = [];
        if (rows && rows.length > 0) {
            const h = rows[0];
            data = rows.slice(1).map((row: any) => {
                const obj: any = {};
                h.forEach((key: string, index: number) => {
                    obj[key] = row[index];
                });
                return obj;
            });
        }

        const existingIndex = data.findIndex((item: any) => item['標籤'] === keyword && item['星曜'] === star);

        const now = new Date().toISOString();
        const updateObj = {
            '標籤': keyword,
            '狀態': status || (existingIndex !== -1 ? data[existingIndex]['狀態'] : 'none'),
            '星曜': star,
            '更新時間': now,
            '映射': mapping !== undefined ? mapping : (existingIndex !== -1 ? data[existingIndex]['映射'] : '')
        };

        if (existingIndex !== -1) {
            data[existingIndex] = { ...data[existingIndex], ...updateObj };
        } else {
            data.push(updateObj);
        }

        const sheets = createSheetsClientWithAuth();
        const values = [header, ...data.map((item: any) => [
            item['標籤'],
            item['狀態'],
            item['星曜'],
            item['更新時間'],
            item['映射'] || ''
        ])];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAMES.KEYWORD_PREFERENCES}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('更新標籤偏好失敗:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
