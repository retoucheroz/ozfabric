"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, User } from "lucide-react"

interface SavePoseDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    tempPoseData: { original: string } | null;
    handleSavePose: (gender: 'male' | 'female' | 'skip') => void;
}

export function SavePoseDialog({
    isOpen,
    onOpenChange,
    language,
    tempPoseData,
    handleSavePose
}: SavePoseDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Pozu Kaydet" : "Save Pose"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-center">
                        {tempPoseData && (
                            <div className="relative w-32 h-48 rounded-md overflow-hidden border">
                                <img src={tempPoseData.original} alt="Original" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">{language === "tr" ? "Stickman oluşturmadan önce pozu kaydetmek ister misiniz?" : "Do you want to save this to library before converting?"}</p>
                    <div className="flex gap-2 justify-center mt-2">
                        <Button variant="outline" onClick={() => handleSavePose('female')} className="gap-2">
                            <User className="w-4 h-4 text-pink-500" />
                            {language === "tr" ? "Kadın Olarak Kaydet" : "Save as Female"}
                        </Button>
                        <Button variant="outline" onClick={() => handleSavePose('male')} className="gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            {language === "tr" ? "Erkek Olarak Kaydet" : "Save as Male"}
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => handleSavePose('skip')} className="w-full mt-2 text-xs text-muted-foreground">
                        {language === "tr" ? "Kaydetme, Sadece Dönüştür" : "Don't Save, Just Convert"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
