"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Plus, Edit3, BrainCircuit, LayoutGrid, Settings, CreditCard, User, LogOut, Sparkles, Globe, Moon, Sun, Menu, Zap } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/Sidebar"
import { useSession, signOut } from "next-auth/react"

export function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { credits, refreshCredits } = useProjects();
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
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
        <header className="h-[72px] border-b border-white/5 bg-[#0D0D0F] flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
            {/* Left Section: Mobile Menu & Logo */}
            <div className="flex items-center gap-6">
                {mounted && (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 font-bold">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[240px] bg-[#0D0D0F] border-white/5">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                                <SheetDescription>Access design and photoshoot tools</SheetDescription>
                            </SheetHeader>
                            <div className="p-6 border-b border-white/5">
                                <Link href="/home" className="flex items-center gap-2 font-black text-xl tracking-tighter text-white">
                                    <div className="w-9 h-4.5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
                                        <div className="w-[1px] h-2 bg-[#0D0D0F]/70 rounded-full ml-1" />
                                        <div className="w-3 h-3 bg-[#0D0D0F] rounded-full shadow-sm" />
                                    </div>
                                    <span>ModeOn.<span className="text-[#F5F5F5]">ai</span></span>
                                </Link>
                            </div>
                            <div className="flex flex-col py-4 h-full">
                                <Sidebar variant="mobile" />
                            </div>
                        </SheetContent>
                    </Sheet>
                )}

                {/* Logo */}
                <Link href="/home" className="flex items-center gap-2 font-black text-xl tracking-tighter text-white hover:opacity-80 transition-opacity">
                    <div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
                        <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
                        <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
                    </div>
                    <span>ModeOn<span className="text-[#F5F5F5]">.ai</span></span>
                </Link>
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
                        className="flex items-center gap-2 md:gap-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md cursor-pointer hover:bg-white/10 transition-all group"
                        onClick={() => router.push('/settings?tab=billing')}
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-white/5 text-[#F5F5F5] group-hover:bg-white/10 transition-colors">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col items-start leading-none gap-0.5">
                                <span className="hidden md:inline text-[9px] text-zinc-500 font-black uppercase tracking-widest">{t("settings.credits")}</span>
                                <span className="text-sm font-black text-[#F5F5F5] tabular-nums">{credits}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                </Button>

                {/* Language Switcher & User Dropdown */}
                {mounted && (
                    <>
                        {/* Language Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                    <Globe className="w-4 h-4" />
                                    {language.toUpperCase()}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent" : ""}>
                                    🇬🇧 English
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("tr")} className={language === "tr" ? "bg-accent" : ""}>
                                    🇹🇷 Türkçe
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="w-9 h-9 border cursor-pointer hover:ring-2 ring-violet-500 transition-all">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "RO"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {/* User Info */}
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name || user?.email || "RetoucherOZ"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email || user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Credits */}
                                <div className="px-2 py-3">
                                    <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-200 dark:border-violet-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t("settings.credits")}</p>
                                                <p className="font-bold text-lg leading-none">{credits}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => router.push('/settings')}>
                                            {t("settings.topUp")}
                                        </Button>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />

                                {/* Menu Items */}
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{t("settings.profile")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>{t("settings.billing")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>{t("settings.security")}</span>
                                </DropdownMenuItem>
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
                    </>
                )}
            </div>
        </header>
    )
}
