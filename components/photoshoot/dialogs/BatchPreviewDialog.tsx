"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Package, X, CheckCircle2, AlertCircle, Eye, EyeOff, LayoutPanelLeft, Box, Shirt, User, Zap } from "lucide-react"
import { Separator } from "@/components/ui/separator"
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
    if (!isAdmin) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[95vw] w-[1600px] h-[65vh] p-0 overflow-hidden flex flex-col bg-[#0A0A0B] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {/* Header: Production Control Panel Style */}
                <div className="flex-none px-8 py-5 border-b border-[#222] bg-[#111]/80 backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                            <Zap className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                {language === "tr" ? "Üretim Önizleme" : "Production Preview"}
                                <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-600/30">ADMIN MODE</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-zinc-500 mt-0.5 uppercase tracking-wide">
                                {language === "tr" ? "Çekim parametrelerini ve API talimatlarını kontrol edin." : "Check shooting parameters and API instructions."}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === "tr" ? "KARE SAYISI" : "SHOT COUNT"}:</span>
                            <span className="text-sm font-black text-blue-500">{batchPreviewPrompts.length}</span>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all group"
                        >
                            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Content: Horizontal Scroll Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#0D0D0E] flex items-center px-8 gap-6 py-6 scroll-smooth">
                    {batchPreviewPrompts.map((p, idx) => {
                        const isSelected = selectedBatchImages[idx];
                        const spec = p.spec || {};
                        const prompt = editedBatchPrompts[idx] || "";

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "relative h-full w-[800px] shrink-0 rounded-3xl border-2 transition-all flex flex-col overflow-hidden bg-[#141416]/50 shadow-2xl",
                                    isSelected
                                        ? "border-blue-600/40 ring-1 ring-blue-600/10"
                                        : "border-zinc-800 opacity-40 grayscale pointer-events-none"
                                )}
                            >
                                {/* Item Header */}
                                <div className="flex-none p-5 border-b border-[#222] bg-zinc-900/40 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                            <LayoutPanelLeft className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-sm font-black text-zinc-200 tracking-tight uppercase">{p.title}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = [...selectedBatchImages];
                                            updated[idx] = !isSelected;
                                            setSelectedBatchImages(updated);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all pointer-events-auto",
                                            isSelected
                                                ? "bg-blue-600 border-blue-400 text-white"
                                                : "bg-[#1A1A1C] border-zinc-700 text-zinc-500"
                                        )}
                                    >
                                        {isSelected ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        {isSelected ? (language === "tr" ? "AKTİF" : "ACTIVE") : (language === "tr" ? "PASİF" : "INACTIVE")}
                                    </button>
                                </div>

                                {/* Item Body: 2-Column Layout */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Left Side: Metadata & Status */}
                                    <div className="w-[280px] p-5 border-r border-[#222] space-y-5 overflow-y-auto custom-scrollbar bg-black/20">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === "tr" ? "ÇEKİM AÇISI" : "SHOT ANGLE"}</p>
                                                <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-blue-400 uppercase">{p.spec?.view}</div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === "tr" ? "SEÇİLİ VARLIKLAR" : "SELECTED ASSETS"}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(p.spec?.assets || ['Default']).map((a: string) => (
                                                        <span key={a} className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* API Status Checklist */}
                                            <div className="pt-4 space-y-3">
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === "tr" ? "API GÖNDERİM DURUMU" : "API SEND STATUS"}</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { label: "Shoes", excluded: spec.excludeShoesAsset || spec.excludeAllAccessories },
                                                        { label: "Belt", excluded: spec.excludeBeltAsset || spec.excludeAllAccessories },
                                                        { label: "Hat", excluded: spec.excludeHatAsset || spec.excludeAllAccessories },
                                                        { label: "Bag", excluded: spec.excludeBagAsset || spec.excludeAllAccessories },
                                                        { label: "Jewelry", excluded: spec.excludeAllAccessories },
                                                        { label: "Hair Context", excluded: spec.excludeHairInfo }
                                                    ].map((item) => (
                                                        <div key={item.label} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                                                            <span className="text-[10px] font-bold text-zinc-500">{item.label}</span>
                                                            {item.excluded ? (
                                                                <X className="w-3 h-3 text-red-500/50" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Final Prompt Viewer */}
                                    <div className="flex-1 p-5 flex flex-col bg-black/40">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Box className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">{language === "tr" ? "FİNAL PROMPT (API)" : "FINAL PROMPT (API)"}</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                                {prompt.length} CHR
                                            </span>
                                        </div>
                                        <div className="flex-1 relative group">
                                            <textarea
                                                value={prompt}
                                                readOnly
                                                className="w-full h-full bg-[#0A0A0B] border border-zinc-800 rounded-2xl p-4 text-[12px] font-mono leading-relaxed text-zinc-400 focus:outline-none resize-none custom-scrollbar-minimal scroll-pt-4"
                                                spellCheck={false}
                                            />
                                            {/* Mask to indicate it's readonly and structured */}
                                            <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-blue-500/10 transition-colors rounded-2xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Spacer for horizontal scroll padding */}
                    <div className="w-8 shrink-0" />
                </div>

                {/* Footer */}
                <div className="flex-none px-8 py-5 border-t border-[#222] bg-[#111]/90 backdrop-blur-xl flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{language === "tr" ? "API HAZIR" : "API READY"}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-zinc-800" />
                        <div className="text-[11px] font-bold text-zinc-500">
                            {selectedBatchImages.filter(Boolean).length} {language === "tr" ? "KARE ÜRETİLECEK" : "SHOTS TO GENERATE"}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 px-8 font-black text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-all bg-transparent hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-2xl"
                        >
                            {language === "tr" ? "İPTAL" : "CANCEL"}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!selectedBatchImages.some(Boolean)}
                            className="h-12 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.1em] shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 disabled:opacity-30 border border-blue-400/20"
                        >
                            {language === "tr" ? "ONAYLA VE BAŞLAT" : "CONFIRM & START"}
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                <Zap className="w-3 h-3 fill-white" />
                            </div>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

