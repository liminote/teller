/**
 * 爬取2025年農曆陽曆對照資料
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
}

async function scrapeCalendar2025(): Promise<DailyCalendarData[]> {
    const url = 'https://calendar.8s8s.net/calendar/2025/2025riqi.php';

    console.log('正在爬取 2025 年農曆陽曆對照表...');
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const data: DailyCalendarData[] = [];

        $('a').each((_, element) => {
            const text = $(element).text();
            const match = text.match(/公歷(\d{4}\.\d{1,2}\.\d{1,2})，農曆(.+?)年(.+?)日號，(.+?)年，(.+?)月，(.+?)日/);

            if (match) {
                const [_, gregorian, lunar, day, year, month, dayStem] = match;

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
    const data = await scrapeCalendar2025();

    const outputPath = path.join(process.cwd(), 'src', 'data', 'calendar-2025.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`資料已儲存至: ${outputPath}`);

    // 顯示範例資料
    console.log('\n範例資料 (2025-09-25):');
    const example = data.find(d => d.gregorianDate === '2025-09-25');
    if (example) {
        console.log(JSON.stringify(example, null, 2));
    }
}

main().catch(console.error);
