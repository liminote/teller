
import fs from 'fs';
import path from 'path';

const calendarPath = '/Users/vannyma/Documents/antigravity/01_Personal_OS/Teller/src/data/calendar-2025.json';
const journalPath = '/Users/vannyma/Documents/antigravity/01_Personal_OS/Heptabase/Heptabase-Data-Backup-2026-01-27T17-43-39-326Z/Journal';

// Keywords to look for
const NEGATIVE_KEYWORDS = ['煩', '累', '糾結', '壓力', '卡', '衝突', '誤會', '心累', '急躁', '不舒服', '生氣', '怒', '悶'];
const POSITIVE_KEYWORDS = ['開心', '順', '爽', '棒', '幸運', '感激', '平靜'];

// Target Branches
const TARGET_BRANCHES = ['申', '寅', '亥']; // Monkey, Tiger, Pig

async function analyze() {
    // 1. Load Calendar Data
    const calendarRaw = fs.readFileSync(calendarPath, 'utf8');
    const calendarData = JSON.parse(calendarRaw);

    // Map date to branch
    // Calendar format: { gregorianDate: '2025-01-01', dayPillar: '甲子', ... }
    const dateToBranch = new Map();
    calendarData.forEach((entry: any) => {
        if (entry.gregorianDate && entry.dayPillar) {
            const branch = entry.dayPillar[1]; // Second char is the branch
            dateToBranch.set(entry.gregorianDate, branch);
        }
    });

    // 2. Read Journal Files
    const files = fs.readdirSync(journalPath);
    const stats = {
        '申': { total: 0, bad: 0, keywords: [] as string[], samples: [] as string[] },
        '寅': { total: 0, bad: 0, keywords: [] as string[], samples: [] as string[] },
        '亥': { total: 0, bad: 0, keywords: [] as string[], samples: [] as string[] }
    };

    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const dateStr = file.replace('.md', '');

        // Filter for 2025
        if (!dateStr.startsWith('2025')) continue;

        const branch = dateToBranch.get(dateStr);
        if (TARGET_BRANCHES.includes(branch)) {
            const content = fs.readFileSync(path.join(journalPath, file), 'utf8');
            const targetStats = stats[branch as keyof typeof stats];
            targetStats.total++;

            // Simple keyword matching
            let isBad = false;
            const foundKeywords = new Set<string>();

            NEGATIVE_KEYWORDS.forEach(kw => {
                if (content.includes(kw)) {
                    isBad = true;
                    foundKeywords.add(kw);
                }
            });

            if (isBad) {
                targetStats.bad++;
                targetStats.keywords.push(...Array.from(foundKeywords));
                // Store a snippet (first 100 chars or context)
                const snippetIdx = content.indexOf(Array.from(foundKeywords)[0]);
                const snippet = content.substring(Math.max(0, snippetIdx - 20), Math.min(content.length, snippetIdx + 50)).replace(/\n/g, ' ');
                targetStats.samples.push(`[${dateStr}] ...${snippet}...`);
            }
        }
    }

    // 3. Output Results
    console.log('--- 2025 Journal Analysis for 申(Monkey), 寅(Tiger), 亥(Pig) ---');
    for (const branch of TARGET_BRANCHES) {
        const s = stats[branch as keyof typeof stats];
        const badRate = s.total > 0 ? (s.bad / s.total * 100).toFixed(1) : '0.0';
        console.log(`\n### 地支: ${branch}`);
        console.log(`Total Days logged: ${s.total}`);
        console.log(`Days with Negative Keywords: ${s.bad} (${badRate}%)`);

        // Count top keywords
        const kwCounts = s.keywords.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sortedKw = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        console.log(`Top Keywords: ${sortedKw.map(p => `${p[0]}(${p[1]})`).join(', ')}`);

        console.log(`Samples:`);
        s.samples.slice(0, 3).forEach(sample => console.log(`  - ${sample}`));
    }
}

analyze().catch(console.error);
