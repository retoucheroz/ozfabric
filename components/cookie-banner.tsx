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
        <div className="fixed bottom-6 left-6 z-[100] max-w-[400px] w-[calc(100%-3rem)] pointer-events-none group">
            <div className="glass-strong rounded-[2rem] border border-[var(--border-accent)] shadow-2xl p-5 sm:p-6 pointer-events-auto relative overflow-hidden transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-500/30">
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/10 blur-[40px] rounded-full" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-[var(--accent-primary)]/10 p-2 rounded-xl">
                                <Cookie className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>
                            <h3 className="font-bold text-[15px] tracking-tight text-[var(--text-primary)]">
                                {language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition-all"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-5">
                        {language === 'tr'
                            ? 'Daha iyi bir kullanıcı deneyimi sunmak ve sitemizi geliştirmek için çerezler kullanıyoruz.'
                            : 'We use cookies to enhance your experience and improve our services.'}
                        {' '}
                        <Link href="/cookie-policy" className="text-[var(--accent-primary)] hover:underline font-semibold inline-flex items-center gap-0.5">
                            {language === 'tr' ? 'Detaylar' : 'Details'}
                        </Link>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAcceptEssential}
                            className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-transparent border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all"
                        >
                            {language === 'tr' ? 'Gerekli' : 'Essential'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAcceptAll}
                            className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                        >
                            {language === 'tr' ? 'Kabul Et' : 'Accept All'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
