"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X, Cookie } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem("cookie_consent", "all");
        setIsVisible(false);
    };

    const handleAcceptEssential = () => {
        localStorage.setItem("cookie_consent", "essential");
        setIsVisible(false);
    };

    const handleClose = () => {
        localStorage.setItem("cookie_consent", "essential");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] max-w-[600px] w-[calc(100%-3rem)] pointer-events-none group animate-in fade-in slide-in-from-right-5 duration-500">
            <div className="glass-strong rounded-3xl border border-[var(--border-accent)] shadow-2xl p-4 sm:p-5 pointer-events-auto relative overflow-hidden transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-500/30">
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/10 blur-[40px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-[var(--accent-primary)]/10 p-2 rounded-xl shrink-0 hidden sm:block">
                            <Cookie className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                        <p className="text-[13px] text-[var(--text-secondary)] leading-tight">
                            {language === 'tr'
                                ? 'Daha iyi bir kullanıcı deneyimi için çerezler kullanıyoruz.'
                                : 'We use cookies to enhance your experience.'}
                            {' '}
                            <Link href="/cookie-policy" className="text-[var(--accent-primary)] hover:underline font-semibold whitespace-nowrap">
                                {language === 'tr' ? 'Detaylar' : 'Details'}
                            </Link>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAcceptEssential}
                            className="flex-1 md:flex-none h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-transparent border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all"
                        >
                            {language === 'tr' ? 'Gerekli' : 'Essential'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAcceptAll}
                            className="flex-1 md:flex-none h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white shadow-lg shadow-purple-500/10 active:scale-95 transition-all text-nowrap"
                        >
                            {language === 'tr' ? 'Kabul Et' : 'Accept All'}
                        </Button>
                        <button
                            onClick={handleClose}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all ml-1 hidden md:block"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
