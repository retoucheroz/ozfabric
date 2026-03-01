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
import { downloadImage, cn } from "@/lib/utils"
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

const UPSCALE_CREDITS: Record<string, number> = {
    "1x": 50,
    "2x": 100,
    "4x": 200,
    "8x": 400
};

export default function ResizePage() {
    const { addProject, deductCredits } = useProjects();
    const { t, language } = useLanguage();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [mode, setMode] = useState<"expand" | "upscale">("expand");
    const [expandDirection, setExpandDirection] = useState("all");
    const [expandAmount, setExpandAmount] = useState(50);
    const [upscaleFactor, setUpscaleFactor] = useState("2x");
    const [creativity, setCreativity] = useState(5.0);
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

        const creditCost = mode === "upscale" ? UPSCALE_CREDITS[upscaleFactor] : 3;
        if (!(await deductCredits(creditCost))) {
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
                    prompt: expandPrompt,
                    creativity
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
                        : `Upscaled ${upscaleFactor}`,
                    mediaType: "image"
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
            downloadImage(resultImage, `retoucheroz-${mode}.png`);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
            {/* Left Panel - Controls */}
            <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-[#0D0D0F] p-8 lg:overflow-y-auto space-y-8 shrink-0">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
                        <TbMaximize className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">{t("resize.title")}</h2>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1.5">{t("resize.subtitle")}</p>
                    </div>
                </div>

                {/* Mode Tabs */}
                <Tabs value={mode} onValueChange={(v) => setMode(v as "expand" | "upscale")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-white/5 border border-white/5 rounded-xl">
                        <TabsTrigger value="expand" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2">
                            <TbMaximize className="w-4 h-4" />
                            {t("resize.expand")}
                        </TabsTrigger>
                        <TabsTrigger value="upscale" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2">
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
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1">{t("resize.upscaleFactor")}</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {["1x", "2x", "4x", "8x"].map((factor) => (
                                    <Button
                                        key={factor}
                                        variant={upscaleFactor === factor ? "default" : "outline"}
                                        className={cn(
                                            "h-12 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            upscaleFactor === factor
                                                ? "bg-white text-black hover:bg-zinc-200 shadow-xl border-white"
                                                : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                                        )}
                                        onClick={() => setUpscaleFactor(factor)}
                                    >
                                        {factor}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 ">
                                    <TbSparkles className="w-3.5 h-3.5" />
                                    {language === "tr" ? "YARATICILIK" : "CREATIVITY"}
                                </Label>
                                <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{creativity.toFixed(1)}</span>
                            </div>
                            <Slider
                                value={[creativity]}
                                onValueChange={(v) => setCreativity(v[0])}
                                min={0}
                                max={10}
                                step={0.1}
                                className="py-2"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 leading-relaxed px-1 grayscale">
                                {language === "tr" ? "Görsele yeni ve yaratıcı detaylar ekler." : "Adds new and creative details to the image."}
                            </p>
                        </div>

                        <Card className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-white opacity-40 text-white mt-0.5" />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase tracking-widest text-[11px] text-white leading-none">{t("resize.aiEnhanced")}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 mt-2 leading-relaxed">{t("resize.aiEnhancedDesc")}</p>
                                </div>
                            </div>
                        </Card>

                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5 border border-white/10 rounded-xl p-4 leading-relaxed">
                            <strong className="text-white">{t("resize.note")}:</strong> {t("resize.upscaleNote")}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Upload Area */}
                <div className="space-y-4 pt-4">
                    <Label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1">
                        <TbPhoto className="w-3.5 h-3.5 text-white" />
                        {t("resize.uploadImage")}
                    </Label>
                    <div className="border-2 border-dashed rounded-2xl h-44 border-white/5 hover:border-white/20 transition-all relative group overflow-hidden cursor-pointer bg-white/[0.02]">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                        />
                        {preview ? (
                            <img src={preview} className="w-full h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-6 h-6 opacity-30" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t("resize.dropImage")}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        size="lg"
                        className="w-full h-16 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em]"
                        onClick={handleProcess}
                        disabled={!preview || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <TbLoader2 className="w-5 h-5 mr-3 animate-spin" />
                                <span>{t("resize.processing")}</span>
                            </>
                        ) : (
                            <>
                                <TbSparkles className="w-5 h-5 mr-3 opacity-50" />
                                <span>{mode === "expand" ? t("resize.expandNow") : t("resize.upscaleNow")}</span>
                                <span className="ml-4 opacity-40 font-black border-l border-black/10 pl-4">
                                    {mode === "expand" ? "3" : UPSCALE_CREDITS[upscaleFactor]} {t("settings.credits")}
                                </span>
                            </>
                        )}
                    </Button>
                </div>


            </div>

            {/* Right Panel - Result */}
            <div className="flex-1 bg-[#0D0D0F] flex items-center justify-center p-8 relative">
                {resultImage ? (
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={resultImage}
                            className="max-h-[calc(100vh-160px)] max-w-full rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500"
                        />
                        <div className="absolute top-6 right-6 flex gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="bg-white text-black hover:bg-zinc-200 h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                                onClick={() => setResultImage(null)}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t("common.reset")}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-white text-black hover:bg-zinc-200 h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                                onClick={handleDownload}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {t("common.download")}
                            </Button>
                        </div>
                        <div className="absolute bottom-6 left-6 bg-black text-white border border-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
                            {mode === "expand"
                                ? `+${expandAmount}% ${expandDirection}`
                                : `${upscaleFactor} ${t("resize.enhanced")}`}
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-20 max-w-sm flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white flex items-center justify-center mb-8">
                            {mode === "expand" ? (
                                <Maximize2 className="w-10 h-10 text-white" />
                            ) : (
                                <ZoomIn className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-3 leading-none">{t("resize.noResult")}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-relaxed">{t("resize.noResultDesc")}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
