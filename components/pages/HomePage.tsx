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

    const recentProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

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
                    {/* 1. Photoshoot */}
                    <Link href="/photoshoot" className="group block h-full">
                        <div className="bg-[#12121a] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-[#F5F5F5]">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-[#F5F5F5] group-hover:bg-white/10 transition-colors">
                                <Camera className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.photoshootTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.photoshootDesc")}</p>
                        </div>
                    </Link>

                    {/* 2. Video Studio */}
                    <Link href="/video" className="group block h-full">
                        <div className="bg-[#12121a] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-500">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-400 group-hover:bg-white/10 transition-colors">
                                <VideoIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.videoTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.videoDesc")}</p>
                        </div>
                    </Link>

                    {/* 3. Face Head Swap */}
                    <Link href="/face-head-swap" className="group block h-full">
                        <div className="bg-[#12121a] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-600">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-500 group-hover:bg-white/10 transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("sidebar.faceHeadSwap") || "Face Swap"}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{language === 'tr' ? 'Modellerin yüzünü değiştirin.' : 'Swap model faces.'}</p>
                        </div>
                    </Link>

                    {/* 4. Ghost Model */}
                    <Link href="/photoshoot/ghost" className="group block h-full">
                        <div className="bg-[#12121a] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-700">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-600 group-hover:bg-white/10 transition-colors">
                                <Shirt className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.ghostModelTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.ghostModelDesc")}</p>
                        </div>
                    </Link>

                    {/* 5. Train */}
                    <Link href="/train" className="group block h-full">
                        <div className="bg-[#12121a] border border-white/5 rounded-md p-6 h-full transition-all hover:bg-white/[0.03] hover:border-white/20 border-l-2 border-l-zinc-800">
                            <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center mb-4 text-zinc-700 group-hover:bg-white/10 transition-colors">
                                <Wand2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#F5F5F5] mb-1">{t("home.trainTitle")}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{t("home.trainDesc")}</p>
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
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
                        {recentProjects.map((project, idx) => (
                            <div
                                key={project.id}
                                className={cn(
                                    "group flex items-center gap-4 p-3 hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors",
                                    idx !== recentProjects.length - 1 && "border-b border-[var(--border-subtle)]"
                                )}
                                onClick={() => router.push('/history?image=' + encodeURIComponent(project.imageUrl))}
                            >
                                {/* Thumbnail */}
                                <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                    <img src={project.imageUrl} className="w-full h-full object-cover" />
                                </div>

                                {/* Info - Single Row */}
                                <div className="flex-1 flex items-center justify-between min-w-0 gap-4">
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <h3 className="font-medium text-sm text-[var(--text-primary)] truncate max-w-[200px]">{project.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] border border-[var(--border-accent)] text-[10px] font-medium shrink-0">
                                                {project.type}
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">{formatTime(project.createdAt)}</span>
                                        </div>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                            </div>
                        ))}
                        {recentProjects.length === 0 && (
                            <div className="py-12 text-center text-[var(--text-muted)]">
                                {t("home.noProjects")}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    )
}
