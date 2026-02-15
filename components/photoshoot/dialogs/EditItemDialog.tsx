"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, ImageIcon, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditItemDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    editingThumbItem: { type: string, id: string } | null;
    editingItemPrompt: string;
    setEditingItemPrompt: (prompt: string) => void;
    editingItemTags: string[];
    setEditingItemTags: (tags: any) => void;
    editingItemNegativePrompt: string;
    setEditingItemNegativePrompt: (prompt: string) => void;
    editingItemSendImage: boolean;
    setEditingItemSendImage: (send: boolean) => void;
    handleUpdateThumbnail: (file: File | null) => void;
    savedPoses: any[];
    savedModels: any[];
    savedBackgrounds: any[];
    savedFits: any[];
    savedLightings: any[];
    savedShoes: any[];
}

export function EditItemDialog({
    isOpen,
    onOpenChange,
    language,
    editingThumbItem,
    editingItemPrompt,
    setEditingItemPrompt,
    editingItemTags,
    setEditingItemTags,
    editingItemNegativePrompt,
    setEditingItemNegativePrompt,
    editingItemSendImage,
    setEditingItemSendImage,
    handleUpdateThumbnail,
    savedPoses,
    savedModels,
    savedBackgrounds,
    savedFits,
    savedLightings,
    savedShoes
}: EditItemDialogProps) {
    if (!editingThumbItem) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Öğeyi Düzenle" : "Edit Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {language === "tr" ? "Kütüphane Görseli" : "Library Thumbnail"}
                        </label>
                        <label className="w-32 h-44 rounded-lg border border-dashed border-[var(--border-subtle)] flex flex-col items-center justify-center bg-[var(--bg-elevated)] cursor-pointer overflow-hidden relative group hover:bg-[var(--bg-surface)] transition-all">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleUpdateThumbnail(e.target.files[0]);
                                }}
                            />
                            {(() => {
                                const { type, id } = editingThumbItem;
                                const list = type === 'pose' ? savedPoses
                                    : type === 'model' ? savedModels
                                        : type === 'background' ? savedBackgrounds
                                            : type === 'fit_pattern' ? savedFits
                                                : type === 'lighting' ? savedLightings
                                                    : savedShoes;
                                return (list as any[]).find(i => i.id === id)?.thumbUrl;
                            })() ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={(() => {
                                            const { type, id } = editingThumbItem!;
                                            const list = type === 'pose' ? savedPoses
                                                : type === 'model' ? savedModels
                                                    : type === 'background' ? savedBackgrounds
                                                        : type === 'fit_pattern' ? savedFits
                                                            : type === 'lighting' ? savedLightings
                                                                : savedShoes;
                                            return (list as any[]).find(i => i.id === id)?.thumbUrl;
                                        })()}
                                        className="w-full h-full object-cover"
                                        alt="Thumbnail"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <RotateCw className="text-white w-6 h-6 animate-spin-slow" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Değiştir</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {(editingThumbItem?.type === 'pose' || editingThumbItem?.type === 'model' || editingThumbItem?.type === 'fit_pattern' || editingThumbItem?.type === 'shoes' || editingThumbItem?.type === 'lighting') && (
                        <div className="space-y-4">
                            {editingThumbItem.type === 'lighting' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={12} />
                                            {language === "tr" ? "Pozitif Prompt" : "Positive Prompt"}
                                        </label>
                                        <textarea
                                            className="w-full h-24 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                            value={editingItemPrompt}
                                            onChange={(e) => setEditingItemPrompt(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={12} />
                                            {language === "tr" ? "Negatif Prompt" : "Negative Prompt"}
                                        </label>
                                        <textarea
                                            className="w-full h-24 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                            value={editingItemNegativePrompt}
                                            onChange={(e) => setEditingItemNegativePrompt(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] mt-2">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-[var(--text-primary)]">
                                                {language === "tr" ? "Görseli Referans Olarak Gönder" : "Send Image as Visual Reference"}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)]">
                                                {language === "tr" ? "Kapatılırsa sadece promptlar kullanılır" : "If disabled, only prompts will be used"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setEditingItemSendImage(!editingItemSendImage)}
                                            className={cn("w-10 h-5 rounded-full transition-colors relative", editingItemSendImage ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-muted)]")}
                                        >
                                            <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${editingItemSendImage ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <FileText size={12} />
                                        {editingThumbItem.type === 'pose'
                                            ? (language === "tr" ? "Poz Prompt Açıklaması" : "Pose Prompt Description")
                                            : (language === "tr" ? "Kalıp/Desen Prompt Açıklaması" : "Fit/Pattern Prompt Description")}
                                    </label>
                                    <textarea
                                        className="w-full h-32 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                        placeholder={editingThumbItem.type === 'pose'
                                            ? (language === "tr" ? "Örn: Yan duran model, kameraya bakmadan 90 derece duruyor" : "e.g. Model standing sideways, looking 90 degrees away from camera")
                                            : (language === "tr" ? "Örn: Bol kesim baggy pantolon, paçaları ayakkabının üstüne yığılıyor" : "e.g. Oversized baggy pants, hem stacking over shoes")
                                        }
                                        value={editingItemPrompt}
                                        onChange={(e) => setEditingItemPrompt(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {editingThumbItem?.type === 'pose' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <FileText size={12} />
                                {language === "tr" ? "Poz Etiketleri (virgülle ayırın)" : "Pose Tags (comma separated)"}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <button
                                    onClick={() => {
                                        const hasTag = editingItemTags.includes('tam_boy');
                                        if (hasTag) setEditingItemTags(editingItemTags.filter(t => t !== 'tam_boy'));
                                        else setEditingItemTags([...editingItemTags.filter(t => t !== 'ust_beden'), 'tam_boy']);
                                    }}

                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all border",
                                        editingItemTags.includes('tam_boy')
                                            ? "bg-blue-500 text-white border-blue-600"
                                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    Tam Boy
                                </button>
                                <button
                                    onClick={() => {
                                        const hasTag = editingItemTags.includes('ust_beden');
                                        if (hasTag) setEditingItemTags(editingItemTags.filter(t => t !== 'ust_beden'));
                                        else setEditingItemTags([...editingItemTags.filter(t => t !== 'tam_boy'), 'ust_beden']);
                                    }}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all border",
                                        editingItemTags.includes('ust_beden')
                                            ? "bg-orange-500 text-white border-orange-600"
                                            : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    Üst Beden
                                </button>
                            </div>
                            <input
                                type="text"
                                className="w-full text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder={language === "tr" ? "Örn: yan_aci, dinamik, casual" : "e.g. yan_aci, dynamic, casual"}
                                value={editingItemTags.join(', ')}
                                onChange={(e) => setEditingItemTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {language === "tr"
                                    ? "💡 Yan açılı pozlar için 'yan_aci' etiketi ekleyin"
                                    : "💡 Add 'yan_aci' tag for angled poses"}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={() => handleUpdateThumbnail(null)}
                        className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] font-semibold"
                    >
                        {language === "tr" ? "Güncelle ve Kaydet" : "Update & Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
