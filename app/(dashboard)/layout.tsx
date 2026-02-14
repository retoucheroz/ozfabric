"use client"

import { useState, useEffect } from "react"
import { TopNav } from "@/components/top-nav"
import { LeftSidebar } from "@/components/left-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('sidebar-expanded');
        if (saved !== null) {
            setSidebarExpanded(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarExpanded;
        setSidebarExpanded(newState);
        localStorage.setItem('sidebar-expanded', String(newState));
    };

    if (!mounted) {
        return <div className="min-h-screen bg-background" />; // Prevent hydration mismatch
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopNav onToggleSidebar={toggleSidebar} />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex shrink-0">
                    <LeftSidebar variant="default" isExpanded={sidebarExpanded} />
                </aside>
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )

}
