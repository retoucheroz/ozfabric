"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface BatchPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    batchPreviewPrompts: any[];
    selectedBatchImages: boolean[];
    setSelectedBatchImages: (selected: boolean[]) => void;
    editedBatchPrompts: string[];
    setEditedBatchPrompts: (prompts: string[]) => void;
    onConfirm: () => void;
    isAdmin?: boolean;
}

export function BatchPreviewDialog({
    isOpen,
    onOpenChange,
    language,
    batchPreviewPrompts,
    selectedBatchImages,
    setSelectedBatchImages,
    editedBatchPrompts,
    setEditedBatchPrompts,
    onConfirm,
    isAdmin
}: BatchPreviewDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-2xl rounded-3xl">
                {/* Header Section */}
                <div className="flex-none px-8 py-6 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                            <Package className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                {language === "tr" ? "Üretim Önizleme" : "Production Preview"}
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-[var(--text-muted)]">
                                {isAdmin && batchPreviewPrompts.some(p => p.isMavi) ? "Mavi EU Fashion Lab Engine" : (language === "tr" ? "Seçilen kareleri ve promptları kontrol edin." : "Review selected shots and their generation prompts.")}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const allSelected = selectedBatchImages.every(Boolean);
                                setSelectedBatchImages(selectedBatchImages.map(() => !allSelected));
                            }}
                            className="text-[10px] uppercase tracking-widest font-black h-9 rounded-xl border-2 hover:bg-[var(--bg-elevated)] transition-all bg-[var(--bg-surface)]"
                        >
                            {selectedBatchImages.every(Boolean)
                                ? (language === "tr" ? "Hepsini Kaldır" : "Deselect All")
                                : (language === "tr" ? "Hepsini Seç" : "Select All")}
                        </Button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/10 hover:text-red-500 transition-all border border-[var(--border-subtle)]"
                        >
                            <Package className="w-4 h-4 rotate-45" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[var(--bg-surface)] p-8">
                    <div className="flex gap-8 h-full min-w-max">
                        {batchPreviewPrompts.map((p, idx) => {
                            const isSelected = selectedBatchImages[idx];

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-[400px] h-full flex flex-col rounded-[2.5rem] border-2 transition-all duration-500 relative group",
                                        isSelected
                                            ? "bg-[var(--bg-elevated)] border-blue-500/30 shadow-2xl shadow-blue-500/5 ring-4 ring-blue-500/5"
                                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-40 grayscale-70 grayscale hover:opacity-70 hover:grayscale-0"
                                    )}
                                >
                                    {/* Selection Header */}
                                    <div className="p-6 flex items-center justify-between border-b border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all",
                                                    isSelected ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" : "border-[var(--border-strong)] bg-transparent"
                                                )}
                                                onClick={() => {
                                                    const updated = [...selectedBatchImages];
                                                    updated[idx] = !isSelected;
                                                    setSelectedBatchImages(updated);
                                                }}
                                            >
                                                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in duration-300" />}
                                            </div>
                                            <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                                                {p.title}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            isSelected ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isSelected ? (language === "tr" ? "Üretilecek" : "Active") : (language === "tr" ? "Atlanacak" : "Disabled")}
                                        </div>
                                    </div>

                                    {/* Scrollable Section */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                        {/* Metadata */}
                                        <div className="grid grid-cols-1 gap-2 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "ÇEKİM AÇISI" : "SHOT ANGLE"}</span>
                                                <span className="font-black text-blue-500">{p.spec?.view}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "KIYAFET GÖRSELLERİ" : "GARMENTS"}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(p.spec?.assets || ['Default']).map((a: string) => (
                                                        <span key={a} className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[9px] font-bold text-[var(--text-primary)]">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {p.spec && (
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "HARİÇ TUTULANLAR" : "EXCLUDED"}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {[
                                                            p.spec?.excludeBagAsset && (language === "tr" ? 'Çanta' : 'Bag'),
                                                            p.spec?.excludeShoesAsset && (language === "tr" ? 'Ayakkabı' : 'Shoes'),
                                                            p.spec?.excludeHatAsset && (language === "tr" ? 'Şapka' : 'Hat'),
                                                            p.spec?.excludeBeltAsset && (language === "tr" ? 'Kemer' : 'Belt'),
                                                            p.spec?.excludeAllAccessories && (language === "tr" ? 'Tüm Aksesuarlar' : 'All Accessories')
                                                        ].filter(Boolean).length > 0 ? (
                                                            [
                                                                p.spec?.excludeBagAsset && (language === "tr" ? 'Çanta' : 'Bag'),
                                                                p.spec?.excludeShoesAsset && (language === "tr" ? 'Ayakkabı' : 'Shoes'),
                                                                p.spec?.excludeHatAsset && (language === "tr" ? 'Şapka' : 'Hat'),
                                                                p.spec?.excludeBeltAsset && (language === "tr" ? 'Kemer' : 'Belt'),
                                                                p.spec?.excludeAllAccessories && (language === "tr" ? 'Tüm Aksesuarlar' : 'All Accessories')
                                                            ].filter(Boolean).map((a: any) => (
                                                                <span key={a} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-500">
                                                                    {a}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-[var(--text-muted)] italic">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Editor */}
                                        <div className="flex flex-col flex-1 min-h-[400px]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                                                    {language === "tr" ? "ÜRETİM PROMPT'U" : "GENERATION PROMPT"}
                                                </span>
                                                <div className="flex gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                                </div>
                                            </div>
                                            <Textarea
                                                value={editedBatchPrompts[idx]}
                                                onChange={(e) => {
                                                    const updated = [...editedBatchPrompts];
                                                    updated[idx] = e.target.value;
                                                    setEditedBatchPrompts(updated);
                                                }}
                                                placeholder={language === "tr" ? "Prompt buraya gelecek..." : "Prompt will appear here..."}
                                                className={cn(
                                                    "flex-1 font-medium text-[11px] leading-relaxed bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-[var(--text-primary)] rounded-3xl p-5 resize-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 custom-scrollbar",
                                                    !isSelected && "pointer-events-none opacity-50"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex-none p-8 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 backdrop-blur-xl flex gap-6">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-16 px-12 rounded-[2rem] border-2 border-[var(--border-strong)] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[var(--bg-surface)] transition-all flex-none"
                    >
                        {language === "tr" ? "İPTAL" : "CANCEL"}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedBatchImages.some(Boolean)}
                        className="h-16 flex-1 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                            {language === "tr" ? "ONAYLA VE ÜRETİMİ BAŞLAT" : "CONFIRM & START PRODUCTION"}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                            <Package className="w-5 h-5" />
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
