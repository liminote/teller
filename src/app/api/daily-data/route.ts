import { readSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const rows = await readSheet(SHEET_NAMES.DAILY_DATA);

        if (!rows || rows.length <= 1) {
            return NextResponse.json([]);
        }

        const header = rows[0];
        const data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            header.forEach((key: string, index: number) => {
                let value = row[index];

                // 清理日期格式
                if (key === '日期' && value) {
                    try {
                        const d = new Date(value);
                        if (!isNaN(d.getTime())) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            value = `${y}-${m}-${day}`;
                        }
                    } catch (e) { }
                }

                obj[key] = value;
            });
            return obj;
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('獲取每日基本資料失敗:', error);
        return NextResponse.json({ error: 'Failed to fetch daily data' }, { status: 500 });
    }
}
