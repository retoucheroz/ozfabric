"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Loader2,
    Download,
    X,
    Maximize2,
    Sparkles,
    Camera,
    Package,
    Box,
    Image as ImageIcon
} from "lucide-react"
import {
    TbCoins,
    TbAspectRatio,
    TbRefresh,
    TbPhoto,
    TbMessageDots
} from "react-icons/tb"
import { useRouter } from "next/navigation"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { downloadImage, cn, optimizeImageForApi } from "@/lib/utils"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { SERVICE_COSTS } from "@/lib/pricingConstants"

const RESOLUTION_OPTIONS = [
    { id: "1K", label: "1K Standard", labelTr: "1K Standart" },
    { id: "2K", label: "2K High", labelTr: "2K Yüksek" },
    { id: "4K", label: "4K Ultra", labelTr: "4K Ultra" },
];

const ASPECT_RATIO_OPTIONS = [
    { id: "1:1", label: "Square (1:1)", labelTr: "Kare (1:1)" },
    { id: "2:3", label: "Classic (2:3)", labelTr: "Klasik (2:3)" },
    { id: "3:4", label: "Portrait (3:4)", labelTr: "Portre (3:4)" },
    { id: "9:16", label: "Story (9:16)", labelTr: "Hikaye (9:16)" },
    { id: "16:9", label: "Wide (16:9)", labelTr: "Geniş (16:9)" },
];

const LOADING_MESSAGES = [
    { en: "Analyzing product geometry...", tr: "Ürün geometrisi analiz ediliyor..." },
    { en: "Setting up studio lighting...", tr: "Stüdyo ışıkları ayarlanıyor..." },
    { en: "Enhancing material textures...", tr: "Malzeme dokuları iyileştiriliyor..." },
    { en: "Synthesizing background scene...", tr: "Arkaplan sahnesi oluşturuluyor..." },
    { en: "Finalizing 8K render pass...", tr: "8K render işlemi tamamlanıyor..." },
];

function ProductPageContent() {
    const router = useRouter();
    const { addProject, deductCredits } = useProjects();
    const { t, language } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Image states
    const [mainImage, setMainImage] = useState<string | null>(null)
    const [detail1Image, setDetail1Image] = useState<string | null>(null)
    const [detail2Image, setDetail2Image] = useState<string | null>(null)
    const [prompt, setPrompt] = useState("")

    const [selectedResolution, setSelectedResolution] = useState("1K")
    const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1")
    const [isProcessing, setIsProcessing] = useState(false)
    const [resultImage, setResultImage] = useState<string | null>(null)

    // Progress states
    const [generationProgress, setGenerationProgress] = useState(0)
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

    if (!mounted) return null;

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const optimized = await optimizeImageForApi(reader.result as string, 3000, 0.90);
                setter(optimized);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!mainImage) {
            toast.error(t("product.errorMain"));
            return;
        }

        const creditCost = selectedResolution === "4K"
            ? SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_4K
            : SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_1_2K;

        if (!(await deductCredits(creditCost))) {
            toast.error(t("common.insufficientCredits") || "Insufficient Credits");
            return;
        }

        setIsProcessing(true);
        setResultImage(null);
        setGenerationProgress(0);
        setCurrentMessageIndex(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.floor(Math.random() * 5) + 1;
            });
        }, 800);

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);

        try {
            const response = await fetch("/api/product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    images: [mainImage, detail1Image, detail2Image].filter(Boolean),
                    prompt,
                    resolution: selectedResolution,
                    aspectRatio: selectedAspectRatio
                }),
            });

            const data = await response.json();

            clearInterval(progressInterval);
            clearInterval(messageInterval);
            setGenerationProgress(100);

            if (data.imageUrl) {
                setResultImage(data.imageUrl);
                addProject({
                    title: language === "tr" ? "Ürün Çekimi" : "Product Shot",
                    type: "Product",
                    imageUrl: data.imageUrl,
                    description: `${selectedResolution} • ${selectedAspectRatio} • ${prompt.substring(0, 30)}...`,
                    mediaType: "image"
                });
                toast.success(t("product.success"));
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            console.error("Product Error:", error);
            toast.error(language === "tr" ? "Bir hata oluştu" : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-8">

                    {/* Left: Input Panel */}
                    <div className="w-full lg:w-[420px] flex flex-col space-y-6 shrink-0">

                        {/* Main Product Image */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                                <Package className="w-4 h-4 text-white" />
                                {t("product.mainImage")} *
                            </label>
                            <div className="h-48 border-2 border-dashed border-white/5 rounded-2xl bg-[#18181b] relative group hover:border-white transition-all cursor-pointer overflow-hidden">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                                    onChange={(e) => handleImageChange(e, setMainImage)}
                                />
                                {mainImage ? (
                                    <div className="relative h-full">
                                        <img src={mainImage} className="w-full h-full object-contain p-2" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setMainImage(null); }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <Box className="w-8 h-8 opacity-50" />
                                        <span className="text-xs uppercase font-black tracking-widest">{language === 'tr' ? 'ANA GÖRSEL YÜKLE' : 'UPLOAD MAIN IMAGE'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Optional Detail Images */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                                <TbPhoto className="w-4 h-4 text-white" />
                                {t("product.detailImages")}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Detail 1 */}
                                <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl bg-[#18181b] relative group hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageChange(e, setDetail1Image)}
                                    />
                                    {detail1Image ? (
                                        <div className="relative h-full">
                                            <img src={detail1Image} className="w-full h-full object-contain p-1" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDetail1Image(null); }}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t("product.detail1")}</span>
                                            <span className="text-[8px] opacity-50">{language === 'tr' ? '(OPSİYONEL)' : '(OPTIONAL)'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Detail 2 */}
                                <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl bg-[#18181b] relative group hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageChange(e, setDetail2Image)}
                                    />
                                    {detail2Image ? (
                                        <div className="relative h-full">
                                            <img src={detail2Image} className="w-full h-full object-contain p-1" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDetail2Image(null); }}
                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{t("product.detail2")}</span>
                                            <span className="text-[8px] opacity-50">{language === 'tr' ? '(OPSİYONEL)' : '(OPTIONAL)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Prompt Area */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                                <TbMessageDots className="w-4 h-4 text-white" />
                                {t("product.prompt")}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t("product.promptPlaceholder")}
                                className="w-full h-32 bg-[#18181b] border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all resize-none overflow-y-auto custom-scrollbar"
                            />
                        </div>

                        {/* Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <TbAspectRatio className="w-4 h-4 text-white" />
                                    {language === "tr" ? "ORAN" : "RATIO"}
                                </label>
                                <select
                                    value={selectedAspectRatio}
                                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-md px-4 text-[10px] font-bold text-white uppercase tracking-tight focus:outline-none"
                                >
                                    {ASPECT_RATIO_OPTIONS.map(ratio => (
                                        <option key={ratio.id} value={ratio.id} className="bg-zinc-900">
                                            {ratio.id} ({language === 'tr' ? ratio.labelTr : ratio.label})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-white" />
                                    {language === "tr" ? "KALİTE" : "QUALITY"}
                                </label>
                                <select
                                    value={selectedResolution}
                                    onChange={(e) => setSelectedResolution(e.target.value)}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-md px-4 text-[10px] font-bold text-white uppercase tracking-tight focus:outline-none"
                                >
                                    {RESOLUTION_OPTIONS.map(res => (
                                        <option key={res.id} value={res.id} className="bg-zinc-900">
                                            {res.id} {language === 'tr' ? res.labelTr : res.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="pt-4">
                            <Button
                                variant="hot-coral"
                                size="lg"
                                className="h-12 w-full overflow-hidden"
                                disabled={isProcessing}
                                onClick={handleGenerate}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t("product.generating")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-4 h-4 flex-none" />
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <span>{language === "tr" ? "OLUŞTUR" : "GENERATE"}</span>
                                            <div className="h-4 w-px bg-white/20 mx-1 shrink-0" />
                                            <div className="flex items-center gap-1 opacity-90">
                                                <TbCoins className="w-4 h-4" />
                                                <span className="text-[10px] font-black">
                                                    {selectedResolution === "4K" ? SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_4K : SERVICE_COSTS.IMAGE_GENERATION.PRODUCT_MODEL_1_2K}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right Area: Result */}
                    <div className="flex-1 flex flex-col space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                            {language === 'tr' ? 'SONUÇ' : 'RESULT'}
                        </Label>

                        <Card className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#18181b] border-2 border-dashed border-border dark:border-white/10 overflow-hidden flex items-center justify-center group rounded-3xl shadow-none hover:border-border/80 dark:hover:border-white/20 transition-colors">
                            {isProcessing ? (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                                        <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                                            <Box className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{language === 'tr' ? 'ÜRETİLİYOR' : 'GENERATING'}</h3>
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 transition-all duration-300 min-h-[1.5em] max-w-[240px] mx-auto">
                                            {language === 'tr' ? LOADING_MESSAGES[currentMessageIndex].tr : LOADING_MESSAGES[currentMessageIndex].en}
                                        </p>
                                    </div>
                                    <div className="w-full max-w-[280px] space-y-4">
                                        <Progress value={generationProgress} className="h-1.5 w-full bg-white/5" />
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            <span>{generationProgress}%</span>
                                            <span>{language === 'tr' ? 'Tahmini süre: 15-20sn' : 'Est. time: 15-20s'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : resultImage ? (
                                <div className="w-full h-full flex flex-col p-4 space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner bg-black/5">
                                        <img src={resultImage} className="w-full h-full object-contain" alt="Result" />
                                        <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="icon" className="bg-white text-black hover:bg-zinc-200 h-10 w-10 rounded-md" onClick={() => downloadImage(resultImage, `product_${Date.now()}.png`)}>
                                                <Download className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'tr' ? 'BAŞARIYLA ÜRETİLDİ' : 'SUCCESSFULLY GENERATED'}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="ghost" size="sm" onClick={() => setResultImage(null)} className="h-10 text-[11px] font-black uppercase tracking-widest rounded-md px-5 border border-white/5 bg-white/5 hover:bg-white hover:text-black transition-all">
                                                <TbRefresh className="w-4 h-4 mr-2" />
                                                {language === 'tr' ? 'YENİ' : 'NEW'}
                                            </Button>
                                            <Button size="sm" onClick={() => downloadImage(resultImage, `product_${Date.now()}.png`)} className="h-10 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-md px-5 hover:bg-zinc-200 shadow-xl transition-all">
                                                <Download className="w-4 h-4 mr-2" />
                                                {language === 'tr' ? 'İNDİR' : 'DOWNLOAD'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center p-12">
                                    <div className="w-20 h-20 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center">
                                        <Package className="w-10 h-10 text-white/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{t("product.title")}</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] max-w-[280px] mx-auto text-balance">
                                            {t("product.subtitle")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProductPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ProductPageContent />
        </Suspense>
    )
}
