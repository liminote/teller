'use client';

import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { Loader2, TrendingUp, Filter, AlertCircle, Info } from 'lucide-react';
import { getGanzhiColor } from '@/lib/ganzhi-colors';

export default function Dashboard() {
    const [data, setData] = useState<any[]>([]);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [mergedData, setMergedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // 獲取每日記錄
                const recordsRes = await fetch('/api/records');
                const recordsJson = await recordsRes.json();
                if (recordsJson.error) throw new Error(recordsJson.error);

                // 獲取每日基本資料
                const dailyRes = await fetch('/api/daily-data');
                const dailyJson = await dailyRes.json();
                if (dailyJson.error) throw new Error(dailyJson.error);

                setData(Array.isArray(recordsJson) ? recordsJson : recordsJson.data || []);
                setDailyData(Array.isArray(dailyJson) ? dailyJson : dailyJson.data || []);

                // 合併資料：以日期為 key
                const recordsMap = new Map();
                (Array.isArray(recordsJson) ? recordsJson : recordsJson.data || []).forEach((record: any) => {
                    if (record.日期) {
                        recordsMap.set(record.日期, record);
                    }
                });

                const merged = (Array.isArray(dailyJson) ? dailyJson : dailyJson.data || []).map((daily: any) => {
                    const record = recordsMap.get(daily.日期);
                    return {
                        ...daily,
                        ...record,
                        hasRecord: !!record,
                        hasEmotion: record && record.情緒 && Array.isArray(record.情緒) && record.情緒.length > 0
                    };
                });

                setMergedData(merged);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#E5E2DB] space-y-4">
                <Loader2 className="w-10 h-10 text-[#8294A5] animate-spin" />
                <p className="text-[#8294A5] font-bold tracking-widest uppercase text-xs">Syncing Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#E5E2DB] text-center px-4">
                <AlertCircle className="w-16 h-16 text-[#B25050] mb-4" />
                <h2 className="text-2xl font-black mb-2 text-[#4A4A4A]">Sync Failed</h2>
                <p className="text-stone-400 max-w-md">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#E5E2DB] text-center px-4">
                <Info className="w-16 h-16 text-[#8294A5] mb-4" />
                <h2 className="text-2xl font-black mb-2 text-[#4A4A4A]">No Data Yet</h2>
                <p className="text-stone-400 max-w-md mb-8">
                    Start by recording your daily scores in the Logs or Google Sheets to see your energy analysis here.
                </p>
            </div>
        );
    }

    // 格式化分數走勢圖數據 - 使用三個層級
    const trendData = [...data]
        .filter(r => r.今日分數)
        .sort((a, b) => new Date(a.日期).getTime() - new Date(b.日期).getTime())
        .slice(-14)
        .map(r => ({
            date: r.日期.split('-').slice(1).join('/'),
            score: r.今日分數 === '好' ? 2 : r.今日分數 === '普通' ? 1 : 0,
            label: r.今日分數,
            note: r.備註 || ''
        }));

    return (
        <main className="min-h-screen bg-[#E5E2DB] text-[#4A4A4A] pb-32">
            <div className="container max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 gap-10">
                    {/* 運勢分布統計 */}
                    <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm">
                        {(() => {
                            const goodDays = data.filter(r => r.今日分數 === '好').length;
                            const normalDays = data.filter(r => r.今日分數 === '普通').length;
                            const badDays = data.filter(r => r.今日分數 === '不好').length;
                            const totalWithScore = goodDays + normalDays + badDays;

                            return (
                                <div className="mb-8">
                                    <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] mb-1">運勢分布</h2>
                                    <p className="text-xs text-stone-400">總記錄數：{totalWithScore}d</p>
                                </div>
                            );
                        })()}

                        {(() => {
                            const goodDays = data.filter(r => r.今日分數 === '好').length;
                            const normalDays = data.filter(r => r.今日分數 === '普通').length;
                            const badDays = data.filter(r => r.今日分數 === '不好').length;
                            const total = goodDays + normalDays + badDays;

                            if (total === 0) {
                                return (
                                    <div className="text-center text-stone-400 py-8">
                                        尚無運勢記錄
                                    </div>
                                );
                            }

                            const goodPct = ((goodDays / total) * 100).toFixed(1);
                            const normalPct = ((normalDays / total) * 100).toFixed(1);
                            const badPct = ((badDays / total) * 100).toFixed(1);

                            return (
                                <>
                                    {/* 橫向堆疊條形圖 */}
                                    <div className="mb-6">
                                        <div className="h-16 w-full rounded-2xl overflow-hidden flex shadow-inner">
                                            {badDays > 0 && (
                                                <div
                                                    className="bg-[#B88A8A] flex items-center justify-center transition-all hover:opacity-90"
                                                    style={{ width: `${badPct}%` }}
                                                >
                                                    {parseFloat(badPct) > 10 && (
                                                        <span className="text-white font-black text-sm">{badPct}%</span>
                                                    )}
                                                </div>
                                            )}
                                            {normalDays > 0 && (
                                                <div
                                                    className="bg-[#D4C5A9] flex items-center justify-center transition-all hover:opacity-90"
                                                    style={{ width: `${normalPct}%` }}
                                                >
                                                    {parseFloat(normalPct) > 10 && (
                                                        <span className="text-white font-black text-sm">{normalPct}%</span>
                                                    )}
                                                </div>
                                            )}
                                            {goodDays > 0 && (
                                                <div
                                                    className="bg-[#8EA68F] flex items-center justify-center transition-all hover:opacity-90"
                                                    style={{ width: `${goodPct}%` }}
                                                >
                                                    {parseFloat(goodPct) > 10 && (
                                                        <span className="text-white font-black text-sm">{goodPct}%</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 詳細統計 */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 rounded-xl bg-[#B88A8A]/10 border border-[#B88A8A]/20">
                                            <div className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-2">不好</div>
                                            <div className="text-3xl font-black text-[#B88A8A] mb-1">{badDays}</div>
                                            <div className="text-xs text-stone-500 font-medium">{badPct}%</div>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-[#D4C5A9]/10 border border-[#D4C5A9]/20">
                                            <div className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-2">普通</div>
                                            <div className="text-3xl font-black text-[#A89874] mb-1">{normalDays}</div>
                                            <div className="text-xs text-stone-500 font-medium">{normalPct}%</div>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-[#8EA68F]/10 border border-[#8EA68F]/20">
                                            <div className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-2">好</div>
                                            <div className="text-3xl font-black text-[#8EA68F] mb-1">{goodDays}</div>
                                            <div className="text-xs text-stone-500 font-medium">{goodPct}%</div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </section>

                    {/* 命理特徵 × 運勢分析 */}
                    {
                        (() => {
                            // 1. 嚴格過濾：只統計真正有分數（好、普通、不好）的日子
                            const scoreData = mergedData.filter(d =>
                                d.hasRecord && (d.今日分數 === '好' || d.今日分數 === '普通' || d.今日分數 === '不好')
                            );

                            if (scoreData.length === 0) {
                                return (
                                    <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm">
                                        <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] mb-4 text-center">命理特徵分析</h2>
                                        <p className="text-stone-400 text-center py-8">
                                            開始記錄運勢後，這裡會顯示命理特徵與運勢的關聯分析。
                                        </p>
                                    </section>
                                );
                            }

                            // 2. 初始化統計 Map
                            const palaceScoreMap: Record<string, { good: number; normal: number; bad: number; total: number }> = {};
                            const ganzhiScoreMap: Record<string, { good: number; normal: number; bad: number; total: number }> = {};

                            scoreData.forEach(d => {
                                const palace = d.流日命宮地支;
                                const ganzhi = `${d.天干}${d.地支}`;

                                if (palace) {
                                    if (!palaceScoreMap[palace]) palaceScoreMap[palace] = { good: 0, normal: 0, bad: 0, total: 0 };
                                    if (d.今日分數 === '好') palaceScoreMap[palace].good++;
                                    else if (d.今日分數 === '普通') palaceScoreMap[palace].normal++;
                                    else if (d.今日分數 === '不好') palaceScoreMap[palace].bad++;
                                    palaceScoreMap[palace].total++;
                                }

                                if (!ganzhiScoreMap[ganzhi]) ganzhiScoreMap[ganzhi] = { good: 0, normal: 0, bad: 0, total: 0 };
                                if (d.今日分數 === '好') ganzhiScoreMap[ganzhi].good++;
                                else if (d.今日分數 === '普通') ganzhiScoreMap[ganzhi].normal++;
                                else if (d.今日分數 === '不好') ganzhiScoreMap[ganzhi].bad++;
                                ganzhiScoreMap[ganzhi].total++;
                            });

                            // 3. 計算宮位排名
                            // 最好的 4 格：按「好運率」由高到低
                            const bestPalaces = Object.entries(palaceScoreMap)
                                .map(([key, stats]) => ({ key, rate: stats.good / stats.total }))
                                .sort((a, b) => b.rate - a.rate);

                            // 最差的 4 格：按「不好運率」由高到低
                            const worstPalaces = Object.entries(palaceScoreMap)
                                .map(([key, stats]) => ({ key, rate: stats.bad / stats.total }))
                                .sort((a, b) => b.rate - a.rate);

                            const best4 = new Set(bestPalaces.slice(0, 4).map(o => o.key));
                            const worst4 = new Set(worstPalaces.slice(0, 4).map(o => o.key));

                            return (
                                <>
                                    {/* 流日命宮 × 運勢分布 (十二宮位圖) */}
                                    <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm overflow-hidden mb-12">
                                        <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] mb-8 text-center uppercase tracking-[0.2em]">流日命宮 × 運勢分布</h2>

                                        <div className="max-w-4xl mx-auto">
                                            <div className="grid grid-cols-4 gap-3 md:gap-4">
                                                {[
                                                    ['巳', '午', '未', '申'],
                                                    ['辰', 'CENTER', 'CENTER', '酉'],
                                                    ['卯', 'CENTER', 'CENTER', '戌'],
                                                    ['寅', '丑', '子', '亥']
                                                ].map((row, rowIndex) => (
                                                    row.map((cell, colIndex) => {
                                                        if (cell === 'CENTER') {
                                                            if (rowIndex === 1 && colIndex === 1) {
                                                                return (
                                                                    <div key="center" className="col-span-2 row-span-2 flex flex-col items-center justify-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 p-4">
                                                                        <span className="text-lg font-black text-stone-400 chinese-font vertical-text tracking-widest leading-relaxed">
                                                                            地支十二宮圖
                                                                        </span>
                                                                        <div className="mt-4 text-[10px] text-stone-300 font-black uppercase tracking-widest">Lucky Analysis</div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }

                                                        const stats = palaceScoreMap[cell] || { good: 0, normal: 0, bad: 0, total: 0 };
                                                        const goodPct = stats.total > 0 ? ((stats.good / stats.total) * 100) : 0;
                                                        const normalPct = stats.total > 0 ? ((stats.normal / stats.total) * 100) : 0;
                                                        const badPct = stats.total > 0 ? ((stats.bad / stats.total) * 100) : 0;

                                                        // 動態樣式
                                                        let cardStyle = "bg-white border-stone-100";
                                                        if (best4.has(cell)) cardStyle = "bg-[#8EA68F]/5 border-[#8EA68F]/20 shadow-[0_0_15px_rgba(142,166,143,0.1)]";
                                                        else if (worst4.has(cell)) cardStyle = "bg-[#B88A8A]/5 border-[#B88A8A]/20 shadow-[0_0_15px_rgba(184,138,138,0.1)]";

                                                        return (
                                                            <div
                                                                key={cell}
                                                                className={`relative aspect-square md:aspect-[4/3] ${cardStyle} border rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <span className={`text-2xl md:text-3xl font-black chinese-font ${getGanzhiColor(cell)}`}>
                                                                        {cell}
                                                                    </span>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] text-stone-400 font-black px-1.5 py-0.5 bg-white/80 rounded-md border border-stone-100 shadow-sm">
                                                                            {stats.total}d
                                                                        </span>
                                                                        {best4.has(cell) && <span className="text-[8px] font-bold text-[#8EA68F] mt-1">BEST</span>}
                                                                        {worst4.has(cell) && <span className="text-[8px] font-bold text-[#B88A8A] mt-1">WORST</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    {stats.total > 0 ? (
                                                                        <>
                                                                            <div className="flex justify-between text-[9px] font-black">
                                                                                <span className="text-[#B88A8A]">{badPct.toFixed(0)}%({stats.bad}d) 不好</span>
                                                                                <span className="text-[#8EA68F]">好 {goodPct.toFixed(0)}%({stats.good}d)</span>
                                                                            </div>
                                                                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                                                                <div className="bg-[#B88A8A]" style={{ width: `${badPct}%` }}></div>
                                                                                <div className="bg-[#D4C5A9]" style={{ width: `${normalPct}%` }}></div>
                                                                                <div className="bg-[#8EA68F]" style={{ width: `${goodPct}%` }}></div>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="text-[10px] text-stone-200 text-center py-1 font-bold italic tracking-wider">NO RECORDS</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-10 flex justify-center gap-8 text-[11px] font-black text-stone-400 tracking-widest uppercase">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#8EA68F]"></div> 好運</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D4C5A9]"></div> 普通</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#B88A8A]"></div> 不好</div>
                                        </div>
                                    </section>

                                    {/* 天干地支運勢分析 */}
                                    {(() => {
                                        const validGanzhi = Object.entries(ganzhiScoreMap).filter(([_, stats]) => stats.total >= 2);
                                        if (validGanzhi.length === 0) return null;

                                        const bestLuck = [...validGanzhi].sort((a, b) => (b[1].good / b[1].total) - (a[1].good / a[1].total)).slice(0, 10);
                                        const worstLuck = [...validGanzhi].sort((a, b) => (b[1].bad / b[1].total) - (a[1].bad / a[1].total)).slice(0, 10);

                                        return (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm">
                                                    <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] mb-2 uppercase tracking-tighter">🟢 好運八字流日 Top 10</h2>
                                                    <p className="text-xs text-stone-400 mb-8 font-medium">按「好」比例由高至低</p>
                                                    <div className="space-y-4">
                                                        {bestLuck.map(([ganzhi, stats], index) => {
                                                            const goodPct = ((stats.good / stats.total) * 100).toFixed(0);
                                                            const normalPct = ((stats.normal / stats.total) * 100).toFixed(0);
                                                            const badPct = ((stats.bad / stats.total) * 100).toFixed(0);
                                                            return (
                                                                <div key={ganzhi} className="p-5 rounded-2xl bg-gradient-to-br from-[#8EA68F]/5 to-[#8EA68F]/10 border border-[#8EA68F]/20 shadow-sm">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-black text-[#8EA68F] bg-white w-7 h-7 flex items-center justify-center rounded-full border border-[#8EA68F]/20">#{index + 1}</span>
                                                                            <span className="text-2xl font-black chinese-font">
                                                                                <span className={getGanzhiColor(ganzhi[0])}>{ganzhi[0]}</span>
                                                                                <span className={getGanzhiColor(ganzhi[1])}>{ganzhi[1]}</span>
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs text-stone-400 font-bold">({stats.total}d)</span>
                                                                    </div>
                                                                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex mb-3 shadow-inner">
                                                                        <div className="bg-[#B88A8A]" style={{ width: `${badPct}%` }}></div>
                                                                        <div className="bg-[#D4C5A9]" style={{ width: `${normalPct}%` }}></div>
                                                                        <div className="bg-[#8EA68F]" style={{ width: `${goodPct}%` }}></div>
                                                                    </div>
                                                                    <div className="text-xs font-black text-[#8EA68F] uppercase tracking-wider text-right">
                                                                        好運比例：{goodPct}% <span className="text-stone-300 ml-1">({stats.good}/{stats.total}d)</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>

                                                <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm">
                                                    <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] mb-2 uppercase tracking-tighter">🔴 不好運八字流日 Top 10</h2>
                                                    <p className="text-xs text-stone-400 mb-8 font-medium">按「不好」比例由高至低</p>
                                                    <div className="space-y-4">
                                                        {worstLuck.map(([ganzhi, stats], index) => {
                                                            const goodPct = ((stats.good / stats.total) * 100).toFixed(0);
                                                            const normalPct = ((stats.normal / stats.total) * 100).toFixed(0);
                                                            const badPct = ((stats.bad / stats.total) * 100).toFixed(0);
                                                            return (
                                                                <div key={ganzhi} className="p-5 rounded-2xl bg-gradient-to-br from-[#B88A8A]/5 to-[#B88A8A]/10 border border-[#B88A8A]/20 shadow-sm">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-black text-[#B88A8A] bg-white w-7 h-7 flex items-center justify-center rounded-full border border-[#B88A8A]/20">#{index + 1}</span>
                                                                            <span className="text-2xl font-black chinese-font">
                                                                                <span className={getGanzhiColor(ganzhi[0])}>{ganzhi[0]}</span>
                                                                                <span className={getGanzhiColor(ganzhi[1])}>{ganzhi[1]}</span>
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs text-stone-400 font-bold">({stats.total}d)</span>
                                                                    </div>
                                                                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex mb-3 shadow-inner">
                                                                        <div className="bg-[#B88A8A]" style={{ width: `${badPct}%` }}></div>
                                                                        <div className="bg-[#D4C5A9]" style={{ width: `${normalPct}%` }}></div>
                                                                        <div className="bg-[#8EA68F]" style={{ width: `${goodPct}%` }}></div>
                                                                    </div>
                                                                    <div className="text-xs font-black text-[#B88A8A] uppercase tracking-wider text-right">
                                                                        壞運比例：{badPct}% <span className="text-stone-300 ml-1">({stats.bad}/{stats.total}d)</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            </div>
                                        );
                                    })()}

                                    {/* 紫微四化 × 天干運勢分析 */}
                                    {(() => {
                                        const SI_HUA_MAP: Record<string, string> = {
                                            '甲': '廉破武陽', '乙': '機梁紫陰', '丙': '同機昌廉', '丁': '陰同機巨',
                                            '戊': '貪陰右機', '己': '武貪梁曲', '庚': '陽武陰同', '辛': '巨陽曲昌',
                                            '壬': '梁紫左武', '癸': '破巨陰貪'
                                        };

                                        const stemScoreMap: Record<string, { good: number; normal: number; bad: number; total: number }> = {};
                                        scoreData.forEach(d => {
                                            const stem = d.天干;
                                            if (!stem) return;
                                            if (!stemScoreMap[stem]) stemScoreMap[stem] = { good: 0, normal: 0, bad: 0, total: 0 };
                                            if (d.今日分數 === '好') stemScoreMap[stem].good++;
                                            else if (d.今日分數 === '普通') stemScoreMap[stem].normal++;
                                            else if (d.今日分數 === '不好') stemScoreMap[stem].bad++;
                                            stemScoreMap[stem].total++;
                                        });

                                        const stemStats = Object.entries(stemScoreMap)
                                            .map(([stem, stats]) => ({
                                                stem,
                                                sihua: SI_HUA_MAP[stem] || '',
                                                ...stats,
                                                goodRate: (stats.good / stats.total) * 100,
                                                badRate: (stats.bad / stats.total) * 100,
                                                normalRate: (stats.normal / stats.total) * 100
                                            }))
                                            .sort((a, b) => b.goodRate - a.goodRate); // 修正 lint error

                                        const bestStem = [...stemStats].sort((a, b) => b.goodRate - a.goodRate).slice(0, 3);
                                        const worstStem = [...stemStats].sort((a, b) => b.badRate - a.badRate).slice(0, 3);

                                        return (
                                            <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm mt-10">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                                                    <div>
                                                        <h2 className="text-xl font-black tracking-tight text-[#4A4A4A] uppercase tracking-[0.2em]">流日天干 × 紫微四化分析</h2>
                                                        <p className="text-xs text-stone-400 mt-1 font-medium italic">Tracing energy patterns through the 10 Heavenly Stems and their transformations.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {bestStem.map(s => (
                                                            <div key={s.stem} className="px-3 py-1 bg-[#8EA68F]/10 border border-[#8EA68F]/20 rounded-full text-[10px] font-black text-[#8EA68F]">
                                                                BEST: {s.stem}日
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6">
                                                    {stemStats.sort((a, b) => '甲乙丙丁戊己庚辛壬癸'.indexOf(a.stem) - '甲乙丙丁戊己庚辛壬癸'.indexOf(b.stem)).map((s) => (
                                                        <div key={s.stem} className="group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100 hover:shadow-sm">
                                                            <div className="flex items-center gap-6 w-full md:w-56 overflow-hidden">
                                                                <div className={`text-4xl font-black chinese-font ${getGanzhiColor(s.stem)} flex-shrink-0`}>{s.stem}</div>
                                                                <div className="flex flex-col gap-1.5 min-w-0">
                                                                    <div className="text-[9px] font-black text-stone-300 uppercase leading-none tracking-[0.2em]">四化星曜</div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {s.sihua.split('').map((star, i) => {
                                                                            const labels = ['祿', '權', '科', '忌'];
                                                                            const colors = [
                                                                                'text-[#8EA68F] bg-[#8EA68F]/10', // 祿: 綠色
                                                                                'text-[#B88A8A] bg-[#B88A8A]/10', // 權: 酒紅/粉紅
                                                                                'text-[#8294A5] bg-[#8294A5]/10', // 科: 藍色
                                                                                'text-[#B25050] bg-[#B25050]/10'  // 忌: 紅色
                                                                            ];
                                                                            return (
                                                                                <div key={i} className="flex flex-col items-center">
                                                                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-lg ${colors[i]}`}>
                                                                                        {star}
                                                                                    </div>
                                                                                    <span className="text-[8px] font-bold text-stone-300 mt-1">{labels[i]}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex justify-between text-[10px] font-black tracking-tighter text-stone-400">
                                                                    <span className="text-[#B88A8A]">{s.badRate.toFixed(0)}%({s.bad}d) 不好</span>
                                                                    <span className="tracking-widest">TOTAL {s.total}d</span>
                                                                    <span className="text-[#8EA68F]">好 {s.goodRate.toFixed(0)}%({s.good}d)</span>
                                                                </div>
                                                                <div className="h-2.5 w-full bg-stone-100/50 rounded-full overflow-hidden flex shadow-inner group-hover:h-3 transition-all">
                                                                    <div className="bg-[#B88A8A] transition-all" style={{ width: `${s.badRate}%` }}></div>
                                                                    <div className="bg-[#D4C5A9] transition-all" style={{ width: `${s.normalRate}%` }}></div>
                                                                    <div className="bg-[#8EA68F] transition-all" style={{ width: `${s.goodRate}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-10 p-6 bg-stone-50 rounded-2xl border border-stone-100 italic text-stone-400 text-xs leading-relaxed">
                                                    透過觀察發現：您的 <strong>{bestStem[0]?.stem}日</strong> 表現最為出色，對應的四化星曜「{bestStem[0]?.sihua}」可能對您的運勢有正面疊加效果；
                                                    而 <strong>{worstStem[0]?.stem}日</strong> 波動較大，需注意「{worstStem[0]?.sihua}」所帶來的壓力和挑戰。
                                                </div>
                                            </section>
                                        );
                                    })()}
                                </>
                            );
                        })()}
                </div>
            </div>
        </main>
    );
}
