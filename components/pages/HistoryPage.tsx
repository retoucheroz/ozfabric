"use client"

import { useProjects, Project } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import {
    Clock,
    Search,
    Filter,
    MoreVertical,
    Download,
    Trash2,
    ExternalLink,
    Grid2X2,
    List,
    Image as ImageIcon,
    Calendar,
    ChevronRight,
    Tag,
    Copy
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function HistoryPage() {
    const { projects, deleteProject } = useProjects()
    const { t, language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [filterType, setFilterType] = useState<string>("all")
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data?.user?.role === 'admin') {
                    setIsAdmin(true)
                }
            })
            .catch(() => { })
    }, [])

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                const matchesType = filterType === "all" || p.type === filterType
                return matchesSearch && matchesType
            })
            .sort((a, b) => b.createdAt - a.createdAt)
    }, [projects, searchQuery, filterType])

    const projectTypes = useMemo(() => {
        const types = new Set(projects.map(p => p.type))
        return Array.from(types)
    }, [projects])

    const handleDelete = (id: string) => {
        if (confirm(language === "tr" ? "Bu projeyi silmek istediğinize emin misiniz?" : "Are you sure you want to delete this project?")) {
            deleteProject(id)
            toast.success(language === "tr" ? "Proje silindi" : "Project deleted")
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

    return (
        <div className="flex flex-col h-full bg-[var(--bg-background)] overflow-hidden">
            {/* Header Area */}
            <div className="shrink-0 p-8 border-b border-white/5 bg-[#0D0D0F]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
                                {language === "tr" ? "GEÇMİŞ" : "HISTORY"}
                            </h1>
                            <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1.5 grayscale opacity-70">
                                {language === "tr" ? "TÜM ÜRETİMLERİNİZİ YÖNETİN" : "MANAGE ALL YOUR GENERATIONS"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder={language === "tr" ? "ARA..." : "SEARCH..."}
                                className="pl-10 h-11 border-white/5 bg-white/5 text-white placeholder:text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-white/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 h-11">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-lg transition-all",
                                    viewMode === "grid" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white"
                                )}
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid2X2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-lg transition-all",
                                    viewMode === "list" ? "bg-white text-black hover:bg-zinc-200" : "text-zinc-500 hover:text-white"
                                )}
                                onClick={() => setViewMode("list")}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mt-6 max-w-7xl mx-auto w-full overflow-x-auto pb-1 no-scrollbar">
                    <Badge
                        variant={filterType === "all" ? "default" : "outline"}
                        className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                        onClick={() => setFilterType("all")}
                    >
                        {language === "tr" ? "Tümü" : "All"}
                    </Badge>
                    {projectTypes.map(type => (
                        <Badge
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            className="cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap"
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto w-full">
                    {filteredProjects.length > 0 ? (
                        viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        language={language}
                                        onDelete={() => handleDelete(project.id)}
                                        onDownload={() => handleDownload(project.imageUrl, project.title)}
                                        isAdmin={isAdmin}
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
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <ImageIcon className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{language === "tr" ? "Henüz Bir Şey Yok" : "Nothing Here Yet"}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 max-w-xs mx-auto mt-2 leading-relaxed">
                                {language === "tr"
                                    ? "Ürettiğiniz görseller burada güvenle saklanır."
                                    : "Everything you generate will be safely stored here."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ProjectCard({ project, language, onDelete, onDownload, isAdmin }: { project: Project, language: string, onDelete: () => void, onDownload: () => void, isAdmin: boolean }) {

    // Extract seed and prompt from description
    const { seed, prompt } = useMemo(() => {
        if (!project.description) return { seed: null, prompt: null }
        const parts = project.description.split('|')
        const seedPart = parts.find(p => p.trim().startsWith('Seed:'))
        const promptPart = parts.find(p => p.trim().startsWith('Prompt:'))
        return {
            seed: seedPart ? seedPart.replace('Seed:', '').trim() : null,
            prompt: promptPart ? promptPart.replace('Prompt:', '').trim() : null
        }
    }, [project.description])

    const handleCopyPrompt = () => {
        if (prompt) {
            navigator.clipboard.writeText(prompt)
            toast.success(language === "tr" ? "Prompt kopyalandı" : "Prompt copied")
        }
    }

    return (
        <div className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-white/20 transition-all duration-500">
            <div className="relative aspect-[3/4] overflow-hidden bg-black/50">
                <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                    <Badge className="bg-[var(--bg-surface)]/90 text-[var(--text-primary)] backdrop-blur-md border border-[var(--border-subtle)] shadow-sm">
                        {project.type}
                    </Badge>
                </div>
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-[var(--bg-surface)]/90 text-[var(--text-primary)] backdrop-blur-md shadow-sm hover:bg-[var(--bg-elevated)]"
                        onClick={onDownload}
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    {prompt && isAdmin && (
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-[var(--bg-surface)]/90 text-[var(--text-primary)] backdrop-blur-md shadow-sm hover:bg-[var(--bg-elevated)]"
                            onClick={handleCopyPrompt}
                            title={language === "tr" ? "Promptu Kopyala" : "Copy Prompt"}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                {seed && isAdmin && (
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md truncate">
                            Seed: {seed}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-[var(--accent-primary)] transition-colors uppercase tracking-tight text-[var(--text-primary)]">{project.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[var(--text-muted)]">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px]">
                                {new Date(project.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                            {seed && (
                                <>
                                    <span className="text-[10px] text-[var(--text-disabled)]">•</span>
                                    <span className="text-[10px] font-mono bg-[var(--bg-muted)] text-[var(--text-secondary)] px-1 rounded">S: {seed}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {prompt && isAdmin && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleCopyPrompt}>
                                    <Copy className="w-4 h-4" />
                                    <span>{language === "tr" ? "Prompt Kopyala" : "Copy Prompt"}</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onDownload}>
                                <Download className="w-4 h-4" />
                                <span>{language === "tr" ? "İndir" : "Download"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10" onClick={onDelete}>
                                <Trash2 className="w-4 h-4" />
                                <span>{language === "tr" ? "Sil" : "Delete"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}

function ProjectRow({ project, language, onDelete, onDownload, isAdmin }: { project: Project, language: string, onDelete: () => void, onDownload: () => void, isAdmin: boolean }) {

    // Extract seed and prompt from description
    const { seed, prompt } = useMemo(() => {
        if (!project.description) return { seed: null, prompt: null }
        const parts = project.description.split('|')
        const seedPart = parts.find(p => p.trim().startsWith('Seed:'))
        const promptPart = parts.find(p => p.trim().startsWith('Prompt:'))
        return {
            seed: seedPart ? seedPart.replace('Seed:', '').trim() : null,
            prompt: promptPart ? promptPart.replace('Prompt:', '').trim() : null
        }
    }, [project.description])

    const handleCopyPrompt = () => {
        if (prompt) {
            navigator.clipboard.writeText(prompt)
            toast.success(language === "tr" ? "Prompt kopyalandı" : "Prompt copied")
        }
    }

    return (
        <div className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-3 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-muted)] relative group-hover:ring-1 group-hover:ring-[var(--accent-primary)] transition-all">
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="font-semibold text-sm truncate uppercase tracking-tight text-[var(--text-primary)]">{project.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-2 py-0 h-4 border-none bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                            {project.type}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px]">
                                {new Date(project.createdAt).toLocaleString(language === "tr" ? "tr-TR" : "en-US", {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        {seed && (
                            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">Seed: {seed}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {prompt && isAdmin && (
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-2 hidden sm:flex" onClick={handleCopyPrompt}>
                            <Copy className="w-3.5 h-3.5" />
                            {language === "tr" ? "Prompt" : "Prompt"}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-2 hidden sm:flex" onClick={onDownload}>
                        <Download className="w-3.5 h-3.5" />
                        {language === "tr" ? "İndir" : "Download"}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {prompt && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleCopyPrompt}>
                                    <Copy className="w-4 h-4" />
                                    <span>{language === "tr" ? "Prompt Kopyala" : "Copy Prompt"}</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onDownload}>
                                <Download className="w-4 h-4" />
                                <span>{language === "tr" ? "İndir" : "Download"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600" onClick={onDelete}>
                                <Trash2 className="w-4 h-4" />
                                <span>{language === "tr" ? "Sil" : "Delete"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
