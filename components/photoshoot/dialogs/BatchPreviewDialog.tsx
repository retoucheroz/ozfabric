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
                        {isAdmin && batchPreviewPrompts.some(p => p.isMavi) ? "MAVI EU - " : ""}
                        {language === "tr" ? "Önizleme" : "Preview"}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 py-2 border-b flex justify-end bg-[var(--bg-elevated)]">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const allSelected = selectedBatchImages.every(Boolean);
                            setSelectedBatchImages(selectedBatchImages.map(() => !allSelected));
                        }}
                        className="text-xs h-6 font-bold text-[var(--accent-primary)]"
                    >
                        {selectedBatchImages.every(Boolean)
                            ? (language === "tr" ? "Hepsini Kaldır" : "Deselect All")
                            : (language === "tr" ? "Hepsini Seç" : "Select All")}
                    </Button>
                </div>
                <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                    <div className="flex gap-4 min-w-max pb-4">
                        {batchPreviewPrompts.map((p, idx) => (
                            <div key={idx} className={cn("w-80 flex-none space-y-2 p-3 rounded-lg border transition-colors", selectedBatchImages[idx] ? "bg-[var(--bg-elevated)] border-[var(--border-subtle)]" : "bg-[var(--bg-surface)] border-transparent opacity-60")}>
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
                                    <div className="space-y-2 mt-2 border-t border-[var(--border-subtle)] pt-2 flex flex-col h-[calc(100%-40px)]">
                                        <div className="text-[10px] text-[var(--text-secondary)] flex flex-col gap-1 pb-1">
                                            <p><strong className="text-[var(--text-primary)]">{language === "tr" ? "Çekim Açısı (View):" : "Shot Angle (View):"}</strong> {p.spec?.view}</p>
                                            <p><strong className="text-[var(--text-primary)]">{language === "tr" ? "Kıyafet Görselleri:" : "Garment Images:"}</strong> {p.spec?.assets?.join(', ') || (language === "tr" ? 'Belirtilmedi' : 'Not specified')}</p>
                                            <p><strong className="text-[var(--text-primary)]">{language === "tr" ? "Hariç Tutulanlar:" : "Excluded:"}</strong> {[
                                                p.spec?.excludeBagAsset && (language === "tr" ? 'Çanta' : 'Bag'),
                                                p.spec?.excludeShoesAsset && (language === "tr" ? 'Ayakkabı' : 'Shoes'),
                                                p.spec?.excludeHatAsset && (language === "tr" ? 'Şapka' : 'Hat'),
                                                p.spec?.excludeBeltAsset && (language === "tr" ? 'Kemer' : 'Belt'),
                                                p.spec?.excludeAllAccessories && (language === "tr" ? 'Tüm Aksesuarlar' : 'All Accessories')
                                            ].filter(Boolean).join(', ') || (language === "tr" ? "Yok" : "None")}</p>
                                        </div>
                                        <Textarea
                                            value={editedBatchPrompts[idx]}
                                            onChange={(e) => {
                                                const updated = [...editedBatchPrompts];
                                                updated[idx] = e.target.value;
                                                setEditedBatchPrompts(updated);
                                            }}
                                            className="font-mono text-[10px] flex-1 min-h-[400px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg p-2 resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
