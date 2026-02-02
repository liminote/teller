
import fs from 'fs';
import path from 'path';

// Paths
const calendarPath2025 = '/Users/vannyma/antigravity/01_Personal_OS/Teller/src/data/calendar-2025.json';
const calendarPath2026 = '/Users/vannyma/antigravity/01_Personal_OS/Teller/src/data/calendar-2026.json';
const journalPath = '/Users/vannyma/antigravity/01_Personal_OS/Heptabase/Heptabase-Data-Backup-2026-01-27T17-43-39-326Z/Journal';
const outputPath = '/Users/vannyma/antigravity/01_Personal_OS/Teller/output/ganzhi_report.md';

// Keywords
const NEGATIVE_KEYWORDS = ['煩', '累', '糾結', '壓力', '卡', '衝突', '誤會', '心累', '急躁', '不舒服', '生氣', '怒', '悶', '沮喪', '焦慮', '擔心', '痛', '病', '糟'];
const POSITIVE_KEYWORDS = ['開心', '順', '爽', '棒', '幸運', '感激', '平靜', '興奮', '期待', '滿足', '放鬆', '成', '喜', '樂'];

// GanZhi Helpers
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCH_NAMES: Record<string, string> = {
    '子': 'Rat (鼠)', '丑': 'Ox (牛)', '寅': 'Tiger (虎)', '卯': 'Rabbit (兔)',
    '辰': 'Dragon (龍)', '巳': 'Snake (蛇)', '午': 'Horse (馬)', '未': 'Goat (羊)',
    '申': 'Monkey (猴)', '酉': 'Rooster (雞)', '戌': 'Dog (狗)', '亥': 'Pig (豬)'
};

interface DayStats {
    total: number;
    positiveCount: number;
    negativeCount: number;
    keywords: Record<string, number>;
}

async function generateReport() {
    // 1. Load Calendar Data
    let calendarData: any[] = [];
    if (fs.existsSync(calendarPath2025)) {
        calendarData = calendarData.concat(JSON.parse(fs.readFileSync(calendarPath2025, 'utf8')));
    }
    if (fs.existsSync(calendarPath2026)) {
        calendarData = calendarData.concat(JSON.parse(fs.readFileSync(calendarPath2026, 'utf8')));
    }

    const dateToPillar = new Map<string, string>();
    const validDates = new Set<string>();
    
    calendarData.forEach((entry: any) => {
        if (entry.gregorianDate && entry.dayPillar) {
            dateToPillar.set(entry.gregorianDate, entry.dayPillar);
            validDates.add(entry.gregorianDate);
        }
    });

    // 2. Initialize Stats
    const branchStats: Record<string, DayStats> = {};
    const stemStats: Record<string, DayStats> = {};
    const pillarStats: Record<string, DayStats> = {};
    
    BRANCHES.forEach(b => branchStats[b] = { total: 0, positiveCount: 0, negativeCount: 0, keywords: {} });
    STEMS.forEach(s => stemStats[s] = { total: 0, positiveCount: 0, negativeCount: 0, keywords: {} });

    // 3. Scan Journal
    if (!fs.existsSync(journalPath)) {
        console.error(`Journal path not found: ${journalPath}`);
        return;
    }

    const files = fs.readdirSync(journalPath);
    let totalJournalsAnalyzed = 0;

    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const dateStr = file.replace('.md', '');
        
        // Only process if we have calendar data for this date
        if (!dateToPillar.has(dateStr)) continue;

        const dayPillar = dateToPillar.get(dateStr)!;
        const stem = dayPillar[0];
        const branch = dayPillar[1];

        // Read Content
        const content = fs.readFileSync(path.join(journalPath, file), 'utf8');
        
        // Count keywords
        let dailyPos = 0;
        let dailyNeg = 0;
        const dailyKeywords: string[] = [];

        POSITIVE_KEYWORDS.forEach(kw => {
            if (content.includes(kw)) {
                dailyPos++;
                dailyKeywords.push(kw);
            }
        });
        NEGATIVE_KEYWORDS.forEach(kw => {
            if (content.includes(kw)) {
                dailyNeg++;
                dailyKeywords.push(kw);
            }
        });

        // Update Stats Helper
        const updateStats = (statsObj: DayStats) => {
            statsObj.total++;
            statsObj.positiveCount += dailyPos;
            statsObj.negativeCount += dailyNeg;
            dailyKeywords.forEach(kw => {
                statsObj.keywords[kw] = (statsObj.keywords[kw] || 0) + 1;
            });
        };

        // Initialize pillar stats if needed
        if (!pillarStats[dayPillar]) {
             pillarStats[dayPillar] = { total: 0, positiveCount: 0, negativeCount: 0, keywords: {} };
        }

        updateStats(branchStats[branch]);
        updateStats(stemStats[stem]);
        updateStats(pillarStats[dayPillar]);

        totalJournalsAnalyzed++;
    }

    // 4. Generate Markdown
    let md = `# 天干地支與流日八字綜合報告 (Comprehensive GanZhi Report)\n\n`;
    md += `**Analysis Date:** ${new Date().toISOString().split('T')[0]}\n`;
    md += `**Total Journal Entries Analyzed:** ${totalJournalsAnalyzed}\n\n`;

    md += `## 1. 地支分析 (Earthly Branches Analysis)\n`;
    md += `Here we analyze how your days went based on the Earthly Branch of the day (e.g., Rat, Ox, Tiger...).\n\n`;
    
    md += `| Branch | Name | Days Logged | Positivity Score | Top Keywords |\n`;
    md += `|---|---|---|---|---|\n`;

    BRANCHES.forEach(branch => {
        const s = branchStats[branch];
        if (s.total === 0) return;
        
        // Simple "Positivity Score": (Pos - Neg) / Total. Or just show raw counts.
        // Let's do a ratio: Pos / (Pos + Neg)
        const totalKeywords = s.positiveCount + s.negativeCount;
        const ratio = totalKeywords > 0 ? (s.positiveCount / totalKeywords * 100).toFixed(0) + '%' : 'N/A';
        const netScore = (s.positiveCount - s.negativeCount) / s.total; // Net per day
        
        const topKw = Object.entries(s.keywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(p => `${p[0]}(${p[1]})`)
            .join(', ');

        md += `| **${branch}** | ${BRANCH_NAMES[branch]} | ${s.total} | ${ratio} Pos | ${topKw} |\n`;
    });

    md += `\n### Detailed Branch Insights\n`;
    BRANCHES.forEach(branch => {
        const s = branchStats[branch];
        if (s.total === 0) return;
        const totalKeywords = s.positiveCount + s.negativeCount;
        const posRatio = totalKeywords > 0 ? s.positiveCount / totalKeywords : 0;
        
        let sentiment = "Neutral";
        if (posRatio > 0.6) sentiment = "Mostly Positive";
        if (posRatio < 0.4 && totalKeywords > 0) sentiment = "Mostly Negative";

        md += `#### ${branch} (${BRANCH_NAMES[branch]})\n`;
        md += `- **Sentiment**: ${sentiment} (Pos: ${s.positiveCount}, Neg: ${s.negativeCount})\n`;
        md += `- **Keywords**: ${Object.entries(s.keywords).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>`${x[0]}`).join(', ')}\n`;
        md += `\n`;
    });

    md += `## 2. 天干分析 (Heavenly Stems Analysis)\n`;
    md += `Analysis based on the Heavenly Stem of the day.\n\n`;
    md += `| Stem | Days Logged | Positivity | Top Keywords |\n`;
    md += `|---|---|---|---|\n`;
    
    STEMS.forEach(stem => {
        const s = stemStats[stem];
        if (s.total === 0) return;
        const totalKeywords = s.positiveCount + s.negativeCount;
        const ratio = totalKeywords > 0 ? (s.positiveCount / totalKeywords * 100).toFixed(0) + '%' : 'N/A';
        const topKw = Object.entries(s.keywords).sort((a,b)=>b[1]-a[1]).slice(0,3).map(p=>p[0]).join(', ');
        md += `| **${stem}** | ${s.total} | ${ratio} | ${topKw} |\n`;
    });

    md += `\n## 3. Notable Day Pillars (流日八字)\n`;
    md += `Day pillars with significant activity or strong sentiment (min 2 entries).\n\n`;
    
    const sortedPillars = Object.entries(pillarStats)
        .filter(([_, s]) => s.total >= 1)
        .sort((a, b) => {
             // Sort by total activity (keywords found) per day average? Or just total keywords?
             // Let's sort by "Intensity" = (Pos + Neg) / Total Days
             const intA = (a[1].positiveCount + a[1].negativeCount) / a[1].total;
             const intB = (b[1].positiveCount + b[1].negativeCount) / b[1].total;
             return intB - intA;
        })
        .slice(0, 10);

    sortedPillars.forEach(([pillar, s]) => {
        const totalKw = s.positiveCount + s.negativeCount;
        const sentiment = s.positiveCount > s.negativeCount ? "Positive" : (s.negativeCount > s.positiveCount ? "Negative" : "Mixed");
        md += `### ${pillar}\n`;
        md += `- **Entries**: ${s.total}\n`;
        md += `- **Vibe**: ${sentiment} (Pos: ${s.positiveCount}, Neg: ${s.negativeCount})\n`;
        md += `- **Key themes**: ${Object.entries(s.keywords).sort((a,b)=>b[1]-a[1]).slice(0, 5).map(x=>x[0]).join(', ')}\n\n`;
    });

    // Write to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    fs.writeFileSync(outputPath, md);
    console.log(`Report generated at: ${outputPath}`);
}

generateReport().catch(console.error);
