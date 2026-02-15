"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SaveLightingDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    tempLightingData: { url: string, name: string, positivePrompt: string, negativePrompt: string, sendImageAsAsset: boolean } | null;
    setTempLightingData: (data: any) => void;
    onSave: () => void;
}

export function SaveLightingDialog({
    isOpen,
    onOpenChange,
    language,
    tempLightingData,
    setTempLightingData,
    onSave
}: SaveLightingDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Işıklandırmayı Kaydet" : "Save Lighting Setup"}</DialogTitle>
                </DialogHeader>
                {tempLightingData && (
                    <div className="space-y-4 py-4">
                        <div className="aspect-square w-32 mx-auto rounded-lg border overflow-hidden">
                            <img src={tempLightingData.url} className="w-full h-full object-cover" alt="Lighting" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">{language === "tr" ? "Setup Adı" : "Setup Name"}</label>
                            <input
                                type="text"
                                className="w-full text-sm p-2 rounded-lg border bg-background"
                                placeholder={language === "tr" ? "Örn: Gün Işığı 5600K" : "e.g. Daylight 5600K"}
                                value={tempLightingData.name}
                                onChange={(e) => setTempLightingData({ ...tempLightingData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">{language === "tr" ? "Pozitif Prompt (LIGHTING)" : "Positive Prompt (LIGHTING)"}</label>
                            <textarea
                                className="w-full text-sm p-2 rounded-lg border bg-background h-20"
                                value={tempLightingData.positivePrompt}
                                onChange={(e) => setTempLightingData({ ...tempLightingData, positivePrompt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">{language === "tr" ? "Negatif Prompt" : "Negative Prompt"}</label>
                            <textarea
                                className="w-full text-sm p-2 rounded-lg border bg-background h-20"
                                value={tempLightingData.negativePrompt}
                                onChange={(e) => setTempLightingData({ ...tempLightingData, negativePrompt: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                            <div className="space-y-0.5">
                                <div className="text-xs font-bold text-[var(--text-primary)]">
                                    {language === "tr" ? "Görseli Referans Olarak Gönder" : "Send Image as Visual Reference"}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)]">
                                    {language === "tr" ? "Kapatılırsa sadece promptlar kullanılır" : "If disabled, only prompts will be used"}
                                </div>
                            </div>
                            <button
                                onClick={() => setTempLightingData({ ...tempLightingData, sendImageAsAsset: !tempLightingData.sendImageAsAsset })}
                                className={cn("w-10 h-5 rounded-full transition-colors relative", tempLightingData.sendImageAsAsset ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-muted)]")}
                            >
                                <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${tempLightingData.sendImageAsAsset ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        <Button onClick={onSave} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]">
                            {language === "tr" ? "Kütüphaneye Kaydet" : "Save to Library"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
