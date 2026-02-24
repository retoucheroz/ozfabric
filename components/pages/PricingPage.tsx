"use client"

import { useState } from "react"
import { Check, Zap, Crown, Rocket, Sparkles, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"
import { motion } from "framer-motion"
import { SERVICE_COSTS } from "@/lib/pricingConstants";
import { useEffect } from "react";

import { PRICING_PLANS, CREDIT_PACKS } from "@/lib/pricingConstants";
// ... imports

export default function PricingPage() {
    const { t, language } = useLanguage();
    // Removed isAnnual state as plans are currently simplified to monthly
    // const [isAnnual, setIsAnnual] = useState(true); 
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data?.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Session fetch failed", err));
    }, []);

    // Plans are now imported from constants

    return (
        <div className="min-h-screen bg-[var(--bg-base)] py-8 px-6 overflow-y-auto">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-indigo-500 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center space-y-3 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Badge variant="outline" className="px-3 py-1 border-violet-500/30 bg-violet-500/10 text-violet-500 font-bold mb-3 text-[10px] uppercase tracking-wider">
                            {language === "tr" ? "Fiyatlandırma" : "Pricing Plans"}
                        </Badge>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                            {language === "tr" ? "Yaratıcılığınızı" : "Unleash Your"}{" "}
                            <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent">
                                {language === "tr" ? "Ölçeklendirin" : "Creativity"}
                            </span>
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm max-w-xl mx-auto mt-2">
                            {language === "tr"
                                ? "Sizin için en uygun planı seçin. İstediğiniz zaman iptal edebilirsiniz."
                                : "Choose the perfect plan for your business. Cancel or switch anytime."}
                        </p>
                    </motion.div>

                    {/* Billing Toggle Removed - Simplification */}
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {PRICING_PLANS.map((plan, idx) => {
                        const Icon = idx === 0 ? Rocket : (idx === 1 ? Crown : Zap);
                        const isMain = plan.highlight;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={cn(
                                    "relative group rounded-3xl p-8 transition-all duration-300 flex flex-col h-full",
                                    isMain
                                        ? "bg-gradient-to-b from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-900/20 scale-105 z-10 border-0"
                                        : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30 shadow-lg shadow-black/5"
                                )}
                            >
                                {isMain && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 uppercase tracking-wider">
                                        <Star className="w-3 h-3 fill-white" />
                                        {language === "tr" ? "Önerilen" : "Most Popular"}
                                    </div>
                                )}

                                <div className="mb-6 text-center">
                                    <h3 className={cn("text-lg font-black uppercase tracking-tight mb-2", isMain ? "text-white" : "text-[var(--text-primary)]")}>
                                        {language === "tr" ? plan.nameTr : plan.name}
                                    </h3>
                                    <div className={cn("text-xs font-medium opacity-80", isMain ? "text-white/80" : "text-[var(--text-secondary)]")}>
                                        {language === "tr" ? plan.descriptionTr : plan.description}
                                    </div>
                                </div>

                                <div className="mb-6 text-center">
                                    <div className="flex items-baseline gap-1 justify-center">
                                        <span className={cn("text-4xl font-black heading-font", isMain ? "text-white" : "text-[var(--text-primary)]")}>${plan.price}</span>
                                        {plan.price !== "0" && <span className={cn("text-sm font-medium", isMain ? "text-white/60" : "text-[var(--text-muted)]")}>/{language === "tr" ? "ay" : "mo"}</span>}
                                    </div>
                                    <Badge variant="secondary" className={cn("mt-3 font-bold", isMain ? "bg-white/20 text-white border-none" : "bg-violet-500/10 text-violet-500 border-violet-500/20")}>
                                        {plan.credits.toLocaleString()} {language === "tr" ? "KREDİ" : "CREDITS"}
                                    </Badge>
                                </div>

                                <div className="space-y-4 flex-1 mb-8">
                                    {(language === "tr" ? plan.featuresTr : plan.features).map((feature, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-3">
                                            <div className={cn("p-0.5 rounded-full", isMain ? "bg-white/20" : "bg-emerald-500/10")}>
                                                <Check className={cn("w-3 h-3", isMain ? "text-white" : "text-emerald-500")} />
                                            </div>
                                            <span className={cn("text-xs font-medium", isMain ? "text-white/90" : "text-[var(--text-secondary)]")}>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="lg"
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300",
                                        isMain
                                            ? "bg-white text-violet-600 hover:bg-white/90 shadow-xl"
                                            : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                                    )}
                                >
                                    {language === "tr" ? (plan.price === "0" ? "Şimdi Başla" : "Seç") : (plan.price === "0" ? "Start Now" : "Select Plan")}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Credit Packs */}
                <div className="mt-16">
                    <h2 className="text-xl font-bold text-center mb-8 text-[var(--text-primary)]">
                        {language === "tr" ? "Kredi Paketleri" : "Credit Packs"}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CREDIT_PACKS.map((pack, i) => (
                            <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center hover:border-violet-500/30 transition-all relative overflow-hidden group">
                                {pack.label === "Pro" || pack.label === "Ultra" ? (
                                    <div className="absolute top-0 right-0 bg-violet-500/10 text-violet-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                                        BONUS
                                    </div>
                                ) : null}
                                <div className="text-2xl font-black text-[var(--text-primary)] mb-1">{pack.credits.toLocaleString()}</div>
                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-3">{language === "tr" ? "KREDİ" : "CREDITS"}</div>
                                <Button size="sm" variant="outline" className="w-full text-xs font-bold border-violet-500/20 text-violet-500 hover:bg-violet-500/10 hover:text-violet-600 transition-all group-hover:scale-105 active:scale-95">
                                    {pack.price} {language === "tr" ? "Satın Al" : "Buy Now"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Costs Info - ADMIN ONLY */}
                {user?.role === 'admin' && (
                    <div className="mt-16 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            {language === "tr" ? "Hizmet Maliyetleri (Admin)" : "Service Costs (Admin)"}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 border-b pb-2">
                                    {language === "tr" ? "Görsel Üretim" : "Image Generation"}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Nano Banana Pro (1-2K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_1_2K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Nano Banana Pro (4K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_4K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Face Swap (1-2K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_1_2K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Face Swap (4K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_4K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Ghost Model (1-2K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_1_2K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Ghost Model (4K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_4K}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Upscaler</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.UPSCALER_PER_MP} / MP</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 border-b pb-2">
                                    {language === "tr" ? "Video Üretim" : "Video Generation"}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Kling 3 ({language === "tr" ? "ses kapalı" : "sound off"})</span>
                                        <span className="font-bold">{SERVICE_COSTS.VIDEO_GENERATION.KLING_3_SOUND_OFF} / {language === "tr" ? "sn" : "sec"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Kling 3 ({language === "tr" ? "ses açık" : "sound on"})</span>
                                        <span className="font-bold">{SERVICE_COSTS.VIDEO_GENERATION.KLING_3_SOUND_ON} / {language === "tr" ? "sn" : "sec"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Kling 3 (Voice Control)</span>
                                        <span className="font-bold">{SERVICE_COSTS.VIDEO_GENERATION.KLING_3_VOICE_CONTROL} / {language === "tr" ? "sn" : "sec"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Kling 2.5 (5 {language === "tr" ? "sn" : "sec"})</span>
                                        <span className="font-bold">{SERVICE_COSTS.VIDEO_GENERATION.KLING_2_5_5SEC}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Kling 2.5 ({language === "tr" ? "ek saniye" : "extra sec"})</span>
                                        <span className="font-bold">{SERVICE_COSTS.VIDEO_GENERATION.KLING_2_5_EXTRA_SEC} / {language === "tr" ? "sn" : "sec"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Disclaimer */}
                <div className="mt-12 text-center">
                    <p className="text-[var(--text-muted)] text-[10px] font-medium flex items-center justify-center gap-4">
                        <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-violet-500" /> {language === "tr" ? "Güvenli Ödeme" : "Secure Payment"}</span>
                        <span>•</span>
                        <span>{language === "tr" ? "Para İade Garantisi" : "Money Back Guarantee"}</span>
                        <span>•</span>
                        <span>{language === "tr" ? "İstediğin Zaman İptal Et" : "Cancel Anytime"}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
