'use client';

import { generateDailyBasicData } from '@/lib/calendar-utils';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PenLine, ChevronUp, TrendingUp } from 'lucide-react';
import DailyFeedbackForm from '@/components/DailyFeedbackForm';
import { DailyBasicData, FeedbackData, StatusMappingRecord, HistoryData } from '@/lib/types';

export default function Home() {
  const [dataList, setDataList] = useState<DailyBasicData[]>([]);
  const [statusMapping, setStatusMapping] = useState<Record<string, StatusMappingRecord>>({});
  const [dailyRecords, setDailyRecords] = useState<Record<string, FeedbackData>>({});
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [activeFeedbackDate, setActiveFeedbackDate] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [mappingRes, recordsRes, dailyRes] = await Promise.all([
          fetch('/api/status-mapping'),
          fetch('/api/records'),
          fetch('/api/daily-data')
        ]);

        const [mappingData, recordsData, dailyData] = await Promise.all([
          mappingRes.json(),
          recordsRes.json(),
          dailyRes.json()
        ]);

        if (!mappingRes.ok) throw new Error(mappingData.details || mappingData.error || '載入對照表失敗');
        if (!recordsRes.ok) throw new Error(recordsData.details || recordsData.error || '載入歷史記錄失敗');
        if (!dailyRes.ok) throw new Error(dailyData.details || dailyData.error || '載入每日資料失敗');

        const mapping: Record<string, StatusMappingRecord> = {};
        if (Array.isArray(mappingData)) {
          mappingData.forEach((item: StatusMappingRecord) => (mapping[item.干支] = item));
          setStatusMapping(mapping);
        }

        const records: Record<string, FeedbackData> = {};
        if (Array.isArray(recordsData)) {
          recordsData.forEach((item: FeedbackData) => (records[item.日期] = item));
          setDailyRecords(records);
        }

        const recordsMap = new Map<string, FeedbackData>();
        const recordsArray = Array.isArray(recordsData) ? recordsData : [];
        recordsArray.forEach((r: FeedbackData) => { if (r.日期) recordsMap.set(r.日期, r); });

        const dailyArray = Array.isArray(dailyData) ? dailyData : dailyData.data || [];
        const merged = dailyArray.map((d: DailyBasicData) => {
          const r = recordsMap.get(d.日期);
          return { ...d, ...r, hasRecord: !!r } as HistoryData;
        });
        setHistoryData(merged);
      } catch (error: unknown) {
        console.error('初始化資料失敗:', error);
        const msg = error instanceof Error ? error.message : '未知錯誤';
        setFeedbackToast({ type: 'error', message: `載入資料失敗：${msg}` });
      }
    };

    fetchInitialData();

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
    setDataList(dates as DailyBasicData[]);
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || '儲存失敗');
      }

      setFeedbackToast({ type: 'success', message: '記錄已儲存！' });
      setActiveFeedbackDate(null);
    } catch (error: unknown) {
      console.error('儲存紀錄失敗:', error);
      const msg = error instanceof Error ? error.message : '未知錯誤';
      setFeedbackToast({ type: 'error', message: `儲存失敗：${msg}` });
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

          return dataList.map((data) => {
            // [修正] 預測算法嚴格化：只使用該日期「之前」的歷史記錄來計算概率
            // 防止包含今日或未來的數據影響當日的預測（避免 Data Leakage）
            const pastRecords = scoreData.filter(h => h.日期 < data.日期);

            const pMap: Record<string, { r: number; c: number }> = {};
            const gMap: Record<string, { r: number; c: number }> = {};
            const sMap: Record<string, { r: number; c: number }> = {};

            pastRecords.forEach(d => {
              const p = d.流日命宮地支;
              const g = `${d.天干}${d.地支}`;
              const s = d.天干;
              const isGood = d.今日分數 === '好' ? 1 : d.今日分數 === '普通' ? 0.5 : 0;

              if (p) { if (!pMap[p]) pMap[p] = { r: 0, c: 0 }; pMap[p].r += isGood; pMap[p].c++; }
              if (g) { if (!gMap[g]) gMap[g] = { r: 0, c: 0 }; gMap[g].r += isGood; gMap[g].c++; }
              if (s) { if (!sMap[s]) sMap[s] = { r: 0, c: 0 }; sMap[s].r += isGood; sMap[s].c++; }
            });

            // 計算加權平均機率 (如果沒有歷史數據則默認 0.5)
            const getProb = (map: Record<string, { r: number; c: number }>, key: string) =>
              map[key] && map[key].c > 0 ? map[key].r / map[key].c : 0.5;

            const pillar = `${data.天干}${data.地支}`;
            const status = statusMapping[pillar];
            const record = dailyRecords[data.日期];

            const probP = getProb(pMap, data.流日命宮地支);
            const probG = getProb(gMap, pillar);
            const probS = getProb(sMap, data.天干);

            const luckIndex = Math.round(((probP + probG + probS) / 3) * 100);
            const statusColor = luckIndex > 65 ? "bg-[#8EA68F]" : luckIndex < 35 ? "bg-[#B88A8A]" : "bg-stone-300";

            return (
              <div key={data.日期} data-today={data.isToday} className={`snap-center flex-shrink-0 w-[86vw] max-w-[440px] h-fit min-h-[400px] rounded-[32px] border-2 relative transition-all duration-700 flex flex-col ${data.isPast ? 'opacity-80' : 'opacity-100'} ${data.isToday ? 'bg-white border-slate-200 shadow-[0_40px_80px_-20px_rgba(130,148,165,0.12)] scale-[1.02] md:scale-[1.05] z-10' : 'bg-white/80 border-stone-100 shadow-sm'}`}>
                <div className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-black text-[#8294A5] mb-1 chinese-font uppercase tracking-widest">{data.星期}</div>
                      <h1 className="text-6xl font-black tracking-tighter mb-2 text-[#4A4A4A]">{data.日期.split('-').slice(1).join('/')}</h1>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <span className="chinese-font">{data.農曆}</span>
                        <span>·</span>
                        <span className="chinese-font">{data.節氣}</span>
                        <span>·</span>
                        <span className="uppercase">{data.紫微流月}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center pt-2">
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bazi</div>
                        <div className="flex text-4xl font-black chinese-font">
                          <span className={getCharColor(data.天干)}>{data.天干}</span>
                          <span className={getCharColor(data.地支)}>{data.地支}</span>
                        </div>
                      </div>
                      <div className="w-[1px] h-10 bg-stone-100 mt-3" />
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Palace</div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-4xl font-black chinese-font text-slate-500">{data.流日命宮地支}</span>
                          <span className="text-[11px] text-slate-400 font-bold">宮</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 能量整合預報區 */}
                  <div className="mt-8 mb-2 p-4 bg-stone-50/50 rounded-2xl border border-stone-100 flex items-center justify-between group">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap flex-shrink-0">AI Forecast // 運勢預測</span>
                        <div className="h-[1px] w-full bg-slate-200/50"></div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none text-white ${statusColor}`}>
                          {luckIndex > 65 ? "高能" : luckIndex < 35 ? "低迷" : "平穩"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 italic">基于 {scoreData.length}d 歷史規律</span>
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
                            <span className="text-[10px] text-slate-500 font-bold">{status.組合}</span>
                          </div>
                          <p className="chinese-font text-base leading-relaxed text-slate-600 font-medium">{status.詳細說明}</p>
                          <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div>
                              <div className="text-[9px] text-slate-400 font-black uppercase mb-2">建議指令</div>
                              <div className="text-sm font-black text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">「{status.PM指令}」</div>
                            </div>
                            {(status['宜 (Dos)'] || status["忌 (Don'ts)"]) && (
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                {status['宜 (Dos)'] && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 opacity-70">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8EA68F]" />
                                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">宜 Dos</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium leading-relaxed chinese-font">{status['宜 (Dos)']}</div>
                                  </div>
                                )}
                                {status["忌 (Don'ts)"] && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 opacity-70">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88A8A]" />
                                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">忌 Don'ts</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium leading-relaxed chinese-font">{status["忌 (Don'ts)"]}</div>
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
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-black text-sm ${activeFeedbackDate === data.日期 ? 'border-[#8294A5] bg-slate-50 text-[#8294A5]' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-800 hover:text-slate-800'}`}
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

                    <div className="flex items-center gap-2 text-slate-300">
                      <PenLine size={14} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Journal // 我的回饋</span>
                    </div>
                    <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                      {record ? (
                        <div className="divide-y divide-slate-100">
                          {(record.八字_體感 || record.八字_體驗) && (
                            <div className="p-5 space-y-2">
                              <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50 w-fit px-1.5 py-0.5 rounded">八字實證</div>
                              <p className="chinese-font text-sm text-slate-800 leading-relaxed font-bold whitespace-pre-wrap">{record.八字_體感 || record.八字_體驗}</p>
                            </div>
                          )}
                          {record.紫微_四化簡述 && (
                            <div className="p-5 space-y-2">
                              <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider bg-slate-50 w-fit px-1.5 py-0.5 rounded">紫微回饋</div>
                              <p className="chinese-font text-sm text-slate-700 leading-relaxed font-bold whitespace-pre-wrap">{record.紫微_四化簡述}</p>
                            </div>
                          )}
                          <div className="p-5 bg-slate-50/50 grid grid-cols-5 gap-2">
                            {[
                              { label: 'OVERALL', val: record.今日分數, color: record.今日分數 === '好' ? 'text-green-600' : record.今日分數 === '不好' ? 'text-red-600' : 'text-slate-400' },
                              { label: 'WORK', val: record.紫微_工作 },
                              { label: 'HEALTH', val: record.紫微_健康 },
                              { label: 'WEALTH', val: record.紫微_財運 },
                              { label: 'ENERGY', val: record.紫微_能量 },
                            ].map((item, i) => (
                              <div key={i} className="text-center">
                                <div className="text-[9px] text-slate-400 font-bold mb-1 tracking-wider uppercase">{item.label}</div>
                                <div className={`text-xl font-black ${item.color || 'text-slate-500'}`}>{item.val || '-'}</div>
                              </div>
                            ))}
                          </div>
                          {record.情緒 && Array.isArray(record.情緒) && record.情緒.length > 0 && (
                            <div className="px-5 pb-4 pt-2">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Emotion</div>
                              <div className="text-sm text-slate-800 chinese-font font-bold">
                                {record.情緒.join(' · ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-slate-200 italic text-sm font-bold">Waiting for logs...</div>
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
