"use client"

import { useState, useEffect, useRef, Suspense } from "react"
// ... (imports)
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Shirt, Loader2, Zap, Download, RotateCw, ChevronRight, X, Palette, Tag, Maximize2, Sparkles, Edit2, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { downloadImage, cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const ANGLE_OPTIONS = [
  { id: "front", label: "Front 3/4", labelTr: "Ön 3/4", icon: "↗️" },
  { id: "back", label: "Back 3/4", labelTr: "Arka 3/4", icon: "↙️" },
];

const RESOLUTION_OPTIONS = [
  { id: "1K", label: "1K Standard", labelTr: "1K Standart" },
  { id: "2K", label: "2K High", labelTr: "2K Yüksek" },
  { id: "4K", label: "4K Ultra", labelTr: "4K Ultra" },
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

  const [selectedAngle, setSelectedAngle] = useState<"front" | "back">("front")
  const [selectedResolution, setSelectedResolution] = useState("1K")
  const [angleDialogOpen, setAngleDialogOpen] = useState(false)
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false)
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
      reader.onloadend = () => setMainImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFabricImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFabricImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getAngleLabel = () => {
    const angle = ANGLE_OPTIONS.find(a => a.id === selectedAngle);
    return `${angle?.icon} ${language === "tr" ? angle?.labelTr : angle?.label}`;
  };

  const handleGenerate = async () => {
    if (!mainImage) {
      toast.error(language === "tr" ? "Lütfen ana giysi görseli yükleyin" : "Please upload main garment image");
      return;
    }
    const creditCost = selectedResolution === "4K" ? 4 : 2;
    if (!deductCredits(creditCost)) {
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
          resolution: selectedResolution
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
          description: `${selectedResolution} • ${selectedAngle === "front" ? "Front" : "Back"}`
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
      const filename = `rawless_image_${Date.now()}.png`;
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
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden lg:overflow-hidden overflow-y-auto lg:overflow-y-hidden">
      {/* Left: Input */}
      <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("ghost.title")}</h2>
          <p className="text-muted-foreground text-sm">{t("ghost.subtitle")}</p>
        </div>

        {/* Main Garment Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Shirt className="w-4 h-4" />
            {language === "tr" ? "Ana Giysi Görseli" : "Main Garment Image"} *
          </label>
          <div className="h-32 border-2 border-dashed rounded-xl bg-muted/20 relative group hover:border-violet-500 transition-colors cursor-pointer overflow-hidden">
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
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
              <Tag className="w-3 h-3" />
              {language === "tr" ? "Logo / Detay" : "Logo / Detail"}
            </label>
            <div className="h-28 border-2 border-dashed rounded-lg bg-muted/20 relative group hover:bg-muted/40 transition-colors cursor-pointer overflow-hidden">
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
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
              <Palette className="w-3 h-3" />
              {language === "tr" ? "Kumaş / Doku" : "Fabric / Texture"}
            </label>
            <div className="h-28 border-2 border-dashed rounded-lg bg-muted/20 relative group hover:bg-muted/40 transition-colors cursor-pointer overflow-hidden">
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

        {/* Angle Selector */}
        <Dialog open={angleDialogOpen} onOpenChange={setAngleDialogOpen}>
          <DialogTrigger asChild>
            <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-violet-500/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <RotateCw className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{language === "tr" ? "Görünüm Açısı" : "View Angle"}</p>
                  <p className="font-medium text-sm">{getAngleLabel()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{language === "tr" ? "Görünüm Açısı Seçin" : "Select View Angle"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {ANGLE_OPTIONS.map((angle) => (
                <Button
                  key={angle.id}
                  variant={selectedAngle === angle.id ? "default" : "outline"}
                  className={`h-20 flex-col gap-2 ${selectedAngle === angle.id ? 'bg-violet-500 text-white hover:bg-violet-600' : ''}`}
                  onClick={() => { setSelectedAngle(angle.id as "front" | "back"); setAngleDialogOpen(false); }}
                >
                  <span className="text-2xl">{angle.icon}</span>
                  <span>{language === "tr" ? angle.labelTr : angle.label}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolution Selector */}
        <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
          <DialogTrigger asChild>
            <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-violet-500/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{language === "tr" ? "Çözünürlük" : "Resolution"}</p>
                  <p className="font-medium text-sm">{RESOLUTION_OPTIONS.find(r => r.id === selectedResolution)?.[language === "tr" ? 'labelTr' : 'label']}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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
        <div className="space-y-2">
          <Button size="lg" className="w-full h-12 text-lg bg-violet-500 text-white hover:bg-violet-600" onClick={handleGenerate} disabled={!mainImage || isProcessing}>
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
            {isProcessing ? t("styles.generating") : t("styles.generate")}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
            {language === "tr" ? `Maliyet: ${selectedResolution === "4K" ? 4 : 2} Kredi` : `Cost: ${selectedResolution === "4K" ? 4 : 2} Credits`}
          </p>
        </div>
      </div>

      {/* Middle: Result */}
      <div className="flex-1 bg-stone-50/50 dark:bg-stone-950/50 p-8 flex items-center justify-center min-h-[400px]">
        {isProcessing ? (
          <div className="max-w-md w-full space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shirt className="w-16 h-16 text-violet-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{t("styles.generating")}</h3>
              <p className="text-muted-foreground transition-all duration-300 min-h-[1.5em]">
                {language === 'tr' ? LOADING_MESSAGES[currentMessageIndex].tr : LOADING_MESSAGES[currentMessageIndex].en}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={generationProgress} className="h-2 w-full bg-violet-100 dark:bg-violet-900/20" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{generationProgress}%</span>
                <span>{language === 'tr' ? 'Tahmini süre: 10-15sn' : 'Est. time: 10-15s'}</span>
              </div>
            </div>
          </div>
        ) : resultImage ? (
          <Card className="max-w-xl w-full aspect-[2/3] p-2 bg-white shadow-xl animate-in zoom-in-95 duration-500 relative group">
            <img src={resultImage} className="w-full h-full object-contain rounded-md" />
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" onClick={() => router.push(`/studio?image=${encodeURIComponent(resultImage)}`)}>{t("common.getSpecs")}</Button>
              <Button variant="secondary" size="icon" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
            </div>
          </Card>
        ) : (
          <div className="text-center opacity-40 max-w-sm">
            <Shirt className="w-24 h-24 mx-auto mb-4 stroke-1" />
            <h3 className="text-2xl font-semibold mb-2">{t("ghost.studioTitle")}</h3>
            <p>{t("ghost.studioDesc")}</p>
          </div>
        )}
      </div>

      {/* Right: History */}
      <div className="hidden xl:block w-[200px] border-l bg-white dark:bg-stone-950 p-4 overflow-y-auto shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{language === 'tr' ? 'Geçmiş' : 'History'}</h3>
        </div>
        <div className="space-y-3">
          {ghostHistory.length > 0 ? (
            ghostHistory.map((item) => (
              <div key={item.id} className="space-y-1 group cursor-pointer" onClick={() => setResultImage(item.imageUrl)}>
                <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-transparent group-hover:border-violet-500 transition-all bg-muted">
                  <img src={item.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-muted-foreground">{formatDate(item.createdAt)}</p>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 max-w-[80px] truncate">{item.description}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">{language === 'tr' ? 'Henüz geçmiş yok' : 'No history yet'}</p>
          )}
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
