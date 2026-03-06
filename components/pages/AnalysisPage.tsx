"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Download,
    Upload,
    X,
    MoveUpRight,
    Loader2,
    RotateCw,
    Check,
    Copy,
    User,
    Ruler,
    Zap,
    Image as ImageIcon,
    ChevronRight
} from "lucide-react"
import {
    TbPhoto,
    TbSearch,
    TbBolt,
    TbUserCircle,
    TbRuler2,
    TbSparkles,
    TbAdjustmentsHorizontal,
    TbCoins
} from "react-icons/tb"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

// Resize image so longest edge is max 2048px. If already smaller, return as-is.
function resizeImageForAnalysis(base64: string, maxEdge: number = 2048): Promise<string> {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
            const { width, height } = img;
            if (width <= maxEdge && height <= maxEdge) {
                resolve(base64);
                return;
            }
            const scale = maxEdge / Math.max(width, height);
            const newW = Math.round(width * scale);
            const newH = Math.round(height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = newW;
            canvas.height = newH;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, newW, newH);
            resolve(canvas.toDataURL("image/jpeg", 0.92));
        };
        img.src = base64;
    });
}

export default function AnalysisPage() {
    const { language } = useLanguage();
    const [mounted, setMounted] = useState(false);

    // UI State
    const [mode, setMode] = useState<"product" | "pose" | "pattern">("product");

    // Input State
    const [images, setImages] = useState<string[]>([]);
    const [productType, setProductType] = useState("");
    const [productName, setProductName] = useState("");
    const [poseToStickman, setPoseToStickman] = useState(false);

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultEn, setResultEn] = useState<string | null>(null);
    const [resultTr, setResultTr] = useState<string | null>(null);
    const [stickmanUrl, setStickmanUrl] = useState<string | null>(null);
    const [copiedEn, setCopiedEn] = useState(false);
    const [copiedTr, setCopiedTr] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const MAX_IMAGES = mode === "pose" ? 1 : 3;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const fileArray = Array.from(files);

        if (images.length + fileArray.length > MAX_IMAGES) {
            toast.error(language === "tr"
                ? `Maksimum ${MAX_IMAGES} görsel yükleyebilirsiniz.`
                : `You can upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }

        for (const file of fileArray) {
            const reader = new FileReader();
            const base64: string = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            const resized = await resizeImageForAnalysis(base64, 2048);
            setImages(prev => [...prev, resized]);
        }

        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        if (index === 0 && mode === "pose") {
            setStickmanUrl(null);
        }
    };

    const handleAnalyze = async () => {
        if (images.length === 0) {
            toast.error(language === "tr" ? "Lütfen en az bir görsel yükleyin." : "Please upload at least one image.");
            return;
        }

        setIsProcessing(true);
        setResultEn(null);
        setResultTr(null);
        setStickmanUrl(null);

        try {
            const response = await fetch("/api/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    analysisType: mode,
                    images,
                    productType,
                    productName,
                    options: {
                        pose_to_stickman: poseToStickman
                    }
                })
            });

            const data = await response.json();

            if (data.status === "success") {
                setResultEn(data.analysisEn || data.analysis || "");
                setResultTr(data.analysisTr || "");
                if (data.stickmanUrl) {
                    setStickmanUrl(data.stickmanUrl);
                }
                toast.success(language === "tr" ? "Analiz tamamlandı (-20 Kredi)!" : "Analysis complete (-20 Credits)!");
            } else {
                toast.error(data.error || "Analysis failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during analysis.");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyText = (text: string, which: "en" | "tr") => {
        navigator.clipboard.writeText(text);
        if (which === "en") {
            setCopiedEn(true);
            setTimeout(() => setCopiedEn(false), 2000);
        } else {
            setCopiedTr(true);
            setTimeout(() => setCopiedTr(false), 2000);
        }
        toast.success(language === "tr" ? "Kopyalandı!" : "Copied!");
    };

    const downloadStickman = () => {
        if (!stickmanUrl) return;
        try {
            const a = document.createElement("a");
            a.href = stickmanUrl;
            a.download = `stickman_${Date.now()}.png`;
            a.target = "_blank"; // Ensure it opens in a new tab for direct download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch {
            // Fallback for base64 or other issues, ensuring target="_blank"
            const a = document.createElement('a');
            a.href = stickmanUrl; // Use stickmanUrl here
            a.target = "_blank";
            a.download = `stickman_${Date.now()}.png`; // Use stickman filename
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const PRODUCT_TYPES = [
        { id: "shirt", labelEn: "Shirt", labelTr: "Gömlek" },
        { id: "t-shirt", labelEn: "T-Shirt", labelTr: "Tişört" },
        { id: "pants", labelEn: "Pants", labelTr: "Pantolon" },
        { id: "dress", labelEn: "Dress", labelTr: "Elbise" },
        { id: "jacket", labelEn: "Jacket", labelTr: "Ceket" },
        { id: "coat", labelEn: "Coat", labelTr: "Palto/Kaban" },
        { id: "skirt", labelEn: "Skirt", labelTr: "Etek" },
        { id: "sweater", labelEn: "Sweater", labelTr: "Kazak" },
        { id: "hoodie", labelEn: "Hoodie", labelTr: "Kapşonlu" },
        { id: "shorts", labelEn: "Shorts", labelTr: "Şort" },
        { id: "blazer", labelEn: "Blazer", labelTr: "Blazer" },
        { id: "vest", labelEn: "Vest", labelTr: "Yelek" },
    ];

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-screen pb-24">
                <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-8">

                    {/* Left: Input Panel */}
                    <div className="w-full lg:w-[420px] flex flex-col space-y-6 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                                <TbSearch className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                                    {language === "tr" ? "ANALİZ" : "ANALYSIS"}
                                </label>
                                <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                                    {language === "tr"
                                        ? "Görsellerinizden teknik detayları analiz edin."
                                        : "Analyze technical details from your images."}
                                </span>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                <TbAdjustmentsHorizontal className="w-4 h-4 text-zinc-500" />
                                {language === "tr" ? "ANALİZ MODU" : "ANALYSIS MODE"}
                            </Label>
                            <div className="relative">
                                <select
                                    value={mode}
                                    onChange={(e) => {
                                        const v = e.target.value as any;
                                        setMode(v);
                                        setResultEn(null);
                                        setResultTr(null);
                                        setStickmanUrl(null);
                                        if (v === "pose" && images.length > 1) setImages([images[0]]);
                                        if (v !== "pose" && images.length > 3) setImages(images.slice(0, 3));
                                    }}
                                    className="w-full h-12 bg-[#121214] border border-white/10 rounded-xl px-4 pr-10 text-[11px] font-black text-white shadow-none uppercase tracking-[0.18em] focus:outline-none focus:border-white/30 transition-all appearance-none"
                                >
                                    <option value="product" className="bg-[#121214]">{language === "tr" ? "Ürün Analizi" : "Product Analysis"}</option>
                                    <option value="pose" className="bg-[#121214]">{language === "tr" ? "Poz Analizi" : "Pose Analysis"}</option>
                                    <option value="pattern" className="bg-[#121214]">{language === "tr" ? "Kalıp Analizi" : "Pattern Analysis"}</option>
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                            </div>
                        </div>

                        {/* Uploads Area */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                    <TbPhoto className="w-4 h-4 text-zinc-500" />
                                    {language === "tr" ? "GÖRSELLER" : "IMAGES"}
                                </Label>
                                <span className="text-[10px] font-black text-zinc-600 tracking-widest">
                                    {images.length}/{MAX_IMAGES}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#121214] group">
                                        <img src={img} className="w-full h-full object-cover p-1.5 rounded-2xl" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20 scale-0 group-hover:scale-100 transition-transform shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        {idx === 0 && (
                                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#FF3D5A] text-white text-[8px] font-black rounded uppercase tracking-tighter shadow-xl">
                                                {language === "tr" ? "ANA" : "MAIN"}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {images.length < MAX_IMAGES && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-2xl border border-dashed border-white/20 bg-[#121214] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/40 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-white/10 flex items-center justify-center group-hover:bg-white text-zinc-500 group-hover:text-black transition-all">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{language === "tr" ? "EKLE" : "ADD"}</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple={mode !== "pose"}
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Main Content Area */}
                        {/* Parameters */}
                        <div className="space-y-4">
                            {mode === "product" || mode === "pattern" ? (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 px-1">
                                            <TbBolt className="w-4 h-4 text-zinc-500" />
                                            {language === "tr" ? "Ürün Tipi" : "Product Type"}
                                        </Label>
                                        <div className="relative">
                                            <select
                                                value={productType}
                                                onChange={(e) => setProductType(e.target.value)}
                                                className="w-full h-12 bg-[#121214] border border-white/10 rounded-xl px-4 pr-10 text-[11px] font-black text-white shadow-none uppercase tracking-[0.18em] focus:outline-none focus:border-white/30 transition-all appearance-none"
                                            >
                                                <option value="" className="bg-[#121214]">{language === "tr" ? "Seçiniz" : "Select"}</option>
                                                {PRODUCT_TYPES.map(t => (
                                                    <option key={t.id} value={t.id} className="bg-[#121214]">
                                                        {language === "tr" ? t.labelTr : t.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1">
                                            {language === "tr" ? "Ürün Adı (Opsiyonel)" : "Product Name (Optional)"}
                                        </Label>
                                        <Input
                                            className="h-12 bg-[#121214] border-white/10 text-[11px] font-black uppercase tracking-[0.18em] rounded-xl text-white shadow-none focus:border-white/30"
                                            placeholder={language === "tr" ? "Örn: Keten Gömlek" : "e.g. Linen Shirt"}
                                            value={productName}
                                            onChange={e => setProductName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-[#121214] rounded-2xl border border-white/10 group transition-all hover:bg-[#18181B]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white">{language === "tr" ? "Stickman Üret" : "Generate Stickman"}</span>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">{language === "tr" ? "Poz hassasiyetini artırır." : "Increases precision."}</span>
                                            </div>
                                        </div>
                                        <Switch checked={poseToStickman} onCheckedChange={setPoseToStickman} className="data-[state=checked]:bg-green-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analysis Button */}
                        <div className="pt-2">
                            <Button
                                className="w-full h-12 rounded-md bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white font-black text-[11px] shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.18em]"
                                onClick={handleAnalyze}
                                disabled={isProcessing || images.length === 0}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        <span>{language === "tr" ? "ANALİZ EDİLİYOR..." : "ANALYZING..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <TbSparkles className="w-4 h-4 mr-2" />
                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                            <span>{language === "tr" ? "ANALİZİ BAŞLAT" : "START ANALYSIS"}</span>
                                            <div className="h-4 w-px bg-white/30 mx-1 shrink-0" />
                                            <div className="flex items-center gap-1 opacity-90">
                                                <TbCoins className="w-4 h-4 text-white" />
                                                <span className="text-[11px] font-black tracking-tighter">20</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Results Panel */}
                    <div className="flex-1 flex flex-col space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-1.5">
                            <TbSparkles className="w-4 h-4 text-zinc-500" />
                            {language === 'tr' ? 'SONUÇ' : 'RESULT'}
                        </Label>

                        <div className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#121214] border border-dashed border-white/20 overflow-hidden flex items-center justify-center group rounded-2xl shadow-none hover:border-white/40 transition-colors">
                            {isProcessing ? (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                                        <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                                            <TbSearch className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">{language === 'tr' ? 'ANALİZ EDİLİYOR...' : 'ANALYZING...'}</h3>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 max-w-[240px] mx-auto transition-all duration-300 min-h-[1.5em] text-balance">
                                            {language === 'tr' ? 'Hassas teknik veriler yapay zeka tarafından işleniyor.' : 'Precision technical data is being processed by AI.'}
                                        </p>
                                    </div>
                                </div>
                            ) : resultEn ? (
                                <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-500">
                                    {/* POSE RESULT: Stickman side card */}
                                    {mode === "pose" && stickmanUrl && (
                                        <div className="bg-[#18181B] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-20 bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center shrink-0">
                                                    <img src={stickmanUrl} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-white">{language === 'tr' ? 'STICKMAN GÖRSELİ' : 'STICKMAN IMAGE'}</h4>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{language === 'tr' ? 'POZ VERİLERİ ÇIKARTILDI' : 'POSE DATA EXTRACTED'}</p>
                                                </div>
                                            </div>
                                            <Button variant="secondary" onClick={downloadStickman} className="h-10 bg-white text-black hover:bg-zinc-200 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest">
                                                <Download className="w-4 h-4 mr-2" />
                                                {language === 'tr' ? 'İNDİR' : 'DOWNLOAD'}
                                            </Button>
                                        </div>
                                    )}

                                    {/* ENGLISH PROMPT BOX */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3D5A]">
                                                {language === 'tr' ? '🇬🇧 İNGİLİZCE PROMPT' : '🇬🇧 ENGLISH PROMPT'}
                                            </span>
                                            <Button variant="ghost" onClick={() => copyText(resultEn!, "en")} className="h-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg border border-white/5">
                                                {copiedEn ? <Check className="w-3.5 h-3.5 mr-2 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                                                {copiedEn ? (language === "tr" ? "KOPYALANDI" : "COPIED") : (language === "tr" ? "KOPYALA" : "COPY")}
                                            </Button>
                                        </div>
                                        <div className="bg-[#0D0D0F] border border-white/10 rounded-2xl p-6 text-[13px] font-medium leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap">
                                            {resultEn}
                                        </div>
                                    </div>

                                    {/* TURKISH BOX (if applicable) */}
                                    {resultTr && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                    {language === 'tr' ? '🇹🇷 TÜRKÇE ÇEVİRİ' : '🇹🇷 TURKISH TRANSLATION'}
                                                </span>
                                                <Button variant="ghost" onClick={() => copyText(resultTr!, "tr")} className="h-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg border border-white/5">
                                                    {copiedTr ? <Check className="w-3.5 h-3.5 mr-2 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                                                    {copiedTr ? (language === "tr" ? "KOPYALANDI" : "COPIED") : (language === "tr" ? "KOPYALA" : "COPY")}
                                                </Button>
                                            </div>
                                            <div className="bg-[#0D0D0F]/50 border border-white/5 rounded-2xl p-6 text-[13px] font-medium leading-relaxed text-zinc-500 font-mono whitespace-pre-wrap italic">
                                                {resultTr}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center p-12">
                                    <div className="w-20 h-20 rounded-full bg-[#18181B] border border-white/10 flex items-center justify-center">
                                        <Zap className="w-10 h-10 text-white/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{language === "tr" ? "ANALİZ YOK" : "NO ANALYSIS"}</h4>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.18em] max-w-[280px] mx-auto text-balance mt-2">
                                            {language === "tr"
                                                ? "Analizini yapmak istediğiniz görselleri yükleyip modu belirleyerek başlayın."
                                                : "Start by uploading images and selecting the mode you want to analyze."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
