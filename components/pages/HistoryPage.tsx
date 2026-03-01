"use client"

import Image from "next/image"
import { useProjects, Project } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import {
    Search,
    Download,
    Trash2,
    Grid2X2,
    Image as ImageIcon,
    Calendar,
    Copy,
    Star,
    PlayCircle,
    FolderOpen,
    FolderPlus,
    CheckCircle2,
    X,
    MoreVertical,
    Move,
    PlusCircle,
    DownloadCloud
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label as UILabel } from "@/components/ui/label"

export default function HistoryPage() {
    const { projects, deleteProject, updateProject, collections, addCollection, addToCollection, removeFromCollection } = useProjects()
    const { language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "image" | "video">("all")
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>("all")
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(4) // 2 to 8. Higher = Zoom In (Fewer columns)
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
    const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                const user = data?.user;
                if (user?.role === 'admin' || user?.name?.toLowerCase() === 'admin' || (user?.email as string)?.toLowerCase() === 'admin' || user?.name?.toLowerCase() === 'retoucheroz') {
                    setIsAdmin(true)
                }
            })
            .catch(() => { })
    }, [])

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                const searchLower = searchQuery.toLowerCase();
                const matchesSearch = p.title.toLowerCase().includes(searchLower) ||
                    (p.description && p.description.toLowerCase().includes(searchLower));
                const matchesMedia = mediaTypeFilter === "all" || (p.mediaType === mediaTypeFilter) || (mediaTypeFilter === "image" && !p.mediaType);
                const matchesFavorite = !showOnlyFavorites || p.isFavorite;

                // Collection filter
                const matchesCollection = selectedCollectionId === "all" ||
                    collections.find(c => c.id === selectedCollectionId)?.projectIds.includes(p.id);

                return matchesSearch && matchesMedia && matchesFavorite && matchesCollection;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
    }, [projects, searchQuery, mediaTypeFilter, showOnlyFavorites, selectedCollectionId, collections])

    const handleDelete = (id: string) => {
        if (confirm(language === "tr" ? "Bu projeyi silmek istediğinize emin misiniz?" : "Are you sure you want to delete this project?")) {
            deleteProject(id);
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
            toast.success(language === "tr" ? "Proje silindi" : "Project deleted")
        }
    }

    const handleBulkDelete = () => {
        if (!selectedIds.length) return;
        if (confirm(language === "tr" ? `${selectedIds.length} öğeyi silmek istediğinize emin misiniz?` : `Are you sure you want to delete ${selectedIds.length} items?`)) {
            selectedIds.forEach(id => deleteProject(id));
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast.success(language === "tr" ? "Öğeler silindi" : "Items deleted");
        }
    }

    const toggleFavorite = (id: string, current: boolean) => {
        updateProject(id, { isFavorite: !current });
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const selectAll = () => {
        if (selectedIds.length === filteredProjects.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProjects.map(p => p.id));
        }
    }

    const handleDownload = async (imageUrl: string, title: string) => {
        try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (e) {
            toast.error(language === "tr" ? "İndirme başarısız" : "Download failed")
        }
    }

    // Grid columns logic: Slider 2 -> 8 Cols (Zoom Out), Slider 8 -> 2 Cols (Zoom In)
    const gridCols = 10 - zoomLevel;

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F] overflow-hidden text-white">
            {/* STICKY TOOLBAR */}
            <div className="shrink-0 z-[40] bg-[#0D0D0F]/80 backdrop-blur-xl border-b border-white/5 py-4 px-8 flex items-center justify-between gap-4 sticky top-0">
                <div className="flex items-center gap-6">
                    {/* Collection/Folder Selector */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 px-3 bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center gap-2 rounded-lg">
                                    <FolderOpen className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {selectedCollectionId === "all"
                                            ? (language === "tr" ? "TÜM PROJELER" : "ALL PROJECTS")
                                            : collections.find(c => c.id === selectedCollectionId)?.title.toUpperCase() || "FOLDER"}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 bg-zinc-900 border-white/10 text-white">
                                <DropdownMenuItem onClick={() => setSelectedCollectionId("all")} className="text-[10px] font-black uppercase tracking-widest">
                                    {language === "tr" ? "TÜM PROJELER" : "ALL PROJECTS"}
                                </DropdownMenuItem>
                                {collections.map(c => (
                                    <DropdownMenuItem key={c.id} onClick={() => setSelectedCollectionId(c.id)} className="text-[10px] font-black tracking-widest uppercase flex justify-between items-center">
                                        <span>{c.title}</span>
                                        <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-white/10 text-white border-none">{c.projectIds.length}</Badge>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem onClick={() => setIsCreateFolderOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-amber-500 focus:text-amber-400">
                                    <PlusCircle className="w-3.5 h-3.5 mr-2" />
                                    {language === "tr" ? "YENİ KLASÖR" : "NEW FOLDER"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="text-[10px] font-black text-white bg-white/10 px-1.5 py-0.5 rounded">
                            {selectedCollectionId === "all" ? projects.length : collections.find(c => c.id === selectedCollectionId)?.projectIds.length || 0}
                        </span>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10" />

                    {/* Search Input */}
                    <div className="relative group max-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder={language === "tr" ? "PROMPT ARA..." : "SEARCH PROMPTS..."}
                            className="pl-9 pr-4 h-9 w-[180px] lg:w-[240px] border-none bg-white/5 text-white placeholder:text-zinc-600 rounded-lg text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-white/20 transition-all font-sans"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-white/10" />

                    {/* Media Type Filters */}
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-[9px] font-black uppercase tracking-widest rounded-md px-3",
                                mediaTypeFilter === "all" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white"
                            )}
                            onClick={() => setMediaTypeFilter("all")}
                        >
                            {language === "tr" ? "HEPSİ" : "ALL"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-[9px] font-black uppercase tracking-widest rounded-md px-3 gap-1.5",
                                mediaTypeFilter === "video" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white"
                            )}
                            onClick={() => setMediaTypeFilter("video")}
                        >
                            <PlayCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">VIDEOS</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-[9px] font-black uppercase tracking-widest rounded-md px-3 gap-1.5",
                                mediaTypeFilter === "image" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white"
                            )}
                            onClick={() => setMediaTypeFilter("image")}
                        >
                            <ImageIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">IMAGES</span>
                        </Button>
                    </div>

                    {/* Favorites Filter */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-9 text-[9px] px-3 font-black uppercase tracking-widest rounded-lg gap-2 ml-1 transition-all",
                            showOnlyFavorites ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10"
                        )}
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    >
                        <Star className={cn("w-3.5 h-3.5 transition-all text-amber-500", showOnlyFavorites ? "fill-amber-500" : "")} />
                        <span className="hidden xl:inline">{language === "tr" ? "FAVORİLER" : "FAVORITES"}</span>
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <Grid2X2 className="w-3.5 h-3.5 text-zinc-500" />
                        <Slider
                            min={2}
                            max={8}
                            step={1}
                            value={[zoomLevel]}
                            onValueChange={(val) => setZoomLevel(val[0])}
                            className="w-24 h-4"
                        />
                        <span className="text-[10px] w-6 text-right font-black text-white/50">{zoomLevel}</span>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10" />

                    {/* Selection Toggle */}
                    <div className="flex items-center gap-2">
                        {isSelectionMode && selectedIds.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-[9px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20"
                                    onClick={async () => {
                                        for (const id of selectedIds) {
                                            const p = projects.find(proj => proj.id === id);
                                            if (p) await handleDownload(p.imageUrl, p.title);
                                        }
                                    }}
                                >
                                    <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                                    {language === "tr" ? "İNDİR" : "DOWNLOAD"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-[9px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20"
                                    onClick={() => setIsMoveFolderOpen(true)}
                                >
                                    <Move className="w-3.5 h-3.5 mr-1.5" />
                                    {language === "tr" ? "TAŞI" : "MOVE"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    {language === "tr" ? `SİL (${selectedIds.length})` : `DELETE (${selectedIds.length})`}
                                </Button>
                            </div>
                        )}
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "h-9 w-9 rounded-lg transition-all",
                                isSelectionMode ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds([]);
                            }}
                            title={language === "tr" ? "Seçme Modu" : "Selection Mode"}
                        >
                            <CheckCircle2 className="w-4.5 h-4.5" />
                        </Button>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10" />

                    {/* View Mode */}
                    <div className="flex items-center p-1 bg-white/5 rounded-lg">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-md", viewMode === "grid" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white")}
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid2X2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-md", viewMode === "list" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white")}
                            onClick={() => setViewMode("list")}
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* SELECTION BANNER */}
            {isSelectionMode && (
                <div className="bg-white text-black px-8 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300 z-50">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{selectedIds.length} {language === "tr" ? "ÖĞE SEÇİLDİ" : "ITEMS SELECTED"}</span>
                        <div className="h-4 w-[1px] bg-black/10 mx-1" />
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] hover:bg-black/10 font-black uppercase tracking-widest px-4" onClick={selectAll}>
                            {selectedIds.length === filteredProjects.length ? (language === "tr" ? "SEÇİMİ KALDIR" : "DESELECT ALL") : (language === "tr" ? "HEPSİNİ SEÇ" : "SELECT ALL")}
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-black/10 rounded-lg" onClick={() => setIsSelectionMode(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-[1920px] mx-auto w-full">
                    {filteredProjects.length > 0 ? (
                        viewMode === "grid" ? (
                            <div
                                className="grid gap-6 transition-all duration-300"
                                style={{
                                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                                }}
                            >
                                {filteredProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        language={language}
                                        onDelete={() => handleDelete(project.id)}
                                        onDownload={() => handleDownload(project.imageUrl, project.title)}
                                        isAdmin={isAdmin}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.includes(project.id)}
                                        onSelect={() => toggleSelect(project.id)}
                                        onFavorite={() => toggleFavorite(project.id, !!project.isFavorite)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredProjects.map((project) => (
                                    <ProjectRow
                                        key={project.id}
                                        project={project}
                                        language={language}
                                        onDelete={() => handleDelete(project.id)}
                                        onDownload={() => handleDownload(project.imageUrl, project.title)}
                                        isAdmin={isAdmin}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.includes(project.id)}
                                        onSelect={() => toggleSelect(project.id)}
                                        onFavorite={() => toggleFavorite(project.id, !!project.isFavorite)}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <ImageIcon className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{language === "tr" ? "HENÜZ BİR ŞEY YOK" : "NOTHING HERE YET"}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 max-w-xs mx-auto mt-2 leading-relaxed">
                                {language === "tr"
                                    ? "ÜRETTİĞİNİZ GÖRSELLER BURADA GÜVENLE SAKLANIR."
                                    : "EVERYTHING YOU GENERATE WILL BE SAFELY STORED HERE."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* DIALOGS */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest">{language === "tr" ? "YENİ KLASÖR OLUŞTUR" : "CREATE NEW FOLDER"}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <UILabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === "tr" ? "KLASÖR ADI" : "FOLDER NAME"}</UILabel>
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder={language === "tr" ? "Klasör adı girin..." : "Enter folder name..."}
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setIsCreateFolderOpen(false)}>{language === "tr" ? "İPTAL" : "CANCEL"}</Button>
                        <Button
                            className="bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest px-8 rounded-xl"
                            onClick={() => {
                                if (!newFolderName.trim()) return;
                                addCollection({ title: newFolderName, projectIds: [] });
                                setNewFolderName("");
                                setIsCreateFolderOpen(false);
                                toast.success(language === "tr" ? "Klasör oluşturuldu" : "Folder created");
                            }}
                        >
                            {language === "tr" ? "OLUŞTUR" : "CREATE"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isMoveFolderOpen} onOpenChange={setIsMoveFolderOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-widest">{language === "tr" ? "KLASÖRE TAŞI" : "MOVE TO FOLDER"}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 max-h-[400px] overflow-y-auto space-y-2">
                        {collections.length === 0 ? (
                            <p className="text-center py-8 text-zinc-500 text-[10px] font-black uppercase">{language === "tr" ? "HİÇ KLASÖR YOK" : "NO FOLDERS FOUND"}</p>
                        ) : (
                            collections.map(c => (
                                <Button
                                    key={c.id}
                                    variant="ghost"
                                    className="w-full justify-start h-12 gap-3 hover:bg-white/5 rounded-xl border border-white/5"
                                    onClick={() => {
                                        selectedIds.forEach(id => {
                                            collections.forEach(coll => {
                                                if (coll.projectIds.includes(id)) removeFromCollection(coll.id, id);
                                            });
                                            addToCollection(c.id, id);
                                        });
                                        setIsMoveFolderOpen(false);
                                        setIsSelectionMode(false);
                                        setSelectedIds([]);
                                        toast.success(language === "tr" ? "Öğeler taşındı" : "Items moved");
                                    }}
                                >
                                    <FolderOpen className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[11px] font-bold uppercase">{c.title}</span>
                                </Button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ProjectCard({
    project,
    language,
    onDelete,
    onDownload,
    isAdmin,
    isSelectionMode,
    isSelected,
    onSelect,
    onFavorite
}: {
    project: Project,
    language: string,
    onDelete: () => void,
    onDownload: () => void,
    isAdmin: boolean,
    isSelectionMode: boolean,
    isSelected: boolean,
    onSelect: () => void,
    onFavorite: () => void
}) {

    // Extract prompt from description
    const prompt = useMemo(() => {
        if (!project.description) return null
        const parts = project.description.split('|')
        const promptPart = parts.find(p => p.trim().startsWith('Prompt:'))
        return promptPart ? promptPart.replace('Prompt:', '').trim() : null
    }, [project.description])

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (prompt) {
            navigator.clipboard.writeText(prompt)
            toast.success(language === "tr" ? "Prompt kopyalandı" : "Prompt copied")
        }
    }

    return (
        <div
            className={cn(
                "group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 relative w-full",
                isSelected ? "ring-2 ring-white border-white" : "hover:border-white/20"
            )}
            style={{
                maxHeight: '720px',
                maxWidth: '540px' // Calculate width based on 720 height and 3:4 aspect ratio (540 / 0.75 is wrong, 720 * 0.75 = 540)
            }}
            onClick={() => isSelectionMode && onSelect()}
        >
            {/* Selection Overlay */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3 z-30">
                    <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        isSelected ? "bg-white border-white text-black" : "bg-black/50 border-white/30 text-transparent"
                    )}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                </div>
            )}

            <div className="relative aspect-[3/4] overflow-hidden bg-black/50">
                <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-500",
                        !isSelectionMode && "group-hover:scale-105"
                    )}
                />

                {/* Favorite Button */}
                {!isSelectionMode && (
                    <button
                        className={cn(
                            "absolute top-3 right-3 z-20 w-8 h-8 rounded-full border backdrop-blur-md flex items-center justify-center transition-all active:scale-90 opacity-0 group-hover:opacity-100",
                            project.isFavorite ? "bg-amber-500 border-amber-500 text-white opacity-100" : "bg-black/40 border-white/20 text-white hover:bg-black/60"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavorite();
                        }}
                    >
                        <Star className={cn("w-4 h-4", project.isFavorite && "fill-current")} />
                    </button>
                )}

                {/* MediaType Indicator */}
                <div className="absolute bottom-3 right-3 z-20">
                    {project.mediaType === 'video' ? (
                        <div className="bg-black/40 backdrop-blur-md text-white p-1.5 rounded-lg border border-white/10">
                            <PlayCircle className="w-3.5 h-3.5" />
                        </div>
                    ) : (
                        <div className="bg-black/40 backdrop-blur-md text-white p-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>

                {/* CTA Action */}
                {!isSelectionMode && (
                    <div className="absolute bottom-3 left-3 right-3 flex justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-20">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 bg-white text-black hover:bg-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest w-full gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload();
                            }}
                        >
                            <Download className="w-3.5 h-3.5" />
                            {language === "tr" ? "İNDİR" : "DOWNLOAD"}
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-bold text-[11px] truncate uppercase tracking-tight text-white/90">{project.title}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[9px]">
                                {new Date(project.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                    {!isSelectionMode && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/5" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-white/10 text-white">
                                {prompt && isAdmin && (
                                    <DropdownMenuItem className="gap-2 cursor-pointer text-[11px] focus:bg-white/5" onClick={handleCopyPrompt}>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>{language === "tr" ? "Prompt Kopyala" : "Copy Prompt"}</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="gap-2 cursor-pointer text-[11px] focus:bg-white/5" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{language === "tr" ? "İndir" : "Download"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-[11px] text-red-500 focus:text-red-400 focus:bg-red-500/10" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{language === "tr" ? "Sil" : "Delete"}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    )
}

function ProjectRow({
    project,
    language,
    onDelete,
    onDownload,
    isAdmin,
    isSelectionMode,
    isSelected,
    onSelect,
    onFavorite
}: {
    project: Project,
    language: string,
    onDelete: () => void,
    onDownload: () => void,
    isAdmin: boolean,
    isSelectionMode: boolean,
    isSelected: boolean,
    onSelect: () => void,
    onFavorite: () => void
}) {

    const prompt = useMemo(() => {
        if (!project.description) return null
        const parts = project.description.split('|')
        const promptPart = parts.find(p => p.trim().startsWith('Prompt:'))
        return promptPart ? promptPart.replace('Prompt:', '').trim() : null
    }, [project.description])

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (prompt) {
            navigator.clipboard.writeText(prompt)
            toast.success(language === "tr" ? "Prompt kopyalandı" : "Prompt copied")
        }
    }

    return (
        <div
            className={cn(
                "group bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:shadow-md transition-all relative",
                isSelected ? "ring-2 ring-white border-white bg-white/5" : "hover:border-white/10"
            )}
            onClick={() => isSelectionMode && onSelect()}
        >
            {isSelectionMode && (
                <div className="shrink-0">
                    <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        isSelected ? "bg-white border-white text-black" : "bg-white/5 border-white/20 text-transparent"
                    )}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                </div>
            )}

            <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-zinc-800 relative group-hover:ring-1 group-hover:ring-white transition-all">
                <Image src={project.imageUrl} alt={project.title} fill sizes="48px" className="object-cover" />
                {project.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate uppercase tracking-tight text-white">{project.title}</h3>
                        {project.isFavorite && <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-2 py-0 h-4 border-none bg-white/5 text-zinc-400">
                            {project.type}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px]">
                                {new Date(project.createdAt).toLocaleString(language === "tr" ? "tr-TR" : "en-US", {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
                {!isSelectionMode && (
                    <div className="flex items-center gap-2">
                        <button
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5",
                                project.isFavorite ? "text-amber-500" : "text-zinc-500 hover:text-zinc-400"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onFavorite();
                            }}
                        >
                            <Star className={cn("w-4 h-4", project.isFavorite && "fill-current")} />
                        </button>
                        <div className="h-4 w-[1px] bg-white/5 mx-1 hidden sm:block" />
                        {prompt && isAdmin && (
                            <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-2 hidden sm:flex text-zinc-400 hover:text-white" onClick={handleCopyPrompt}>
                                <Copy className="w-3.5 h-3.5" />
                                PROMPT
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-2 hidden sm:flex text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                            <Download className="w-3.5 h-3.5" />
                            {language === "tr" ? "İNDİR" : "DOWNLOAD"}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-white/10 text-white">
                                {prompt && (
                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={handleCopyPrompt}>
                                        <Copy className="w-4 h-4" />
                                        <span>{language === "tr" ? "Prompt Kopyala" : "Copy Prompt"}</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                                    <Download className="w-4 h-4" />
                                    <span>{language === "tr" ? "İndir" : "Download"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-500/10" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                    <Trash2 className="w-4 h-4" />
                                    <span>{language === "tr" ? "Sil" : "Delete"}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    )
}
