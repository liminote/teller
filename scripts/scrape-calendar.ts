/**
 * 爬取2026年完整農曆陽曆對照資料
 * 資料來源: https://calendar.8s8s.net/calendar/2026/2026riqi.php
 * 
 * 執行方式: npx tsx scripts/scrape-calendar.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface DailyCalendarData {
    gregorianDate: string;
    lunarDate: string;
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    solarTerm?: string;
    solarTermTime?: string;
}

async function scrapeCalendar(): Promise<DailyCalendarData[]> {
    const url = 'https://calendar.8s8s.net/calendar/2026/2026riqi.php';

    console.log('正在爬取 2026 年農曆陽曆對照表...');
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const data: DailyCalendarData[] = [];

        // 找到所有包含日期資料的連結
        // 格式: 公歷2026.1.20，農曆乙巳年十二月初二日號，乙巳年，己丑月，甲午日
        $('a').each((_, element) => {
            const text = $(element).text();
            const match = text.match(/公歷(\d{4}\.\d{1,2}\.\d{1,2})，農曆(.+?)年(.+?)日號，(.+?)年，(.+?)月，(.+?)日/);

            if (match) {
                const [_, gregorian, lunar, day, year, month, dayStem] = match;

                // 轉換日期格式 2026.1.20 -> 2026-01-20
                const [y, m, d] = gregorian.split('.');
                const gregorianDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                const lunarDateStr = lunar + day;

                data.push({
                    gregorianDate,
                    lunarDate: lunarDateStr,
                    yearPillar: year,
                    monthPillar: month,
                    dayPillar: dayStem,
                });
            }
        });

        // 排序並去重
        const uniqueData = Array.from(
            new Map(data.map(item => [item.gregorianDate, item])).values()
        ).sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate));

        console.log(`成功爬取 ${uniqueData.length} 天的資料`);

        return uniqueData;

    } catch (error) {
        console.error('爬取失敗:', error);
        throw error;
    }
}

async function main() {
    const data = await scrapeCalendar();

    // 儲存為 JSON
    const outputPath = path.join(process.cwd(), 'src', 'data', 'calendar-2026.json');
    const outputDir = path.dirname(outputPath);

    // 確保目錄存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`資料已儲存至: ${outputPath}`);

    // 顯示範例資料
    console.log('\n範例資料 (2026-01-20):');
    const example = data.find(d => d.gregorianDate === '2026-01-20');
    if (example) {
        console.log(JSON.stringify(example, null, 2));
    }
}

main().catch(console.error);
