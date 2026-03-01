"use client"

import { TopNav } from "@/components/layout/TopNav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-auto bg-[var(--bg-sidebar)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
