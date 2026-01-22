'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EMOTIONS, getQuadrantBg, type Emotion } from '@/lib/emotion-data';
import { X } from 'lucide-react';

interface EmotionPickerProps {
    selected: string[];
    onChange: (emotions: string[]) => void;
    onClose: () => void;
}

export default function EmotionPicker({ selected, onChange, onClose }: EmotionPickerProps) {
    const [tempSelected, setTempSelected] = useState<string[]>(selected);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleToggle = (chinese: string) => {
        if (tempSelected.includes(chinese)) {
            setTempSelected(tempSelected.filter(e => e !== chinese));
        } else {
            if (tempSelected.length < 3) {
                setTempSelected([...tempSelected, chinese]);
            }
        }
    };

    const handleConfirm = () => {
        onChange(tempSelected);
        onClose();
    };

    if (!mounted) return null;

    const quadrants = {
        red: EMOTIONS.filter(e => e.quadrant === 'red'),
        yellow: EMOTIONS.filter(e => e.quadrant === 'yellow'),
        blue: EMOTIONS.filter(e => e.quadrant === 'blue'),
        green: EMOTIONS.filter(e => e.quadrant === 'green'),
    };

    const QuadrantSection = ({
        title,
        emotions,
        bgColor
    }: {
        title: string;
        emotions: Emotion[];
        bgColor: string;
    }) => (
        <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-black opacity-60 px-1 border-l-2 border-slate-900 pl-2">
                {title}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {emotions.map((emotion) => {
                    const isSelected = tempSelected.includes(emotion.chinese);
                    return (
                        <button
                            key={emotion.chinese}
                            onClick={() => handleToggle(emotion.chinese)}
                            disabled={!isSelected && tempSelected.length >= 3}
                            className={`
                                px-2 py-1.5 rounded-lg text-xs font-bold chinese-font
                                transition-all border
                                ${isSelected
                                    ? 'border-slate-800 bg-slate-800 text-white scale-[1.02] shadow-sm'
                                    : 'border-slate-200 hover:border-slate-400 bg-white'
                                }
                                ${!isSelected && tempSelected.length >= 3
                                    ? 'opacity-20 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                            `}
                            style={{
                                backgroundColor: isSelected ? undefined : bgColor,
                                color: isSelected ? undefined : '#000000'
                            }}
                        >
                            {emotion.chinese}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-black">
                            情緒量表
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-bold">
                            選擇最多 3 個情緒（已選 {tempSelected.length}/3）
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-black"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuadrantSection
                            title="🔴 高能量 + 低愉悅"
                            emotions={quadrants.red}
                            bgColor={getQuadrantBg('red')}
                        />
                        <QuadrantSection
                            title="🟡 高能量 + 高愉悅"
                            emotions={quadrants.yellow}
                            bgColor={getQuadrantBg('yellow')}
                        />
                        <QuadrantSection
                            title="🔵 低能量 + 低愉悅"
                            emotions={quadrants.blue}
                            bgColor={getQuadrantBg('blue')}
                        />
                        <QuadrantSection
                            title="🟢 低能量 + 高愉悅"
                            emotions={quadrants.green}
                            bgColor={getQuadrantBg('green')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-500 font-black text-sm hover:border-slate-300 transition-all"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-800 bg-slate-800 text-white font-black text-sm hover:bg-black transition-all"
                    >
                        確認選擇 ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
