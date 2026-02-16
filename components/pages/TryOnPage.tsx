"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/context/language-context"
import { Upload, Shirt, Camera, Loader2, Maximize2, X, Eye, FileText, ShoppingBag, Gem, RotateCw, ScanLine, Ruler, Scissors, Footprints, User, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SERVICE_COSTS } from "@/lib/pricingConstants";

// --- CONSTANTS ---
const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", labelTr: "1:1 (Kare)" },
  { id: "2:3", label: "2:3", labelTr: "2:3 (Portre)" },
  { id: "3:4", label: "3:4", labelTr: "3:4 (Portre)" },
  { id: "4:3", label: "4:3", labelTr: "4:3 (Yatay)" },
  { id: "16:9", label: "16:9", labelTr: "16:9" },
  { id: "9:16", label: "9:16", labelTr: "9:16" },
];

const RESOLUTION_OPTIONS = [
  { id: "1K", label: "1K Standard", labelTr: "1K Standart" },
  { id: "2K", label: "2K High", labelTr: "2K Yüksek" },
  { id: "4K", label: "4K Ultra", labelTr: "4K Ultra" },
];
// -----------------

export default function TryOnPage() {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Core State - DEFAULTS: 4K resolution, 2:3 aspect ratio
  const [productName, setProductName] = useState("");
  const [workflowType, setWorkflowType] = useState<"upper" | "lower" | "dress">("lower");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [resolution, setResolution] = useState("4K"); // DEFAULT 4K
  const [aspectRatio, setAspectRatio] = useState("2:3"); // DEFAULT 2:3

  const estimatedCost = resolution === "4K"
    ? SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_4K
    : SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_1_2K;

  // LOWER BODY OPTIONS
  const [lowerTucked, setLowerTucked] = useState(true); // For lower body: undershirt tucked

  // UPPER BODY SPECIFIC OPTIONS
  const [upperTucked, setUpperTucked] = useState(false); // Is the upper garment tucked into pants?
  const [innerwearTucked, setInnerwearTucked] = useState(true); // Is the innerwear tucked into pants? (default: yes)
  const [frontOpen, setFrontOpen] = useState(false); // Is the front open? (for shirts, jackets with buttons/zipper)
  const [innerwearImage, setInnerwearImage] = useState<string | null>(null); // Undershirt/t-shirt image

  // Model Image State (Required for Upper Body)
  const [modelImage, setModelImage] = useState<string | null>(null);

  // View State
  const [detailView, setDetailView] = useState<'front' | 'angled' | 'back'>('front');

  // Assets State
  const [assets, setAssets] = useState<Record<string, string | null>>({});

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Resize Utility
  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas ctx error')); return; }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.90));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Auto-analyze garment to get product name
  const analyzeGarmentForName = async (imageUrl: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageUrl,
          language: "en",
          type: "techPack"
        })
      });

      if (!res.ok) {
        console.error("Analyze API error");
        return;
      }

      const data = await res.json();

      if (data.productName && !productName) {
        setProductName(data.productName);
        toast.success(language === "tr" ? "Ürün adı otomatik algılandı!" : "Product name detected!");
      }
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Asset Upload Handler
  const handleAssetUpload = async (id: string, file: File) => {
    try {
      const resizedUrl = await resizeImage(file, 1536);
      setAssets(prev => ({ ...prev, [id]: resizedUrl }));

      // Auto-analyze if it's a main garment image and product name is empty
      if ((id === 'top_front' || id === 'top_back' || id === 'bottom_front' || id === 'bottom_back') && !productName) {
        analyzeGarmentForName(resizedUrl);
      }
    } catch (e) {
      console.error("Resize failed", e);
      toast.error("Image processing failed");
    }
  };

  // Model Upload Handler
  const handleModelUpload = async (file: File) => {
    try {
      const resizedUrl = await resizeImage(file, 1536);
      setModelImage(resizedUrl);
      toast.success(language === "tr" ? "Model görseli yüklendi" : "Model image uploaded");
    } catch (e) {
      console.error("Model resize failed", e);
      toast.error("Model image processing failed");
    }
  };

  // Innerwear Upload Handler
  const handleInnerwearUpload = async (file: File) => {
    try {
      const resizedUrl = await resizeImage(file, 1536);
      setInnerwearImage(resizedUrl);
      toast.success(language === "tr" ? "İç giyim görseli yüklendi" : "Innerwear image uploaded");
    } catch (e) {
      console.error("Innerwear resize failed", e);
      toast.error("Innerwear image processing failed");
    }
  };

  const removeAsset = (id: string) => {
    setAssets(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Asset Relevance Logic - Now also considers workflow type
  const isAssetRelevant = (id: string) => {
    // Shoes: HIDE for upper body (cowboy shot doesn't show feet)
    if (id === 'shoes' && workflowType === 'upper') return false;

    // Universal assets
    if (['background', 'accessories', 'detail_1', 'detail_2', 'detail_3'].includes(id)) return true;
    if (id === 'shoes' && workflowType !== 'upper') return true;

    if (detailView === 'front') {
      if (['top_back', 'bottom_back'].includes(id)) return false;
    } else if (detailView === 'back') {
      if (['top_front', 'bottom_front'].includes(id)) return false;
    }
    return true;
  };

  // Asset Card Component
  const AssetCard = ({ id, label, icon: Icon, required = false }: { id: string, label: string, icon: any, required?: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasAsset = !!assets[id];
    const relevant = isAssetRelevant(id);

    if (!relevant) return null; // Don't render at all if not relevant

    return (
      <div
        className={`relative group h-14 w-full transition-all border rounded-xl overflow-hidden flex items-center bg-card
                ${hasAsset ? 'border-violet-500 ring-1 ring-violet-500/20' : 'border-border hover:bg-muted/50'}
                cursor-pointer`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAssetUpload(id, e.target.files[0])}
        />

        <div className="w-14 h-full flex items-center justify-center shrink-0 bg-muted/40 border-r relative">
          {hasAsset ? (
            <img src={assets[id]!} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Icon className="w-5 h-5 opacity-40" />
          )}
        </div>

        <div className="flex-1 px-3 py-1 flex flex-col justify-center min-w-0">
          <span className="text-xs font-medium truncate leading-none mb-1">{label}</span>
          <span className="text-[10px] text-muted-foreground truncate leading-none opacity-80">
            {hasAsset ? (language === "tr" ? "Yüklendi" : "Uploaded") : (language === "tr" ? "Görsel Seç" : "Select Image")}
          </span>
        </div>

        {hasAsset && (
          <div className="pr-2 flex items-center justify-center">
            <button
              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
              onClick={(e) => { e.stopPropagation(); removeAsset(id); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Generate Handler
  const handleGenerate = async (previewMode = false) => {
    if (!productName) {
      toast.error(language === "tr" ? "Ürün adı gerekli" : "Product name required");
      return;
    }

    if (workflowType === 'upper' && !modelImage) {
      toast.error(language === "tr" ? "Üst giyim için model görseli zorunlu!" : "Model image required for upper body!");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          workflowType,
          gender,
          resolution,
          aspectRatio,
          detailView,
          // Lower body options
          tucked: workflowType === 'lower' ? lowerTucked : false,
          // Upper body specific options
          upperTucked: workflowType === 'upper' ? upperTucked : false,
          innerwearTucked: workflowType === 'upper' ? innerwearTucked : true, // Default true
          frontOpen: workflowType === 'upper' ? frontOpen : false,
          innerwearImage: workflowType === 'upper' ? innerwearImage : null,
          modelImage: modelImage,
          uploadedImages: assets,
          preview: previewMode
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }
      const data = await res.json();

      if (previewMode) {
        if (data.previews && data.previews[0]) {
          setPreviewJson(data.previews[0].prompt);
        }
      } else {
        const img = data.images?.[0]?.url || data.image_url;
        if (img) {
          setResultImage(img);
          toast.success(language === "tr" ? "Görsel oluşturuldu!" : "Image generated!");
        } else {
          console.error("No image in data", data);
          toast.error("API returned no image");
        }
      }
    } catch (e: any) {
      console.error("GENERATE ERROR:", e);
      toast.error(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canGenerate = productName && (workflowType !== 'upper' || modelImage);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden bg-background">

      {/* --- LEFT SIDEBAR (SETTINGS) --- */}
      <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background p-4 lg:overflow-y-auto space-y-4 shrink-0 scrollbar-thin scrollbar-thumb-muted-foreground/20">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("sidebar.tryOn")}</h2>
          <p className="text-sm text-muted-foreground">{language === "tr" ? "Teknik detay çekimleri ve close-up görseller." : "Technical detail shots and close-ups."}</p>
        </div>

        <div className="space-y-4 pt-2">
          {/* 1. Product Context */}
          <div className="space-y-3 p-3 border rounded-xl bg-card/50">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Ürün Bilgileri" : "Product Info"}</label>

            <Select value={workflowType} onValueChange={(v) => setWorkflowType(v as any)}>
              <SelectTrigger className="h-8 text-xs bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">{language === "tr" ? "Üst Giyim" : "Upper Body"}</SelectItem>
                <SelectItem value="lower">{language === "tr" ? "Alt Giyim" : "Lower Body"}</SelectItem>
                <SelectItem value="dress">{language === "tr" ? "Elbise" : "Dress"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Name with auto-analyze indicator */}
            <div className="relative">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={language === "tr" ? "Ürün Adı (otomatik algılanır)" : "Product Name (auto-detected)"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-8"
              />
              {isAnalyzing && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                </div>
              )}
            </div>

            {/* Gender Selection */}
            <div className="flex bg-muted/30 p-1 rounded-lg">
              <button
                onClick={() => setGender('female')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${gender === 'female' ? 'bg-background shadow-sm text-violet-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === "tr" ? "Kadın" : "Female"}
              </button>
              <button
                onClick={() => setGender('male')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${gender === 'male' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === "tr" ? "Erkek" : "Male"}
              </button>
            </div>
          </div>

          {/* ===== UPPER BODY SPECIFIC OPTIONS ===== */}
          {workflowType === 'upper' && (
            <>
              {/* MODEL IMAGE - Required */}
              <div className="space-y-2 p-3 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50/50 dark:bg-orange-950/20">
                <label className="text-[10px] uppercase font-bold text-orange-600 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {language === "tr" ? "Model Görseli (Zorunlu)" : "Model Image (Required)"}
                </label>

                {modelImage ? (
                  <div className="relative h-32 rounded-lg overflow-hidden border bg-card">
                    <img src={modelImage} className="w-full h-full object-contain" />
                    <button
                      onClick={() => setModelImage(null)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100/50 transition-colors">
                    <User className="w-6 h-6 text-orange-400 mb-1" />
                    <span className="text-xs text-orange-600">{language === "tr" ? "Model görseli yükle" : "Upload model image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleModelUpload(e.target.files[0])}
                    />
                  </label>
                )}
              </div>

              {/* INNERWEAR - Optional */}
              <div className="space-y-2 p-3 border rounded-xl bg-blue-50/50 dark:bg-blue-950/20">
                <label className="text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1">
                  <Shirt className="w-3 h-3" />
                  {language === "tr" ? "İç Giyim (Opsiyonel)" : "Innerwear (Optional)"}
                </label>
                <p className="text-[10px] text-blue-600/70 -mt-1">
                  {language === "tr" ? "Atlet, tişört vb. - asıl ürünün altında görünür" : "Undershirt, t-shirt etc. - shown under main product"}
                </p>

                {innerwearImage ? (
                  <div className="relative h-24 rounded-lg overflow-hidden border bg-card">
                    <img src={innerwearImage} className="w-full h-full object-contain" />
                    <button
                      onClick={() => setInnerwearImage(null)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100/50 transition-colors">
                    <Shirt className="w-5 h-5 text-blue-400 mb-1" />
                    <span className="text-[10px] text-blue-600">{language === "tr" ? "İç giyim görseli yükle" : "Upload innerwear"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleInnerwearUpload(e.target.files[0])}
                    />
                  </label>
                )}
              </div>

              {/* UPPER BODY OPTIONS */}
              <div className="space-y-3 p-3 border rounded-xl bg-card/50">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Üst Giyim Seçenekleri" : "Upper Body Options"}</label>

                {/* Front Open/Closed Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{language === "tr" ? "Ürün Önü" : "Front"}</span>
                  <div className="flex bg-muted/30 p-0.5 rounded-lg">
                    <button
                      onClick={() => setFrontOpen(false)}
                      className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${!frontOpen ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {language === "tr" ? "Kapalı" : "Closed"}
                    </button>
                    <button
                      onClick={() => setFrontOpen(true)}
                      className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${frontOpen ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {language === "tr" ? "Açık" : "Open"}
                    </button>
                  </div>
                </div>
                {frontOpen && (
                  <p className="text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-2 py-1 rounded">
                    {language === "tr" ? "💡 İç giyim görsel eklerseniz açık önün altında görünecek" : "💡 If you add innerwear image, it will show under open front"}
                  </p>
                )}

                {/* Upper Garment Tucked In/Out Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">{language === "tr" ? "Üst Ürün" : "Upper Garment"}</span>
                  <div className="flex bg-muted/30 p-0.5 rounded-lg">
                    <button
                      onClick={() => setUpperTucked(false)}
                      className={`px-3 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${!upperTucked ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ChevronDown className="w-3 h-3" />
                      {language === "tr" ? "Dışarıda" : "Outside"}
                    </button>
                    <button
                      onClick={() => setUpperTucked(true)}
                      className={`px-3 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${upperTucked ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ChevronUp className="w-3 h-3" />
                      {language === "tr" ? "İçeride" : "Tucked In"}
                    </button>
                  </div>
                </div>

                {/* Innerwear Tucked In/Out Toggle - Only show if innerwear is uploaded */}
                {innerwearImage && (
                  <div className="flex items-center justify-between pt-1 border-t border-dashed">
                    <span className="text-xs text-blue-600">{language === "tr" ? "İç Giyim" : "Innerwear"}</span>
                    <div className="flex bg-blue-50 dark:bg-blue-950/30 p-0.5 rounded-lg">
                      <button
                        onClick={() => setInnerwearTucked(false)}
                        className={`px-3 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${!innerwearTucked ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
                      >
                        <ChevronDown className="w-3 h-3" />
                        {language === "tr" ? "Dışarıda" : "Outside"}
                      </button>
                      <button
                        onClick={() => setInnerwearTucked(true)}
                        className={`px-3 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${innerwearTucked ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
                      >
                        <ChevronUp className="w-3 h-3" />
                        {language === "tr" ? "İçeride" : "Tucked In"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary hint */}
                <div className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-1.5 rounded space-y-0.5">
                  <div>🔹 {language === "tr" ? "Üst ürün" : "Upper"}: {upperTucked ? (language === "tr" ? "pantolonun içinde" : "tucked in") : (language === "tr" ? "pantolonun dışında" : "outside")}</div>
                  {innerwearImage && (
                    <div>🔸 {language === "tr" ? "İç giyim" : "Innerwear"}: {innerwearTucked ? (language === "tr" ? "pantolonun içinde" : "tucked in") : (language === "tr" ? "pantolonun dışında" : "outside")}</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===== LOWER BODY SPECIFIC OPTIONS ===== */}
          {workflowType === 'lower' && (
            <div className="flex items-center justify-between p-3 border rounded-xl bg-card/50">
              <span className="text-xs">{language === "tr" ? "Üst İç Giyim Pantolonun İçinde" : "Undershirt Tucked In"}</span>
              <button
                onClick={() => setLowerTucked(!lowerTucked)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${lowerTucked
                  ? 'bg-violet-50 border-violet-200 text-violet-700'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
              >
                <ScanLine className={`w-3.5 h-3.5 ${lowerTucked ? 'fill-current' : ''}`} />
                {lowerTucked ? (language === "tr" ? "Evet" : "Yes") : (language === "tr" ? "Hayır" : "No")}
              </button>
            </div>
          )}

          {/* 2. Resolution & Ratio */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Çözünürlük" : "Resolution"}</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.map(opt => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">{language === "tr" ? opt.labelTr : opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "En/Boy Oranı" : "Aspect Ratio"}</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(opt => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">{language === "tr" ? opt.labelTr : opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. View Angle Selector */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Çekim Açısı" : "Shot Angle"}</label>
            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-lg">
              <button
                onClick={() => setDetailView('front')}
                className={`text-[10px] px-2 py-1.5 rounded transition-all ${detailView === 'front' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === "tr" ? "Ön Detay" : "Front"}
              </button>
              <button
                onClick={() => setDetailView('angled')}
                className={`text-[10px] px-2 py-1.5 rounded transition-all ${detailView === 'angled' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === "tr" ? "Yan (Açılı)" : "Angled"}
              </button>
              <button
                onClick={() => setDetailView('back')}
                className={`text-[10px] px-2 py-1.5 rounded transition-all ${detailView === 'back' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === "tr" ? "Arka Detay" : "Back"}
              </button>
            </div>
          </div>

          <Separator />

          {/* 4. Assets List */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Görsel Materyaller" : "Visual Assets"}</label>
            <div className="space-y-2">
              <AssetCard id="background" label={language === "tr" ? "Arka Plan" : "Background"} icon={Maximize2} />

              <div className="grid grid-cols-2 gap-2">
                <AssetCard id="top_front" label={language === "tr" ? "Üst-Ön" : "Top Front"} icon={Shirt} />
                <AssetCard id="bottom_front" label={language === "tr" ? "Alt-Ön" : "Bottom Front"} icon={Shirt} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <AssetCard id="top_back" label={language === "tr" ? "Üst-Arka" : "Top Back"} icon={Shirt} />
                <AssetCard id="bottom_back" label={language === "tr" ? "Alt-Arka" : "Bottom Back"} icon={Shirt} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <AssetCard id="detail_1" label="Detay 1" icon={ScanLine} />
                <AssetCard id="detail_2" label="Detay 2" icon={Scissors} />
                <AssetCard id="detail_3" label="Detay 3" icon={Ruler} />
              </div>

              {/* Shoes - Only show for non-upper workflows */}
              {workflowType !== 'upper' && (
                <div className="grid grid-cols-2 gap-2">
                  <AssetCard id="shoes" label={language === "tr" ? "Ayakkabı" : "Shoes"} icon={Footprints} />
                  <AssetCard id="accessories" label={language === "tr" ? "Aksesuar" : "Accessories"} icon={Gem} />
                </div>
              )}

              {workflowType === 'upper' && (
                <AssetCard id="accessories" label={language === "tr" ? "Aksesuar" : "Accessories"} icon={Gem} />
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleGenerate(true)}
              disabled={isProcessing || !canGenerate}
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
              {language === "tr" ? "JSON Önizle" : "Preview JSON"}
            </Button>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => handleGenerate(false)}
              disabled={isProcessing || !canGenerate}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
              {language === "tr" ? "Detay Oluştur" : "Generate Detail"}
              <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                {estimatedCost} {language === "tr" ? "Kr" : "Cr"}
              </span>
            </Button>

            {workflowType === 'upper' && !modelImage && (
              <p className="text-xs text-orange-600 text-center">
                {language === "tr" ? "⚠️ Üst giyim için model görseli yükleyin" : "⚠️ Upload model image for upper body"}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* --- RIGHT AREA (PREVIEW) --- */}
      <div className="flex-1 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-center p-4 md:p-8 relative min-h-[400px]">
        {resultImage ? (
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src={resultImage}
              className="max-h-[calc(100vh-100px)] max-w-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-500 object-contain border bg-white"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" onClick={() => window.open(resultImage, '_blank')}>{language === "tr" ? "İndir" : "Download"}</Button>
              <Button variant="ghost" size="icon" onClick={() => setResultImage(null)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center gap-4 max-w-sm">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center border-2 border-dashed">
              <Camera className="w-10 h-10 opacity-30" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{language === "tr" ? "Detay Çekimi Başlatın" : "Start Detail Photoshoot"}</h3>
              <p className="text-sm mt-1">{language === "tr" ? "Sol menüden ayarları yapın ve oluştur butonuna basın." : "Configure settings on the left and click generate."}</p>
            </div>
          </div>
        )}
      </div>

      {/* JSON PREVIEW DIALOG */}
      <Dialog open={!!previewJson} onOpenChange={(o) => !o && setPreviewJson(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>JSON Preview</DialogTitle>
            <DialogDescription>
              {language === "tr" ? "Yapay zekaya gönderilecek prompt yapısı." : "The prompt structure sent to AI."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted p-4 rounded-lg font-mono text-xs">
            <pre className="whitespace-pre-wrap break-all">{previewJson}</pre>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
