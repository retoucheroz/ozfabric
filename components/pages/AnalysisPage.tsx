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
    Image as ImageIcon
} from "lucide-react"
import {
    TbPhoto,
    TbSearch,
    TbBolt,
    TbUserCircle,
    TbRuler2,
    TbSparkles,
    TbAdjustmentsHorizontal,
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
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header Area */}
            <div className="shrink-0 p-8 border-b border-white/5 bg-[#0D0D0F]">
                <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
                            <TbSearch className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
                                {language === "tr" ? "ANALİZ" : "ANALYSIS"}
                            </h1>
                            <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1.5 grayscale opacity-70">
                                {language === "tr"
                                    ? "YAPAY ZEKA DESTEKLİ TEKNİK ARAÇLAR"
                                    : "AI-POWERED TECHNICAL TOOLS"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Select value={mode} onValueChange={(v: any) => {
                            setMode(v);
                            setResultEn(null);
                            setResultTr(null);
                            setStickmanUrl(null);
                            if (v === "pose" && images.length > 1) setImages([images[0]]);
                            if (v !== "pose" && images.length > 3) setImages(images.slice(0, 3));
                        }}>
                            <SelectTrigger className="w-56 h-12 bg-white/5 border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-white/20 transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="product" className="focus:bg-white focus:text-black text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <TbBolt className="w-4 h-4" />
                                        <span>{language === "tr" ? "Ürün Analizi" : "Product Analysis"}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pose" className="focus:bg-white focus:text-black text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <TbUserCircle className="w-4 h-4" />
                                        <span>{language === "tr" ? "Poz Analizi" : "Pose Analysis"}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pattern" className="focus:bg-white focus:text-black text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <TbRuler2 className="w-4 h-4" />
                                        <span>{language === "tr" ? "Kalıp Analizi" : "Pattern Analysis"}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                    {/* LEFT PANEL: Inputs */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-card border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                                    <TbPhoto className="w-4 h-4 text-[var(--accent-primary)]" />
                                    {language === "tr" ? "GÖRSELLER" : "IMAGES"}
                                </h3>
                                <Badge variant="outline" className="text-[10px]">
                                    Max {MAX_IMAGES}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                {images.map((img, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={idx}
                                        className="relative aspect-square rounded-xl overflow-hidden border bg-muted group"
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        {idx === 0 && (
                                            <Badge className="absolute bottom-1.5 left-1.5 bg-violet-600 text-[9px] px-1.5 h-4">
                                                {language === "tr" ? "Ana" : "Main"}
                                            </Badge>
                                        )}
                                    </motion.div>
                                ))}

                                {images.length < MAX_IMAGES && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors group"
                                    >
                                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {language === "tr" ? "Görsel Yükle" : "Upload Image"}
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple={mode !== "pose"}
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === "product" || mode === "pattern" ? (
                                    <motion.div
                                        key="product-inputs"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 pt-4 border-t"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{language === "tr" ? "Ürün Tipi" : "Product Type"}</Label>
                                                <Select value={productType} onValueChange={setProductType}>
                                                    <SelectTrigger className="h-9 text-xs bg-muted/20">
                                                        <SelectValue placeholder={language === "tr" ? "Seçiniz" : "Select"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PRODUCT_TYPES.map(t => (
                                                            <SelectItem key={t.id} value={t.id} className="text-xs">
                                                                {language === "tr" ? t.labelTr : t.labelEn}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground text-nowrap">{language === "tr" ? "Ürün Adı (Opsiyonel)" : "Product Name (Optional)"}</Label>
                                                <Input
                                                    className="h-9 text-xs bg-muted/20"
                                                    placeholder={language === "tr" ? "Örn: Keten Gömlek" : "e.g. Linen Shirt"}
                                                    value={productName}
                                                    onChange={e => setProductName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="pose-inputs"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 pt-4 border-t"
                                    >
                                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{language === "tr" ? "DWPose Stickman Üret" : "Generate DWPose Stickman"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{language === "tr" ? "Poz hassasiyetini artırır." : "Increases pose precision."}</span>
                                                </div>
                                            </div>
                                            <Switch checked={poseToStickman} onCheckedChange={setPoseToStickman} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>

                        <Button
                            className="w-full h-16 bg-white hover:bg-zinc-200 text-black font-black rounded-2xl shadow-2xl transition-all active:scale-[0.98] group overflow-hidden relative"
                            onClick={handleAnalyze}
                            disabled={isProcessing || images.length === 0}
                        >
                            <AnimatePresence mode="wait">
                                {isProcessing ? (
                                    <motion.div
                                        key="loading"
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-[11px] uppercase tracking-[0.2em]">{language === "tr" ? "Analiz Ediliyor..." : "Analyzing..."}</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ready"
                                        className="flex flex-col items-center justify-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <TbSparkles className="w-5 h-5 opacity-50" />
                                            <span className="text-[11px] uppercase tracking-[0.2em] font-black">{language === "tr" ? "ANALİZİ BAŞLAT" : "START ANALYSIS"}</span>
                                        </div>
                                        <span className="text-[9px] font-black opacity-30 tracking-[0.3em] mt-1 border-t border-black/10 pt-1">20 CREDITS</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>

                    {/* RIGHT PANEL: Results */}
                    <div className="flex flex-col gap-4 h-full min-h-[500px]">
                        <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col shadow-sm">
                            <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-violet-500/10 flex items-center justify-center">
                                        <MoveUpRight className="w-3.5 h-3.5 text-violet-500" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {language === "tr" ? "Analiz Sonucu" : "Analysis Result"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 p-0 relative bg-muted/5 group">
                                {isProcessing ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] z-10">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <RotateCw className="w-8 h-8 text-violet-500 opacity-50" />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs font-medium text-muted-foreground animate-pulse">
                                            {language === "tr" ? "Hassas analiz verileri işleniyor..." : "Processing precision analysis data..."}
                                        </p>
                                    </div>
                                ) : null}

                                <div className="h-full w-full overflow-y-auto p-6 flex flex-col scrollbar-thin">
                                    {resultEn ? (
                                        <div className="space-y-6">
                                            {/* POSE: Stickman + Prompt side by side */}
                                            {mode === "pose" && stickmanUrl && (
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-32 shrink-0 flex flex-col gap-2">
                                                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Stickman (DWPose)</span>
                                                        <div className="aspect-[3/4] rounded-lg overflow-hidden border bg-black flex items-center justify-center">
                                                            <img src={stickmanUrl} className="w-full h-full object-contain" />
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full h-7 text-[10px] gap-1"
                                                            onClick={downloadStickman}
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            {language === "tr" ? "İndir" : "Download"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ENGLISH PROMPT */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        🇬🇧 English Prompt
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 gap-1.5 hover:bg-violet-500/10 hover:text-violet-600 transition-colors"
                                                        onClick={() => copyText(resultEn!, "en")}
                                                    >
                                                        {copiedEn ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        <span className="text-[10px] font-bold">{copiedEn ? (language === "tr" ? "Kopyalandı" : "Copied") : (language === "tr" ? "Kopyala" : "Copy")}</span>
                                                    </Button>
                                                </div>
                                                <div className="bg-background/80 rounded-xl border-border border p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90 selection:bg-violet-500/20">
                                                    {resultEn}
                                                </div>
                                            </div>

                                            {/* TURKISH PROMPT */}
                                            {resultTr && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            🇹🇷 Türkçe Çeviri
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 gap-1.5 hover:bg-violet-500/10 hover:text-violet-600 transition-colors"
                                                            onClick={() => copyText(resultTr!, "tr")}
                                                        >
                                                            {copiedTr ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                            <span className="text-[10px] font-bold">{copiedTr ? (language === "tr" ? "Kopyalandı" : "Copied") : (language === "tr" ? "Kopyala" : "Copy")}</span>
                                                        </Button>
                                                    </div>
                                                    <div className="bg-background/80 rounded-xl border-border border p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90 selection:bg-violet-500/20">
                                                        {resultTr}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border mb-6 flex items-center justify-center">
                                                <Zap className="w-10 h-10 text-muted-foreground" />
                                            </div>
                                            <h4 className="font-bold text-lg mb-2">{language === "tr" ? "Henüz Analiz Yok" : "No Analysis Yet"}</h4>
                                            <p className="text-sm max-w-[280px]">
                                                {language === "tr"
                                                    ? "Analizini yapmak istediğiniz görselleri yükleyip modu belirleyerek başlayın."
                                                    : "Start by uploading images and selecting the mode you want to analyze."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}
