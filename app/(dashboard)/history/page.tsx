"use client"

import { useState, useEffect, Suspense } from "react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Download, Trash2, ExternalLink, Search, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { downloadImage } from "@/lib/utils"

function HistoryPageContent() {
    const { projects, deleteProject } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            setSelectedId(id);
        } else {
            setSelectedId(null);
        }
    }, [searchParams]);

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.type && p.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectedProject = projects.find(p => p.id === selectedId);

    const formatDate = (dateString: string | number) => {
        return new Date(dateString).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (selectedId && selectedProject) {
        return (
            <div className="h-[calc(100vh-60px)] flex flex-col p-6 overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/history")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">{selectedProject.title}</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                    <div className="flex-1 bg-muted/20 rounded-xl border-2 border-dashed flex items-center justify-center p-8 overflow-hidden relative group">
                        <img
                            src={selectedProject.imageUrl}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            alt={selectedProject.title}
                        />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" onClick={() => downloadImage(selectedProject.imageUrl, `${selectedProject.title}.png`)}>
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] bg-card border rounded-xl p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{language === "tr" ? "Detaylar" : "Details"}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">{language === "tr" ? "Tarih" : "Date"}</span>
                                    <span>{formatDate(selectedProject.createdAt)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">{language === "tr" ? "Tür" : "Type"}</span>
                                    <span>{selectedProject.type}</span>
                                </div>
                            </div>
                        </div>

                        {selectedProject.description && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{language === "tr" ? "Açıklama" : "Description"}</h3>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                    {selectedProject.description}
                                </p>
                            </div>
                        )}

                        <div className="mt-auto flex flex-col gap-2">
                            <Button onClick={() => router.push(`/studio?image=${encodeURIComponent(selectedProject.imageUrl)}`)} className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {language === "tr" ? "Stüdyoda Düzenle" : "Edit in Studio"}
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                    deleteProject(selectedProject.id);
                                    router.push("/history");
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === "tr" ? "Sil" : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-60px)] p-6 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{language === "tr" ? "Geçmiş" : "History"}</h1>
                    <p className="text-muted-foreground mt-1">
                        {language === "tr" ? "Tüm tasarımlarınız ve işlemleriniz." : "All your designs and generations."}
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={language === "tr" ? "Ara..." : "Search..."}
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            className="group cursor-pointer overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all hover:shadow-lg"
                            onClick={() => router.push(`/history?id=${project.id}`)}
                        >
                            <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                                <img
                                    src={project.imageUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-white text-xs font-medium truncate">{project.title}</p>
                                    <p className="text-white/70 text-[10px]">{formatDate(project.createdAt).split(' ')[0]}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Calendar className="w-12 h-12 mb-4 opacity-20" />
                    <p>{language === "tr" ? "Henüz bir kayıt yok." : "No history found."}</p>
                </div>
            )}
        </div>
    )
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <HistoryPageContent />
        </Suspense>
    )
}
