"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import {
    ShoppingBag,
    UserSquare2
} from "lucide-react"
import {
    TbShoppingBag,
    TbSettings2,
    TbAspectRatio,
    TbHdr,
    TbWand,
    TbSparkles,
    TbLoader2,
    TbHistory,
    TbCircleCheckFilled,
    TbPhoto,
    TbGlobe,
    TbAdjustmentsHorizontal,
    TbTrash,
    TbBolt
} from "react-icons/tb"
import {
    Upload,
    Image as ImageIcon,
    Wand2,
    Download,
    Loader2,
    Sparkles,
    RefreshCw,
    Settings2,
    Eye,
    Edit3,
    Check,
    X,
    Plus,
    Trash2,
    Library,
    Grip,
    Tag,
    Globe,
    ChevronDown,
    ChevronUp,
    Search,
    Copy,
    Maximize2,
    FolderOpen,
    Eraser,
    History,
    Zap
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

// === STUDIO ANIMATION STEPS ===
const STUDIO_STEPS_TR = [
    { icon: "💡", text: "Stüdyo ışıkları ayarlanıyor...", detail: "Yumuşak aydınlatma kurulumu" },
    { icon: "📸", text: "Ürün yerleşimi kontrol ediliyor...", detail: "Altın oran hizalaması" },
    { icon: "👤", text: "Model pozisyonu ayarlanıyor...", detail: "Doğal duruş analizi" },
    { icon: "🎨", text: "Renk kartı kalibrasyonu...", detail: "Doğru kumaş tonu için" },
    { icon: "🖥️", text: "AI Motoru başlatılıyor...", detail: "GPU render hattı aktif" },
    { icon: "✨", text: "Detaylar işleniyor...", detail: "Doku ve dikiş netleştirme" },
];

const STUDIO_STEPS_EN = [
    { icon: "💡", text: "Setting up studio lights...", detail: "Soft lighting configuration" },
    { icon: "📸", text: "Checking product placement...", detail: "Golden ratio alignment" },
    { icon: "👤", text: "Adjusting model position...", detail: "Natural pose analysis" },
    { icon: "🎨", text: "Color board calibration...", detail: "Matching fabric tones" },
    { icon: "🖥️", text: "Starting AI Engine...", detail: "GPU render pipeline active" },
    { icon: "✨", text: "Processing details...", detail: "Enhancing texture and seams" },
];

function StudioLoading({ language }: { language: string }) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = language === "tr" ? STUDIO_STEPS_TR : STUDIO_STEPS_EN;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">
                    {steps[currentStep].icon}
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">{steps[currentStep].text}</h3>
                <p className="text-muted-foreground">{steps[currentStep].detail}</p>
            </div>
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-500",
                            i === currentStep ? "w-8 bg-violet-500" : "bg-muted-foreground/30"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

interface FalApiOptions {
    resolution: "1K" | "2K" | "4K"
    aspectRatio: string
    seed?: number
    enableWebSearch: boolean
    outputFormat: "png" | "jpeg" | "webp"
    numImages: number
}

interface StructuredPrompt {
    intent: string
    subject: { type: string, description: string }
    garment?: { name: string, description: string, fabric?: string, fit?: string }
    styling?: { pose: string, framing: string, view: string }
    scene: { background: string, lighting: string }
    camera: { shot_type: string, angle: string, framing: string }
    additionalNotes?: string
}

const ASPECT_RATIOS = [
    { value: "1:1", label: "1:1 (Kare)" },
    { value: "4:5", label: "4:5 (Instagram)" },
    { value: "3:4", label: "3:4 (Portre)" },
    { value: "2:3", label: "2:3 (Fashion)" },
    { value: "9:16", label: "9:16 (Tik-Tok)" },
];

export default function EComPage() {
    const { language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [userPrompt, setUserPrompt] = useState("")
    // ... rest of the states stay same
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [structuredPrompt, setStructuredPrompt] = useState<StructuredPrompt | null>(null)
    const [isEditingPrompt, setIsEditingPrompt] = useState(false)
    const [promptJsonString, setPromptJsonString] = useState("")
    const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({})
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [showLibrary, setShowLibrary] = useState(false)
    const [libraryType, setLibraryType] = useState<'product' | 'model' | 'background' | 'pose'>('product')

    const [apiOptions, setApiOptions] = useState<FalApiOptions>({
        resolution: "1K",
        aspectRatio: "3:4",
        seed: undefined,
        enableWebSearch: false,
        outputFormat: "webp",
        numImages: 1
    })

    const handleAnalyze = async () => {
        if (!userPrompt.trim()) {
            toast.error(language === "tr" ? "Lütfen bir açıklama yazın" : "Please write a description");
            return;
        }
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/ecom/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt,
                    images: Object.values(uploadedImages),
                    language,
                    framing: "full",
                    viewAngle: "front",
                    lighting: "studio"
                })
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            setStructuredPrompt(result.structuredPrompt);
            setPromptJsonString(JSON.stringify(result.structuredPrompt, null, 2));
            toast.success(language === "tr" ? "Yapay zeka analizi tamamlandı!" : "AI Analysis complete!");
        } catch (error) {
            console.error(error);
            toast.error(language === "tr" ? "Analiz sırasında bir hata oluştu" : "Error during analysis");
        } finally {
            setIsAnalyzing(false);
        }
    }

    const handleGenerate = async () => {
        if (!uploadedImages.product_front) {
            toast.error(language === "tr" ? "Önce ürün görseli yüklemelisiniz" : "You must upload a product image first");
            return;
        }
        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: structuredPrompt?.garment?.name || "E-Com Product",
                    prompt: promptJsonString || userPrompt,
                    uploadedImages,
                    resolution: apiOptions.resolution,
                    aspectRatio: apiOptions.aspectRatio,
                    seed: apiOptions.seed,
                    enableWebSearch: apiOptions.enableWebSearch,
                    workflowType: 'upper',
                    lightingPositive: null,
                    lightingNegative: null
                })
            });

            if (!response.ok) throw new Error('Generation failed');
            const result = await response.json();

            if (result.status === 'completed' && result.images && result.images.length > 0) {
                setGeneratedImage(result.images[0]);
                toast.success(language === "tr" ? "Görsel başarıyla oluşturuldu!" : "Image generated successfully!");
            }
        } catch (error) {
            console.error(error);
            toast.error(language === "tr" ? "Görsel oluşturma hatası" : "Generation error");
        } finally {
            setIsGenerating(false);
        }
    }

    const savePromptEdits = () => {
        try {
            const parsed = JSON.parse(promptJsonString);
            setStructuredPrompt(parsed);
            setIsEditingPrompt(false);
            toast.success(language === "tr" ? "Değişiklikler kaydedildi" : "Changes saved");
        } catch (e) {
            toast.error(language === "tr" ? "Geçersiz JSON formatı" : "Invalid JSON format");
        }
    }

    const AssetSlot = ({ id, label, icon: Icon, type }: { id: string, label: string, icon: any, type: any }) => {
        const hasImage = !!uploadedImages[id];
        return (
            <div className="relative group">
                <div
                    className={cn(
                        "aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden",
                        hasImage
                            ? "border-violet-500 bg-violet-500/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                            : "border-border bg-muted/30 hover:border-violet-500/50 hover:bg-muted/50"
                    )}
                    onClick={() => {
                        if (!hasImage) {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                        setUploadedImages(prev => ({ ...prev, [id]: re.target?.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            };
                            input.click();
                        }
                    }}
                >
                    {hasImage ? (
                        <div className="absolute inset-0">
                            <img src={uploadedImages[id]} alt={label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedImages(prev => {
                                        const n = { ...prev };
                                        delete n[id];
                                        return n;
                                    });
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Icon className="w-6 h-6 text-muted-foreground group-hover:text-violet-400" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground text-center">{label}</span>
                            <div className="mt-4 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg bg-muted/50" onClick={(e) => {
                                    e.stopPropagation();
                                    setLibraryType(type);
                                    setShowLibrary(true);
                                }}>
                                    <Library className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                {hasImage && (
                    <div className="absolute -top-2 -right-2 bg-violet-500 text-white p-1 rounded-full shadow-lg">
                        <Check className="w-3 h-3" />
                    </div>
                )}
            </div>
        )
    }

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
            <div className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--accent-soft)] rounded-xl shadow-lg shadow-[var(--accent-primary)]/10">
                        <TbShoppingBag className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase italic text-[var(--text-primary)]">E-Com Studio</h1>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-black -mt-0.5">Professional Marketplace Assets</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">128</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Credits</span>
                    </div>
                    <Separator orientation="vertical" className="h-8 bg-border" />
                    <Link href="/history">
                        <Button variant="outline" size="sm" className="border-border">
                            <History className="w-4 h-4 mr-2" />
                            {language === "tr" ? "Geçmiş" : "History"}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 border-r border-border flex flex-col shrink-0 bg-background">
                    <div className="p-4 flex-1 overflow-y-auto space-y-6 scrollbar-none">
                        <section className="space-y-4">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] px-1 flex items-center gap-2">
                                <TbSettings2 className="w-4 h-4 text-[var(--accent-primary)]" />
                                {language === "tr" ? "AYARLAR" : "SETTINGS"}
                            </Label>
                            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 px-1">
                                        <TbAspectRatio className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                        {language === "tr" ? "GÖRÜNÜM" : "ASPECT RATIO"}
                                    </Label>
                                    <Select
                                        value={apiOptions.aspectRatio}
                                        onValueChange={(v) => setApiOptions(p => ({ ...p, aspectRatio: v }))}
                                    >
                                        <SelectTrigger className="bg-background border-border rounded-xl h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {ASPECT_RATIOS.map(ar => (
                                                <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 px-1">
                                        <TbHdr className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                        {language === "tr" ? "KALİTE" : "QUALITY"}
                                    </Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["1K", "2K", "4K"].map(res => (
                                            <Button
                                                key={res}
                                                size="sm"
                                                variant={apiOptions.resolution === res ? "default" : "outline"}
                                                onClick={() => setApiOptions(p => ({ ...p, resolution: res as any }))}
                                                className={cn("h-9 rounded-lg text-[10px] font-bold", apiOptions.resolution === res ? "bg-violet-600 hover:bg-violet-700" : "bg-transparent border-border")}
                                            >
                                                {res}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-border/50">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">{language === "tr" ? "Gelişmiş Ayarlar" : "Advanced Settings"}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground">Seed</Label>
                                            <input
                                                type="number"
                                                placeholder="Random"
                                                className="w-full h-8 bg-background border border-border rounded-lg px-2 text-[10px] focus:outline-none focus:border-violet-500/50"
                                                value={apiOptions.seed || ""}
                                                onChange={(e) => setApiOptions(p => ({ ...p, seed: e.target.value === "" ? undefined : Number(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground">Web Search</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setApiOptions(p => ({ ...p, enableWebSearch: !p.enableWebSearch }))}
                                                className={cn(
                                                    "w-full h-8 rounded-lg text-[10px] font-bold border-border transition-all",
                                                    apiOptions.enableWebSearch ? "bg-violet-500/10 border-violet-500/50 text-violet-400" : "bg-transparent"
                                                )}
                                            >
                                                <Globe className={cn("w-3 h-3 mr-1.5", apiOptions.enableWebSearch ? "text-violet-400" : "text-muted-foreground")} />
                                                {apiOptions.enableWebSearch ? "ON" : "OFF"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-3">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1">Concept Generator</Label>
                            <div className="space-y-3">
                                <Textarea
                                    className="min-h-[140px] bg-muted/30 border-border rounded-2xl resize-none text-sm placeholder:text-muted-foreground/50 focus:border-violet-500/50 transition-colors"
                                    placeholder={language === "tr" ? "Kıyafetinizi ve sahneyi hayal edin..." : "Imagine your outfit and scene..."}
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                />
                                <Button
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 rounded-xl font-bold transition-all active:scale-95"
                                    disabled={isAnalyzing}
                                    onClick={handleAnalyze}
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                    {language === "tr" ? "Kavramı Analiz Et" : "Analyze Concept"}
                                </Button>
                            </div>
                        </section>

                        {structuredPrompt && (
                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center gap-2 text-violet-400">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                                        "{structuredPrompt.intent}"
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full h-8 flex items-center justify-between text-[10px] font-bold transition-colors",
                                            isEditingPrompt ? "text-violet-400" : "text-muted-foreground"
                                        )}
                                        onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                                    >
                                        {language === "tr" ? "Detaylı JSON Düzenle" : "Edit Detailed JSON"}
                                        <Edit3 className="w-3 h-3" />
                                    </Button>
                                </div>

                                {isEditingPrompt && (
                                    <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                        <Textarea
                                            value={promptJsonString}
                                            onChange={(e) => setPromptJsonString(e.target.value)}
                                            className="font-mono text-[10px] min-h-[300px] bg-background border-border rounded-xl leading-relaxed custom-scrollbar"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 border-border text-xs rounded-xl"
                                                onClick={() => setIsEditingPrompt(false)}
                                            >
                                                {language === "tr" ? "Vazgeç" : "Cancel"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs rounded-xl"
                                                onClick={savePromptEdits}
                                            >
                                                <Check className="w-3 h-3 mr-2" />
                                                {language === "tr" ? "Kaydet" : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-muted/10 relative overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <div className="text-center space-y-2 mb-12 animate-in fade-in zoom-in duration-700">
                                <h2 className="text-3xl font-black tracking-tight text-foreground">{language === "tr" ? "Ürün Konuşlandırma" : "Asset Orchestration"}</h2>
                                <p className="text-sm text-muted-foreground">{language === "tr" ? "Çekim için gerekli tüm bileşenleri yerleştirin" : "Arrange all essential components for the shoot"}</p>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <AssetSlot id="product_front" label={language === "tr" ? "ÜST ÜRÜN" : "TOP PIECE"} icon={Plus} type="product" />
                                <AssetSlot id="product_back" label={language === "tr" ? "ALT ÜRÜN" : "BOTTOM PIECE"} icon={Plus} type="product" />
                                <AssetSlot id="model" label={language === "tr" ? "MODEL" : "MODEL"} icon={UserSquare2} type="model" />
                                <AssetSlot id="background" label={language === "tr" ? "ARKA PLAN" : "BACKGROUND"} icon={ImageIcon} type="background" />
                            </div>

                            <div className="pt-8 flex justify-center">
                                <Button
                                    size="lg"
                                    className={cn(
                                        "px-12 h-16 rounded-2xl text-lg font-black tracking-tight transition-all duration-500 shadow-[0_0_30px_rgba(139,92,246,0.2)]",
                                        isGenerating
                                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                                            : "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white hover:scale-105 active:scale-95"
                                    )}
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-3">
                                            <TbLoader2 className="w-6 h-6 animate-spin" />
                                            {language === "tr" ? "STÜDYO AKTİF..." : "STUDIO ACTIVE..."}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <TbSparkles className="w-6 h-6" />
                                            {language === "tr" ? "ÇEKİMİ BAŞLAT" : "START PRODUCTION"}
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {isGenerating && (
                        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xl animate-in fade-in duration-500 flex items-center justify-center">
                            <StudioLoading language={language} />
                        </div>
                    )}
                </div>

                <div className="w-96 border-l border-border bg-background flex flex-col shrink-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-border">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Studio Output</Label>
                                {generatedImage && (
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border flex flex-col items-center justify-center relative group">
                                {generatedImage ? (
                                    <>
                                        <img src={generatedImage} alt="Result" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <Button className="w-full bg-white text-black font-bold h-10 rounded-xl" onClick={() => window.open(generatedImage, '_blank')}>
                                                <Maximize2 className="w-4 h-4 mr-2" />
                                                {language === "tr" ? "Tam Ekran Gör" : "Expand Result"}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 px-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-border/50">
                                            <Eye className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-muted-foreground">{language === "tr" ? "Stüdyo Hazır" : "Studio Ready"}</p>
                                            <p className="text-[10px] text-muted-foreground/60 leading-relaxed uppercase tracking-wider">{language === "tr" ? "Çekim bittiğinde sonuçlar burada kalibre edilecektir" : "Results will be calibrated here after production"}</p>
                                        </div>
                                    </div>
                                )}

                                {isGenerating && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex gap-1 flex-wrap justify-center w-24">
                                                {[...Array(9)].map((_, i) => (
                                                    <div key={i} className="w-4 h-4 rounded-sm bg-violet-500/20 border border-violet-500/50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold px-1">Session History</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="aspect-square rounded-xl bg-muted border border-border/50 opacity-20 hover:opacity-100 transition-opacity cursor-not-allowed">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
                <DialogContent className="max-w-4xl bg-background border-border p-0 overflow-hidden h-[80vh] flex flex-col">
                    <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <Library className="w-5 h-5 text-violet-500" />
                            <DialogTitle className="text-lg font-bold">
                                Asset Library / <span className="text-muted-foreground capitalize">{libraryType}</span>
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Manage and select assets for your e-commerce shoot
                            </DialogDescription>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => setShowLibrary(false)} className="h-8 w-8">
                            <X className="w-5 h-5" />
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <FolderOpen className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium uppercase tracking-widest">No assets found in target directory</p>
                        <Button variant="outline" className="border-border rounded-xl">Upload New Asset</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
