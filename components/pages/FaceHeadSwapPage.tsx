"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/context/language-context"
import { downloadFile } from "@/lib/download"
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
    Coins,
    Camera,
} from "lucide-react"
import {
    TbRefresh,
    TbUserCircle,
    TbMaximize,
    TbPhoto,
    TbSettings2,
    TbAdjustmentsHorizontal,
    TbAspectRatio,
    TbHdr,
    TbCoins
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
        await downloadFile(resultImage, `swap_${Date.now()}.png`);
    }

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-screen pb-24">
                <div className="max-w-[1180px] mx-auto w-full flex flex-col lg:flex-row gap-8">
                    {/* Left: Input */}
                    <div className="w-full lg:w-[420px] flex flex-col space-y-6 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                                <UserCircle2 className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                                    {language === "tr" ? "FACE SWAP" : "FACE SWAP"}
                                </label>
                                <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                                    {language === "tr"
                                        ? "Modelinizin yüzünü kolayca değiştirin."
                                        : "Easily swap your model's face."}
                                </span>
                            </div>
                        </div>
                        {/* 1. Upload Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-0">
                                    <TbUserCircle className="w-4 h-4 text-zinc-500" />
                                    {t("faceSwap.identitySource")}
                                </label>
                                <Card className="relative h-56 overflow-hidden border border-dashed border-white/20 hover:border-white/40 transition-all bg-[#121214] flex items-center justify-center group cursor-pointer rounded-2xl shadow-none" onClick={() => identityInputRef.current?.click()}>
                                    <input type="file" ref={identityInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'identity')} />
                                    {identityImage ? (
                                        <div className="relative w-full h-full">
                                            <img src={identityImage} className="w-full h-full object-cover rounded-xl p-2" alt="Identity" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIdentityImage(null); }}
                                                className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center p-4">
                                            <div className="w-12 h-12 rounded-lg bg-[#18181B] border border-white/10 flex items-center justify-center group-hover:bg-white text-zinc-500 group-hover:text-black transition-all">
                                                <UserCircle2 className="w-6 h-6" />
                                            </div>
                                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em]">{t("faceSwap.uploadReference")}</span>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-0">
                                    <TbPhoto className="w-4 h-4 text-zinc-500" />
                                    {t("faceSwap.baseImage")}
                                </label>
                                <Card className="relative h-56 overflow-hidden border border-dashed border-white/20 hover:border-white/40 transition-all bg-[#121214] flex items-center justify-center group cursor-pointer rounded-2xl shadow-none" onClick={() => baseInputRef.current?.click()}>
                                    <input type="file" ref={baseInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'base')} />
                                    {baseImage ? (
                                        <div className="relative w-full h-full">
                                            <img src={baseImage} className="w-full h-full object-cover rounded-xl p-2" alt="Base" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setBaseImage(null); }}
                                                className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center p-4">
                                            <div className="w-12 h-12 rounded-lg bg-[#18181B] border border-white/10 flex items-center justify-center group-hover:bg-white text-zinc-500 group-hover:text-black transition-all">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em]">{t("faceSwap.uploadBase")}</span>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>

                        {/* 2. Mode & Parameters Panel */}
                        <div className="space-y-6">
                            <div className="p-5 space-y-6 bg-[#18181B] border border-white/10 shadow-sm rounded-2xl">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em] flex items-center gap-1.5 mb-1">
                                        <TbAdjustmentsHorizontal className="w-4 h-4 text-zinc-500" />
                                        {t("faceSwap.mode")}
                                    </label>
                                    <Tabs value={swapMode} onValueChange={(v) => setSwapMode(v as any)} className="w-full">
                                        <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-[#121214] rounded-md border border-white/10">
                                            <TabsTrigger value="head_swap" className="text-[11px] font-black uppercase tracking-[0.18em] rounded-sm data-[state=active]:bg-white data-[state=active]:text-black transition-all py-2">
                                                {t("faceSwap.headSwap")}
                                            </TabsTrigger>
                                            <TabsTrigger value="face_swap" className="text-[11px] font-black uppercase tracking-[0.18em] rounded-sm data-[state=active]:bg-white data-[state=active]:text-black transition-all py-2">
                                                {t("faceSwap.faceSwap")}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em] flex items-center gap-1.5">
                                            <TbAspectRatio className="w-4 h-4 text-zinc-500" />
                                            {language === 'tr' ? 'EN BOY' : 'RATIO'}
                                        </label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger className="h-12 text-[11px] font-black uppercase bg-[#121214] border-white/10 text-white rounded-md focus:ring-1 focus:ring-white/20 shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#121214] border-white/10 text-white">
                                                {ASPECT_RATIOS.map(r => (
                                                    <SelectItem key={r.value} value={r.value} className="text-[11px] font-bold uppercase focus:bg-white/5 focus:text-white">{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em] flex items-center gap-1.5">
                                            <TbHdr className="w-4 h-4 text-zinc-500" />
                                            {language === 'tr' ? 'KALİTE' : 'QUALITY'}
                                        </label>
                                        <Select value={resolution} onValueChange={setResolution}>
                                            <SelectTrigger className="h-12 text-[11px] font-black uppercase bg-[#121214] border-white/10 text-white rounded-md focus:ring-1 focus:ring-white/20 shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#121214] border-white/10 text-white">
                                                <SelectItem value="1K" className="text-[11px] font-bold focus:bg-white/5 focus:text-white">1K - STANDARD</SelectItem>
                                                <SelectItem value="2K" className="text-[11px] font-bold focus:bg-white/5 focus:text-white">2K - HIGH</SelectItem>
                                                <SelectItem value="4K" className="text-[11px] font-bold focus:bg-white/5 focus:text-white">4K - ULTRA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.18em] flex items-center gap-1.5 px-1">
                                        <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                                        {language === 'tr' ? 'SEED (OPSİYONEL)' : 'SEED (OPTIONAL)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        placeholder={language === 'tr' ? 'Rastgele için boş bırakın' : 'Leave empty for random'}
                                        className="w-full h-12 bg-[#121214] border border-white/10 rounded-md px-4 text-white text-[13px] font-medium focus:ring-1 focus:border-white/25 focus:ring-white/10 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                <Button
                                    variant="default"
                                    className="w-full h-12 mt-4 bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white rounded-md flex items-center justify-center font-black"
                                    disabled={isGenerating}
                                    onClick={handleGenerate}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-3" />
                                            <span className="text-[11px] uppercase tracking-[0.18em]">{t("faceSwap.generating")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4 mr-2 flex-none" />
                                            <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.18em]">
                                                <span>{t("faceSwap.generate")}</span>
                                                <div className="h-4 w-px bg-white/30 mx-2 shrink-0" />
                                                <div className="flex items-center gap-1">
                                                    <TbCoins className="w-4 h-4" />
                                                    <span className="font-black tracking-tighter">
                                                        {estimatedCost}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Result Section */}
                    <div className="flex-1 flex flex-col space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-4 h-4 text-zinc-500" />
                            {language === 'tr' ? 'SONUÇ' : 'RESULT'}
                        </label>
                        <div className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#121214] border border-dashed border-white/20 overflow-hidden flex items-center justify-center group rounded-2xl shadow-none hover:border-white/40 transition-colors">
                            {isGenerating ? (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                                        <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">{language === 'tr' ? 'Oluşturuluyor...' : 'Generating...'}</h3>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 max-w-[240px] mx-auto">{language === 'tr' ? 'Nano Banana Pro pikselleri yeniden örüyor.' : 'Nano Banana Pro is weaving the pixels.'}</p>
                                    </div>
                                </div>
                            ) : null}

                            {resultImage ? (
                                <div className="w-full h-full flex flex-col p-4 space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner bg-black/5">
                                        <img src={resultImage} className="w-full h-full object-contain" alt="Result" />
                                        <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" className="bg-[#F5F5F5] text-black hover:bg-zinc-200 font-black h-10 px-5 rounded-md uppercase tracking-[0.18em] text-[11px]" onClick={() => window.open(resultImage, '_blank')}>{language === "tr" ? "TAM BOYUT" : "FULL SIZE"}</Button>
                                            <Button variant="secondary" size="icon" className="bg-[#F5F5F5] text-black hover:bg-zinc-200 h-10 w-10 rounded-md" onClick={handleDownload}>
                                                <Download className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{language === 'tr' ? 'BAŞARIYLA ÜRETİLDİ' : 'SUCCESSFULLY GENERATED'}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="secondary" size="sm" onClick={() => setResultImage(null)} className="h-10 text-[11px] font-black uppercase tracking-[0.18em] rounded-md px-5 bg-[#F5F5F5] text-black hover:bg-zinc-200 transition-all">
                                                <TbRefresh className="w-4 h-4 mr-2" />
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
                                    <div className="w-20 h-20 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center">
                                        <ImageIcon className="w-10 h-10 text-white/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{language === 'tr' ? 'FACE SWAP' : 'FACE SWAP'}</h4>
                                        <p className="text-[11px] font-bold text-zinc-400 max-w-[280px] mx-auto">
                                            {language === 'tr'
                                                ? 'Kimlik kaynağı ve hedef görseli yükledikten sonra "Oluştur" butonuna basın.'
                                                : 'Upload your images and click Generate to see the result here.'}
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
