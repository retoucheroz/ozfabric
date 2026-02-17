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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        MAVI EU - {language === "tr" ? "Önizleme" : "Preview"}
                    </DialogTitle>
                    <DialogDescription>
                        {language === "tr"
                            ? `${batchPreviewPrompts.length} görsel için promptlar. İsterseniz düzenleyebilirsiniz.`
                            : `Prompts for ${batchPreviewPrompts.length} images. You can edit them if needed.`
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                    <div className="flex justify-end px-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const allSelected = selectedBatchImages.every(Boolean);
                                setSelectedBatchImages(selectedBatchImages.map(() => !allSelected));
                            }}
                            className="text-xs h-6"
                        >
                            {selectedBatchImages.every(Boolean)
                                ? (language === "tr" ? "Hepsini Kaldır" : "Deselect All")
                                : (language === "tr" ? "Hepsini Seç" : "Select All")}
                        </Button>
                    </div>
                    {batchPreviewPrompts.map((p, idx) => (
                        <div key={idx} className={cn("space-y-2 p-3 rounded-lg border transition-colors", selectedBatchImages[idx] ? "bg-[var(--bg-elevated)] border-[var(--border-subtle)]" : "bg-[var(--bg-surface)] border-transparent opacity-60")}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedBatchImages[idx]}
                                        onChange={(e) => {
                                            const updated = [...selectedBatchImages];
                                            updated[idx] = e.target.checked;
                                            setSelectedBatchImages(updated);
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-semibold text-blue-600 cursor-pointer" onClick={() => {
                                        const updated = [...selectedBatchImages];
                                        updated[idx] = !updated[idx];
                                        setSelectedBatchImages(updated);
                                    }}>{p.title}</label>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">{selectedBatchImages[idx] ? (language === "tr" ? "Üretilecek" : "Will Generate") : (language === "tr" ? "Atlanacak" : "Skipped")}</span>
                            </div>
                            {selectedBatchImages[idx] && isAdmin && (
                                <Textarea
                                    value={editedBatchPrompts[idx]}
                                    onChange={(e) => {
                                        const updated = [...editedBatchPrompts];
                                        updated[idx] = e.target.value;
                                        setEditedBatchPrompts(updated);
                                    }}
                                    className="font-mono text-xs h-32 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg p-2"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 p-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        {language === "tr" ? "İptal" : "Cancel"}
                    </Button>
                    <Button onClick={onConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        {language === "tr" ? "Onayla ve Üret" : "Confirm & Generate"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
