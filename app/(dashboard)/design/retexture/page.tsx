"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Shirt, Wand2, Loader2, Download, RefreshCw } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RetexturePage() {
    const { addProject, deductCredits } = useProjects();
    const { t } = useLanguage();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [prompt, setPrompt] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [resultImage, setResultImage] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            const r = new FileReader();
            r.onload = () => setPreview(r.result as string);
            r.readAsDataURL(f);
        }
    }

    const handleGenerate = async () => {
        if (!preview || !prompt) return;
        if (!deductCredits(1)) {
            toast.error(t("common.insufficientCredits") || "Insufficient Credits");
            return;
        }
        setIsProcessing(true);
        setResultImage(null);

        try {
            const response = await fetch("/api/retexture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: preview, prompt })
            });
            const data = await response.json();
            if (data.imageUrl) {
                setResultImage(data.imageUrl);
                toast.success(t("retexture.success") || "Texture Transferred!")
                addProject({
                    title: "Retextured: " + prompt.slice(0, 15),
                    type: "Style",
                    imageUrl: data.imageUrl,
                    description: `Retextured with: ${prompt}`
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
            {/* Input Column */}
            <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("retexture.title")}</h1>
                    <p className="text-muted-foreground">{t("retexture.subtitle")}</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">1. {t("retexture.baseGarment") || "Base Garment"}</label>
                        <Card className="h-32 flex items-center justify-center relative border-dashed border-2 rounded-xl hover:border-violet-500 transition-colors group overflow-hidden bg-muted/20 shadow-none">
                            {preview ? (
                                <img src={preview} className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <Shirt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-xs">{t("retexture.uploadGarment")}</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">2. {t("retexture.texturePrompt")}</label>
                        <Textarea
                            placeholder={t("retexture.promptPlaceholder")}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-32 resize-none"
                        />
                    </div>

                    <Button
                        size="lg"
                        className="w-full shadow-lg bg-violet-500 text-white hover:bg-violet-600"
                        onClick={handleGenerate}
                        disabled={!preview || !prompt || isProcessing}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isProcessing ? t("retexture.weaving") || "Weaving..." : t("retexture.transfer") || "Transfer Texture"}
                    </Button>
                </div>
            </div>

            {/* Result Column */}
            <div className="flex-1 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-center p-4 md:p-8 relative min-h-[400px]">
                {resultImage ? (
                    <div className="relative max-h-full max-w-full">
                        <img src={resultImage} className="max-h-[calc(100vh-150px)] max-w-full rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-700 object-contain" />
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button variant="secondary" onClick={() => router.push(`/photoshoot/try-on?garment=${encodeURIComponent(resultImage)}`)}>{t("styles.tryOn")}</Button>
                            <Button variant="secondary" onClick={() => router.push(`/studio?image=${encodeURIComponent(resultImage)}`)}>{t("common.getSpecs")}</Button>
                            <Button variant="secondary" size="icon"><Download className="w-4 h-4" /></Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center">
                        <RefreshCw className="w-16 h-16 mb-4 stroke-1" />
                        <p>{t("retexture.resultHere") || "Result will appear here"}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
