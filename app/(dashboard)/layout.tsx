"use client"

import { TopNav } from "@/components/top-nav"
import { LeftSidebar } from "@/components/left-sidebar"
import { SidebarProvider } from "@/context/sidebar-context"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex flex-col bg-background">
                <TopNav />
                <div className="flex flex-1 overflow-hidden">
                    <aside className="hidden md:flex shrink-0">
                        <LeftSidebar />
                    </aside>
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}
