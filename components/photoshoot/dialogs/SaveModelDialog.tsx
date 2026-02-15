"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SaveModelDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    tempModelData: { url: string, name: string, gender: 'male' | 'female' } | null;
    setTempModelData: (data: any) => void;
    onSave: () => void;
}

export function SaveModelDialog({
    isOpen,
    onOpenChange,
    language,
    tempModelData,
    setTempModelData,
    onSave
}: SaveModelDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Modeli Kaydet" : "Save Model"}</DialogTitle>
                </DialogHeader>
                {tempModelData && (
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-center">
                            <div className="relative w-32 h-48 rounded-md overflow-hidden border bg-muted">
                                <img src={tempModelData.url} alt="Model" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">{language === "tr" ? "Model Adı" : "Model Name"}</label>
                            <input
                                type="text"
                                className="w-full text-sm p-2 rounded-lg border bg-background"
                                placeholder={language === "tr" ? "Model Adı Girin" : "Enter Model Name"}
                                value={tempModelData.name}
                                onChange={(e) => setTempModelData({ ...tempModelData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div
                                onClick={() => setTempModelData({ ...tempModelData, gender: 'female' })}
                                className={cn(
                                    "cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all",
                                    tempModelData.gender === 'female'
                                        ? "bg-violet-100 border-violet-500 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                        : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                                )}
                            >
                                <span className="text-xs font-medium">{language === "tr" ? "Kadın" : "Female"}</span>
                            </div>
                            <div
                                onClick={() => setTempModelData({ ...tempModelData, gender: 'male' })}
                                className={cn(
                                    "cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all",
                                    tempModelData.gender === 'male'
                                        ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                                )}
                            >
                                <span className="text-xs font-medium">{language === "tr" ? "Erkek" : "Male"}</span>
                            </div>
                        </div>

                        <Button onClick={onSave} className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] mt-2">
                            {language === "tr" ? "Kaydet ve Seç" : "Save & Select"}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
