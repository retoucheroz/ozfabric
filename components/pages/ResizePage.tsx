"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Maximize2, ZoomIn, Loader2, Download, Image as ImageIcon, Sparkles, ArrowRight, RefreshCw } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import {
    TbMaximize,
    TbZoomIn,
    TbAdjustmentsHorizontal,
    TbPhoto,
    TbSparkles,
    TbLoader2,
    TbArrowRight,
    TbRefresh,
    TbHdr
} from "react-icons/tb"

export default function ResizePage() {
    const { addProject, deductCredits } = useProjects();
    const { t } = useLanguage();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [mode, setMode] = useState<"expand" | "upscale">("expand");
    const [expandDirection, setExpandDirection] = useState("all");
    const [expandAmount, setExpandAmount] = useState(50);
    const [upscaleFactor, setUpscaleFactor] = useState("2x");
    const [expandPrompt, setExpandPrompt] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
            setResultImage(null);
        }
    };

    const handleProcess = async () => {
        if (!preview) return;

        const creditCost = mode === "upscale" ? 2 : 3;
        if (!deductCredits(creditCost)) {
            toast.error(t("common.insufficientCredits"));
            return;
        }

        setIsProcessing(true);
        setResultImage(null);

        try {
            const response = await fetch("/api/resize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: preview,
                    mode,
                    upscale_factor: upscaleFactor,
                    expand_direction: expandDirection,
                    expand_amount: expandAmount / 100, // Normalized to 0-1
                    prompt: expandPrompt
                })
            });

            const data = await response.json();

            if (data.imageUrl) {
                setResultImage(data.imageUrl);
                addProject({
                    title: mode === "expand" ? t("resize.expandResult") : t("resize.upscaleResult"),
                    type: mode === "expand" ? "Expand" : "Upscale",
                    imageUrl: data.imageUrl,
                    description: mode === "expand"
                        ? `Expanded ${expandDirection} by ${expandAmount}%`
                        : `Upscaled ${upscaleFactor}`
                });
                toast.success(mode === "expand" ? t("resize.expandSuccess") : t("resize.upscaleSuccess"));
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Process failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `retoucheroz-${mode}.png`;
            link.click();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
            {/* Left Panel - Controls */}
            <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                        <TbMaximize className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase italic text-[var(--text-primary)]">{t("resize.title")}</h2>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest -mt-0.5">{t("resize.subtitle")}</p>
                    </div>
                </div>

                {/* Mode Tabs */}
                <Tabs value={mode} onValueChange={(v) => setMode(v as "expand" | "upscale")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] rounded-xl">
                        <TabsTrigger value="expand" className="gap-2 text-xs font-bold rounded-lg data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
                            <TbMaximize className="w-4 h-4" />
                            {t("resize.expand")}
                        </TabsTrigger>
                        <TabsTrigger value="upscale" className="gap-2 text-xs font-bold rounded-lg data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
                            <TbZoomIn className="w-4 h-4" />
                            {t("resize.upscale")}
                        </TabsTrigger>
                    </TabsList>

                    {/* Expand Options */}
                    <TabsContent value="expand" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 px-1">
                                <TbAdjustmentsHorizontal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                {t("resize.expandDirection")}
                            </Label>
                            <Select value={expandDirection} onValueChange={setExpandDirection}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("resize.allSides")}</SelectItem>
                                    <SelectItem value="horizontal">{t("resize.horizontal")}</SelectItem>
                                    <SelectItem value="vertical">{t("resize.vertical")}</SelectItem>
                                    <SelectItem value="top">{t("resize.top")}</SelectItem>
                                    <SelectItem value="bottom">{t("resize.bottom")}</SelectItem>
                                    <SelectItem value="left">{t("resize.left")}</SelectItem>
                                    <SelectItem value="right">{t("resize.right")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{t("resize.expandAmount")}</Label>
                                <span className="text-sm text-muted-foreground">{expandAmount}%</span>
                            </div>
                            <Slider
                                value={[expandAmount]}
                                onValueChange={(v) => setExpandAmount(v[0])}
                                min={10}
                                max={100}
                                step={10}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t("resize.expandPrompt")}</Label>
                            <Textarea
                                placeholder={t("resize.expandPromptPlaceholder")}
                                value={expandPrompt}
                                onChange={(e) => setExpandPrompt(e.target.value)}
                                className="h-24 resize-none"
                            />
                            <p className="text-xs text-muted-foreground">{t("resize.expandPromptHint")}</p>
                        </div>
                    </TabsContent>

                    {/* Upscale Options */}
                    <TabsContent value="upscale" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>{t("resize.upscaleFactor")}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {["2x", "4x", "8x"].map((factor) => (
                                    <Button
                                        key={factor}
                                        variant={upscaleFactor === factor ? "default" : "outline"}
                                        className={upscaleFactor === factor ? "bg-violet-500 text-white hover:bg-violet-600" : ""}
                                        onClick={() => setUpscaleFactor(factor)}
                                    >
                                        {factor}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Card className="p-4 bg-muted/30 border-dashed">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-violet-500 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm">{t("resize.aiEnhanced")}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{t("resize.aiEnhancedDesc")}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <strong>{t("resize.note")}:</strong> {t("resize.upscaleNote")}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Upload Area */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 px-1">
                        <TbPhoto className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        {t("resize.uploadImage")}
                    </Label>
                    <div className="border-2 border-dashed rounded-2xl h-36 border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all relative group overflow-hidden cursor-pointer bg-[var(--bg-surface)]">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                        />
                        {preview ? (
                            <img src={preview} className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <div className="p-2 bg-background/50 rounded-full shadow-sm">
                                    <ImageIcon className="w-5 h-5 opacity-50" />
                                </div>
                                <span className="text-xs">{t("resize.dropImage")}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Process Button */}
                <Button
                    size="lg"
                    className="w-full h-14 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black text-sm shadow-xl shadow-[var(--accent-primary)]/20 transition-all active:scale-95"
                    onClick={handleProcess}
                    disabled={!preview || isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <TbLoader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span className="uppercase tracking-widest">{t("resize.processing")}</span>
                        </>
                    ) : (
                        <>
                            <TbSparkles className="w-5 h-5 mr-2" />
                            <span className="uppercase tracking-widest">{mode === "expand" ? t("resize.expandNow") : t("resize.upscaleNow")}</span>
                        </>
                    )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                    {t("resize.cost")}: {mode === "expand" ? "3" : "2"} {t("settings.credits")}
                </p>
            </div>

            {/* Right Panel - Result */}
            <div className="flex-1 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-center p-8 relative">
                {resultImage ? (
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={resultImage}
                            className="max-h-[calc(100vh-160px)] max-w-full rounded-xl shadow-2xl animate-in zoom-in-95 duration-500"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setResultImage(null)}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t("common.reset")}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-violet-500 text-white hover:bg-violet-600"
                                onClick={handleDownload}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {t("common.download")}
                            </Button>
                        </div>
                        {/* Size comparison badge */}
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
                            {mode === "expand"
                                ? `+${expandAmount}% ${expandDirection}`
                                : `${upscaleFactor} ${t("resize.enhanced")}`}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground flex flex-col items-center gap-4 max-w-sm">
                        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center">
                            {mode === "expand" ? (
                                <Maximize2 className="w-10 h-10 opacity-30" />
                            ) : (
                                <ZoomIn className="w-10 h-10 opacity-30" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{t("resize.noResult")}</h3>
                            <p className="text-sm mt-1">{t("resize.noResultDesc")}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
