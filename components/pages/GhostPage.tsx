"use client"

import { useState, useEffect, useRef, Suspense } from "react"
// ... (imports)
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Upload,
  Loader2,
  Zap,
  Download,
  RotateCw,
  ChevronRight,
  X,
  Palette,
  Tag,
  Maximize2,
  Sparkles,
  Edit2,
  Trash2,
  Shirt
} from "lucide-react"
import {
  TbHanger,
  TbShirt,
  TbSignature,
  TbPalette,
  TbAdjustmentsHorizontal,
  TbHdr,
  TbChevronRight,
  TbSparkles,
  TbLoader2,
  TbRefresh,
  TbMaximize,
  TbSquare,
  TbSquareRotated,
  TbArrowUpRight,
  TbArrowDownLeft,
  TbLayoutBoard,
  TbShirtFilled
} from "react-icons/tb"
import { useRouter, useSearchParams } from "next/navigation"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { downloadImage, cn, optimizeImageForApi } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SERVICE_COSTS } from "@/lib/pricingConstants";

const ANGLE_OPTIONS = [
  { id: "front_straight", label: "Front", labelTr: "Ön", icon: TbShirt },
  { id: "back_straight", label: "Back", labelTr: "Arka", icon: TbShirt },
  { id: "front", label: "Front 3/4", labelTr: "Ön 3/4", icon: TbArrowUpRight },
  { id: "back", label: "Back 3/4", labelTr: "Arka 3/4", icon: TbArrowDownLeft },
  { id: "flatlay", label: "Flatlay", labelTr: "Flatlay", icon: TbShirtFilled },
];

const RESOLUTION_OPTIONS = [
  { id: "1K", label: "1K Standard", labelTr: "1K Standart" },
  { id: "2K", label: "2K High", labelTr: "2K Yüksek" },
  { id: "4K", label: "4K Ultra", labelTr: "4K Ultra" },
];

const ASPECT_RATIO_OPTIONS = [
  { id: "1:1", label: "Square (1:1)", labelTr: "Kare (1:1)" },
  { id: "3:4", label: "Portrait (3:4)", labelTr: "Dikey (3:4)" },
  { id: "4:3", label: "Landscape (4:3)", labelTr: "Yatay (4:3)" },
  { id: "9:16", label: "Story (9:16)", labelTr: "Hikaye (9:16)" },
  { id: "16:9", label: "Wide (16:9)", labelTr: "Geniş (16:9)" },
  { id: "2:3", label: "Classic (2:3)", labelTr: "Klasik (2:3)" },
  { id: "3:2", label: "Landscape (3:2)", labelTr: "Yatay (3:2)" },
  { id: "21:9", label: "Ultra Wide (21:9)", labelTr: "Ultra Geniş (21:9)" },
  { id: "9:21", label: "Ultra Tall (9:21)", labelTr: "Ultra Dikey (9:21)" },
];

const LOADING_MESSAGES = [
  { en: "Analyzing garment structure...", tr: "Giysi yapısı analiz ediliyor..." },
  { en: "detecting fabric details...", tr: "Kumaş detayları algılanıyor..." },
  { en: "Aligning ghost mannequin...", tr: "Hayalet manken hizalanıyor..." },
  { en: "Applying lighting and shadows...", tr: "Işık ve gölgeler uygulanıyor..." },
  { en: "Finalizing high-res output...", tr: "Yüksek çözünürlüklü çıktı hazırlanıyor..." },
];

function GhostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("modelId");
  const { projects, models, addProject, deductCredits } = useProjects(); // Added projects
  const activeModel = models.find(m => m.id === modelId);
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Image states - up to 3 images
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [fabricImage, setFabricImage] = useState<string | null>(null)

  const [selectedAngle, setSelectedAngle] = useState<string>("front_straight")
  const [selectedResolution, setSelectedResolution] = useState("1K")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3")
  const [angleDialogOpen, setAngleDialogOpen] = useState(false)
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false)
  const [aspectRatioDialogOpen, setAspectRatioDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)

  // Progress states
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  if (!mounted) return null;

  // History - Filter only Ghost type
  const ghostHistory = projects.filter(p => p.type === "Ghost").sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await optimizeImageForApi(reader.result as string, 3000, 0.90);
        setMainImage(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await optimizeImageForApi(reader.result as string, 3000, 0.90);
        setLogoImage(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFabricImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await optimizeImageForApi(reader.result as string, 3000, 0.90);
        setFabricImage(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAngleLabel = () => {
    const angle = ANGLE_OPTIONS.find(a => a.id === selectedAngle);
    if (!angle) return "";
    const Icon = angle.icon;
    return (
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-violet-500" />
        {language === "tr" ? angle.labelTr : angle.label}
      </span>
    );
  };

  const handleGenerate = async () => {
    if (!mainImage) {
      toast.error(language === "tr" ? "Lütfen ana giysi görseli yükleyin" : "Please upload main garment image");
      return;
    }
    const creditCost = selectedResolution === "4K"
      ? SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_4K
      : SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_1_2K;
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

    // Rotate messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const response = await fetch("/api/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [mainImage, logoImage, fabricImage].filter(Boolean),
          angle: selectedAngle,
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
          title: language === "tr" ? "Hayalet Manken Çekimi" : "Ghost Mannequin Shot",
          type: "Ghost",
          imageUrl: data.imageUrl,
          description: `${selectedResolution} • ${ANGLE_OPTIONS.find(a => a.id === selectedAngle)?.label || selectedAngle}`,
          mediaType: "image"
        });
        toast.success(language === "tr" ? "Hayalet manken oluşturuldu!" : "Ghost mannequin generated!");
      } else if (data.error) {
        toast.error(data.error);
        setIsProcessing(false); // Only set false mainly on error here, for success we might wait a bit or set immediately
      }
    } catch (error) {
      console.error("Ghost Error:", error);
      toast.error(language === "tr" ? "Bir hata oluştu" : "An error occurred");
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDownload = () => {
    if (resultImage) {
      const filename = `modeon_image_${Date.now()}.png`;
      downloadImage(resultImage, filename);
    }
  }

  // Format date helper
  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0D0D0F] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1240px] mx-auto w-full min-h-full flex flex-col lg:flex-row">
          {/* Left: Input */}
          <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 border-white/5 bg-background p-4 md:p-8 lg:overflow-y-auto space-y-4 shrink-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center shadow-xl">
                <TbHanger className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">{t("ghost.title")}</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-0.5">{t("ghost.subtitle")}</p>
              </div>
            </div>

            {/* Main Garment Upload */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                <TbShirt className="w-4 h-4 text-white" />
                {language === "tr" ? "ANA GİYSİ GÖRSELİ" : "MAIN GARMENT IMAGE"} *
              </label>
              <div className="h-40 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02] relative group hover:border-white transition-all cursor-pointer overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                  onChange={handleMainImageChange}
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
                    <Shirt className="w-8 h-8 opacity-50" />
                    <span className="text-xs">{t("ghost.uploadFlatLay")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Detail Images */}
            <div className="grid grid-cols-2 gap-3">
              {/* Logo/Detail Image */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1">
                  <TbSignature className="w-3.5 h-3.5 text-white" />
                  {language === "tr" ? "LOGO / DETAY" : "LOGO / DETAIL"}
                </label>
                <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02] relative group hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    onChange={handleLogoImageChange}
                  />
                  {logoImage ? (
                    <div className="relative h-full">
                      <img src={logoImage} className="w-full h-full object-contain p-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setLogoImage(null); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <Tag className="w-5 h-5 opacity-50" />
                      <span className="text-[10px]">{language === "tr" ? "İsteğe Bağlı" : "Optional"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fabric Image */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 px-1">
                  <TbPalette className="w-3.5 h-3.5 text-white" />
                  {language === "tr" ? "KUMAŞ / DOKU" : "FABRIC / TEXTURE"}
                </label>
                <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02] relative group hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 opacity-0 cursor-pointer"
                    onChange={handleFabricImageChange}
                  />
                  {fabricImage ? (
                    <div className="relative h-full">
                      <img src={fabricImage} className="w-full h-full object-contain p-1" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setFabricImage(null); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <Palette className="w-5 h-5 opacity-50" />
                      <span className="text-[10px]">{language === "tr" ? "İsteğe Bağlı" : "Optional"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {language === "tr"
                ? "• Görsel 1: Ana giysi referansı (zorunlu)\n• Görsel 2: Logo/yazı/detay kilidi\n• Görsel 3: Kumaş/malzeme kilidi"
                : "• Image 1: Main garment reference (required)\n• Image 2: Logo/text/detail lock\n• Image 3: Fabric/material lock"}
            </p>

            {/* Angle Grid Section */}
            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                <TbAdjustmentsHorizontal className="w-4 h-4 text-white" />
                {language === "tr" ? "GÖRÜNÜM AÇILARI" : "VIEW ANGLES"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ANGLE_OPTIONS.map((angle) => (
                  <Button
                    key={angle.id}
                    variant={selectedAngle === angle.id ? "default" : "outline"}
                    className={cn(
                      "h-24 flex-col gap-2 transition-all duration-300 rounded-2xl border-white/5",
                      selectedAngle === angle.id
                        ? "bg-white text-black shadow-2xl border-white ring-2 ring-white/20"
                        : "bg-white/[0.02] hover:border-white/20 text-zinc-500 hover:text-white"
                    )}
                    onClick={() => setSelectedAngle(angle.id)}
                  >
                    <angle.icon className={cn("w-8 h-8 mb-1", selectedAngle === angle.id ? "text-black" : "text-white opacity-40")} />
                    <span className="font-black text-[10px] uppercase tracking-widest">{language === "tr" ? angle.labelTr : angle.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Resolution and Aspect Ratio Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="p-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition-all border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                        <TbHdr className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}</p>
                        <p className="font-bold text-xs text-[var(--text-primary)]">{RESOLUTION_OPTIONS.find(r => r.id === selectedResolution)?.label}</p>
                      </div>
                      <TbChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Çözünürlük Seçin" : "Select Resolution"}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 mt-4">
                    {RESOLUTION_OPTIONS.map((res) => (
                      <Button
                        key={res.id}
                        variant={selectedResolution === res.id ? "default" : "outline"}
                        className={`justify-between h-14 px-4 ${selectedResolution === res.id ? 'bg-violet-500 text-white hover:bg-violet-600' : ''}`}
                        onClick={() => { setSelectedResolution(res.id); setResolutionDialogOpen(false); }}
                      >
                        <span className="font-medium">{language === "tr" ? res.labelTr : res.label}</span>
                        <Badge variant="secondary" className={selectedResolution === res.id ? 'bg-white/20 text-white border-white/20' : ''}>
                          {res.id}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                    {language === "tr"
                      ? "* Yüksek çözünürlükler (2K, 4K) daha fazla kredi tüketebilir ve işlem süresi uzayabilir."
                      : "* Higher resolutions (2K, 4K) may consume more credits and take longer to process."}
                  </p>
                </DialogContent>
              </Dialog>

              <Dialog open={aspectRatioDialogOpen} onOpenChange={setAspectRatioDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="p-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition-all border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                        <TbSquareRotated className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{language === "tr" ? "BOYUT" : "ASPECT RATIO"}</p>
                        <p className="font-bold text-xs text-[var(--text-primary)]">{ASPECT_RATIO_OPTIONS.find(r => r.id === selectedAspectRatio)?.label}</p>
                      </div>
                      <TbChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{language === "tr" ? "Boyut Oranı Seçin" : "Select Aspect Ratio"}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                    {ASPECT_RATIO_OPTIONS.map((ratio) => (
                      <Button
                        key={ratio.id}
                        variant={selectedAspectRatio === ratio.id ? "default" : "outline"}
                        className={`justify-between h-14 px-4 ${selectedAspectRatio === ratio.id ? 'bg-violet-500 text-white hover:bg-violet-600' : ''}`}
                        onClick={() => { setSelectedAspectRatio(ratio.id); setAspectRatioDialogOpen(false); }}
                      >
                        <span className="font-medium">{language === "tr" ? ratio.labelTr : ratio.label}</span>
                        <Badge variant="secondary" className={selectedAspectRatio === ratio.id ? 'bg-white/20 text-white border-white/20' : ''}>
                          {ratio.id}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic px-1">
                    {language === "tr"
                      ? "* Farklı pazar yerleri ve kullanım alanlarına göre görüntü oranını belirler."
                      : "* Determines the image ratio based on different marketplaces and use cases."}
                  </p>
                </DialogContent>
              </Dialog>
            </div>

            {/* Active Model Indicator */}
            {activeModel && (
              <div className="bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <div>
                    <p className="text-xs font-semibold text-violet-900 dark:text-violet-100">{t("train.usingModel") || "Using Model"}</p>
                    <p className="text-xs text-violet-700 dark:text-violet-300">{activeModel.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => router.push('/photoshoot/ghost')}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Generate Button */}
            <div className="space-y-2 pt-6">
              <Button
                className="w-full py-8 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-[11px] shadow-2xl transition-all active:scale-[0.98] flex items-center gap-4 uppercase tracking-[0.2em]"
                disabled={!mainImage || isProcessing}
                onClick={handleGenerate}
              >
                {isProcessing ? (
                  <>
                    <TbLoader2 className="w-5 h-5 animate-spin" />
                    <span>{t("ghost.processing") || "GENERATING..."}</span>
                  </>
                ) : (
                  <>
                    <TbSparkles className="w-5 h-5 opacity-50" />
                    <span>{t("ghost.generate") || "GENERATE GHOST"}</span>
                    <span className="ml-1 opacity-40 font-black border-l border-black/10 pl-4">
                      {selectedResolution === "4K" ? SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_4K : SERVICE_COSTS.IMAGE_GENERATION.GHOST_MODEL_1_2K} {language === "tr" ? "KR" : "CR"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Middle: Result */}
          <div className="flex-1 bg-[#0D0D0F] p-8 flex items-center justify-center min-h-[400px]">
            {isProcessing ? (
              <div className="max-w-md w-full space-y-8 text-center animate-in fade-in duration-500">
                <div className="relative w-48 h-48 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="w-16 h-16 text-white animate-pulse" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{t("styles.generating")}</h3>
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 transition-all duration-300 min-h-[1.5em]">
                    {language === 'tr' ? LOADING_MESSAGES[currentMessageIndex].tr : LOADING_MESSAGES[currentMessageIndex].en}
                  </p>
                </div>

                <div className="space-y-4">
                  <Progress value={generationProgress} className="h-1.5 w-full bg-white/5" />
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>{generationProgress}%</span>
                    <span>{language === 'tr' ? 'Tahmini süre: 10-15sn' : 'Est. time: 10-15s'}</span>
                  </div>
                </div>
              </div>
            ) : resultImage ? (
              <Card className="max-w-xl w-full aspect-[2/3] p-3 bg-zinc-900 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 relative group rounded-2xl">
                <img src={resultImage} className="w-full h-full object-contain rounded-xl" />
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" className="bg-white text-black hover:bg-zinc-200 font-black h-10 px-5 rounded-xl uppercase tracking-widest text-[10px]" onClick={() => router.push(`/studio?image=${encodeURIComponent(resultImage)}`)}>{t("common.getSpecs")}</Button>
                  <Button variant="secondary" size="icon" className="bg-white text-black hover:bg-zinc-200 h-10 w-10 rounded-xl" onClick={handleDownload}><Download className="w-5 h-5" /></Button>
                </div>
              </Card>
            ) : (
              <div className="text-center opacity-20 max-w-sm">
                <Shirt className="w-32 h-32 mx-auto mb-6 stroke-[0.5]" />
                <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">{t("ghost.studioTitle")}</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{t("ghost.studioDesc")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GhostPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <GhostPageContent />
    </Suspense>
  )
}
