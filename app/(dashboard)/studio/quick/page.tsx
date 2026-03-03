"use client"

import { useLanguage } from "@/context/language-context"

export default function Page() {
    const { language } = useLanguage()

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0D0D0F] text-white">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">QUICK MODE</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-4">
                {language === "tr" ? "Çok yakında..." : "Coming soon..."}
            </p>
        </div>
    )
}
