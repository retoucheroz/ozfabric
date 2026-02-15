"use client"

import { useState } from "react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Folder } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CollectionsPage() {
    const { collections, addCollection, projects } = useProjects();
    const { t } = useLanguage();
    const router = useRouter();
    const [newTitle, setNewTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = () => {
        if (!newTitle.trim()) return;
        addCollection({ title: newTitle, projectIds: [] });
        setNewTitle("");
        setIsCreating(false);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("collections.title")}</h1>
                    <p className="text-muted-foreground mt-1">{t("collections.subtitle")}</p>
                </div>
                <Button size="lg" onClick={() => setIsCreating(!isCreating)} className="shadow-lg bg-violet-500 text-white hover:bg-violet-600">
                    <Plus className="w-5 h-5 mr-2" /> {t("collections.newCollection")}
                </Button>
            </div>

            {isCreating && (
                <Card className="p-6 max-w-md animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold mb-4">{t("collections.createFirst")}</h3>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Winter 2026..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            autoFocus
                        />
                        <Button onClick={handleCreate} className="bg-violet-500 text-white hover:bg-violet-600">{t("photoshoot.create")}</Button>
                    </div>
                </Card>
            )}

            {collections.length === 0 && !isCreating && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold mb-2">{t("collections.createFirst")}</h3>
                    <p className="text-muted-foreground mb-4">{t("collections.createFirstDesc")}</p>
                    <Button onClick={() => setIsCreating(true)} className="bg-violet-500 text-white hover:bg-violet-600">
                        <Plus className="w-4 h-4 mr-2" /> {t("collections.newCollection")}
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map(collection => {
                    const cover = collection.projectIds.length > 0
                        ? projects.find(p => p.id === collection.projectIds[0])?.imageUrl
                        : null;

                    return (
                        <Card
                            key={collection.id}
                            className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all"
                            onClick={() => router.push(`/collections/${collection.id}`)}
                        >
                            <div className="aspect-video bg-muted relative overflow-hidden">
                                {cover ? (
                                    <img src={cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/30">
                                        <Folder className="w-12 h-12 opacity-50 mb-2" />
                                        <span className="text-sm">{t("collections.empty") || "Empty Collection"}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                    <h3 className="text-white text-xl font-bold">{collection.title}</h3>
                                    <p className="text-white/80 text-sm mt-1">{collection.projectIds.length} {t("collections.items")}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    )
}
