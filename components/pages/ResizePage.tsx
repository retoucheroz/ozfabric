"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Maximize2, ZoomIn, Loader2, Download, Image as ImageIcon, Sparkles, ArrowRight, RefreshCw, X, ChevronRight } from "lucide-react"
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
    TbHdr,
    TbCoins
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
        <div className="flex flex-col h-full bg-[#0D0D0F]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-screen pb-24">
                <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-8">

                    {/* Left: Input Panel */}
                    <div className="w-full lg:w-[420px] flex flex-col space-y-6 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                                <Maximize2 className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                                    {t("resize.title")}
                                </label>
                                <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                                    {t("resize.subtitle")}
                                </span>
                            </div>
                        </div>

                        {/* Upload Area First */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                <TbPhoto className="w-4 h-4 text-zinc-500" />
                                {t("resize.uploadImage")}
                            </label>
                            <div className="h-44 border border-dashed border-white/20 rounded-2xl bg-[#121214] relative group hover:border-white/40 transition-all cursor-pointer overflow-hidden shadow-none">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                {preview ? (
                                    <div className="relative h-full">
                                        <img src={preview} className="w-full h-full object-contain p-2" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-[#18181B] border border-white/10 flex items-center justify-center group-hover:bg-white text-zinc-500 group-hover:text-black transition-all text-zinc-500">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em]">{t("resize.dropImage")}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode Tabs */}
                        <Tabs value={mode} onValueChange={(v) => setMode(v as "expand" | "upscale")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-[#121214] border border-white/10 rounded-xl">
                                <TabsTrigger value="expand" className="text-[11px] font-black uppercase tracking-[0.18em] rounded-lg data-[state=active]:bg-[#18181B] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-2 text-zinc-500">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    {t("resize.expand")}
                                </TabsTrigger>
                                <TabsTrigger value="upscale" className="text-[11px] font-black uppercase tracking-[0.18em] rounded-lg data-[state=active]:bg-[#18181B] data-[state=active]:text-white data-[state=active]:shadow-none transition-all gap-2 text-zinc-500">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                    {t("resize.upscale")}
                                </TabsTrigger>
                            </TabsList>

                            {/* Expand Options */}
                            <TabsContent value="expand" className="space-y-6 mt-6 focus-visible:outline-none">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                        <TbAdjustmentsHorizontal className="w-4 h-4 text-zinc-500" />
                                        {t("resize.expandDirection")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={expandDirection}
                                            onChange={(e) => setExpandDirection(e.target.value)}
                                            className="w-full h-12 bg-[#121214] border border-white/10 rounded-xl px-4 pr-10 text-[11px] font-black text-white shadow-none uppercase tracking-[0.18em] focus:outline-none focus:border-white/30 transition-all appearance-none"
                                        >
                                            <option value="all" className="bg-[#121214]">{t("resize.allSides")}</option>
                                            <option value="horizontal" className="bg-[#121214]">{t("resize.horizontal")}</option>
                                            <option value="vertical" className="bg-[#121214]">{t("resize.vertical")}</option>
                                            <option value="top" className="bg-[#121214]">{t("resize.top")}</option>
                                            <option value="bottom" className="bg-[#121214]">{t("resize.bottom")}</option>
                                            <option value="left" className="bg-[#121214]">{t("resize.left")}</option>
                                            <option value="right" className="bg-[#121214]">{t("resize.right")}</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                            <TbMaximize className="w-4 h-4" />
                                            {t("resize.expandAmount")}
                                        </label>
                                        <span className="text-[11px] font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{expandAmount}%</span>
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

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                        <Sparkles className="w-4 h-4 text-zinc-500" />
                                        {t("resize.expandPrompt")}
                                    </label>
                                    <textarea
                                        placeholder={t("resize.expandPromptPlaceholder")}
                                        value={expandPrompt}
                                        onChange={(e) => setExpandPrompt(e.target.value)}
                                        className="w-full h-28 bg-[#121214] border border-white/10 rounded-2xl p-4 text-[13px] font-medium text-white shadow-none placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all resize-none overflow-y-auto custom-scrollbar"
                                    />
                                    <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 leading-relaxed px-1">
                                        {t("resize.expandPromptHint")}
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Upscale Options */}
                            <TabsContent value="upscale" className="space-y-6 mt-6 focus-visible:outline-none">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                        <Maximize2 className="w-4 h-4 text-zinc-500" />
                                        {t("resize.upscaleFactor")}
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {["1x", "2x", "4x", "8x"].map((factor) => (
                                            <Button
                                                key={factor}
                                                className={cn(
                                                    "h-12 text-[11px] font-black uppercase tracking-[0.18em] rounded-xl transition-all shadow-none",
                                                    upscaleFactor === factor
                                                        ? "bg-[#FF3D5A] text-white hover:bg-[#FF3D5A]/90"
                                                        : "bg-[#121214] border border-white/10 text-zinc-500 hover:text-white"
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
                                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-zinc-500" />
                                            {language === "tr" ? "YARATICILIK" : "CREATIVITY"}
                                        </label>
                                        <span className="text-[11px] font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{creativity.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        value={[creativity]}
                                        onValueChange={(v) => setCreativity(v[0])}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        className="py-2"
                                    />
                                    <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 leading-relaxed px-1">
                                        {language === "tr" ? "Görsele yeni ve yaratıcı detaylar ekler." : "Adds new and creative details to the image."}
                                    </p>
                                </div>

                                <div className="p-5 bg-[#18181B] border border-white/10 rounded-2xl">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-[#121214] flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-[#FF3D5A]" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-[0.18em] text-[11px] text-white leading-none">{t("resize.aiEnhanced")}</h4>
                                            <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 mt-2 leading-relaxed">{t("resize.aiEnhancedDesc")}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-[#121214] border border-white/10 rounded-xl p-4 leading-relaxed">
                                    <strong className="text-white">{t("resize.note")}:</strong> {t("resize.upscaleNote")}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Process Button */}
                        <div className="pt-2">
                            <Button
                                className="w-full h-12 rounded-md bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white font-black text-[11px] shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.18em]"
                                onClick={handleProcess}
                                disabled={!preview || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        <span>{t("resize.processing")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <span>{mode === "expand" ? t("resize.expandNow") : t("resize.upscaleNow")}</span>
                                            <div className="h-4 w-px bg-white/30 mx-1 shrink-0" />
                                            <div className="flex items-center gap-1 opacity-90">
                                                <TbCoins className="w-4 h-4" />
                                                <span className="text-[11px] font-black tracking-tighter">
                                                    {mode === "expand" ? "3" : UPSCALE_CREDITS[upscaleFactor]}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Result Section */}
                    <div className="flex-1 flex flex-col space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-4 h-4 text-zinc-500" />
                            {language === 'tr' ? 'SONUÇ' : 'RESULT'}
                        </Label>

                        <div className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#121214] border border-dashed border-white/20 overflow-hidden flex items-center justify-center group rounded-2xl shadow-none hover:border-white/40 transition-colors">
                            {isProcessing ? (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                                        <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">{language === 'tr' ? 'İŞLENİYOR...' : 'PROCESSING...'}</h3>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 max-w-[240px] mx-auto transition-all duration-300 min-h-[1.5em] text-balance">
                                            {language === 'tr' ? 'Görseliniz yapay zeka tarafından yeniden işleniyor.' : 'Your image is being reprocessed by AI.'}
                                        </p>
                                    </div>
                                </div>
                            ) : resultImage ? (
                                <div className="w-full h-full flex flex-col p-4 space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner bg-black/5">
                                        <img src={resultImage} className="w-full h-full object-contain" alt="Result" />
                                        <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="icon" className="bg-white text-black hover:bg-zinc-200 h-10 w-10 rounded-md" onClick={handleDownload}>
                                                <Download className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[11px] font-black text-zinc-500 tracking-[0.18em] uppercase">
                                                {mode === "expand" ? (language === 'tr' ? 'BAŞARIYLA GENİŞLETİLDİ' : 'SUCCESSFULLY EXPANDED') : (language === 'tr' ? 'BAŞARIYLA BÜYÜTÜLDİ' : 'SUCCESSFULLY UPSCALED')}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="secondary" size="sm" onClick={() => setResultImage(null)} className="h-10 text-[11px] font-black uppercase tracking-[0.18em] rounded-md px-5 bg-[#F5F5F5] text-black hover:bg-zinc-200 shadow-none transition-all">
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                {language === 'tr' ? 'YENİ' : 'NEW'}
                                            </Button>
                                            <Button size="sm" onClick={handleDownload} className="h-10 bg-[#FF3D5A] text-white text-[11px] font-black uppercase tracking-[0.18em] rounded-md px-5 hover:bg-[#FF3D5A]/90 shadow-xl transition-all">
                                                <Download className="w-4 h-4 mr-2" />
                                                {language === 'tr' ? 'İNDİR' : 'DOWNLOAD'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center p-12">
                                    <div className="w-20 h-20 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center shadow-none">
                                        {mode === 'expand' ? <Maximize2 className="w-10 h-10 text-white/50" /> : <ZoomIn className="w-10 h-10 text-white/50" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{t("resize.noResult")}</h4>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.18em] max-w-[280px] mx-auto text-balance mt-2">
                                            {t("resize.noResultDesc")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
