"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Wand2,
    Camera,
    Maximize,
    FileText,
    Layers,
    Palette,
    Shirt,
    UserSquare2,
    Folder,
    Globe,
    Settings,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Clock,
} from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"

interface LeftSidebarProps {
    variant?: "default" | "mobile"
}

export function LeftSidebar({ variant = "default" }: LeftSidebarProps) {
    const pathname = usePathname();
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true); // Default: expanded

    useEffect(() => {
        setMounted(true);
        // Load saved state from localStorage
        const saved = localStorage.getItem('sidebar-expanded');
        if (saved !== null) {
            setIsExpanded(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('sidebar-expanded', String(newState));
    };

    if (!mounted) return variant === "default" ? (
        <aside className="w-[240px] h-full border-r bg-white dark:bg-zinc-950 hidden md:flex" />
    ) : null;

    const designItems: { label: string; href: string; icon: any }[] = [
    ];

    const photoshootItems = [
        { label: t("sidebar.aiModel"), href: "/photoshoot", icon: Camera },
        { label: language === "tr" ? "Detay Oluştur" : "Detail Create", href: "/photoshoot/try-on", icon: Camera },
        { label: language === "tr" ? "Editorial" : "Editorial", href: "/editorial", icon: Camera },
        { label: t("sidebar.ghost"), href: "/photoshoot/ghost", icon: UserSquare2 },
    ];

    // E-Com as a separate main page
    const ecomItems = [
        { label: language === "tr" ? "E-Com Stüdyo" : "E-Com Studio", href: "/ecom", icon: ShoppingBag },
    ];

    const toolItems = [
        { label: t("sidebar.resize"), href: "/resize", icon: Maximize },
        { label: t("sidebar.techPack"), href: "/studio", icon: FileText },
        { label: t("sidebar.train"), href: "/train", icon: Sparkles },
    ];

    const libraryItems = [
        { label: t("sidebar.history"), href: "/history", icon: Clock },
    ];

    const renderItem = (item: { label: string; href: string; icon: any }) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (variant === "mobile") {
            return (
                <Link key={item.href} href={item.href}>
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive
                            ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                    </div>
                </Link>
            );
        }

        // Desktop Item
        return (
            <Link key={item.href} href={item.href} className="flex-shrink-0 block w-full">
                <div className={cn(
                    "flex items-center gap-3 px-3 h-11 rounded-xl transition-all overflow-hidden whitespace-nowrap",
                    isActive
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                    <div className="flex items-center justify-center w-6 h-6 shrink-0">
                        <Icon className="w-5 h-5" />
                    </div>
                    {isExpanded && (
                        <span className="font-medium text-sm truncate">
                            {item.label}
                        </span>
                    )}
                </div>
            </Link>
        );
    };

    const sidebarContent = (
        <>
            {/* Toggle Button - Desktop Only */}
            {variant === "default" && (
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-full h-10 mb-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={isExpanded ? "Daralt" : "Genişlet"}
                >
                    {isExpanded ? (
                        <ChevronLeft className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </button>
            )}


            {designItems.length > 0 && (
                <>
                    <div className="flex flex-col gap-1 md:gap-1">
                        {designItems.map(renderItem)}
                    </div>
                    <Separator className="my-2 opacity-50" />
                </>
            )}

            <div className="flex flex-col gap-1 md:gap-1">
                {photoshootItems.map(renderItem)}
            </div>

            <Separator className="my-2 opacity-50" />

            {/* E-Com Studio - Separate Section */}
            <div className="flex flex-col gap-1 md:gap-1">
                {ecomItems.map(renderItem)}
            </div>

            <Separator className="my-2 opacity-50" />

            <div className="flex flex-col gap-1 md:gap-1">
                {toolItems.map(renderItem)}
            </div>

            <Separator className="my-2 opacity-50" />

            <div className="flex flex-col gap-1 md:gap-1">
                {libraryItems.map(renderItem)}
            </div>

            <div className="flex-1" />

            <Separator className="my-2 opacity-50" />

            {/* Settings Item */}
            {variant === "mobile" ? (
                <Link href="/settings">
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        pathname === "/settings"
                            ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="font-medium text-sm">{t("sidebar.settings")}</span>
                    </div>
                </Link>
            ) : (
                <Link href="/settings" className="flex-shrink-0 block w-full">
                    <div className={cn(
                        "flex items-center gap-3 px-3 h-11 rounded-xl transition-all overflow-hidden whitespace-nowrap",
                        pathname === "/settings"
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                        <div className="flex items-center justify-center w-6 h-6 shrink-0">
                            <Settings className="w-5 h-5" />
                        </div>
                        {isExpanded && (
                            <span className="font-medium text-sm truncate">
                                {t("sidebar.settings")}
                            </span>
                        )}
                    </div>
                </Link>
            )}
        </>
    );

    if (variant === "mobile") {
        return (
            <div className="flex flex-col py-2 px-4 gap-1 h-full overflow-y-auto">
                {sidebarContent}
            </div>
        );
    }

    // Desktop Container - Width based on isExpanded state
    return (
        <aside className={cn(
            "h-full border-r bg-white dark:bg-zinc-950 flex flex-col py-4 px-3 gap-1 shrink-0 overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out z-50 relative shadow-sm",
            isExpanded ? "w-[220px]" : "w-[72px]"
        )}>
            {sidebarContent}
        </aside>
    )
}
