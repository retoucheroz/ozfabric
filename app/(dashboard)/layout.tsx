"use client"

import { TopNav } from "@/components/layout/TopNav"
import { Sidebar } from "@/components/layout/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:flex shrink-0">
                    <Sidebar />
                </aside>
                <main className="flex-1 overflow-auto bg-[var(--bg-sidebar)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
