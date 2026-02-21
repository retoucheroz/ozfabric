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
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pb-safe sm:pb-6 pointer-events-none">
            <div className="mx-auto max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pointer-events-auto transform transition-all duration-500 animate-in slide-in-from-bottom-5">
                <div className="bg-[var(--accent-soft)] p-3 rounded-xl shrink-0 hidden sm:block">
                    <Cookie className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                            {language === 'tr' ? 'Çerez Politikası ve Gizlilik' : 'Cookie Policy & Privacy'}
                        </h3>
                        <div className="bg-[var(--accent-soft)] p-2 rounded-lg shrink-0 sm:hidden">
                            <Cookie className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        {language === 'tr'
                            ? 'Size daha iyi bir deneyim sunabilmek, sitemizi teknik olarak geliştirebilmek ve kullanım analizleri yapabilmek için çerezler (cookies) kullanıyoruz. Sitemizi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz.'
                            : 'We use cookies to provide you with a better experience, improve our site technically, and analyze usage. By continuing to use our site, you accept the use of cookies.'}
                        {' '}
                        <Link href="/cookie-policy" className="text-[var(--accent-primary)] hover:underline font-medium inline-block mt-1 sm:mt-0">
                            {language === 'tr' ? 'Detaylı Bilgi' : 'Learn More'}
                        </Link>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 border-[var(--border-subtle)] pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAcceptEssential}
                        className="w-full sm:w-auto h-10 px-4 text-xs font-semibold rounded-xl bg-transparent border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
                    >
                        {language === 'tr' ? 'Yalnızca Gerekli Çerezler' : 'Essential Only'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAcceptAll}
                        className="w-full sm:w-auto h-10 px-4 text-xs font-semibold rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent-primary)]/20"
                    >
                        {language === 'tr' ? 'Tümünü Kabul Et' : 'Accept All'}
                    </Button>
                </div>

                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 sm:static p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
