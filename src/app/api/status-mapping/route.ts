import { readSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const rows = await readSheet(SHEET_NAMES.MAPPING);

        // 假設第一列是標題：[干支, 標誌性狀態, 詳細說明, PM指令, 顏色類別]
        // 顏色類別建議填寫：happy (綠), moody (紅), high-pressure (藍), turbulence (紫)
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
        console.error('獲取狀態對照表失敗:', error);
        return NextResponse.json({ error: 'Failed to fetch mapping' }, { status: 500 });
    }
}
