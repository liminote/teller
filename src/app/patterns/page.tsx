'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Sparkles, Filter, ChevronRight, History, Calendar, Layout, Search, Star, Target, X, Link as LinkIcon, Edit2, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGanzhiColor } from '@/lib/ganzhi-colors';

// 星曜定義
const MAIN_STARS = [
    '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
    '天府', '太陰', '貪狼', '巨門', '天相', '天梁',
    '七殺', '破軍', '文昌', '文曲', '左輔', '右弼'
];

const SI_HUA_LABELS = ['祿', '權', '科', '忌'] as const;
type SiHuaType = (typeof SI_HUA_LABELS)[number];

const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '朋友', '官祿', '田宅', '福德', '父母'];

interface PatternMatch {
    date: string;
    score: string;
    text: string;
    star: string;
    sihua: SiHuaType | 'None';
    palace: string | 'Unknown';
}

export default function PatternLab() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI 狀態
    const [selectedStar, setSelectedStar] = useState<string | null>(null);
    const [selectedSiHua, setSelectedSiHua] = useState<SiHuaType | 'All'>('All');
    const [selectedPalace, setSelectedPalace] = useState<string | 'All'>('All');
    const [keywordPrefs, setKeywordPrefs] = useState<any[]>([]);
    const [updatingKeyword, setUpdatingKeyword] = useState<string | null>(null);

    // 對話框狀態
    const [mappingTarget, setMappingTarget] = useState<{ original: string; current: string } | null>(null);
    const [trimmingTarget, setTrimmingTarget] = useState<{ original: string; current: string } | null>(null);

    const fetchPrefs = async () => {
        try {
            const res = await fetch('/api/keywords');
            const json = await res.json();
            if (!json.error) setKeywordPrefs(json);
        } catch (e) { }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/records');
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                setData(Array.isArray(json) ? json : json.data || []);
                await fetchPrefs();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handlePreference = async (keyword: string, star: string, updates: { status?: string; mapping?: string }) => {
        setUpdatingKeyword(keyword);
        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, star, ...updates })
            });
            const result = await res.json();
            if (result.error) {
                alert(`更新失敗: ${result.error}`);
            } else {
                await fetchPrefs();
            }
        } catch (e) {
            alert('網路連線失敗');
        } finally {
            setUpdatingKeyword(null);
            setMappingTarget(null);
            setTrimmingTarget(null);
        }
    };

    // 核心解析邏輯
    const allMatches = useMemo(() => {
        const matches: PatternMatch[] = [];

        data.forEach(record => {
            const ziweiText = record['紫微_四化簡述'] || '';
            const baziText = record['八字_體感'] || '';
            const fullText = `${ziweiText} ${baziText}`;
            const date = record['日期'];
            const score = record['今日分數'];

            const sentences = fullText.split(/[\n。]|[?|!|；]/).filter(s => s.trim());

            sentences.forEach(sentence => {
                const starPositions: { star: string; index: number }[] = [];
                MAIN_STARS.forEach(star => {
                    let pos = sentence.indexOf(star);
                    while (pos !== -1) {
                        starPositions.push({ star, index: pos });
                        pos = sentence.indexOf(star, pos + 1);
                    }
                });

                starPositions.sort((a, b) => a.index - b.index);

                starPositions.forEach(({ star, index }) => {
                    const textBefore = sentence.substring(0, index);
                    let matchedPalace: string | 'Unknown' = 'Unknown';
                    const tags = [...textBefore.matchAll(/@([\u4e00-\u9fa5]{2})|日([\u4e00-\u9fa5]{1,2})/g)];
                    if (tags.length > 0) {
                        const lastTag = tags[tags.length - 1];
                        const pName = lastTag[1] || lastTag[2];
                        matchedPalace = PALACES.find(fullP => fullP.startsWith(pName)) || pName;
                    }

                    const textAfter = sentence.substring(index + star.length, index + star.length + 5);
                    let matchedSiHua: SiHuaType | 'None' = 'None';
                    for (const sh of SI_HUA_LABELS) {
                        if (textAfter.includes(sh)) {
                            matchedSiHua = sh;
                            break;
                        }
                    }

                    matches.push({
                        date,
                        score,
                        text: sentence.trim(),
                        star,
                        sihua: matchedSiHua,
                        palace: matchedPalace
                    });
                });
            });
        });

        return matches;
    }, [data]);

    // 過濾後的匹配項
    const filteredMatches = useMemo(() => {
        return allMatches.filter(m => {
            const starMatch = !selectedStar || m.star === selectedStar;
            const sihuaMatch = selectedSiHua === 'All' || m.sihua === selectedSiHua;
            const palaceMatch = selectedPalace === 'All' || m.palace === selectedPalace;
            return starMatch && sihuaMatch && palaceMatch;
        });
    }, [allMatches, selectedStar, selectedSiHua, selectedPalace]);

    // 關鍵字分析與統計 (加入映射邏輯)
    const stats = useMemo(() => {
        if (!selectedStar) return null;
        const starMatches = allMatches.filter(m => m.star === selectedStar);

        const currentPrefs = keywordPrefs.filter(p => p['星曜'] === selectedStar);
        const invalidSet = new Set(currentPrefs.filter(p => p['狀態'] === 'invalid').map(p => p['標籤']));
        const validSet = new Set(currentPrefs.filter(p => p['狀態'] === 'valid').map(p => p['標籤']));

        // 建立映射映射表: 原詞 -> 標準詞
        const mappingTable: Record<string, string> = {};
        currentPrefs.forEach(p => {
            if (p['映射'] && p['映射'].trim()) {
                mappingTable[p['標籤']] = p['映射'].trim();
            }
        });

        const keywords: Record<string, number> = {};
        starMatches.forEach(m => {
            let clean = m.text
                .replace(/日[\u4e00-\u9fa5]{1,2}/g, '')
                .replace(/@[\u4e00-\u9fa5]{2}/g, '')
                .replace(new RegExp(`${selectedStar}[祿權科忌|化[祿權科忌]]?`, 'g'), '')
                .replace(/[，|,|。|/|(|)|（|）|：|；|！|？|XD|xd]/g, ' ')
                .trim();

            const chunks = clean.split(/\s+/).filter(word => {
                return word.length >= 2 && word.length <= 8 &&
                    !['真的', '感覺', '覺得', '好像', '一個', '可以', '今天', '特別'].includes(word);
            });

            chunks.forEach(c => {
                const finalWord = mappingTable[c] || c; // 使用映射後的名稱
                if (!invalidSet.has(c)) {
                    keywords[finalWord] = (keywords[finalWord] || 0) + 1;
                }
            });
        });

        const sortedKeywords = Object.entries(keywords)
            .map(([word, count]) => ({
                word,
                count,
                isValid: validSet.has(word)
            }))
            .sort((a, b) => {
                if (a.isValid && !b.isValid) return -1;
                if (!a.isValid && b.isValid) return 1;
                return b.count - a.count;
            })
            .slice(0, 40);

        return {
            total: starMatches.length,
            sortedKeywords,
            sihuaDist: SI_HUA_LABELS.map(sh => ({
                label: sh,
                count: starMatches.filter(m => m.sihua === sh).length
            }))
        };
    }, [allMatches, selectedStar, keywordPrefs]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#E5E2DB]">
            <Loader2 className="w-10 h-10 text-[#8294A5] animate-spin mb-4" />
            <p className="text-[#8294A5] font-black tracking-widest text-xs uppercase">Deciphering Patterns...</p>
        </div>
    );

    return (
        <main className="min-h-screen bg-[#E5E2DB] text-[#4A4A4A] pb-32 selection:bg-[#8EA68F]/20">
            <div className="container max-w-6xl mx-auto px-6 py-20">

                {/* Header */}
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/50 shadow-sm mb-2">
                        <Sparkles className="w-4 h-4 text-[#A89874]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8294A5]">Astrological Pattern Lab</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-[#4A4A4A]">星曜規律分析</h1>
                </header>

                {/* Star Selection Matrix */}
                <section className="mb-12">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {MAIN_STARS.map(star => {
                            const count = allMatches.filter(m => m.star === star).length;
                            const isActive = selectedStar === star;
                            return (
                                <button
                                    key={star}
                                    onClick={() => {
                                        setSelectedStar(isActive ? null : star);
                                        setSelectedSiHua('All');
                                        setSelectedPalace('All');
                                    }}
                                    className={`p-5 rounded-2xl border-2 transition-all duration-300 ${isActive
                                            ? 'bg-white border-[#8EA68F] shadow-lg scale-105'
                                            : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className={`text-xl font-black chinese-font mb-1 ${isActive ? 'text-[#4A4A4A]' : 'text-[#8294A5]'}`}>
                                        {star}
                                    </div>
                                    <div className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">{count} Records</div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <AnimatePresence mode="wait">
                    {selectedStar ? (
                        <motion.div
                            key={selectedStar}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-10"
                        >
                            {/* Keywords Tag Cloud */}
                            <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <Target className="w-5 h-5 text-[#8EA68F]" />
                                    <h2 className="text-xl font-black">星曜體感標籤</h2>
                                    <span className="text-xs text-stone-300 font-medium">點擊剪刀可剪裁文字，迴紋針可合併重複項</span>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    {stats?.sortedKeywords.map(({ word, count, isValid }) => (
                                        <div
                                            key={word}
                                            className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-3 group ${isValid
                                                    ? 'bg-[#8EA68F]/10 border-[#8EA68F]/30 ring-2 ring-[#8EA68F]/5'
                                                    : 'bg-stone-50 border-stone-100 hover:bg-white'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`chinese-font font-black leading-none ${isValid ? 'text-[#8EA68F]' : 'text-stone-600'}`}>
                                                    {word}
                                                </span>
                                                <span className="text-[9px] font-bold text-stone-300 mt-1">{count} 回應</span>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                {/* 剪裁按鈕 */}
                                                <button
                                                    onClick={() => setTrimmingTarget({ original: word, current: word })}
                                                    title="剪裁/縮減標籤（僅限刪除文字）"
                                                    className="p-1 rounded-full text-stone-300 hover:text-[#8294A5] hover:bg-stone-50 transition-colors"
                                                >
                                                    <Scissors size={14} />
                                                </button>
                                                {/* 合併/映射按鈕 */}
                                                <button
                                                    onClick={() => setMappingTarget({ original: word, current: '' })}
                                                    title="合併/重命名標籤"
                                                    className="p-1 rounded-full text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                                                >
                                                    <LinkIcon size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handlePreference(word, selectedStar!, { status: isValid ? 'none' : 'valid' })}
                                                    title={isValid ? "取消標記" : "標記為有效"}
                                                    className={`p-1 rounded-full transition-colors ${isValid ? 'text-[#8EA68F]' : 'text-stone-300 hover:text-[#8EA68F]'}`}
                                                >
                                                    <Star size={14} fill={isValid ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={() => handlePreference(word, selectedStar!, { status: 'invalid' })}
                                                    title="標記為無效"
                                                    className="p-1 rounded-full text-stone-300 hover:text-[#B25050] hover:bg-stone-50 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 剪裁 Modal */}
                            <AnimatePresence>
                                {trimmingTarget && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                                            className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl mx-6"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Scissors className="w-5 h-5 text-[#8294A5]" />
                                                <h3 className="text-xl font-black">剪裁標籤文字</h3>
                                            </div>
                                            <p className="text-stone-400 text-sm mb-8 chinese-font">
                                                修正自動斷句錯誤。請直接刪除多餘的字，**注意：不可增加新文字**。
                                            </p>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-1">原始文字：{trimmingTarget.original}</label>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={trimmingTarget.current}
                                                        onChange={(e) => setTrimmingTarget({ ...trimmingTarget, current: e.target.value })}
                                                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8294A5]/20 focus:bg-white transition-all chinese-font font-bold text-lg"
                                                    />
                                                    {trimmingTarget.current.split('').some(char => !trimmingTarget.original.includes(char)) && (
                                                        <p className="text-[#B25050] text-[10px] font-black mt-2 uppercase tracking-widest">
                                                            錯誤：檢測到新增文字，請僅進行刪除或縮減。
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    <button onClick={() => setTrimmingTarget(null)} className="flex-1 py-4 bg-stone-50 text-stone-400 rounded-2xl font-black">取消</button>
                                                    <button
                                                        onClick={() => handlePreference(trimmingTarget.original, selectedStar!, { mapping: trimmingTarget.current })}
                                                        disabled={
                                                            !trimmingTarget.current.trim() ||
                                                            trimmingTarget.current === trimmingTarget.original ||
                                                            trimmingTarget.current.split('').some(char => !trimmingTarget.original.includes(char))
                                                        }
                                                        className="flex-1 py-4 bg-[#8294A5] text-white rounded-2xl font-black hover:shadow-lg disabled:opacity-50 transition-all"
                                                    >確認剪裁</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 合併 Modal */}
                            <AnimatePresence>
                                {mappingTarget && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                                            className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl mx-6"
                                        >
                                            <h3 className="text-xl font-black mb-2">標籤歸一化</h3>
                                            <p className="text-stone-400 text-sm mb-8 chinese-font">將「{mappingTarget.original}」對應到一個更通用的標準詞。</p>

                                            <div className="space-y-6">
                                                <div className="space-y-2 relative">
                                                    <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-1">映射後的標準詞</label>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={mappingTarget.current}
                                                        onChange={(e) => setMappingTarget({ ...mappingTarget, current: e.target.value })}
                                                        placeholder="例如：無感"
                                                        className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8EA68F]/20 focus:bg-white transition-all chinese-font font-bold"
                                                    />

                                                    {mappingTarget.current.trim() && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-[1001] overflow-hidden max-h-40 overflow-y-auto">
                                                            {Array.from(new Set(keywordPrefs.map(p => p['映射']).filter(m => m && m.trim())))
                                                                .filter(m => m.includes(mappingTarget.current) && m !== mappingTarget.current)
                                                                .map(m => (
                                                                    <button key={m} onClick={() => setMappingTarget({ ...mappingTarget, current: m })} className="w-full px-5 py-3 text-left hover:bg-stone-50 text-sm font-bold text-stone-600 chinese-font transition-colors border-b border-stone-50 last:border-0">{m}</button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {!mappingTarget.current.trim() && (
                                                    <div className="space-y-3">
                                                        <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-1">常用標籤</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(keywordPrefs.reduce((acc: any, curr: any) => {
                                                                const m = curr['映射'];
                                                                if (m && m.trim()) acc[m] = (acc[m] || 0) + 1;
                                                                return acc;
                                                            }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8).map(([m]) => (
                                                                <button key={m} onClick={() => setMappingTarget({ ...mappingTarget, current: m })} className="px-3 py-1.5 bg-stone-50 rounded-lg text-xs font-bold text-stone-500 hover:bg-[#8EA68F]/10 hover:text-[#8EA68F] transition-all">{m}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    <button onClick={() => setMappingTarget(null)} className="flex-1 py-4 bg-stone-50 text-stone-400 rounded-2xl font-black">取消</button>
                                                    <button onClick={() => handlePreference(mappingTarget.original, selectedStar!, { mapping: mappingTarget.current })} disabled={!mappingTarget.current.trim()} className="flex-1 py-4 bg-[#8EA68F] text-white rounded-2xl font-black hover:shadow-lg disabled:opacity-50 transition-all">確認合併</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Filters & History Section (保持原樣) */}
                            <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                                <div className="space-y-8">
                                    {/* ... (同前) */}
                                    <div className="space-y-3">
                                        <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest">能量狀態 (Si Hua)</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setSelectedSiHua('All')} className={`px-4 py-2 rounded-xl text-xs font-black ${selectedSiHua === 'All' ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-50 text-stone-400'}`}>全部</button>
                                            {stats?.sihuaDist.map(sh => (
                                                <button key={sh.label} onClick={() => setSelectedSiHua(selectedSiHua === sh.label ? 'All' : sh.label)} className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 ${selectedSiHua === sh.label ? 'bg-white border-stone-800 text-stone-800' : 'bg-white border-stone-100 text-stone-300'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${sh.label === '祿' ? 'bg-[#8EA68F]' : sh.label === '權' ? 'bg-[#B88A8A]' : sh.label === '科' ? 'bg-[#8294A5]' : 'bg-[#B25050]'}`} />
                                                    {selectedStar}{sh.label} ({sh.count})
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest">宮位投影 (Palace)</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setSelectedPalace('All')} className={`px-4 py-2 rounded-xl text-xs font-black ${selectedPalace === 'All' ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-50 text-stone-400'}`}>全部</button>
                                            {PALACES.map(p => {
                                                const count = allMatches.filter(m => m.star === selectedStar && m.palace === p).length;
                                                if (count === 0) return null;
                                                return (
                                                    <button key={p} onClick={() => setSelectedPalace(selectedPalace === p ? 'All' : p)} className={`px-4 py-2 rounded-xl text-xs font-black border ${selectedPalace === p ? 'bg-white border-stone-800 text-stone-800 shadow-sm' : 'bg-white border-stone-100 text-stone-300'}`}>
                                                        {p} ({count})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-50">
                                        {filteredMatches.length > 0 ? (
                                            filteredMatches.map((m, idx) => (
                                                <motion.div key={`${m.date}-${idx}`} className="p-6 rounded-3xl bg-stone-50/50 border border-stone-100 hover:bg-white hover:border-[#8EA68F]/30 hover:shadow-sm transition-all duration-500">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-xs font-black text-stone-300">{m.date.replace(/-/g, '/')}</span>
                                                        <div className="flex gap-2">
                                                            <span className="px-2 py-0.5 rounded-lg bg-white border border-stone-100 text-[10px] font-black text-[#8EA68F]">@{m.palace}</span>
                                                            {m.sihua !== 'None' && <span className="px-2 py-0.5 rounded-lg bg-white border border-stone-100 text-[10px] font-black text-stone-500">{m.star}{m.sihua}</span>}
                                                        </div>
                                                    </div>
                                                    <p className="chinese-font text-stone-600 leading-relaxed text-sm">{m.text}</p>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 py-20 text-center text-stone-300 text-xs font-black bg-stone-50/30 rounded-3xl border-2 border-dashed border-stone-100">NO DIALOGUE MATCHES</div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    ) : (
                        <div className="py-40 text-center">
                            <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-6">
                                <Star className="w-8 h-8 text-[#D4C5A9]" />
                            </div>
                            <h2 className="text-stone-300 font-black uppercase tracking-[0.2em]">Select a star to analyze themes</h2>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
