import { readSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const rows = await readSheet(SHEET_NAMES.DAILY_RECORD);

        if (!rows || rows.length <= 1) {
            return NextResponse.json([]);
        }

        const header = rows[0];
        const data = rows.slice(1).map((row: any) => {
            const obj: any = {};
            header.forEach((key: string, index: number) => {
                // 清理日期格式，確保前後端一致
                let value = row[index];
                if (key === '日期' && value) {
                    // 嘗試將各種日期格式統一為 YYYY-MM-DD
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

                // 將情緒欄位從逗號分隔字串轉回陣列
                if (key === '情緒' && value) {
                    value = value.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                }

                obj[key] = value;
            });
            return obj;
        });

        // 依據日期降序排列（最新的在前面）
        data.sort((a, b) => new Date(b.日期).getTime() - new Date(a.日期).getTime());

        return NextResponse.json(data);
    } catch (error) {
        console.error('獲取每日記錄失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        return NextResponse.json({ error: 'Failed to fetch records', details: errorMessage }, { status: 500 });
    }
}
