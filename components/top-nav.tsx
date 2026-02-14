"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Plus, Edit3, BrainCircuit, LayoutGrid, Settings, CreditCard, User, LogOut, Sparkles, Globe, Moon, Sun, Menu } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { LeftSidebar } from "@/components/left-sidebar"
import { TbLayoutSidebar } from "react-icons/tb"

interface TopNavProps {
    onToggleSidebar?: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { credits } = useProjects();
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Session fetch failed", err));
    }, []);

    const navItems = [
        { label: t("nav.home"), href: "/home", icon: Home },
        { label: t("nav.create"), href: "/photoshoot", icon: Plus, isPrimary: true },
        { label: t("nav.train"), href: "/train", icon: BrainCircuit },
    ];

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
            {/* Left Section: Mobile Menu & Logo */}
            <div className="flex items-center gap-2">
                {mounted && (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[240px]">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                                <SheetDescription>Access design and photoshoot tools</SheetDescription>
                            </SheetHeader>
                            <div className="p-6 border-b">
                                <Link href="/home" className="flex items-center font-bold text-xl tracking-tight">
                                    {user?.customLogo ? (
                                        <img src={user.customLogo} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
                                    ) : user?.customTitle ? (
                                        <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent font-black">{user.customTitle}</span>
                                    ) : (
                                        <>
                                            <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent font-black">rawless</span><span className="font-black">.ai</span>
                                        </>
                                    )}
                                </Link>
                            </div>
                            <div className="flex flex-col py-4 h-full">
                                <LeftSidebar variant="mobile" />
                            </div>
                        </SheetContent>
                    </Sheet>
                )}

                {/* Desktop Sidebar Toggle */}
                {mounted && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0 ml-px"
                        onClick={onToggleSidebar}
                    >
                        <TbLayoutSidebar className="size-5" />
                    </Button>
                )}

                {/* Logo */}
                <Link href="/home" className="flex items-center font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                    {user?.customLogo ? (
                        <img src={user.customLogo} alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
                    ) : user?.customTitle ? (
                        <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent font-black">{user.customTitle}</span>
                    ) : (
                        <>
                            <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent font-black">rawless</span><span className="font-black">.ai</span>
                        </>
                    )}
                </Link>
            </div>

            {/* Central Nav - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-1 md:gap-4 flex-1 justify-center mx-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <div className={cn(
                                "flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap gap-2",
                                isActive
                                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                                    : item.isPrimary
                                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}>
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-3">
                {/* Credit Display */}
                {mounted && (
                    <div
                        className="flex items-center gap-3 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all group"
                        onClick={() => router.push('/settings?section=billing')}
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start leading-none gap-0.5">
                                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium uppercase tracking-wider">{t("settings.credits")}</span>
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">{credits}</span>
                            </div>
                        </div>
                        <div className="hidden md:block w-[1px] h-6 bg-amber-200 dark:bg-amber-800 mx-1" />
                        <div className="rounded-full p-1 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                            <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>RO</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {/* User Info */}
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">rawless Designer</p>
                                        <p className="text-xs leading-none text-muted-foreground">designer@rawless.ai</p>
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
                                        await fetch('/api/auth/logout', { method: 'POST' });
                                        router.replace('/');
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
