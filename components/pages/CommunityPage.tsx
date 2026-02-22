"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wand2, Copy, Heart, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { COMMUNITY_DESIGNS } from "@/lib/data"

import React from "react"

export default function CommunityPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [isAdmin, setIsAdmin] = React.useState(false);

    React.useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated && data.user?.role === 'admin') {
                    setIsAdmin(true)
                }
            })
            .catch(() => { })
    }, [])

    const handleRemix = (prompt: string) => {
        router.push(`/design/styles?prompt=${encodeURIComponent(prompt)}`);
        toast.success(t("community.promptLoaded") || "Prompt loaded! Click Generate.");
    }

    const handleCopy = (prompt: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt);
        toast.success(t("community.promptCopied") || "Prompt copied to clipboard");
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("community.title")}</h1>
                    <p className="text-muted-foreground mt-2">{t("community.subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><TrendingUp className="w-4 h-4 mr-2" /> {t("home.trending")}</Button>
                    <Button variant="ghost">{t("community.newest") || "Newest"}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COMMUNITY_DESIGNS.map((design) => (
                    <Card key={design.id} className="overflow-hidden group border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-muted/20">
                        <div className="aspect-[3/4] relative overflow-hidden">
                            <img src={design.image} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <p className="text-white font-bold text-lg mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{design.title}</p>
                                {isAdmin && (
                                    <p className="text-white/70 text-xs line-clamp-2 mb-4 italic translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">"{design.prompt}"</p>
                                )}
                                <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                                    <Button size="sm" onClick={() => handleRemix(design.prompt)} className="flex-1 bg-white text-black hover:bg-white/90 font-medium">
                                        <Wand2 className="w-4 h-4 mr-2" /> {t("community.remix")}
                                    </Button>
                                    {isAdmin && (
                                        <Button size="sm" variant="outline" onClick={(e) => handleCopy(design.prompt, e)} className="border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 flex items-center justify-between bg-card">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold shadow-sm">
                                    {design.author[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium leading-none">@{design.author}</span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">{t("community.topCreator") || "Top Creator"}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                {design.likes}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="h-12" />
        </div>
    )
}
