"use client"

import { useState, useEffect } from "react"
import { Check, Zap, Crown, Rocket, Sparkles, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"
import { motion } from "framer-motion"
import { SERVICE_COSTS, PRICING_PLANS, CREDIT_PACKS } from "@/lib/pricingConstants"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useProjects } from "@/context/projects-context"
import { Coins } from "lucide-react"

export default function PricingPage() {
    const { t, language } = useLanguage();
    const { credits } = useProjects();
    const { data: session } = useSession();
    const user = session?.user as any;
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [loadingPack, setLoadingPack] = useState<number | null>(null);

    // Checkout handler — works for both plans and credit packs
    async function handleCheckout(productKey: string, loadingKey: string | number) {
        if (!session?.user) {
            toast.error(language === "tr" ? "Lütfen önce giriş yapın" : "Please sign in first");
            return;
        }

        // Set loading state
        if (typeof loadingKey === "string") {
            setLoadingPlan(loadingKey);
        } else {
            setLoadingPack(loadingKey);
        }

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productKey }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            // Redirect to Lemon Squeezy checkout
            window.location.href = data.url;
        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error(
                language === "tr"
                    ? "Ödeme sayfası açılamadı. Lütfen tekrar deneyin."
                    : "Could not open checkout. Please try again."
            );
        } finally {
            setLoadingPlan(null);
            setLoadingPack(null);
        }
    }

    // Map plan IDs to checkout product keys
    const planProductKeys: Record<string, string> = {
        free: "free",
        pro: "sub_pro",
        business: "sub_business",
    };

    // Map credit pack index to product keys
    const packProductKeys = ["credits_500", "credits_1100", "credits_6000", "credits_13000"];

    return (
        <div className="min-h-screen bg-[var(--bg-base)] py-8 px-6 overflow-y-auto">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-zinc-500 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-zinc-600 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center space-y-3 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Current Balance - Moved from Settings */}
                        <div className="inline-flex items-center gap-6 px-8 py-4 bg-[#12121a] border border-white/5 rounded-2xl mb-8 shadow-xl">
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t("settings.currentBalance") || "CURRENT BALANCE"}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Coins className="w-6 h-6 text-[#F5F5F5]" />
                                    </div>
                                    <span className="text-4xl font-black italic tracking-tighter text-[#F5F5F5]">{credits}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">{t("settings.credits") || "CREDITS"}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Badge variant="outline" className="px-3 py-1 border-white/10 bg-white/5 text-zinc-400 font-bold mb-3 text-[10px] uppercase tracking-wider">
                                {language === "tr" ? "Fiyatlandırma" : "Pricing Plans"}
                            </Badge>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                                {language === "tr" ? "Yaratıcılığınızı" : "Unleash Your"}{" "}
                                <span className="text-[#F5F5F5]">
                                    {language === "tr" ? "Ölçeklendirin" : "Creativity"}
                                </span>
                            </h1>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm max-w-xl mx-auto mt-2">
                            {language === "tr"
                                ? "Sizin için en uygun planı seçin. İstediğiniz zaman iptal edebilirsiniz."
                                : "Choose the perfect plan for your business. Cancel or switch anytime."}
                        </p>
                    </motion.div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {PRICING_PLANS.map((plan, idx) => {
                        const Icon = idx === 0 ? Rocket : (idx === 1 ? Crown : Zap);
                        const isMain = plan.highlight;
                        const isFree = plan.price === "0";
                        const isLoading = loadingPlan === plan.id;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={cn(
                                    "relative group rounded-3xl p-8 transition-all duration-300 flex flex-col h-full",
                                    isMain
                                        ? "bg-zinc-100 text-black shadow-2xl scale-105 z-10 border-0"
                                        : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-zinc-500/30 shadow-lg shadow-black/5"
                                )}
                            >
                                {isMain && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0D0D0F] border border-white/10 text-[#F5F5F5] text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 uppercase tracking-wider">
                                        <Star className="w-3 h-3 fill-white" />
                                        {language === "tr" ? "Önerilen" : "Most Popular"}
                                    </div>
                                )}

                                <div className="mb-6 text-center">
                                    <h3 className={cn("text-lg font-black uppercase tracking-tight mb-2", isMain ? "text-black" : "text-[var(--text-primary)]")}>
                                        {language === "tr" ? plan.nameTr : plan.name}
                                    </h3>
                                    <div className={cn("text-xs font-medium opacity-80", isMain ? "text-black/80" : "text-[var(--text-secondary)]")}>
                                        {language === "tr" ? plan.descriptionTr : plan.description}
                                    </div>
                                </div>

                                <div className="mb-6 text-center">
                                    <div className="flex items-baseline gap-1 justify-center">
                                        <span className={cn("text-4xl font-black heading-font", isMain ? "text-black" : "text-[var(--text-primary)]")}>${plan.price}</span>
                                        {!isFree && <span className={cn("text-sm font-medium", isMain ? "text-black/60" : "text-[var(--text-muted)]")}>/{language === "tr" ? "ay" : "mo"}</span>}
                                    </div>
                                    <Badge variant="secondary" className={cn("mt-3 font-bold", isMain ? "bg-black text-white border-none" : "bg-white/5 text-zinc-400 border-white/10")}>
                                        {plan.credits.toLocaleString()} {language === "tr" ? "KREDİ" : "CREDITS"}
                                    </Badge>
                                </div>

                                <div className="space-y-4 flex-1 mb-8">
                                    {(language === "tr" ? plan.featuresTr : plan.features).map((feature, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-3">
                                            <div className={cn("p-0.5 rounded-full", isMain ? "bg-black/10" : "bg-emerald-500/10")}>
                                                <Check className={cn("w-3 h-3", isMain ? "text-black" : "text-emerald-500")} />
                                            </div>
                                            <span className={cn("text-xs font-medium", isMain ? "text-black/90" : "text-[var(--text-secondary)]")}>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="lg"
                                    disabled={isLoading || isFree}
                                    onClick={() => {
                                        if (isFree) return;
                                        handleCheckout(planProductKeys[plan.id], plan.id);
                                    }}
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300",
                                        isMain
                                            ? "bg-[#0D0D0F] text-white hover:bg-black shadow-xl disabled:opacity-70"
                                            : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)] disabled:opacity-50"
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isFree ? (
                                        language === "tr" ? "Şimdi Başla" : "Start Now"
                                    ) : (
                                        language === "tr" ? "Seç" : "Select Plan"
                                    )}
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
                        {CREDIT_PACKS.map((pack, i) => {
                            const isLoading = loadingPack === i;
                            return (
                                <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center hover:border-violet-500/30 transition-all relative overflow-hidden group">
                                    {(pack.label === "Pro" || pack.label === "Ultra") && (
                                        <div className="absolute top-0 right-0 bg-[#F5F5F5] text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                                            BONUS
                                        </div>
                                    )}
                                    <div className="text-2xl font-black text-[var(--text-primary)] mb-1">{pack.credits.toLocaleString()}</div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-3">{language === "tr" ? "KREDİ" : "CREDITS"}</div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isLoading}
                                        onClick={() => handleCheckout(packProductKeys[i], i)}
                                        className="w-full text-xs font-bold border-white/10 text-[#F5F5F5] hover:bg-white/5 transition-all group-hover:scale-105 active:scale-95 disabled:opacity-70"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>{pack.price} {language === "tr" ? "Satın Al" : "Buy Now"}</>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
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
                                        <span>Nano Banana 2 (1-2K)</span>
                                        <span className="font-bold">{SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_1_2K}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[var(--border-subtle)] border-dashed">
                                        <span>Nano Banana 2 (4K)</span>
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
                        <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-zinc-400" /> {language === "tr" ? "Güvenli Ödeme" : "Secure Payment"}</span>
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
