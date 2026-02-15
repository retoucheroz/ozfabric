"use client"

import { useState } from "react"
import { Check, Zap, Crown, Rocket, Sparkles, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/language-context"
import { motion } from "framer-motion"

export default function PricingPage() {
    const { t, language } = useLanguage();
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            id: "free",
            name: language === "tr" ? "Ücretsiz Deneme" : "Free Trial",
            price: "0",
            description: language === "tr" ? "Platformu keşfetmek için başlangıç paketi." : "Get started with basic features.",
            features: language === "tr"
                ? ["5 Ücretsiz Kredi", "Temel Model Erişimi", "720p Çözünürlük", "Topluluk Desteği"]
                : ["5 Free Credits", "Standard AI Models", "720p Resolution", "Community Support"],
            icon: Rocket,
            color: "gray",
            buttonText: language === "tr" ? "Şimdi Başla" : "Get Started",
            popular: false
        },
        {
            id: "pro",
            name: "Pro Plan",
            price: isAnnual ? "29" : "39",
            description: language === "tr" ? "Profesyonel tasarımcılar için." : "Perfect for designers.",
            features: language === "tr"
                ? ["Sınırsız Kredi Seçeneği", "Tüm Pro Modellere Erişim", "4K Ultra HD Çözünürlük", "Arka Plan Kaldırma", "Öncelikli İşleme", "Ticari Lisans"]
                : ["Unlimited Credits Plan", "All Pro AI Models", "4K Ultra HD Output", "Background Removal", "Priority Processing", "Commercial License"],
            icon: Crown,
            color: "violet",
            buttonText: language === "tr" ? "Pro'ya Yükselt" : "Upgrade to Pro",
            popular: true
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price: "99",
            description: language === "tr" ? "Büyük ajanslar ve markalar için." : "For large agencies and brands.",
            features: language === "tr"
                ? ["Özel Model Eğitimi (LoRA)", "API Erişimi", "Ekip Yönetimi", "7/24 Özel Destek", "Yüksek Hızlı Rendering", "Kurumsal Güvenlik"]
                : ["Custom Model Training", "API Access", "Team Management", "24/7 Dedicated Support", "High-speed Rendering", "Enterprise Security"],
            icon: Zap,
            color: "indigo",
            buttonText: language === "tr" ? "İletişime Geçin" : "Contact Sales",
            popular: false
        }
    ];

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

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <span className={cn("text-xs font-medium transition-colors", !isAnnual ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                            {language === "tr" ? "Aylık" : "Monthly"}
                        </span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-12 h-6 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full relative p-1 transition-all"
                        >
                            <div className={cn(
                                "absolute top-1 bottom-1 w-4 bg-violet-500 rounded-full transition-all shadow-lg shadow-violet-500/30",
                                isAnnual ? "right-1" : "left-1"
                            )} />
                        </button>
                        <span className={cn("text-xs font-medium transition-colors flex items-center gap-2", isAnnual ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                            {language === "tr" ? "Yıllık" : "Yearly"}
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold px-1.5 py-0">
                                %30 İNDİRİM
                            </Badge>
                        </span>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, idx) => {
                        const Icon = plan.icon;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={cn(
                                    "relative group rounded-2xl p-6 transition-all duration-300",
                                    "bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-violet-500/30",
                                    "flex flex-col h-full shadow-lg shadow-black/5",
                                    plan.popular && "ring-1 ring-violet-500 border-violet-500 bg-violet-500/[0.02]"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-violet-500/20 flex items-center gap-1.5 z-20">
                                        <Star className="w-2.5 h-2.5 fill-white" />
                                        {language === "tr" ? "EN POPÜLER" : "MOST POPULAR"}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0",
                                        plan.color === "violet" ? "bg-violet-500/10 text-violet-500" :
                                            plan.color === "indigo" ? "bg-indigo-500/10 text-indigo-500" : "bg-gray-500/10 text-gray-500"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                                    <p className="text-[var(--text-secondary)] text-[11px] mt-1.5 leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1 justify-center md:justify-start">
                                        <span className="text-3xl font-black text-[var(--text-primary)]">${plan.price}</span>
                                        <span className="text-[var(--text-muted)] text-sm font-medium">/{language === "tr" ? "ay" : "mo"}</span>
                                    </div>
                                    {isAnnual && plan.price !== "0" && (
                                        <p className="text-[var(--text-muted)] text-[9px] uppercase font-bold tracking-wider mt-1 text-center md:text-left">
                                            {language === "tr" ? "Yıllık faturalandırılır" : "Billed annually"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2.5 flex-1">
                                    {plan.features.map((feature, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-2.5">
                                            <div className="mt-0.5 shrink-0 bg-emerald-500/10 rounded-full p-0.5">
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="sm"
                                    className={cn(
                                        "w-full mt-6 h-10 rounded-lg font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2",
                                        plan.popular
                                            ? "bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/10"
                                            : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                                    )}
                                >
                                    {plan.buttonText}
                                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

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
