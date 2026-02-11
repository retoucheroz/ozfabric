"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/language-context"
import {
    LayoutDashboard, // For Home
    Palette,
    Scissors,
    Camera,
    Shirt,
    User,
    MonitorPlay,
    Box,
    Layers,
    Wand2, // Magic wand for styles/generation
    Settings, // for Settings
    Folder, // for Collections
    Globe, // for Community
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppSidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { language } = useLanguage()

    const sections = [
        {
            label: "Overview",
            items: [
                {
                    label: "Dashboard",
                    icon: LayoutDashboard,
                    href: "/home",
                },
            ],
        },
        {
            label: "Design",
            items: [
                {
                    label: "Styles",
                    icon: Wand2,
                    href: "/design/styles",
                },
                {
                    label: "Patterns",
                    icon: Layers,
                    href: "/design/patterns",
                },
                {
                    label: "Retexture",
                    icon: Palette,
                    href: "/design/retexture",
                },
                {
                    label: "Collections",
                    icon: Folder,
                    href: "/collections",
                },
                {
                    label: "Community Feed",
                    icon: Globe,
                    href: "/community",
                },
            ],
        },
        {
            label: "Photoshoot",
            items: [
                {
                    label: "Ghost Ph.",
                    icon: Shirt,
                    href: "/photoshoot/ghost",
                },
                {
                    label: "MAVI EU",
                    icon: User,
                    href: "/photoshoot/mannequin",
                },
                {
                    label: language === "tr" ? "Detay Oluştur" : "Detail Create",
                    icon: Camera,
                    href: "/photoshoot/try-on",
                },
                {
                    label: "E-Com",
                    icon: Box,
                    href: "/photoshoot/ecom",
                },
            ],
        },
        {
            label: "Studio",
            items: [
                {
                    label: "Studio",
                    icon: MonitorPlay,
                    href: "/studio",
                },
            ]
        },
        {
            label: "Account",
            items: [
                {
                    label: "Settings",
                    icon: Settings,
                    href: "/settings",
                }
            ]
        }
    ]

    return (
        <div className={cn("pb-12 h-full border-r bg-background", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-6 px-4 flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-full" />
                        <h2 className="text-lg font-bold tracking-tight">
                            OzFabric
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {sections.map((section, i) => (
                            <div key={i}>
                                <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {section.label}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <Button
                                            key={item.href}
                                            variant={pathname === item.href || pathname?.startsWith(item.href + "/") ? "secondary" : "ghost"}
                                            className="w-full justify-start font-medium"
                                            asChild
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
