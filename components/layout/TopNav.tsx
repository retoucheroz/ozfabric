"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Plus, Edit3, BrainCircuit, LayoutGrid, Settings, CreditCard, User, LogOut, Sparkles, Globe, Moon, Sun, Zap, Coins } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
    TbCameraPlus,
    TbPhotoScan,
    TbMovie,
    TbFaceId,
    TbHanger,
    TbMaximize,
    TbAnalyze,
    TbWand,
    TbShieldLock,
    TbClipboardText,
    TbHistory
} from "react-icons/tb"

export function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { credits, refreshCredits } = useProjects();
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeCategory, setActiveCategory] = useState<"studio" | "tools" | null>(null);
    const { data: session } = useSession();
    const user = session?.user as any;

    useEffect(() => {
        setMounted(true);
        refreshCredits();
    }, []);

    const navItems = [
        { label: t("nav.home"), href: "/home", icon: Home },
        { label: t("nav.create"), href: "/photoshoot", icon: Plus, isPrimary: true },
        { label: t("nav.train"), href: "/train", icon: BrainCircuit },
    ];

    return (
        <header className="sticky top-0 z-50 flex flex-col w-full bg-[#0D0D0F] border-b border-white/5">
            {/* Main Header Row */}
            <div className="h-[72px] flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">
                {/* Left Section: Mobile Menu & Logo */}
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/home" className="flex items-center gap-2 font-black text-xl tracking-tighter text-white hover:opacity-80 transition-opacity">
                        <div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
                            <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
                            <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
                        </div>
                        <span>ModeOn<span className="text-[#F5F5F5]">.ai</span></span>
                    </Link>

                    {/* Main Navigation Categories */}
                    {mounted && (
                        <nav className="flex items-center ml-4">
                            <button
                                onClick={() => setActiveCategory(activeCategory === "studio" ? null : "studio")}
                                className={cn(
                                    "px-4 md:px-6 h-[72px] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                    activeCategory === "studio"
                                        ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t("sidebar.studio") || "STUDIO"}
                            </button>
                            <button
                                onClick={() => setActiveCategory(activeCategory === "tools" ? null : "tools")}
                                className={cn(
                                    "px-4 md:px-6 h-[72px] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                    activeCategory === "tools"
                                        ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t("sidebar.tools") || "TOOLS"}
                            </button>
                            <Link
                                href="/history"
                                className={cn(
                                    "px-4 md:px-6 h-[72px] flex items-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                    pathname === "/history"
                                        ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {t("sidebar.history") || "HISTORY"}
                            </Link>
                        </nav>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Pro Upgrade Pill */}
                    {mounted && (
                        <div
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] hover:bg-white text-black rounded-md cursor-pointer transition-all shadow-none group"
                            onClick={() => router.push('/pricing')}
                        >
                            <Zap className="w-3.5 h-3.5 fill-black" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t("home.upgradeNow")}</span>
                        </div>
                    )}

                    {/* Credit Display */}
                    {mounted && (
                        <div
                            className="flex items-center gap-2 md:gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-md cursor-pointer hover:bg-white/10 transition-all group"
                            onClick={() => router.push('/settings?tab=billing')}
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-white/5 text-[#F5F5F5] group-hover:bg-white/10 transition-colors">
                                    <Coins className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col items-start leading-none gap-0">
                                    <span className="hidden md:inline text-[9px] text-zinc-500 font-black uppercase tracking-widest">{t("settings.credits")}</span>
                                    <span className="text-sm font-black text-[#F5F5F5] tabular-nums">{credits}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Dropdown */}
                    {mounted && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="w-9 h-9 border cursor-pointer hover:ring-2 ring-violet-500 transition-all">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {/* User Info */}
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name || user?.email || "User"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Menu Items */}
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{t("settings.profile")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>{t("settings.security")}</span>
                                </DropdownMenuItem>

                                {/* === CRITICAL SECURITY RULE: The Admin Panel MUST be visible to users with the 'admin' role OR the legacy 'admin' username/email. === */}
                                {(user?.role === 'admin' || user?.name?.toLowerCase() === 'admin' || (user?.email as string)?.toLowerCase() === 'admin' || user?.name?.toLowerCase() === 'retoucheroz') && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer text-amber-500 focus:text-amber-500">
                                            <TbShieldLock className="mr-2 h-4 w-4" />
                                            <span>Admin Panel</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {/* ================================================================ */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={async () => {
                                        await signOut({ callbackUrl: '/' });
                                    }}
                                    className="cursor-pointer text-red-500 focus:text-red-500"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t("settings.logOut")}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Sub-navigation Bar (Integrated) */}
            <AnimatePresence>
                {activeCategory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="overflow-hidden bg-[#0D0D0F] border-b border-white/5"
                    >
                        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-center gap-6 md:gap-8">
                            {activeCategory === "studio" ? (
                                <>
                                    <SubNavItem href="/photoshoot" icon={TbCameraPlus} label={t("sidebar.photoshoot")} active={pathname === "/photoshoot"} />
                                    <SubNavItem href="/editorial" icon={TbPhotoScan} label={t("sidebar.editorial")} active={pathname === "/editorial"} />
                                    <SubNavItem href="/video" icon={TbMovie} label={t("sidebar.video")} active={pathname === "/video"} />
                                    <SubNavItem href="/face-head-swap" icon={TbFaceId} label={t("sidebar.faceHeadSwap")} active={pathname === "/face-head-swap"} />
                                    <SubNavItem href="/photoshoot/ghost" icon={TbHanger} label={t("sidebar.ghost")} active={pathname === "/photoshoot/ghost"} />
                                </>
                            ) : (
                                <>
                                    <SubNavItem href="/resize" icon={TbMaximize} label={t("sidebar.resize")} active={pathname === "/resize"} />
                                    <SubNavItem href="/studio" icon={TbClipboardText} label={t("sidebar.techPack")} active={pathname === "/studio"} />
                                    <SubNavItem href="/analysis" icon={TbAnalyze} label={t("sidebar.analysis")} active={pathname === "/analysis"} />
                                    <SubNavItem href="/train" icon={TbWand} label={t("sidebar.train")} active={pathname === "/train"} />
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

function SubNavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group",
                active ? "bg-white/10 text-[#F5F5F5]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
            )}
        >
            <Icon className={cn("w-4 h-4 transition-colors", active ? "text-[#F5F5F5]" : "text-zinc-600 group-hover:text-zinc-400")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </Link>
    )
}
