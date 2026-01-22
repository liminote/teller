'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('from') || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                // 成功登入
                router.push(redirectTo);
                router.refresh();
            } else {
                setStatus('error');
                setMessage(data.error || '驗證失敗');
                setTimeout(() => setStatus('idle'), 2000);
            }
        } catch (error) {
            setStatus('error');
            setMessage('網路連線錯誤');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F0ED] flex items-center justify-center p-6 selection:bg-[#B5C2B7]/30">
            {/* 背景裝飾 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#B5C2B7]/10 rounded-full blur-[120px]" />
                <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] bg-[#D4C3BA]/15 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[30px] shadow-sm mb-6 relative group"
                    >
                        <Lock className="w-8 h-8 text-[#8294A5]" />
                        <div className="absolute inset-0 bg-[#8294A5]/5 rounded-[30px] scale-0 group-hover:scale-100 transition-transform duration-500" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-[#5C5C5C] mb-2 tracking-tight">TELLER</h1>
                    <p className="text-[#8E8E8E] text-sm font-medium tracking-wide flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        專屬命理觀測站・請驗證訪問權限
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] border border-white">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#B0B0B0] uppercase tracking-[0.2em] pl-1">
                                密碼驗證 (PASSWORD)
                            </label>
                            <div className="relative group">
                                <input
                                    autoFocus
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="請輸入密碼（提示：出生年份共四碼）"
                                    className={`w-full px-6 py-5 bg-stone-50/50 border ${status === 'error' ? 'border-[#B25050]/30 bg-[#B25050]/5' : 'border-stone-100 group-hover:border-[#B5C2B7]/30'} rounded-3xl focus:outline-none focus:ring-4 focus:ring-[#B5C2B7]/10 focus:bg-white transition-all duration-300 chinese-font text-lg font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-stone-300`}
                                />
                                <AnimatePresence>
                                    {status === 'loading' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute right-5 top-1/2 -translate-y-1/2"
                                        >
                                            <div className="w-5 h-5 border-2 border-[#8294A5]/20 border-t-[#8294A5] rounded-full animate-spin" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <button
                            disabled={!password || status === 'loading'}
                            className="w-full py-5 bg-[#5C5C5C] hover:bg-[#444444] text-white rounded-[24px] font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 disabled:opacity-50 disabled:shadow-none group"
                        >
                            開始觀測
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <AnimatePresence>
                            {status === 'error' && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center text-[#B25050] text-xs font-black uppercase tracking-widest"
                                >
                                    {message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Footer Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-12 text-[#B0B0B0] text-[10px] font-bold uppercase tracking-[0.3em]"
                >
                    System Protected by Teller Security
                </motion.p>
            </motion.div>
        </div>
    );
}
