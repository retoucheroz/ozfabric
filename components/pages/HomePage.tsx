"use client"

import { Plus, Shirt, Zap, Layers, Sparkles, TrendingUp, Palette, ArrowRight, CreditCard, Wand2, Camera, Video as VideoIcon, Package } from "lucide-react"
import { TbFaceId } from "react-icons/tb"
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

    const quickActions = [
        { href: "/photoshoot", icon: Camera, titleKey: "home.photoshootTitle", descKey: "home.photoshootDesc" },
        { href: "/editorial", icon: Layers, titleKey: "home.editorialTitle", descKey: "home.editorialDesc" },
        { href: "/product", icon: Package, titleKey: "product.title", descKey: "product.subtitle" },
        { href: "/video", icon: VideoIcon, titleKey: "home.videoTitle", descKey: "home.videoDesc" },
        { href: "/photoshoot/ghost", icon: Shirt, titleKey: "home.ghostModelTitle", descKey: "home.ghostModelDesc" },
        { href: "/face-head-swap", icon: TbFaceId, titleKey: "home.faceSwapTitle", descKey: "home.faceSwapDesc" }
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t("home.welcome")}</h1>
                    <p className="text-[13px] font-medium text-zinc-400 mt-1">{t("home.readyToCreate")}</p>
                </div>
                <div className="flex gap-2">
                    {/* New Design button removed */}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-white mt-8 mb-4">{t("home.createVisualize")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href} className="group block h-full">
                            <div className="relative overflow-hidden bg-[#18181B] border border-white/10 p-4 h-full flex flex-col rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:bg-[#1F1F23] hover:border-white/20">
                                {/* Glow Effect */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[#FF3D5A]" />

                                <div className="relative flex flex-col h-full space-y-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 transition-colors duration-500 group-hover:bg-[#FF3D5A]/10 group-hover:text-[#FF3D5A]">
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 mt-2">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 group-hover:text-zinc-300 transition-colors mb-1">{t(action.titleKey)}</h3>
                                        <p className="text-[11px] font-bold italic text-zinc-400 line-clamp-2 leading-tight">{t(action.descKey)}</p>
                                    </div>
                                    <div className="pt-2 mt-auto">
                                        <div className="h-1 w-0 group-hover:w-full transition-all duration-700 rounded-full bg-[#FF3D5A]" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent & Trending Grid */}
            <div className="flex flex-col gap-8 pb-12">
                {/* Recent Projects Column - Full Width */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-white">{t("home.recentProjects")}</h2>
                        <Link href="/history" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 hover:text-white transition-colors">{t("home.viewAll")}</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {recentProjects.map((project) => (
                            <div
                                key={project.id}
                                className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-[#18181B] border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.01]"
                                onClick={() => router.push('/history?image=' + encodeURIComponent(project.imageUrl))}
                            >
                                <img
                                    src={project.imageUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt={project.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F]/90 via-[#0D0D0F]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-white truncate mb-1">{project.title}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{project.type}</span>
                                </div>
                            </div>
                        ))}
                        {recentProjects.length === 0 && (
                            <div className="col-span-full py-20 text-center text-zinc-400 bg-[#121214] rounded-2xl border border-dashed border-white/20">
                                {t("home.noProjects")}
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    )
}
