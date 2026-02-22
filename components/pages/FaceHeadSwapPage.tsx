"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/context/language-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    Upload,
    ImageIcon,
    Loader2,
    Sparkles,
    Download,
    X,
    UserCircle2,
    RefreshCw,
    Maximize2,
    Monitor,
} from "lucide-react"
import {
    TbRefresh,
    TbUserCircle,
    TbMaximize,
    TbPhoto,
    TbSettings2,
    TbAdjustmentsHorizontal,
    TbAspectRatio,
    TbHdr
} from "react-icons/tb"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SERVICE_COSTS } from "@/lib/pricingConstants";

export default function FaceHeadSwapPage() {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    // Image States
    const [identityImage, setIdentityImage] = useState<string | null>(null)
    const [baseImage, setBaseImage] = useState<string | null>(null)
    const [swapMode, setSwapMode] = useState<'head_swap' | 'face_swap'>('head_swap')
    const [resolution, setResolution] = useState<string>("1K")
    const [aspectRatio, setAspectRatio] = useState<string>("3:4")
    const [isGenerating, setIsGenerating] = useState(false)
    const [resultImage, setResultImage] = useState<string | null>(null)
    const [seed, setSeed] = useState<string>("")
    const [lastUsedSeed, setLastUsedSeed] = useState<number | null>(null)

    const ASPECT_RATIOS = [
        { value: "1:1", label: "1:1 (Square)" },
        { value: "4:5", label: "4:5 (Instagram)" },
        { value: "3:4", label: "3:4 (Portrait)" },
        { value: "2:3", label: "2:3 (Fashion)" },
        { value: "9:16", label: "9:16 (Story)" },
    ];

    const estimatedCost = resolution === "4K"
        ? SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_4K
        : SERVICE_COSTS.IMAGE_GENERATION.FACE_SWAP_1_2K;

    // Refs
    const identityInputRef = useRef<HTMLInputElement>(null)
    const baseInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const resizeImageToMax = (base64: string, maxEdge: number, format: string = 'image/png', quality: number = 1.0): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxEdge || height > maxEdge) {
                    if (width > height) {
                        height = (height / width) * maxEdge;
                        width = maxEdge;
                    } else {
                        width = (width / height) * maxEdge;
                        height = maxEdge;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL(format, quality));
            };
            img.src = base64;
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'base') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            if (type === 'identity') setIdentityImage(result)
            else setBaseImage(result)
        }
        reader.readAsDataURL(file)
    }

    const handleGenerate = async () => {
        if (!identityImage || !baseImage) {
            toast.error(t("faceSwap.errorBothImages"))
            return
        }

        setIsGenerating(true)
        setResultImage(null)

        try {
            // Resize for transit
            const resizedIdentity = await resizeImageToMax(identityImage, 3000, 'image/jpeg', 0.90)
            const resizedBase = await resizeImageToMax(baseImage, 3000, 'image/jpeg', 0.90)

            // Step 1: Upload to Fal Storage
            const upload = async (img: string, name: string) => {
                const res = await fetch('/api/video/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: img, filename: name }),
                })
                if (!res.ok) throw new Error("Upload failed")
                return (await res.json()).url
            }

            const refUrl = await upload(resizedIdentity, 'reference.png')
            const baseUrl = await upload(resizedBase, 'base.png')

            // Step 2: Swap
            const response = await fetch('/api/face-head-swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceImageUrl: refUrl,
                    baseImageUrl: baseUrl,
                    swapMode,
                    resolution,
                    aspectRatio,
                    seed: seed !== "" ? Number(seed) : null
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Swap failed")

            setResultImage(data.image)
            setLastUsedSeed(data.seed)
            toast.success(t("faceSwap.success"))
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || t("faceSwap.error"))
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = async () => {
        if (!resultImage) return
        try {
            const response = await fetch(resultImage)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `swap_${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (e) {
            const a = document.createElement('a')
            a.href = resultImage
            a.target = "_blank"
            a.download = `swap_${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 min-h-screen pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/10">
                            <TbRefresh className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase italic">{t("faceSwap.title")}</h1>
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest -mt-0.5">
                                {language === 'tr' ? 'Nano Banana Pro ile kusursuz geçişler.' : 'Seamless transitions with Nano Banana Pro.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--accent-primary)]/20 shadow-sm">
                        Quantum Engine v4.2
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                {/* Left Side: Inputs & Config */}
                <div className="lg:col-span-5 space-y-6">
                    {/* 1. Upload Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5 mb-1.5">
                                <TbUserCircle className="w-4 h-4 text-[var(--accent-primary)]" />
                                {t("faceSwap.identitySource")}
                            </Label>
                            <Card className="relative h-[200px] overflow-hidden border-2 border-dashed border-border dark:border-white/10 hover:border-violet-500/50 transition-all bg-muted/30 dark:bg-[#1a1a25] p-2 flex items-center justify-center group cursor-pointer" onClick={() => identityInputRef.current?.click()}>
                                <input type="file" ref={identityInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'identity')} />
                                {identityImage ? (
                                    <div className="relative w-full h-full">
                                        <img src={identityImage} className="w-full h-full object-cover rounded-lg" alt="Identity" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <RefreshCw className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center p-4">
                                        <UserCircle2 className="w-8 h-8 text-muted-foreground/50 group-hover:text-violet-500 transition-colors" />
                                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{t("faceSwap.uploadReference")}</span>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5 mb-1.5">
                                <TbPhoto className="w-4 h-4 text-[var(--accent-primary)]" />
                                {t("faceSwap.baseImage")}
                            </Label>
                            <Card className="relative h-[200px] overflow-hidden border-2 border-dashed border-border dark:border-white/10 hover:border-violet-500/50 transition-all bg-muted/30 dark:bg-[#1a1a25] p-2 flex items-center justify-center group cursor-pointer" onClick={() => baseInputRef.current?.click()}>
                                <input type="file" ref={baseInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'base')} />
                                {baseImage ? (
                                    <div className="relative w-full h-full">
                                        <img src={baseImage} className="w-full h-full object-cover rounded-lg" alt="Base" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <RefreshCw className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/50 group-hover:text-violet-500 transition-colors" />
                                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{t("faceSwap.uploadBase")}</span>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* 2. Mode & Parameters Panel */}
                    <Card className="p-5 space-y-6 bg-card border shadow-sm rounded-2xl">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <TbAdjustmentsHorizontal className="w-4 h-4 text-[var(--accent-primary)]" />
                                {t("faceSwap.mode")}
                            </Label>
                            <Tabs value={swapMode} onValueChange={(v) => setSwapMode(v as any)} className="w-full">
                                <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted/50 rounded-xl">
                                    <TabsTrigger value="head_swap" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all">
                                        {t("faceSwap.headSwap")}
                                    </TabsTrigger>
                                    <TabsTrigger value="face_swap" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all">
                                        {t("faceSwap.faceSwap")}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <TbAspectRatio className="w-4 h-4 text-[var(--accent-primary)]" />
                                    {language === 'tr' ? 'EN BOY' : 'RATIO'}
                                </Label>
                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                    <SelectTrigger className="h-9 text-[11px] font-medium rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASPECT_RATIOS.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <TbHdr className="w-4 h-4 text-[var(--accent-primary)]" />
                                    {language === 'tr' ? 'KALİTE' : 'QUALITY'}
                                </Label>
                                <Select value={resolution} onValueChange={setResolution}>
                                    <SelectTrigger className="h-9 text-[11px] font-medium rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1K">1K - Standard</SelectItem>
                                        <SelectItem value="2K">2K - High</SelectItem>
                                        <SelectItem value="4K">4K - Ultra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
                                <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                {language === 'tr' ? 'SEED (OPSİYONEL)' : 'SEED (OPTIONAL)'}
                            </Label>
                            <input
                                type="number"
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                placeholder={language === 'tr' ? 'Rastgele için boş bırakın' : 'Leave empty for random'}
                                className="w-full h-9 bg-muted/50 border border-border/50 rounded-lg px-3 text-[11px] font-medium focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                            />
                        </div>

                        <Button
                            disabled={!identityImage || !baseImage || isGenerating}
                            onClick={handleGenerate}
                            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition-all active:scale-95 mt-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t("faceSwap.generating")}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {t("faceSwap.generate")}
                                    <span className="ml-2 text-[10px] font-normal opacity-80">
                                        ({estimatedCost} {language === "tr" ? "Kredi" : "Credits"})
                                    </span>
                                </>
                            )}
                        </Button>
                    </Card>

                    <div className="p-4 bg-violet-500/5 rounded-xl border border-violet-500/10 hidden lg:block">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            <strong className="text-violet-500 uppercase tracking-tighter mr-1">{language === 'tr' ? 'Pro İpucu:' : 'Pro Tip:'}</strong>
                            {language === 'tr'
                                ? 'Işık ve gölge ayarları hedef görsele (Base) göre otomatik yapılır. Kimlik görselinin sadece yüz hatları alınır.'
                                : 'Lighting and shadows are matched to the base image. Only facial identity features are taken from the source.'}
                        </p>
                    </div>
                </div>

                {/* Right Side: Result Section */}
                <div className="lg:col-span-7 flex flex-col h-full">
                    <Card className="relative flex-1 min-h-[500px] lg:min-h-0 bg-card dark:bg-[#12121a] border-2 border-dashed border-border dark:border-white/10 overflow-hidden flex items-center justify-center group rounded-3xl shadow-none hover:border-border/80 dark:hover:border-white/20 transition-colors">
                        {isGenerating ? (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-violet-500 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold">{language === 'tr' ? 'İşleniyor...' : 'Processing...'}</h3>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">{language === 'tr' ? 'Nano Banana Pro pikselleri yeniden örüyor.' : 'Nano Banana Pro is weaving the pixels.'}</p>
                                </div>
                            </div>
                        ) : null}

                        {resultImage ? (
                            <div className="w-full h-full flex flex-col p-4 space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner bg-black/5">
                                    <img src={resultImage} className="w-full h-full object-contain" alt="Result" />
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleDownload}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'tr' ? 'BAŞARIYLA ÜRETİLDİ' : 'SUCCESSFULLY GENERATED'}</span>
                                        {lastUsedSeed && (
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground ml-2">
                                                Seed: {lastUsedSeed}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setResultImage(null)} className="h-8 text-[11px] font-bold rounded-lg px-3">
                                            <RefreshCw className="w-3 h-3 mr-2" />
                                            {language === 'tr' ? 'YENİ' : 'NEW'}
                                        </Button>
                                        <Button size="sm" onClick={handleDownload} className="h-8 bg-violet-600 text-[11px] font-bold rounded-lg px-3">
                                            <Download className="w-3 h-3 mr-2" />
                                            {language === 'tr' ? 'İNDİR' : 'DOWNLOAD'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center opacity-40 p-12">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-muted-foreground">{language === 'tr' ? 'Sonuç Bekleniyor' : 'Awaiting Result'}</h4>
                                    <p className="text-[11px] text-muted-foreground max-w-[240px]">
                                        {language === 'tr'
                                            ? 'Kimlik kaynağı ve hedef görseli yükledikten sonra "Oluştur" butonuna basın.'
                                            : 'Upload your images and click Generate to see the result here.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}

