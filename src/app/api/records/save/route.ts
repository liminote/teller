import { NextResponse } from 'next/server';
import { appendToSheet, updateSheet, readSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 驗證必填欄位
        if (!data.日期 || !data.今日分數) {
            return NextResponse.json(
                { error: '缺少必填欄位：日期和今日分數' },
                { status: 400 }
            );
        }

        // 將資料轉換為試算表格式（與試算表欄位順序一致）
        // 順序：日期, 今日分數, 紫微_四化簡述, 紫微_工作, 紫微_健康, 紫微_財運, 紫微_能量, 八字_體感, 情緒, 備註
        const rowData = [
            data.日期,
            data.今日分數,
            data.紫微_四化簡述 || '',
            data.紫微_工作,
            data.紫微_健康,
            data.紫微_財運,
            data.紫微_能量,
            data.八字_體感 || '',
            Array.isArray(data.情緒) ? data.情緒.join(',') : '', // 將陣列轉為逗號分隔字串
            '', // 備註欄位（保留空白）
        ];

        // 檢查該日期的記錄是否已存在
        const existingData = await readSheet(SHEET_NAMES.DAILY_RECORD);
        const dateColumnIndex = 0; // 日期在第一欄

        // 找到匹配日期的列（跳過標題列，從第2列開始）
        let existingRowIndex = -1;
        for (let i = 1; i < existingData.length; i++) {
            if (existingData[i][dateColumnIndex] === data.日期) {
                existingRowIndex = i + 1; // +1 因為試算表列號從1開始
                break;
            }
        }

        if (existingRowIndex > 0) {
            // 更新已存在的記錄
            const range = `A${existingRowIndex}:J${existingRowIndex}`; // 更新到 J 欄（包含情緒）
            await updateSheet(SHEET_NAMES.DAILY_RECORD, [rowData], range);

            return NextResponse.json({
                success: true,
                message: '記錄已更新',
                action: 'updated'
            });
        } else {
            // 新增記錄
            await appendToSheet(SHEET_NAMES.DAILY_RECORD, [rowData]);

            return NextResponse.json({
                success: true,
                message: '記錄已新增',
                action: 'created'
            });
        }

    } catch (error) {
        console.error('處理回饋資料失敗:', error);

        // 提供更詳細的錯誤訊息
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';

        return NextResponse.json(
            {
                error: '儲存失敗',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
