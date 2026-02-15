"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SaveAssetDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    tempAssetData: { key: string, url: string, name: string } | null;
    setTempAssetData: (data: any) => void;
    onSave: () => void;
}

export function SaveAssetDialog({
    isOpen,
    onOpenChange,
    language,
    tempAssetData,
    setTempAssetData,
    onSave
}: SaveAssetDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Kütüphaneye Kaydet" : "Save to Library"}</DialogTitle>
                </DialogHeader>
                {tempAssetData && (
                    <div className="space-y-4 py-4">
                        <div className="flex justify-center">
                            <div className="w-32 h-32 rounded-lg border overflow-hidden">
                                <img src={tempAssetData.url} className="w-full h-full object-cover" alt="Asset" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">{language === "tr" ? "Öğe Adı" : "Item Name"}</label>
                            <input
                                type="text"
                                className="w-full text-sm p-2 rounded-lg border bg-background"
                                value={tempAssetData.name}
                                onChange={(e) => setTempAssetData({ ...tempAssetData, name: e.target.value })}
                            />
                        </div>
                        <Button onClick={onSave} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]">
                            {language === "tr" ? "Kaydet" : "Save"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
