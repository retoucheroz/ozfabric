"use client"

import { useLanguage } from "@/context/language-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { TbBolt, TbCrown, TbChevronRight } from "react-icons/tb"
import { cn } from "@/lib/utils"

export default function StudioSelectionPage() {
    const { t, language } = useLanguage()
    const router = useRouter()

    const options = [
        {
            id: "quick",
            title: "QUICK",
            subtitle: language === "tr" ? "Hızlı Üretim" : "Quick Generation",
            description: language === "tr" ? "Saniyeler içinde basit ve etkileyici sonuçlar." : "Simple and impressive results in seconds.",
            icon: TbBolt,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "hover:border-amber-500/50",
            href: "/studio/quick"
        },
        {
            id: "pro",
            title: "PRO",
            subtitle: language === "tr" ? "Profesyonel Stüdyo" : "Professional Studio",
            description: language === "tr" ? "Tam kontrol ve en yüksek kalitede çekim deneyimi." : "Full control and highest quality photoshoot experience.",
            icon: TbCrown,
            color: "text-[#F5F5F5]",
            bg: "bg-white/5",
            border: "hover:border-white/20",
            href: "/photoshoot"
        }
    ]

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F] items-center justify-start pt-24 md:pt-32 p-4 md:p-8">
            <div className="max-w-4xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
                        STUDIO
                    </h1>
                    <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] grayscale opacity-70">
                        {language === "tr" ? "ÜRETİM MODU SEÇİN" : "SELECT GENERATION MODE"}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
                    {options.map((option) => (
                        <Card
                            key={option.id}
                            onClick={() => router.push(option.href)}
                            className={cn(
                                "group relative overflow-hidden bg-[#121214] border-white/5 p-8 cursor-pointer transition-all duration-500",
                                "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50",
                                option.border
                            )}
                        >
                            {/* Glow Effect */}
                            <div className={cn(
                                "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                                option.id === "quick" ? "bg-amber-500" : "bg-white"
                            )} />

                            <div className="relative flex flex-col h-full space-y-6">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                                    option.bg
                                )}>
                                    <option.icon className={cn("w-8 h-8", option.color)} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                                            {option.title}
                                        </h2>
                                        <TbChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        {option.subtitle}
                                    </div>
                                </div>

                                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                    {option.description}
                                </p>

                                <div className="pt-4 mt-auto">
                                    <div className={cn(
                                        "h-1 w-0 group-hover:w-full transition-all duration-700 rounded-full",
                                        option.id === "quick" ? "bg-amber-500" : "bg-[#F5F5F5]"
                                    )} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
