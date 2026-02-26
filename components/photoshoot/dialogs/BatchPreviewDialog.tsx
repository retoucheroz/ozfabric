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
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-surface)] p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {batchPreviewPrompts.map((p, idx) => {
                            const isSelected = selectedBatchImages[idx];

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-2xl border-2 transition-all p-6 flex flex-col md:flex-row gap-6",
                                        isSelected
                                            ? "bg-[var(--bg-elevated)] border-blue-500/30 shadow-sm"
                                            : "opacity-40 grayscale border-[var(--border-subtle)]"
                                    )}
                                >
                                    {/* Selection & Sidebar Info */}
                                    <div className="w-full md:w-64 space-y-4 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                                                    isSelected ? "bg-blue-600 border-blue-600" : "border-[var(--border-strong)]"
                                                )}
                                                onClick={() => {
                                                    const updated = [...selectedBatchImages];
                                                    updated[idx] = !isSelected;
                                                    setSelectedBatchImages(updated);
                                                }}
                                            >
                                                {isSelected && <div className="w-3 h-3 bg-white rounded-sm" />}
                                            </div>
                                            <span className="text-base font-bold text-[var(--text-primary)] truncate">
                                                {p.title}
                                            </span>
                                        </div>

                                        <div className="space-y-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "ÇEKİM AÇISI" : "SHOT ANGLE"}</span>
                                                <span className="text-xs font-bold text-blue-500 uppercase">{p.spec?.view}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "KIYAFETLER" : "GARMENTS"}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(p.spec?.assets || ['Default']).map((a: string) => (
                                                        <span key={a} className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[9px] font-bold uppercase">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prompt Editor - WIDE */}
                                    <div className="flex-1 flex flex-col min-h-[200px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                                                {language === "tr" ? "ÜRETİM TALİMATI" : "GENERATION PROMPT"}
                                            </span>
                                            <span className="text-[9px] text-[var(--text-muted)] font-medium">
                                                {editedBatchPrompts[idx]?.length || 0} characters
                                            </span>
                                        </div>
                                        <Textarea
                                            value={editedBatchPrompts[idx]}
                                            onChange={(e) => {
                                                const updated = [...editedBatchPrompts];
                                                updated[idx] = e.target.value;
                                                setEditedBatchPrompts(updated);
                                            }}
                                            placeholder={language === "tr" ? "Prompt..." : "Prompt..."}
                                            className={cn(
                                                "flex-1 font-medium text-[13px] leading-relaxed bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl p-4 resize-none transition-all focus:border-blue-500/50 outline-none custom-scrollbar",
                                                !isSelected && "pointer-events-none"
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Simplified Footer */}
                <div className="flex-none p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-end gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-12 px-8 font-bold text-xs uppercase"
                    >
                        {language === "tr" ? "İPTAL" : "CANCEL"}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedBatchImages.some(Boolean)}
                        className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase shadow-lg shadow-blue-600/20 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {language === "tr" ? "ONAYLA VE BAŞLAT" : "CONFIRM & START"}
                        <Package className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
