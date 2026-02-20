"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import {
    TbSmartHome,
    TbShieldLock,
    TbCameraPlus,
    TbHanger,
    TbPhotoScan,
    TbMovie,
    TbFaceId,
    TbGhost2,
    TbMaximize,
    TbAnalyze,
    TbWand,
    TbShoppingBag,
    TbClipboardText,
    TbHistory,
    TbSettings,
    TbLayoutSidebarLeftCollapse,
    TbLayoutSidebarLeftExpand,
} from "react-icons/tb"
import { useLanguage } from "@/context/language-context"
import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
    variant?: "default" | "mobile"
}

export function Sidebar({ variant = "default" }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isKvActive, setIsKvActive] = useState(true);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('sidebar-expanded');
        if (saved !== null) {
            setIsExpanded(saved === 'true');
        }

        // Fetch user session for RBAC
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                setIsKvActive(data.isKvActive);
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Session fetch failed", err))
            .finally(() => setIsLoading(false));
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('sidebar-expanded', String(newState));
    };

    if (!mounted) return variant === "default" ? (
        <aside className="w-[240px] h-full border-r bg-[var(--bg-sidebar)] hidden md:flex" />
    ) : null;

    const isAuthorized = (path: string) => {
        if (!isKvActive) return true;
        // Don't show everything while loading, only home
        if (isLoading) return path === '/home';
        if (process.env.NODE_ENV === 'development' && !user) return true;
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.authorizedPages?.includes(path) || user.authorizedPages?.includes('*');
    };

    // --- ITEM GROUPS ---

    const mainItems = [
        { label: t("nav.home"), href: '/home', icon: TbSmartHome },
    ];

    const adminItems = (user?.role === 'admin' || !isKvActive || (process.env.NODE_ENV === 'development' && (isLoading || !user))) ? [
        { label: "Admin Panel", href: '/admin', icon: TbShieldLock },
    ] : [];

    // STÜDYO Group
    const studioItems = [
        { label: t("sidebar.photoshoot"), href: '/photoshoot', icon: TbCameraPlus },

        { label: t("sidebar.editorial"), href: '/editorial', icon: TbPhotoScan },
        { label: t("sidebar.video"), href: '/video', icon: TbMovie },
        { label: t("sidebar.faceHeadSwap"), href: '/face-head-swap', icon: TbFaceId },
        { label: t("sidebar.ghost"), href: '/photoshoot/ghost', icon: TbHanger },
    ].filter(item => isAuthorized(item.href));

    // ARAÇLAR Group
    const toolItems = [
        { label: t("sidebar.resize"), href: '/resize', icon: TbMaximize },
        { label: t("sidebar.analysis"), href: '/analysis', icon: TbAnalyze },
        { label: t("sidebar.train"), href: '/train', icon: TbWand },
    ].filter(item => isAuthorized(item.href));

    // KATALOG Group
    const catalogItems = [
        { label: t("sidebar.techPack"), href: '/studio', icon: TbClipboardText },
    ].filter(item => isAuthorized(item.href));


    const bottomItems = [
        { label: t("sidebar.history"), href: '/history', icon: TbHistory },
        { label: t("sidebar.settings"), href: '/settings', icon: TbSettings },
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
                            ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-medium"
                            : "text-[var(--sidebar-item-text)] hover:bg-[var(--sidebar-hover-bg)]"
                    )}>
                        <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[var(--accent-primary)]" : "text-[var(--sidebar-icon-passive)]")} />
                        <span className="text-sm">{item.label}</span>
                    </div>
                </Link>
            );
        }

        return (
            <Link key={item.href} href={item.href} className="flex-shrink-0 block w-full group relative mb-0.5" title={!isExpanded ? item.label : undefined}>
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-150 overflow-hidden whitespace-nowrap",
                    isActive
                        ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-medium border-l-[3px] border-[var(--accent-primary)]"
                        : "text-[var(--sidebar-item-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] border-l-[3px] border-transparent"
                )}>
                    <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[var(--accent-primary)]" : "text-[var(--sidebar-icon-passive)] group-hover:text-[var(--text-primary)]")} />

                    {isExpanded && (
                        <span className="text-sm truncate transition-colors">
                            {item.label}
                        </span>
                    )}
                </div>
            </Link>
        );
    };

    const renderGroupHeader = (title: string) => {
        if (!isExpanded) return <Separator className="my-2 border-[var(--border-subtle)] mx-4 w-auto" />;

        return (
            <div className="px-6 pt-6 pb-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sidebar-group-label)]">
                    {title}
                </span>
            </div>
        );
    };

    const sidebarContent = (
        <>
            {variant === "default" && (
                <div className="flex items-center mb-4 pt-2 px-[15px]">
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                            "bg-transparent hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] border border-transparent hover:border-[var(--accent-soft)] shadow-none hover:shadow-sm"
                        )}
                        title={isExpanded ? "Daralt" : "Genişlet"}
                    >
                        {isExpanded ? (
                            <TbLayoutSidebarLeftCollapse className="w-6 h-6" />
                        ) : (
                            <TbLayoutSidebarLeftExpand className="w-6 h-6" />
                        )}
                    </button>
                </div>
            )}

            <div className="space-y-0.5">
                {mainItems.map(renderItem)}
                {adminItems.map(renderItem)}
            </div>

            {/* STÜDYO */}
            <div>
                {renderGroupHeader(t("sidebar.studio"))}
                <div className="space-y-0.5">
                    {studioItems.map(renderItem)}
                </div>
            </div>

            {/* ARAÇLAR */}
            <div>
                {renderGroupHeader(t("sidebar.tools"))}
                <div className="space-y-0.5">
                    {toolItems.map(renderItem)}
                </div>
            </div>

            {/* KATALOG */}
            <div>
                {renderGroupHeader(t("sidebar.catalog"))}
                <div className="space-y-0.5">
                    {catalogItems.map(renderItem)}
                </div>
            </div>

            <div className="flex-1" />

            {/* Bottom Items */}
            <div className="mt-auto space-y-0.5 pb-4">
                {bottomItems.map(renderItem)}
            </div>
        </>
    );

    if (variant === "mobile") {
        return (
            <div className="flex flex-col py-2 px-4 gap-1 h-full overflow-y-auto bg-[var(--bg-sidebar)]">
                {sidebarContent}
            </div>
        );
    }

    return (
        <aside className={cn(
            "h-full border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col py-4 gap-0 shrink-0 overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out z-50 relative shadow-xl",
            isExpanded ? "w-[240px]" : "w-[72px]"
        )}>
            {sidebarContent}
        </aside>
    )
}
