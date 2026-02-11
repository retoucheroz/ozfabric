"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Shirt, Zap, Layers, Sparkles, TrendingUp, Palette, ArrowRight, CreditCard, Wand2, Camera } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useRouter } from "next/navigation"
import { COMMUNITY_DESIGNS } from "@/lib/data"
import CountUp from "@/components/ui/count-up"

export default function DashboardHome() {
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

    const stats = [
        { label: t("home.totalDesigns"), value: projects.length, icon: Palette, color: "text-violet-500" },
        { label: t("home.creditsAvailable"), value: credits, icon: Sparkles, color: "text-amber-500" },
        { label: t("home.aiGenerations"), value: projects.filter(p => !p.type?.includes("Upload")).length, icon: Zap, color: "text-purple-500" },
    ]

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto h-full overflow-y-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("home.welcome")}</h1>
                    <p className="text-muted-foreground text-xs md:text-base mt-1">{t("home.readyToCreate")}</p>
                </div>
                <div className="flex gap-2">
                    {/* New Design button removed */}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className={cn("border-0 shadow-sm bg-muted/40 h-24", i === 2 && "col-span-2 md:col-span-1")}>
                        <div className="p-3 flex flex-col justify-center h-full gap-0.5">
                            <div className="flex flex-row items-center justify-between space-y-0">
                                <h3 className="text-xs font-medium text-muted-foreground">{stat.label}</h3>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                <CountUp
                                    to={stat.value}
                                    from={0}
                                    separator=","
                                    direction="up"
                                    duration={0.5}
                                    className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">{t("home.createVisualize")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Photoshoot */}
                    <Link href="/photoshoot" className="group">
                        <Card className="p-5 hover:bg-accent hover:border-primary/50 transition-all cursor-pointer border-dashed border-2 relative overflow-hidden h-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl leading-none tracking-tight">{t("home.photoshootTitle")}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 pl-1">{t("home.photoshootDesc")}</p>
                            </div>
                            <ArrowRight className="absolute top-5 right-5 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all text-violet-500" />
                        </Card>
                    </Link>

                    {/* 2. Virtual Try-On */}
                    <Link href="/photoshoot/try-on" className="group">
                        <Card className="p-5 hover:bg-accent hover:border-primary/50 transition-all cursor-pointer border-dashed border-2 relative overflow-hidden h-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl leading-none tracking-tight">{t("home.virtualTryOn")}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 pl-1">{t("home.virtualTryOnDesc")}</p>
                            </div>
                            <ArrowRight className="absolute top-5 right-5 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all text-pink-500" />
                        </Card>
                    </Link>

                    {/* 3. Ghost Model */}
                    <Link href="/photoshoot/ghost" className="group">
                        <Card className="p-5 hover:bg-accent hover:border-primary/50 transition-all cursor-pointer border-dashed border-2 relative overflow-hidden h-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <Shirt className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl leading-none tracking-tight">{t("home.ghostModelTitle")}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 pl-1">{t("home.ghostModelDesc")}</p>
                            </div>
                            <ArrowRight className="absolute top-5 right-5 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all text-blue-500" />
                        </Card>
                    </Link>

                    {/* 4. Train */}
                    <Link href="/train" className="group">
                        <Card className="p-5 hover:bg-accent hover:border-primary/50 transition-all cursor-pointer border-dashed border-2 relative overflow-hidden h-full">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg md:text-xl leading-none tracking-tight">{t("home.trainTitle")}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 pl-1">{t("home.trainDesc")}</p>
                            </div>
                            <ArrowRight className="absolute top-5 right-5 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all text-amber-500" />
                        </Card>
                    </Link>
                </div>
            </div>

            {/* Pro Plan Banner - Only show if not Pro */}
            {!isPro && (
                <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg w-full">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-3 gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold leading-none whitespace-nowrap">{t("home.proPlan")}</h2>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400/90 text-black text-[10px] font-bold uppercase tracking-wide shrink-0">
                                        PRO
                                    </span>
                                    <p className="text-white/80 text-xs truncate hidden md:block border-l border-white/20 pl-3 ml-1">
                                        {t("home.proPlanDesc")}
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 px-4 rounded-lg font-bold text-xs shadow hover:scale-105 transition-transform shrink-0"
                                onClick={() => router.push('/settings')}
                            >
                                {t("home.upgradeNow")}
                            </Button>
                        </div>
                        {/* Abstract background shapes simplified */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    </CardContent>
                </Card>
            )}

            {/* Recent & Trending Grid */}
            <div className="flex flex-col gap-8 pb-12">
                {/* Recent Projects Column - Full Width */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">{t("home.recentProjects")}</h2>
                        <Button variant="ghost" size="sm" asChild><Link href="/history">{t("home.viewAll")}</Link></Button>
                    </div>
                    <div className="space-y-1">
                        {recentProjects.map((project) => (
                            <div
                                key={project.id}
                                className="group flex items-center gap-4 p-2 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                                onClick={() => router.push('/history?image=' + encodeURIComponent(project.imageUrl))}
                            >
                                {/* Thumbnail */}
                                <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-muted border border-border/50">
                                    <img src={project.imageUrl} className="w-full h-full object-cover" />
                                </div>

                                {/* Info - Single Row */}
                                <div className="flex-1 flex items-center justify-between min-w-0 gap-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <h3 className="font-medium text-sm truncate max-w-[150px] md:max-w-xs">{project.title}</h3>
                                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-[10px] font-medium shrink-0">
                                            {project.type}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                        <span className="hidden sm:block">{formatTime(project.createdAt)}</span>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentProjects.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                                {t("home.noProjects")}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    )
}
