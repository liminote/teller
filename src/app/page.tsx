'use client';

import { generateDailyBasicData } from '@/lib/calendar-utils';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PenLine, ChevronUp, TrendingUp } from 'lucide-react';
import DailyFeedbackForm, { FeedbackData } from '@/components/DailyFeedbackForm';

export default function Home() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [statusMapping, setStatusMapping] = useState<Record<string, any>>({});
  const [dailyRecords, setDailyRecords] = useState<Record<string, any>>({});
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activeFeedbackDate, setActiveFeedbackDate] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/status-mapping')
      .then((res) => res.json())
      .then((data) => {
        const mapping: Record<string, any> = {};
        if (Array.isArray(data)) {
          data.forEach((item) => (mapping[item.干支] = item));
          setStatusMapping(mapping);
        }
      });

    fetch('/api/records')
      .then((res) => res.json())
      .then((data) => {
        const records: Record<string, any> = {};
        if (Array.isArray(data)) {
          data.forEach((item) => (records[item.日期] = item));
          setDailyRecords(records);
        }
      });

    // 獲取所有歷史合併資料以供算法使用
    Promise.all([
      fetch('/api/records').then(res => res.json()),
      fetch('/api/daily-data').then(res => res.json())
    ]).then(([recordsJson, dailyJson]) => {
      const recordsMap = new Map();
      const records = Array.isArray(recordsJson) ? recordsJson : recordsJson.data || [];
      records.forEach((r: any) => { if (r.日期) recordsMap.set(r.日期, r); });

      const daily = Array.isArray(dailyJson) ? dailyJson : dailyJson.data || [];
      const merged = daily.map((d: any) => {
        const r = recordsMap.get(d.日期);
        return { ...d, ...r, hasRecord: !!r };
      });
      setHistoryData(merged);
    });

    const baseDate = new Date();
    const dates = [];
    for (let i = -1; i < 7; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + i);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const data = generateDailyBasicData(dateStr, '巳');
      if (data) {
        dates.push({ ...data, isPast: i < 0, isToday: i === 0 });
      }
    }
    setDataList(dates);
  }, []);

  useEffect(() => {
    if (dataList.length > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayCard = container.querySelector('[data-today="true"]');
      if (todayCard) {
        const containerWidth = container.offsetWidth;
        const cardLeft = (todayCard as HTMLElement).offsetLeft;
        const cardWidth = (todayCard as HTMLElement).offsetWidth;
        const scrollTarget = cardLeft - (containerWidth / 2) + (cardWidth / 2);
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    }
  }, [dataList]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const firstCard = container.querySelector('div[data-today]');
      const cardWidth = firstCard ? (firstCard as HTMLElement).offsetWidth + 40 : 440 + 40;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleSaveFeedback = async (data: FeedbackData) => {
    try {
      setDailyRecords(prev => ({ ...prev, [data.日期]: data }));
      const response = await fetch('/api/records/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('儲存失敗');
      setFeedbackToast({ type: 'success', message: '記錄已儲存！' });
      setActiveFeedbackDate(null);
    } catch (error) {
      console.error('儲存紀錄失敗:', error);
      setFeedbackToast({ type: 'error', message: '儲存失敗，請稍後再試' });
    }
  };

  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  const getCharColor = (char: string) => {
    if ('甲乙寅卯'.includes(char)) return 'text-[#567D5B]';
    if ('丙丁巳午'.includes(char)) return 'text-[#B25050]';
    if ('戊己辰戌丑未'.includes(char)) return 'text-[#8D6E63]';
    if ('庚辛申酉'.includes(char)) return 'text-[#B89130]';
    if ('壬癸亥子'.includes(char)) return 'text-[#457B9D]';
    return 'text-[#6B7280]';
  };

  const getColorClass = (category: string) => {
    switch (category) {
      case 'happy': return 'bg-[#F0F7F0] text-[#4A6B4E] border-[#DCE8DC]';
      case 'moody': return 'bg-[#F9F1F1] text-[#A64B4E] border-[#E8DCDC]';
      case 'high-pressure': return 'bg-[#F1F4F9] text-[#457B9D] border-[#DCE4E8]';
      case 'turbulence': return 'bg-[#F2EDF7] text-[#7A6A96] border-[#E0DCE8]';
      default: return 'bg-stone-50 text-stone-500 border-stone-100';
    }
  };

  if (dataList.length === 0) return null;

  return (
    <main className="min-h-screen bg-[#E5E2DB] text-[#4A4A4A] transition-colors duration-500 pb-32">
      {/* 導航箭頭 */}
      <div className="fixed inset-y-0 left-0 z-50 md:flex items-center px-8 pointer-events-none hidden">
        <button onClick={() => scroll('left')} className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md shadow-xl border border-white/50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all pointer-events-auto active:scale-95 ml-4">
          <ChevronLeft size={28} />
        </button>
      </div>
      <div className="fixed inset-y-0 right-0 z-50 md:flex items-center px-8 pointer-events-none hidden">
        <button onClick={() => scroll('right')} className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md shadow-xl border border-white/50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all pointer-events-auto active:scale-95 mr-28">
          <ChevronRight size={28} />
        </button>
      </div>

      <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pt-20 pb-24 px-[7vw] gap-6 md:gap-10 items-start">
        {(() => {
          const scoreData = historyData.filter(d => d.hasRecord && d.今日分數);
          const pMap: Record<string, { r: number }> = {};
          const gMap: Record<string, { r: number }> = {};
          const sMap: Record<string, { r: number }> = {};

          scoreData.forEach(d => {
            const p = d.流日命宮地支;
            const g = `${d.天干}${d.地支}`;
            const s = d.天干;
            const isGood = d.今日分數 === '好' ? 1 : d.今日分數 === '普通' ? 0.5 : 0;
            if (p) { if (!pMap[p]) pMap[p] = { r: 0.5 }; pMap[p].r = (pMap[p].r + isGood) / 2; }
            if (g) { if (!gMap[g]) gMap[g] = { r: 0.5 }; gMap[g].r = (gMap[g].r + isGood) / 2; }
            if (s) { if (!sMap[s]) sMap[s] = { r: 0.5 }; sMap[s].r = (sMap[s].r + isGood) / 2; }
          });

          return dataList.map((data) => {
            const pillar = `${data.天干}${data.地支}`;
            const status = statusMapping[pillar];
            const record = dailyRecords[data.日期];
            const luckIndex = Math.round(((pMap[data.流日命宮地支]?.r ?? 0.5) + (gMap[pillar]?.r ?? 0.5) + (sMap[data.天干]?.r ?? 0.5)) / 3 * 100);
            const statusColor = luckIndex > 65 ? "bg-[#8EA68F]" : luckIndex < 35 ? "bg-[#B88A8A]" : "bg-stone-300";

            return (
              <div key={data.日期} data-today={data.isToday} className={`snap-center flex-shrink-0 w-[86vw] max-w-[440px] h-fit min-h-[400px] rounded-[32px] border-2 relative transition-all duration-700 flex flex-col ${data.isPast ? 'opacity-80' : 'opacity-100'} ${data.isToday ? 'bg-white border-slate-200 shadow-[0_40px_80px_-20px_rgba(130,148,165,0.12)] scale-[1.02] md:scale-[1.05] z-10' : 'bg-white/80 border-stone-100 shadow-sm'}`}>
                <div className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-black text-slate-900 mb-1 chinese-font uppercase tracking-widest">{data.星期}</div>
                      <h1 className="text-7xl font-black tracking-tighter mb-4 text-black">{data.日期.split('-').slice(1).join('/')}</h1>
                      <div className="flex items-center gap-2 text-slate-600 text-sm font-black">
                        <span className="chinese-font">{data.農曆}</span>
                        <span>·</span>
                        <span className="chinese-font">{data.節氣}</span>
                        <span>·</span>
                        <span className="uppercase">{data.紫微流月}</span>
                      </div>
                    </div>
                    <div className="flex gap-6 items-center pt-2">
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-slate-400 font-black uppercase mb-1">Bazi</div>
                        <div className="flex text-5xl font-black chinese-font">
                          <span className={getCharColor(data.天干)}>{data.天干}</span>
                          <span className={getCharColor(data.地支)}>{data.地支}</span>
                        </div>
                      </div>
                      <div className="w-[2px] h-12 bg-slate-100 mt-3" />
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-slate-400 font-black uppercase mb-1">Palace</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black chinese-font text-slate-800">{data.流日命宮地支}</span>
                          <span className="text-xs text-slate-400 font-black">宮</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 能量整合預報區 */}
                  <div className="mt-8 mb-2 p-6 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between group">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest whitespace-nowrap flex-shrink-0">AI Forecast // 運勢預測</span>
                        <div className="h-[2px] w-full bg-slate-200"></div>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-xs font-black px-2 py-1 rounded leading-none text-white ${statusColor}`}>
                          {luckIndex > 65 ? "高能" : luckIndex < 35 ? "低迷" : "平穩"}
                        </span>
                        <span className="text-sm font-black text-slate-600 italic">基于 {scoreData.length}d 歷史規律</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end min-w-[60px]">
                      <div className="text-2xl font-black tabular-nums tracking-tighter text-slate-700 leading-none mb-1">{luckIndex}</div>
                      <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div className={`h-full ${statusColor} transition-all duration-1000`} style={{ width: `${luckIndex}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100/50 space-y-5">
                      {status ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-lg border text-xs font-black italic tracking-wide ${getColorClass(status.顏色類別)}`}>{status.狀態標籤}</div>
                            <span className="text-[10px] text-stone-300 font-bold">{status.組合}</span>
                          </div>
                          <p className="chinese-font text-base leading-relaxed text-stone-500 font-medium">{status.詳細說明}</p>
                          <div className="pt-4 border-t border-stone-200/30 space-y-4">
                            <div>
                              <div className="text-[9px] text-stone-300 font-bold uppercase mb-2">建議指令</div>
                              <div className="text-sm font-black text-[#5A6A7A] bg-[#F0F2F5] p-4 rounded-xl border border-[#E0E4E8]">「{status.PM指令}」</div>
                            </div>
                            {(status['宜 (Dos)'] || status["忌 (Don'ts)"]) && (
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200/30">
                                {status['宜 (Dos)'] && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 opacity-70">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8EA68F]" />
                                      <span className="text-[9px] text-[#7A8A7A] font-black uppercase tracking-widest">宜 Dos</span>
                                    </div>
                                    <div className="text-xs text-stone-400 font-medium leading-relaxed chinese-font">{status['宜 (Dos)']}</div>
                                  </div>
                                )}
                                {status["忌 (Don'ts)"] && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 opacity-70">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88A8A]" />
                                      <span className="text-[9px] text-[#A68A8A] font-black uppercase tracking-widest">忌 Don'ts</span>
                                    </div>
                                    <div className="text-xs text-stone-400 font-medium leading-relaxed chinese-font">{status["忌 (Don'ts)"]}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center opacity-10 italic">Awaiting Dictionary...</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 紀錄按鈕與表單 (移動到 Journal 上方) */}
                    {(data.isToday || data.isPast) && (
                      <div className="space-y-4">
                        <button
                          onClick={() => setActiveFeedbackDate(activeFeedbackDate === data.日期 ? null : data.日期)}
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-black text-sm ${activeFeedbackDate === data.日期 ? 'border-[#8294A5] bg-stone-50 text-[#8294A5]' : 'border-stone-100 bg-white text-stone-400 hover:border-[#8294A5] hover:text-[#8294A5]'}`}
                        >
                          {activeFeedbackDate === data.日期 ? <><ChevronUp size={16} strokeWidth={3} />收起表單</> : <><PenLine size={16} strokeWidth={3} />{data.isToday ? '記錄今日' : '補登紀錄'}</>}
                        </button>

                        {activeFeedbackDate === data.日期 && (
                          <div className="pb-2">
                            <DailyFeedbackForm
                              date={data.日期}
                              heavenlyStem={data.天干}
                              dailyPalace={data.流日命宮地支}
                              onSave={handleSaveFeedback}
                              onCancel={() => setActiveFeedbackDate(null)}
                              initialData={record}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-black mb-4">
                      <PenLine size={24} strokeWidth={4} />
                      <span className="text-xl font-black uppercase tracking-widest">Journal // 我的回饋</span>
                    </div>
                    <div className="bg-white rounded-[32px] border-4 border-slate-100 shadow-xl overflow-hidden">
                      {record ? (
                        <div className="divide-y-2 divide-slate-100">
                          {(record.八字_體感 || record.八字_體驗) && (
                            <div className="p-8 space-y-3">
                              <div className="text-xs text-white font-black uppercase tracking-wider bg-green-700 w-fit px-3 py-1 rounded">八字實證</div>
                              <p className="chinese-font text-2xl text-black leading-relaxed font-bold">{record.八字_體感 || record.八字_體驗}</p>
                            </div>
                          )}
                          {record.紫微_四化簡述 && (
                            <div className="p-8 space-y-3">
                              <div className="text-xs text-white font-black uppercase tracking-wider bg-blue-700 w-fit px-3 py-1 rounded">紫微回饋</div>
                              <p className="chinese-font text-2xl text-slate-800 leading-relaxed font-bold">{record.紫微_四化簡述}</p>
                            </div>
                          )}
                          <div className="p-8 bg-slate-50 grid grid-cols-5 gap-4">
                            {[
                              { label: 'OVERALL', val: record.今日分數, color: record.今日分數 === '好' ? 'text-green-700' : record.今日分數 === '不好' ? 'text-red-700' : 'text-slate-900' },
                              { label: 'WORK', val: record.紫微_工作 },
                              { label: 'HEALTH', val: record.紫微_健康 },
                              { label: 'WEALTH', val: record.紫微_財運 },
                              { label: 'ENERGY', val: record.紫微_能量 },
                            ].map((item, i) => (
                              <div key={i} className="text-center">
                                <div className="text-xs text-slate-500 font-black mb-2 tracking-wider uppercase">{item.label}</div>
                                <div className={`text-4xl font-black ${item.color || 'text-slate-900'}`}>{item.val || '-'}</div>
                              </div>
                            ))}
                          </div>
                          {record.情緒 && Array.isArray(record.情緒) && record.情緒.length > 0 && (
                            <div className="px-8 pb-8 pt-4">
                              <div className="text-xs text-slate-500 font-black uppercase tracking-wider mb-3">Emotion</div>
                              <div className="text-2xl text-black chinese-font font-black bg-white p-4 rounded-xl border-2 border-slate-100">
                                {record.情緒.join(' · ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-24 text-center text-slate-300 italic text-xl font-bold">Waiting for logs...</div>
                      )}
                    </div>
                  </div>


                </div>

                <div className="p-8 pb-10 mt-auto">
                  <div className="text-[8px] text-center font-bold text-stone-100 tracking-[1em] uppercase">System Archive // V11.0</div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Toast 通知 */}
      {feedbackToast && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border-2 font-black text-sm flex items-center gap-2 ${feedbackToast.type === 'success' ? 'bg-[#F0F7F0] border-[#8EA68F] text-[#4A6B4E]' : 'bg-[#F9F1F1] border-[#B88A8A] text-[#A64B4E]'}`}>
            {feedbackToast.type === 'success' ? '✓' : '✕'} {feedbackToast.message}
          </div>
        </div>
      )}
    </main>
  );
}
