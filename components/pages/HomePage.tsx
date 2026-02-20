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
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 h-full shadow-[var(--shadow-card)] card-interactive hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-accent)] border-l-[3px] border-l-violet-500">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                                <Camera className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{t("home.photoshootTitle")}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{t("home.photoshootDesc")}</p>
                        </div>
                    </Link>

                    {/* 2. Video Studio */}
                    <Link href="/video" className="group block h-full">
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 h-full shadow-[var(--shadow-card)] card-interactive hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-accent)] border-l-[3px] border-l-cyan-500">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/50 transition-colors">
                                <VideoIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{t("home.videoTitle")}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{t("home.videoDesc")}</p>
                        </div>
                    </Link>

                    {/* 3. Virtual Try-On */}
                    <Link href="/try-on" className="group block h-full">
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 h-full shadow-[var(--shadow-card)] card-interactive hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-accent)] border-l-[3px] border-l-fuchsia-500">
                            <div className="w-10 h-10 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center mb-4 text-fuchsia-600 dark:text-fuchsia-400 group-hover:bg-fuchsia-200 dark:group-hover:bg-fuchsia-800/50 transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{t("home.virtualTryOn")}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{t("home.virtualTryOnDesc")}</p>
                        </div>
                    </Link>

                    {/* 4. Ghost Model */}
                    <Link href="/photoshoot/ghost" className="group block h-full">
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 h-full shadow-[var(--shadow-card)] card-interactive hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-accent)] border-l-[3px] border-l-indigo-500">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                                <Shirt className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{t("home.ghostModelTitle")}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{t("home.ghostModelDesc")}</p>
                        </div>
                    </Link>

                    {/* 5. Train */}
                    <Link href="/train" className="group block h-full">
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 h-full shadow-[var(--shadow-card)] card-interactive hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--border-accent)] border-l-[3px] border-l-orange-500">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                                <Wand2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{t("home.trainTitle")}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{t("home.trainDesc")}</p>
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
