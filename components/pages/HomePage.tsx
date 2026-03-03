"use client"

import { Plus, Shirt, Zap, Layers, Sparkles, TrendingUp, Palette, ArrowRight, CreditCard, Wand2, Camera, Video as VideoIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useRouter } from "next/navigation"
import CountUp from "@/components/ui/count-up"

export default function HomePage() {
    const { projects, credits } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const isPro = false; // Mock state: change to true to hide banner

    const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

    const formatTime = (ms: number) => {
        const minutes = Math.floor((Date.now() - ms) / 60000);
        if (language === "tr") {
            if (minutes < 60) return `${minutes} dk önce`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} saat önce`;
            return `${Math.floor(hours / 24)} gün önce`;
        }
        if (minutes < 60) return `${minutes} mins ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{t("home.welcome")}</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{t("home.readyToCreate")}</p>
                </div>
                <div className="flex gap-2">
                    {/* New Design button removed */}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-8 mb-4 tracking-tight">{t("home.createVisualize")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* 1. E-COMM */}
                    <Link href="/photoshoot" className="group block h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-[#F5F5F5]">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-[#F5F5F5] group-hover:bg-white/10 transition-colors">
                                <Camera className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.photoshootTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.photoshootDesc")}</p>
                        </div>
                    </Link>

                    {/* 2. Editorial */}
                    <Link href="/editorial" className="group block h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-400">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-300 group-hover:bg-white/10 transition-colors">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.editorialTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{language === 'tr' ? 'Kampanya çekimleri oluşturun.' : 'Create campaign shots.'}</p>
                        </div>
                    </Link>

                    {/* 3. Video Studio */}
                    <Link href="/video" className="group block h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-500">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-400 group-hover:bg-white/10 transition-colors">
                                <VideoIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.videoTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.videoDesc")}</p>
                        </div>
                    </Link>

                    {/* 4. Ghost - Flatlay */}
                    <Link href="/photoshoot/ghost" className="group block h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-600">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-500 group-hover:bg-white/10 transition-colors">
                                <Shirt className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.ghostModelTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.ghostModelDesc")}</p>
                        </div>
                    </Link>

                    {/* 5. Face Swap */}
                    <Link href="/face-head-swap" className="group block h-full">
                        <div className="bg-[#18181b] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-700">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-600 group-hover:bg-white/10 transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">FACE SWAP</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{language === 'tr' ? 'Modellerin yüzünü değiştirin.' : 'Swap model faces.'}</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent & Trending Grid */}
            <div className="flex flex-col gap-8 pb-12">
                {/* Recent Projects Column - Full Width */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("home.recentProjects")}</h2>
                        <Link href="/history" className="text-sm text-[var(--accent-primary)] hover:underline font-medium">{t("home.viewAll")}</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {recentProjects.map((project) => (
                            <div
                                key={project.id}
                                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all shadow-md hover:shadow-xl hover:scale-[1.02]"
                                onClick={() => router.push('/history?image=' + encodeURIComponent(project.imageUrl))}
                            >
                                <img
                                    src={project.imageUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt={project.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <h3 className="text-[11px] font-black text-white uppercase truncate">{project.title}</h3>
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">{project.type}</span>
                                </div>
                            </div>
                        ))}
                        {recentProjects.length === 0 && (
                            <div className="col-span-full py-20 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                                {t("home.noProjects")}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    )
}
