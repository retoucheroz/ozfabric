"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Upload, Loader2, Trash2, Camera, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
    Image as ImageIcon, Sparkles, X, FileText, Globe, CheckCircle2, AlertCircle,
    Maximize2, Zap, Layers, Pencil, PlusCircle, Plus, Settings2, Info, Download,
    Maximize, Sliders, Monitor, Command, Compass, Search, Check
} from "lucide-react"
import {
    TbCamera,
    TbMaximize,
    TbGlobe,
    TbAspectRatio,
    TbSettings2,
    TbAdjustmentsHorizontal,
    TbPhoto,
    TbUserCircle,
    TbSignature
} from "react-icons/tb"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { downloadImage, resizeImageToThumbnail, optimizeImageForApi, cn } from "@/lib/utils"
import { CAMERAS, LOCATIONS, type CameraSpec, type LensSpec, type EditorialLocation } from "@/lib/editorial-data"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { SERVICE_COSTS } from "@/lib/pricingConstants";
import { Input } from "@/components/ui/input"
import { dbOperations, STORES } from "@/lib/db"
import { SavedModel, MODEL_PRESETS } from "@/lib/photoshoot-shared"
import { ModelSection } from "@/components/photoshoot/ModelSection"
import { AssetCard } from "@/components/photoshoot/AssetCard"
import { WizardProgress } from "@/components/photoshoot/WizardProgress"
import { EditorialLibraryModal } from "@/components/photoshoot/EditorialLibraryModal"
import { User } from "lucide-react"

function DrumColumn({ items, activeIndex, onChange, render }: { items: any[], activeIndex: number, onChange: (idx: number) => void, render: (item: any, active: boolean) => React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const itemHeight = 110;

    // Auto-select on scroll stop
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let timeout: any;
        const handleScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const index = Math.round(el.scrollTop / itemHeight);
                if (index >= 0 && index < items.length && index !== activeIndex) {
                    onChange(index);
                }
            }, 150);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [items, activeIndex, onChange]);

    // Programmatic scroll synchronization - strictly for external index changes
    useEffect(() => {
        if (scrollRef.current && !isDragging) {
            const targetScroll = activeIndex * itemHeight;
            const currentScroll = scrollRef.current.scrollTop;
            if (Math.abs(currentScroll - targetScroll) > 10) {
                scrollRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }
    }, [activeIndex, isDragging]);

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.pageY);
        setScrollTop(scrollRef.current!.scrollTop);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const y = e.pageY;
        const walk = (y - startY) * 1.5;
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollTop - walk;
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="relative h-full flex flex-col border-l border-white/[0.03] first:border-l-0 z-50 overflow-hidden">
            <div
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative h-full overflow-y-auto overflow-x-hidden scrollbar-none snap-y snap-mandatory py-[50px] touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => {
                            if (!isDragging) onChange(idx);
                        }}
                        className={`h-[110px] flex flex-col items-center justify-center snap-center transition-all duration-300
                            ${activeIndex === idx ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale blur-[1px]'}
                        `}
                    >
                        {render(item, activeIndex === idx)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EditorialPage() {
    const { language, t } = useLanguage();
    const { addProject } = useProjects();
    const [isProcessing, setIsProcessing] = useState(false);

    // States
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [modelImageHighRes, setModelImageHighRes] = useState<string | null>(null);
    const [outfitImage, setOutfitImage] = useState<string | null>(null);

    const [resolution, setResolution] = useState("4K");
    const [aspectRatio, setAspectRatio] = useState("3:4");
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [seed, setSeed] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [modelType, setModelType] = useState<'full_body' | 'face_only'>('full_body');

    // Shared assets state
    const [assets, setAssets] = useState<{ [key: string]: string | null }>({ background: null, pose: null, fit_pattern: null });
    const [poseStickman, setPoseStickman] = useState<string | null>(null);
    const [selectedBackgroundPrompt, setSelectedBackgroundPrompt] = useState<string | null>(null);
    const [selectedPosePrompt, setSelectedPosePrompt] = useState<string | null>(null);
    const [activeLibraryAsset, setActiveLibraryAsset] = useState<'model' | 'background' | 'outfit' | 'pose' | null>(null);

    // Camera States
    const [isManualCamera, setIsManualCamera] = useState(false);
    const [activeCameraIndex, setActiveCameraIndex] = useState(0);
    const [activeLensIndex, setActiveLensIndex] = useState(0);
    const [focalLength, setFocalLength] = useState<number>(35);
    const [aperture, setAperture] = useState<string>("f/4");

    const estimatedCost = resolution === "4K"
        ? SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_4K
        : SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_1_2K;

    // Library States
    const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [allLocations, setAllLocations] = useState<EditorialLocation[]>(LOCATIONS);
    const [isAddMode, setIsAddMode] = useState(false);
    const [newLoc, setNewLoc] = useState({
        id: "", // For edit mode
        country: "",
        city: "",
        prompt: "",
        image: "" // This will store the base64 optimized preview
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedAesthetic, setAnalyzedAesthetic] = useState("");
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);

    const handleLibraryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target?.result as string;
                try {
                    const optimized = await resizeImageToThumbnail(base64, 512);
                    setNewLoc(prev => ({ ...prev, image: optimized }));
                } catch (err) {
                    toast.error("Görsel optimize edilemedi");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Load custom locations and models
    useEffect(() => {
        const saved = localStorage.getItem("modeon_custom_locations");
        if (saved) {
            try {
                const custom = JSON.parse(saved);
                setAllLocations([...LOCATIONS, ...custom]);
            } catch (e) {
                console.error("Failed to load custom locations", e);
            }
        }

        // Load saved models from DB
        dbOperations.getAll(STORES.MODELS).then(models => {
            if (models) {
                setSavedModels((models as SavedModel[]).sort((a, b) => b.createdAt - a.createdAt));
            }
        });
    }, []);

    // Save or Update custom locations
    const saveCustomLocation = (location: any) => {
        const custom = JSON.parse(localStorage.getItem("modeon_custom_locations") || "[]");

        if (location.id) {
            // EDIT MODE
            const updated = custom.map((country: any) => ({
                ...country,
                cities: country.cities.map((city: any) => ({
                    ...city,
                    images: city.images.map((img: any) => {
                        if (img.id === location.id) {
                            return { ...img, url: location.image, prompt: location.prompt };
                        }
                        return img;
                    })
                }))
            }));
            localStorage.setItem("modeon_custom_locations", JSON.stringify(updated));
            setAllLocations([...LOCATIONS, ...updated]);
            toast.success(language === "tr" ? "Lokasyon güncellendi!" : "Location updated!");
        } else {
            // NEW MODE
            let countryObj = custom.find((c: any) => c.name === location.country || c.nameTr === location.country);

            if (!countryObj) {
                countryObj = {
                    id: `custom-${Date.now()}`,
                    name: location.country,
                    nameTr: location.country,
                    cities: []
                };
                custom.push(countryObj);
            }

            let cityObj = countryObj.cities.find((c: any) => c.name === location.city || c.nameTr === location.city);
            if (!cityObj) {
                cityObj = {
                    id: `city-${Date.now()}`,
                    name: location.city,
                    nameTr: location.city,
                    images: []
                };
                countryObj.cities.push(cityObj);
            }

            cityObj.images.push({
                id: `img-${Date.now()}`,
                url: location.image,
                prompt: location.prompt
            });

            localStorage.setItem("modeon_custom_locations", JSON.stringify(custom));
            setAllLocations([...LOCATIONS, ...custom]);
            toast.success(language === "tr" ? "Lokasyon eklendi!" : "Location added!");
        }

        setIsAddMode(false);
        setNewLoc({ id: "", country: "", city: "", prompt: "", image: "" });
    };

    // Result
    const [resultImages, setResultImages] = useState<string[]>([]);

    const activeCamera = CAMERAS[activeCameraIndex];
    const activeLens = activeCamera.lenses[activeLensIndex];

    const canMoveToStep = (targetStep: number) => {
        if (targetStep <= wizardStep) return true;

        if (targetStep >= 2) {
            if (!modelImage) {
                toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin" : "Please upload a model image");
                return false;
            }
            if (modelType === 'face_only' && !outfitImage) {
                toast.error(language === "tr" ? "Yüz seçeneği için bir kombin görseli yüklemelisiniz" : "You must upload an outfit image for face-only option");
                return false;
            }
        }

        if (targetStep >= 3) {
            if (!assets.background && !selectedBackgroundPrompt) {
                toast.error(language === "tr" ? "Lütfen bir arka plan seçin" : "Please select a background");
                return false;
            }
        }

        return true;
    };

    // Handle Initial "Generate" Click - Triggers Analysis
    const handleGenerate = async () => {
        if (!modelImage) {
            toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin" : "Please upload a model image");
            return;
        }
        if (!assets.background && !selectedBackgroundPrompt) {
            toast.error(language === "tr" ? "Lütfen kütüphaneden bir arka plan seçin" : "Please select a background from library");
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch("/api/editorial/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    camera: isManualCamera ? activeCamera?.name : "Auto",
                    lens: isManualCamera ? activeLens?.name : "Auto",
                    focalLength: isManualCamera ? focalLength : "Auto",
                    aperture: isManualCamera ? aperture : "Auto",
                    locationPrompt: selectedBackgroundPrompt || "",
                    backgroundImage: assets.background,
                    poseStickman: poseStickman,
                    posePrompt: selectedPosePrompt,
                    outfitImage: outfitImage,
                    modelType,
                    language
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Analysis failed");
            }
            const data = await response.json();
            setAnalyzedAesthetic(data.analysis);
            setShowApprovalDialog(true);
            toast.success(language === "tr" ? "Analiz tamamlandı (-20 Kredi)" : "Analysis complete (-20 Credits)");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || (language === "tr" ? "Analiz sırasında bir hata oluştu" : "Error during analysis"));
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Final Execution after Approval
    const executeGeneration = async () => {
        setShowApprovalDialog(false);
        setIsProcessing(true);
        try {
            const response = await fetch("/api/editorial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: modelImageHighRes || modelImage,
                    outfitImage: outfitImage,
                    backgroundImage: assets.background,
                    backgroundPrompt: selectedBackgroundPrompt,
                    poseStickman: poseStickman,
                    posePrompt: selectedPosePrompt,
                    camera: isManualCamera ? activeCamera.name : "Auto",
                    lens: isManualCamera ? activeLens.name : "Auto",
                    focalLength: isManualCamera ? focalLength : "Auto",
                    aperture: isManualCamera ? aperture : "Auto",
                    resolution,
                    aspectRatio,
                    modelType,
                    prompt: analyzedAesthetic, // Use the structured prompt from analyze
                    seed: seed || null
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Editorial API Error Details:", errorData);
                throw new Error(`Generation failed: ${errorData}`);
            }

            const data = await response.json();
            setResultImages(data.images);

            // Auto-save project
            data.images.forEach((img: string) => {
                addProject({
                    title: `Editorial - ${activeCamera.name} - ${new Date().toLocaleTimeString()}`,
                    type: "Editorial",
                    imageUrl: img,
                    description: `Prompt: ${data.prompt} | Seed: ${data.seed}`
                });
            });

            toast.success(language === "tr" ? "Görsel oluşturuldu!" : "Image generated!");
        } catch (error) {
            console.error(error);
            toast.error(language === "tr" ? "Bir hata oluştu" : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssetUpload = async (id: string, file: File) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;

            if (id === 'model') {
                try {
                    // Generate High-Res (3000px) for API
                    const highRes = await optimizeImageForApi(dataUrl, 3000, 0.90);
                    setModelImageHighRes(highRes);

                    // Generate Display Thumbnail (512px) for UI
                    const displayThumb = await resizeImageToThumbnail(dataUrl, 512);
                    setModelImage(displayThumb);
                } catch (err) {
                    console.error("Image optimization failed", err);
                    setModelImage(dataUrl);
                    setModelImageHighRes(dataUrl);
                }
            } else if (id === 'outfit') {
                try {
                    const optimizedOutfit = await optimizeImageForApi(dataUrl, 3000, 0.90);
                    setOutfitImage(optimizedOutfit);
                } catch (err) {
                    console.error("Outfit image optimization failed", err);
                    setOutfitImage(dataUrl);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAssetRemove = (id: string) => {
        if (id === 'model') {
            setModelImage(null);
            setModelImageHighRes(null);
        }
        if (id === 'outfit') setOutfitImage(null);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--bg-sidebar)] overflow-hidden relative">


            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className={cn(
                        "p-4 md:p-6 mx-auto space-y-4 transition-all duration-500 flex-1 w-full",
                        wizardStep === 1 ? "max-w-[1200px]" : wizardStep === 3 ? "max-w-6xl" : "max-w-4xl"
                    )}>
                        {/* Progress */}
                        <div>
                            <WizardProgress currentStep={wizardStep} onStepClick={(s) => { if (canMoveToStep(s)) setWizardStep(s as any); }} language={language} />
                        </div>

                        {/* Page Title */}
                        <div className="text-center -mt-2 mb-2">
                            <h1 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">📸 {language === "tr" ? "EDİTORYAL" : "EDITORIAL"}</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-0.5">{language === "tr" ? "YARATICI EDİTORYAL ÇEKİMLER" : "CREATIVE EDITORIAL SHOOTS"}</p>
                        </div>

                        {/* ===== STEP 1: MODEL & ASSETS ===== */}
                        {wizardStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                                    {/* Left: Asset Cards */}
                                    <div className="lg:col-span-3 flex flex-col">
                                        <div className="flex items-center gap-3 mb-2 px-1">
                                            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 shadow-sm"><TbUserCircle className="w-5 h-5" /></div>
                                            <div className="flex flex-col">
                                                <label className="text-xs uppercase font-black text-foreground tracking-[0.2em]">{language === "tr" ? "MODEL SEÇİMİ" : "MODEL SELECTION"}</label>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{language === "tr" ? "ÜRETİM İÇİN MODEL BELİRLE" : "DEFINE MODEL FOR PRODUCTION"}</span>
                                            </div>
                                        </div>

                                        {/* Model Type Toggle */}
                                        <div className="mb-4 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl flex">
                                            <button
                                                onClick={() => setModelType('full_body')}
                                                className={cn(
                                                    "flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                    modelType === 'full_body' ? "bg-white dark:bg-white/10 shadow-sm text-violet-500" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {language === "tr" ? "KOMBİN DAHİL" : "OUTFIT INCLUDED"}
                                            </button>
                                            <button
                                                onClick={() => setModelType('face_only')}
                                                className={cn(
                                                    "flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                    modelType === 'face_only' ? "bg-white dark:bg-white/10 shadow-sm text-violet-500" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {language === "tr" ? "SADECE YÜZ / YENİ KOMBİN" : "FACE ONLY / NEW OUTFIT"}
                                            </button>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4">
                                            <AssetCard
                                                id="model"
                                                label={language === "tr" ? "MODEL" : "MODEL"}
                                                icon={TbUserCircle}
                                                required
                                                assets={{ model: modelImage, outfit: outfitImage }}
                                                activeLibraryAsset={activeLibraryAsset}
                                                setActiveLibraryAsset={(val) => setActiveLibraryAsset(val as any)}
                                                handleAssetUpload={handleAssetUpload}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                                orientation="vertical"
                                                description={modelType === 'full_body' ? (language === "tr" ? "KOMBİNLİ BOY FOTOĞRAFI" : "FULL BODY WITH OUTFIT") : (language === "tr" ? "SADECE YÜZ FOTOĞRAFI" : "FACE ONLY IMAGE")}
                                            />
                                            <AssetCard
                                                id="outfit"
                                                label={language === "tr" ? "KOMBİN" : "OUTFIT"}
                                                icon={Layers}
                                                required={modelType === 'face_only'}
                                                assets={{ model: modelImage, outfit: outfitImage }}
                                                activeLibraryAsset={null}
                                                setActiveLibraryAsset={() => { }}
                                                handleAssetUpload={handleAssetUpload}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                                description={modelType === 'full_body' ? (language === "tr" ? "(OPSİYONEL)" : "(OPTIONAL)") : (language === "tr" ? "(ZORUNLU)" : "(REQUIRED)")}
                                                hideLibrary
                                            />
                                        </div>

                                        {/* Info Alert */}
                                        <div className={cn(
                                            "mt-auto p-3 rounded-2xl border flex gap-3 transition-colors",
                                            modelType === 'face_only' && !outfitImage
                                                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                                                : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400"
                                        )}>
                                            <Info size={16} className="shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold leading-relaxed uppercase tracking-tight">
                                                {modelType === 'face_only'
                                                    ? (language === "tr" ? "SADECE YÜZ SEÇTİNİZ. ÜRETİM İÇİN KOMBİN KARTINA BİR KIYAFET YÜKLEMELİSİNİZ." : "FACE ONLY SELECTED. YOU MUST UPLOAD A GARMENT TO THE OUTFIT CARD.")
                                                    : (language === "tr" ? "KOMBİNLİ GÖRSEL SEÇTİNİZ. MODEL ÜZERİNDEKİ KIYAFET KORUNACAKTIR." : "OUTFIT INCLUDED SELECTED. THE CLOTHING ON THE MODEL WILL BE PRESERVED.")
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Tutorial */}
                                    <div className="lg:col-span-8 hidden lg:flex flex-col">
                                        <div className="w-full h-full flex flex-col items-center justify-center pt-10 pb-[51px] px-6 text-center relative overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl">
                                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,currentColor_20px,currentColor_21px)]" />
                                            </div>
                                            <div className="z-10 w-full max-w-4xl space-y-4">
                                                <div className="relative aspect-[16/7] flex items-center justify-center">
                                                    <img src="/editorial_tutorial.webp" className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.25)]" alt="Tutorial" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                                                </div>
                                                <div className="grid grid-cols-3 gap-6 text-left border-t border-border/50 pt-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold italic">1</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{language === "tr" ? "VARLIK YÜKLEME" : "ASSET UPLOAD"}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                            {language === "tr"
                                                                ? "Model görselinizi yükleyin ve çekim modunu (Kombinli veya Sadece Yüz) belirleyerek süreci başlatın."
                                                                : "Upload your model and choose the shoot mode (Outfit Included or Face Only) to start."}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2 border-x border-zinc-200 dark:border-white/5 px-8">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold italic">2</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{language === "tr" ? "EDİTORYAL KURGU" : "EDITORIAL CURATION"}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                            {language === "tr"
                                                                ? "Dünya çapındaki ikonik lokasyonlardan birini seçin ve sanal kamera ayarlarıyla çekim atmosferini kurgulayın."
                                                                : "Choose from iconic global locations and set the atmosphere with virtual camera controls."}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold italic">3</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{language === "tr" ? "PROFESYONEL ÜRETİM" : "PRODUCTION"}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                            {language === "tr"
                                                                ? "Gemini 2.0 destekli analiz ile yüksek moda standartlarında, gerçekçi ve estetik editoryal kareler üretin."
                                                                : "Generate high-fashion, realistic editorial shots with Gemini 2.0 powered scene analysis."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 1 Footer */}
                                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-white/5">
                                    <Button onClick={() => canMoveToStep(2) && setWizardStep(2)} className="px-10 py-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02]">
                                        {language === "tr" ? "İLERLE" : "NEXT"} <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ===== STEP 2: STUDIO SETTINGS ===== */}
                        {wizardStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left: Background & Pose */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <div className="flex items-center gap-3 mb-2 px-1">
                                            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 shadow-sm"><TbGlobe className="w-5 h-5" /></div>
                                            <div className="flex flex-col">
                                                <label className="text-xs uppercase font-black text-foreground tracking-[0.2em]">{language === "tr" ? "KÜTÜPHANE ÖĞELERİ" : "LIBRARY ASSETS"}</label>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{language === "tr" ? "ARKAPLAN VE POZ SEÇİN" : "CHOOSE BACKGROUND & POSE"}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 h-[400px]">
                                            <AssetCard
                                                id="background"
                                                label={language === "tr" ? "ARKAPLAN" : "BACKGROUND"}
                                                icon={ImageIcon}
                                                assets={assets}
                                                activeLibraryAsset={activeLibraryAsset}
                                                setActiveLibraryAsset={setActiveLibraryAsset as any}
                                                handleAssetUpload={(id, file) => handleAssetUpload(id, file)}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                            />
                                            <AssetCard
                                                id="pose"
                                                label={language === "tr" ? "POZ" : "POSE"}
                                                icon={User}
                                                assets={{ ...assets, pose: poseStickman || assets.pose }}
                                                activeLibraryAsset={activeLibraryAsset}
                                                setActiveLibraryAsset={setActiveLibraryAsset as any}
                                                handleAssetUpload={(id, file) => handleAssetUpload(id, file)}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                            />
                                        </div>

                                        {/* Aspect Ratio */}
                                        <section className="space-y-3 pt-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2"><TbAspectRatio className="w-4 h-4 text-violet-500" />{language === "tr" ? "GÖRÜNTÜ ORANI" : "ASPECT RATIO"}</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "21:9"].map((ratio) => (
                                                    <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`h-10 rounded-xl text-[10px] font-bold border transition-all ${aspectRatio === ratio ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'bg-transparent border-zinc-200 dark:border-white/5 hover:border-violet-500/50 text-muted-foreground'}`}>{ratio}</button>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right: Camera Settings */}
                                    <div className="lg:col-span-7 space-y-4">
                                        <div className="flex items-center justify-between gap-3 mb-2 px-1">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 shadow-sm"><TbSettings2 className="w-5 h-5" /></div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs uppercase font-black text-foreground tracking-[0.2em]">{language === "tr" ? "KAMERA KONTROL" : "CAMERA CONTROL"}</label>
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">{language === "tr" ? "PROFESYONEL KAMERA AYARLARI" : "PROFESSIONAL CAMERA SETTINGS"}</span>
                                                </div>
                                            </div>

                                            {/* Camera Mode Toggle */}
                                            <div className="bg-zinc-100 dark:bg-white/5 p-1 rounded-xl flex">
                                                <button
                                                    onClick={() => setIsManualCamera(false)}
                                                    className={cn(
                                                        "px-4 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                        !isManualCamera ? "bg-white dark:bg-white/10 shadow-sm text-violet-500" : "text-muted-foreground"
                                                    )}
                                                >
                                                    AUTO
                                                </button>
                                                <button
                                                    onClick={() => setIsManualCamera(true)}
                                                    className={cn(
                                                        "px-4 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                        isManualCamera ? "bg-white dark:bg-white/10 shadow-sm text-violet-500" : "text-muted-foreground"
                                                    )}
                                                >
                                                    MANUAL
                                                </button>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "relative transition-all duration-500",
                                            !isManualCamera ? "opacity-40 grayscale pointer-events-none scale-[0.98]" : "opacity-100"
                                        )}>
                                            <div className="relative h-[210px] bg-muted/40 dark:bg-background rounded-[30px] border border-border dark:border-white/5 overflow-hidden shadow-inner">
                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[110px] bg-white/[0.03] border-y border-white/10 z-10 pointer-events-none" />
                                                <div className="grid grid-cols-4 h-full relative z-40">
                                                    <DrumColumn items={CAMERAS} activeIndex={activeCameraIndex} onChange={(idx) => { setActiveCameraIndex(idx); setActiveLensIndex(0); }} render={(cam, active) => (
                                                        <div className="flex flex-col items-center justify-center p-2">
                                                            <img src={cam.image} className={`transition-all ${active ? 'w-12 h-9' : 'w-8 h-6 opacity-30'}`} alt={cam.name} />
                                                            <span className={`mt-2 text-[7px] font-bold uppercase ${active ? 'text-white' : 'text-white/20'}`}>{cam.name.split(' ')[0]}</span>
                                                        </div>
                                                    )} />
                                                    <DrumColumn items={activeCamera.lenses} activeIndex={activeLensIndex} onChange={setActiveLensIndex} render={(lens, active) => (
                                                        <div className="flex flex-col items-center justify-center p-2">
                                                            <img src={lens.image} className={`transition-all ${active ? 'w-10 h-10' : 'w-7 h-7 opacity-30'}`} alt={lens.name} />
                                                            <span className={`mt-2 text-[7px] font-bold uppercase text-center line-clamp-1 ${active ? 'text-white' : 'text-white/20'}`}>{lens.name.split(' ')[0]}</span>
                                                        </div>
                                                    )} />
                                                    <DrumColumn items={[14, 24, 35, 50, 85, 100]} activeIndex={[14, 24, 35, 50, 85, 100].indexOf(focalLength)} onChange={(idx) => setFocalLength([14, 24, 35, 50, 85, 100][idx])} render={(f, active) => (
                                                        <span className={`font-black font-mono tracking-tighter transition-all ${active ? 'text-2xl text-white' : 'text-lg text-white/20'}`}>{f}</span>
                                                    )} />
                                                    <DrumColumn items={["f/2", "f/4", "f/11"]} activeIndex={["f/2", "f/4", "f/11"].indexOf(aperture)} onChange={(idx) => setAperture(["f/2", "f/4", "f/11"][idx])} render={(f, active) => (
                                                        <div className={`w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-all ${active ? 'bg-white/10 scale-110' : 'opacity-20 scale-90'}`}><span className="text-[10px] font-bold text-white">{f}</span></div>
                                                    )} />
                                                </div>
                                            </div>

                                            {!isManualCamera && (
                                                <div className="absolute inset-0 flex items-center justify-center z-50">
                                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">AI OPTIMIZED FOR SCENE</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Resolution */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}</label>
                                                <select className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-[10px] font-black uppercase rounded-xl h-10 px-3 outline-none focus:ring-1 focus:ring-violet-500" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                                    <option value="4K">4K Ultra HD</option>
                                                    <option value="Standard">1.2K Digital</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{language === "tr" ? "MALİYET" : "COST"}</label>
                                                <div className="h-10 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl flex flex-col items-center justify-center text-[8px] font-black text-violet-500">
                                                    <span>ANALİZ: 20 TOKEN</span>
                                                    <span>ÜRETİM: {estimatedCost} TOKEN</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 Footer */}
                                <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
                                    <Button variant="ghost" onClick={() => setWizardStep(1)} className="px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <ChevronLeft size={16} /> {language === "tr" ? "GERİ" : "BACK"}
                                    </Button>
                                    <Button onClick={handleGenerate} disabled={isProcessing} className="px-12 py-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.05] active:scale-95">
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
                                        {language === "tr" ? "ÇEKİMİ BAŞLAT" : "START PRODUCTION"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ===== STEP 3: RESULTS ===== */}
                        {wizardStep === 3 && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                {/* Viewport */}
                                <div className="mx-auto w-full max-w-5xl min-h-[500px] max-h-[800px] rounded-[40px] bg-white dark:bg-background border-4 border-zinc-200 dark:border-card overflow-hidden relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] group/preview ring-1 ring-black/5 dark:ring-white/5">
                                    {/* Camera HUD */}
                                    <div className="absolute inset-0 z-20 pointer-events-none p-6 flex flex-col justify-between opacity-40 group-hover/preview:opacity-100 transition-opacity duration-700">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-[10px] font-mono font-bold tracking-[0.2em] text-background dark:text-white uppercase">REC STUDIO 4K</span></div>
                                                <span className="text-[8px] font-mono text-zinc-500">ISO 100 • {focalLength}mm • {aperture}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-mono font-bold text-background dark:text-white mb-1">RAW • PRORES 422</p>
                                                <div className="w-12 h-0.5 bg-zinc-200 dark:bg-card overflow-hidden rounded-full"><div className="h-full bg-violet-500 w-[60%]" /></div>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <div className="relative w-12 h-12">
                                                <div className="absolute top-0 left-0 w-2 h-0.5 bg-current" /><div className="absolute top-0 left-0 w-0.5 h-2 bg-current" />
                                                <div className="absolute bottom-0 right-0 w-2 h-0.5 bg-current" /><div className="absolute bottom-0 right-0 w-0.5 h-2 bg-current" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-red-500 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col gap-0.5"><span className="text-[8px] text-zinc-500 font-bold">MODE</span><span className="text-[10px] font-mono font-bold text-background dark:text-white">MANUAL</span></div>
                                                <div className="flex flex-col gap-0.5"><span className="text-[8px] text-zinc-500 font-bold">WB</span><span className="text-[10px] font-mono font-bold text-background dark:text-white">AUTO</span></div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-[8px] text-zinc-500 font-bold">BATTERY</span>
                                                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-background dark:text-white">84% <div className="w-5 h-2.5 border border-zinc-200 dark:border-zinc-700 rounded-sm p-[1px]"><div className="w-full h-full bg-green-500/80 rounded-[1px]" /></div></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-background dark:border-white opacity-20" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-background dark:border-white opacity-20" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-background dark:border-white opacity-20" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-background dark:border-white opacity-20" />
                                    </div>

                                    {isProcessing ? (
                                        <div className="absolute inset-0 z-30 bg-white/90 dark:bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                                            <div className="relative"><div className="w-24 h-24 rounded-full border-t-4 border-violet-600 animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Monitor className="w-8 h-8 text-violet-600 animate-pulse" /></div></div>
                                            <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "İŞLENİYOR" : "PROCESSING"}</h3>
                                            <div className="mt-4 flex flex-col items-center gap-2">
                                                <div className="flex gap-1"><div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce" /></div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{activeCamera.name} // {activeLens.name} // {focalLength}MM // {aperture}</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {resultImages.length > 0 ? (
                                        <img src={resultImages[0]} className="w-full h-full object-contain bg-background shadow-inner" alt="Result" />
                                    ) : (
                                        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground opacity-40">
                                            <Monitor className="w-12 h-12 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">{language === "tr" ? "İŞLEM BAŞLADI..." : "PROCESSING STARTED..."}</p>
                                        </div>
                                    )}

                                    {/* Result Info Bar */}
                                    {resultImages.length > 0 && (
                                        <div className="absolute bottom-10 left-10 right-10 p-5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/10 flex items-center justify-between text-white shadow-2xl z-20">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-violet-600 rounded text-[9px] font-bold tracking-widest uppercase">{activeCamera.name}</span>
                                                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">{activeLens.name}</span>
                                                </div>
                                                <div className="text-[10px] font-mono text-white/50">{focalLength}MM • {aperture} • ISO 100 • {resolution}</div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => window.open(resultImages[0], '_blank')} className="h-10 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Maximize size={14} />{language === "tr" ? "TAM BOYUT" : "FULL SIZE"}</button>
                                                <Button
                                                    onClick={() => downloadImage(resultImages[0], `editorial_${Date.now()}.png`)}
                                                    className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95 text-white border-none"
                                                >
                                                    <Download size={14} />{language === "tr" ? "İNDİR" : "DOWNLOAD"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Session Roll */}
                                {resultImages.length > 1 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Monitor size={14} />{language === "tr" ? "OTURUM RULOSU" : "SESSION ROLL"}</label>
                                            <span className="text-[10px] font-bold text-zinc-400">{resultImages.length} {language === "tr" ? "KARE" : "FRAMES"}</span>
                                        </div>
                                        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin">
                                            {resultImages.map((img, idx) => (
                                                <div key={idx} className="group/item relative shrink-0">
                                                    <img src={img} className="h-48 w-36 object-cover rounded-2xl border-2 border-transparent hover:border-violet-500 transition-all cursor-pointer shadow-lg group-hover/item:scale-105" alt="Result" onClick={() => setResultImages([img, ...resultImages.filter(i => i !== img)])} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 Footer */}
                                <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
                                    <Button variant="ghost" onClick={() => setWizardStep(2)} className="px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <ChevronLeft size={16} /> {language === "tr" ? "DÜZENLE" : "EDIT"}
                                    </Button>
                                    <Button onClick={() => { setResultImages([]); setWizardStep(1); }} className="px-10 py-6 rounded-2xl bg-white dark:bg-card border-2 border-border hover:border-violet-500 flex items-center gap-3 transition-all">
                                        <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white"><Plus size={18} /></div>
                                        <span className="text-xs font-black uppercase tracking-tight">{language === "tr" ? "YENİ ÇEKİM" : "NEW SHOOT"}</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Library Drawer for Models */}
                <AnimatePresence>
                    {activeLibraryAsset === 'model' && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setActiveLibraryAsset(null)} />
                            <motion.div key="library-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed right-0 top-0 h-full w-full lg:w-[450px] bg-zinc-50 dark:bg-background flex flex-col shrink-0 relative z-50 shadow-xl">
                                <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-card shrink-0">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setActiveLibraryAsset(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                                        <div>
                                            <h3 className="text-sm font-bold tracking-tight">{language === "tr" ? "Model Kütüphanesi" : "Model Library"}</h3>
                                            <p className="text-[10px] text-violet-500 font-bold uppercase tracking-widest">{language === "tr" ? "STUDYO VARLIKLARI" : "STUDIO ASSETS"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveLibraryAsset(null)} className="text-zinc-400 hover:text-foreground p-2"><X size={18} /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <ModelSection
                                        view="library" language={language} gender={gender} setGender={setGender}
                                        assets={{ model: modelImage }} activeLibraryAsset="model"
                                        setActiveLibraryAsset={() => setActiveLibraryAsset(null)}
                                        handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove}
                                        savedModels={savedModels}
                                        setAssets={(updater: any) => { const newVal = typeof updater === 'function' ? updater({ model: modelImage }).model : updater.model; setModelImage(newVal); }}
                                        setAssetsHighRes={(updater: any) => { const newVal = typeof updater === 'function' ? updater({ model: modelImageHighRes }).model : updater.model; setModelImageHighRes(newVal); }}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* PROMPT APPROVAL DIALOG */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-2xl bg-background border-white/5 text-white overflow-hidden p-0 rounded-[30px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent pointer-events-none" />
                    <DialogHeader className="p-8 pb-0 relative">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-violet-600 rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.4)]"><Sparkles size={20} className="text-white" /></div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter uppercase italic">{language === "tr" ? "ÜRETİM ANALİZİ" : "PRODUCTION ANALYSIS"}</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PRO OPTICS ENGINE</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6 relative">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={14} />{language === "tr" ? "OPTİK KARAKTERİSTİK" : "OPTICAL CHARACTERISTICS"}</label>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-zinc-300 leading-relaxed italic">{analyzedAesthetic}</div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><FileText size={14} />{language === "tr" ? "BİRLEŞTİRİLMİŞ PROMPT" : "COMBINED PROMPT"}</label>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-zinc-400 h-32 overflow-y-auto scrollbar-thin">
                                <div className="space-y-2"><p><span className="text-violet-500">SCENE:</span> {selectedBackgroundPrompt || "Custom"}</p><p><span className="text-violet-500">STYLE:</span> {prompt || "None"}</p><p><span className="text-violet-500">OPTICS:</span> {analyzedAesthetic}</p></div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" className="flex-1 h-12 rounded-2xl border border-white/5 hover:bg-white/5 text-xs font-bold uppercase tracking-widest" onClick={() => setShowApprovalDialog(false)}>{language === "tr" ? "İPTAL" : "CANCEL"}</Button>
                            <Button className="flex-[2] h-12 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]" onClick={() => { setShowApprovalDialog(false); setWizardStep(3); executeGeneration(); }}>{language === "tr" ? "ÜRETİMİ BAŞLAT" : "START PRODUCTION"}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROCESSING OVERLAY */}
            {
                isAnalyzing && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                        <div className="relative"><div className="w-24 h-24 rounded-full border-t-4 border-violet-600 animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Zap className="w-8 h-8 text-violet-600 animate-pulse" /></div></div>
                        <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "TEKNİK ANALİZ" : "TECHNICAL ANALYSIS"}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{activeCamera.name} // {activeLens.name} // {focalLength}MM</p>
                    </div>
                )
            }
        </div >
    );
}
