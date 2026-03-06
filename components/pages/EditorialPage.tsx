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
    Maximize, Sliders, Monitor, Command, Compass, Search, Check, Coins, Video
} from "lucide-react"
import {
    TbGlobe,
    TbAspectRatio,
    TbAdjustmentsHorizontal,
    TbPhoto,
    TbUserCircle,
    TbSignature,
    TbCoins,
    TbRefresh
} from "react-icons/tb"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { downloadImage, resizeImageToThumbnail, optimizeImageForApi, mergeImages, cn } from "@/lib/utils"
import { CAMERAS, LOCATIONS, type CameraSpec, type LensSpec, type EditorialLocation } from "@/lib/editorial-data"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { SERVICE_COSTS } from "@/lib/pricingConstants";
import { Input } from "@/components/ui/input"
import { dbOperations, STORES } from "@/lib/db"
import { SavedModel, MODEL_PRESETS } from "@/lib/photoshoot-shared"
import { ASPECT_RATIOS, RESOLUTION_OPTIONS } from "@/lib/photoshoot-constants"
import { ModelSection } from "@/components/photoshoot/ModelSection"
import { AssetCard } from "@/components/photoshoot/AssetCard"
import { WizardProgress } from "@/components/photoshoot/WizardProgress"
import { EditorialLibraryModal } from "@/components/photoshoot/EditorialLibraryModal"
import { User } from "lucide-react"
import { EditorialLibraryInline } from "@/components/photoshoot/EditorialLibraryInline"
import { EditorialModelLibraryInline } from "@/components/photoshoot/EditorialModelLibraryInline";

const HAIR_STYLES = [
    { id: "original", name: "Orijinal", nameEn: "Original", prompt: "" },
    { id: "slicked_back", name: "Geriye Taranmış", nameEn: "Slicked Back", prompt: "hair slicked back, sleek swept-back hair, polished and tight" },
    { id: "straight_silky", name: "Düz & İpeksi", nameEn: "Straight & Silky", prompt: "straight silky hair, smooth glossy hair, pin-straight" },
    { id: "glamour_waves", name: "Glamour Dalgalar", nameEn: "Glamour Waves", prompt: "glamorous Hollywood waves, soft voluminous curls, old Hollywood style" },
    { id: "messy_bun", name: "Dağınık Topuz + Kahkül", nameEn: "Messy Bun + Bangs", prompt: "messy bun with bangs, loose updo with face-framing bangs, casual bun" },
    { id: "long_layered", name: "Uzun Katmanlı Kahkül", nameEn: "Long Layered + Bangs", prompt: "long layered hair with bangs, layered haircut with curtain bangs" },
    { id: "high_bun", name: "Şık Yüksek Topuz", nameEn: "Elegant High Bun", prompt: "elegant high bun, sleek top knot, polished updo" },
    { id: "voluminous", name: "Hacimli Röfleli", nameEn: "Voluminous Highlighted", prompt: "voluminous highlighted hair, balayage highlights, full-bodied layered hair" },
    { id: "textured_bob", name: "Dokulu Bob", nameEn: "Textured Bob", prompt: "textured bob haircut, choppy bob, edgy bob with layers" },
    { id: "natural_afro", name: "Doğal Afro", nameEn: "Natural Afro", prompt: "natural afro hair, big fluffy afro, coily natural hair" },
    { id: "hijab", name: "Tesettür / Hijab", nameEn: "Hijab", prompt: "wearing hijab, modest headscarf, colorful hijab style" }
];


function EditorialWizardProgress({ currentStep, onStepClick, language }: { currentStep: number, onStepClick: (step: number) => void, language: string }) {
    const steps = [
        { num: 1, labelTr: "MODEL & KOMBİN", labelEn: "MODEL & OUTFIT" },
        { num: 2, labelTr: "SAHNE & ÜRETİM", labelEn: "SCENE & PRODUCTION" },
    ];
    return (
        <div className="w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center min-w-max md:min-w-0 justify-center gap-1.5 mb-4 md:mb-6">
                {steps.map((step, i) => (
                    <div key={step.num} className="flex items-center">
                        <button
                            onClick={() => onStepClick(step.num)}
                            className={`flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md transition-all whitespace-nowrap ${currentStep === step.num
                                ? "bg-white text-black shadow-xl"
                                : currentStep > step.num
                                    ? "bg-white/10 text-zinc-300 border border-white/10 cursor-pointer hover:bg-white/20"
                                    : "bg-zinc-800/20 text-zinc-600 border border-transparent"
                                }`}
                        >
                            <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center text-[9px] md:text-xs font-bold ${currentStep === step.num
                                ? "border-black bg-black/10"
                                : currentStep > step.num
                                    ? "border-zinc-400 bg-zinc-400 text-black border-none"
                                    : "border-zinc-700"
                                }`}>
                                {currentStep > step.num ? "✓" : step.num}
                            </span>
                            <span className={`text-[10px] md:text-xs font-bold tracking-tight ${currentStep === step.num ? "block" : "hidden sm:block"}`}>
                                {language === "tr" ? step.labelTr : step.labelEn}
                            </span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`w-3 md:w-6 h-0.5 mx-0.5 rounded-full transition-colors ${currentStep > step.num
                                ? "bg-zinc-400"
                                : "bg-zinc-800"
                                }`} />
                        )}
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
    const [outfitImages, setOutfitImages] = useState<string[]>([]);

    const [resolution, setResolution] = useState("4K");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    // Compatibility for Ecom style
    const aspect_ratio = aspectRatio;
    const [wizardStep, setWizardStep] = useState<1 | 2>(1);
    const [seed, setSeed] = useState<string>("");
    const [useReferencePose, setUseReferencePose] = useState(false);
    const [prompt, setPrompt] = useState<string>("");
    const [hairStyle, setHairStyle] = useState<string>("original");

    // Shared assets state
    const [assets, setAssets] = useState<{ [key: string]: string | null }>({ background: null, pose: null, fit_pattern: null });
    const [poseStickman, setPoseStickman] = useState<string | null>(null);
    const [selectedBackgroundPrompt, setSelectedBackgroundPrompt] = useState<string | null>(null);
    const [selectedPosePrompt, setSelectedPosePrompt] = useState<string | null>(null);
    const [activeLibraryAsset, setActiveLibraryAsset] = useState<'model' | 'background' | 'outfit' | null>(null);
    const [modelLibraryTab, setModelLibraryTab] = useState<string>("library");
    const [modelDescription, setModelDescription] = useState<string>("");

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
            if (!modelImage && !modelDescription) {
                toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin veya kütüphaneden açıklama yazın" : "Please upload a model image or write a description from library");
                return false;
            }
        }

        return true;
    };

    // Handle Initial "Generate" Click - Triggers Analysis
    const handleGenerate = async () => {
        if (!modelImage && !modelDescription) {
            toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin veya açıklama yazın" : "Please upload a model image or write a description");
            return;
        }
        if (!assets.background && !selectedBackgroundPrompt) {
            toast.error(language === "tr" ? "Lütfen kütüphaneden bir arka plan seçin" : "Please select a background from library");
            return;
        }

        setIsAnalyzing(true);
        try {
            // Optimize images to 720px for analysis to save tokens (Free Tier Quota Protection)
            let analysisModel = modelImageHighRes || modelImage;
            let analysisOutfit: string | null = null;

            if (outfitImages.length > 0) {
                analysisOutfit = await mergeImages(outfitImages, 2048);
            }

            if (analysisModel) analysisModel = await resizeImageToThumbnail(analysisModel, 2048);

            const response = await fetch("/api/editorial/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationPrompt: selectedBackgroundPrompt || "",
                    backgroundImage: assets.background,
                    poseStickman: poseStickman,
                    posePrompt: selectedPosePrompt,
                    outfitImage: analysisOutfit,
                    useReferencePose,
                    modelType: 'full_body',
                    modelDescription,
                    modelImage: analysisModel,
                    resolution,
                    aspectRatio,
                    aspect_ratio: aspectRatio,
                    hairStyle,
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
            let finalOutfit: string | null = null;
            if (outfitImages.length > 0) {
                finalOutfit = await mergeImages(outfitImages, 2048);
            }

            const response = await fetch("/api/editorial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: modelImageHighRes || modelImage,
                    outfitImage: finalOutfit,
                    backgroundImage: assets.background,
                    backgroundPrompt: selectedBackgroundPrompt,
                    poseStickman: poseStickman,
                    posePrompt: selectedPosePrompt,
                    resolution,
                    aspectRatio,
                    aspect_ratio: aspectRatio,
                    modelType: 'full_body',
                    modelDescription,
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
                    description: `Prompt: ${data.prompt} | Seed: ${data.seed}`,
                    mediaType: "image"
                });
            });

            toast.success(language === "tr" ? "Görsel oluşturuldu!" : "Image generated!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || (language === "tr" ? "Bir hata oluştu" : "An error occurred"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssetUpload = async (id: string, file: File | File[]) => {
        const processFile = async (f: File) => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.readAsDataURL(f);
            });
        };

        if (Array.isArray(file)) {
            if (id === 'outfit') {
                try {
                    const newImages = await Promise.all(file.slice(0, 10 - outfitImages.length).map(async f => {
                        const dataUrl = await processFile(f);
                        return await optimizeImageForApi(dataUrl, 2048, 0.90);
                    }));
                    setOutfitImages(prev => [...prev, ...newImages]);
                } catch (err) {
                    console.error("Multi-outfit upload failed", err);
                    toast.error(language === "tr" ? "Görseller yüklenirken hata oluştu" : "Error uploading images");
                }
            }
            return;
        }

        const dataUrl = await processFile(file);
        if (id === 'model') {
            try {
                const highRes = await optimizeImageForApi(dataUrl, 3000, 0.90);
                setModelImageHighRes(highRes);
                const displayThumb = await resizeImageToThumbnail(dataUrl, 512);
                setModelImage(displayThumb);
            } catch (err) {
                setModelImage(dataUrl);
                setModelImageHighRes(dataUrl);
            }
        } else if (id === 'outfit') {
            try {
                const optimized = await optimizeImageForApi(dataUrl, 2048, 0.90);
                setOutfitImages(prev => [...prev, optimized]);
            } catch (err) {
                setOutfitImages(prev => [...prev, dataUrl]);
            }
        } else if (id === 'background') {
            try {
                const optimized = await optimizeImageForApi(dataUrl, 2048, 0.85);
                setAssets(prev => ({ ...prev, background: optimized }));
                setSelectedBackgroundPrompt(null);
            } catch (err) {
                setAssets(prev => ({ ...prev, background: dataUrl }));
            }
        }
    };

    const handleAssetRemove = (id: string, e?: React.MouseEvent, index?: number) => {
        if (e) e.stopPropagation();
        if (id === 'model') {
            setModelImage(null);
            setModelImageHighRes(null);
        }
        if (id === 'outfit') {
            if (typeof index === 'number') {
                setOutfitImages(prev => prev.filter((_, i) => i !== index));
            } else {
                setOutfitImages([]);
            }
        }
        if (id === 'background') {
            setAssets(prev => ({ ...prev, background: null }));
            setSelectedBackgroundPrompt(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F] overflow-hidden relative">


            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1240px] mx-auto px-4 py-4 md:px-8 md:py-4 space-y-4 transition-all duration-500 flex-1 w-full">
                        {/* Progress */}
                        <div>
                            <EditorialWizardProgress currentStep={wizardStep} onStepClick={(s) => { if (canMoveToStep(s)) setWizardStep(s as any); }} language={language} />
                        </div>


                        {/* ===== STEP 1: MODEL & ASSETS ===== */}
                        {wizardStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                                    {/* Left: Asset Cards */}
                                    <div className="lg:col-span-3 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4 px-1">
                                            <div className="p-2.5 rounded-md bg-white/5 text-white border border-white/10 shadow-lg"><Camera className="w-5 h-5" /></div>
                                            <div className="flex flex-col">
                                                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                    {language === "tr" ? "EDİTORYAL" : "EDITORIAL"}
                                                </label>
                                                <span className="text-[11px] font-bold italic text-zinc-400 mt-1">
                                                    {language === "tr"
                                                        ? "Kombininizi yükleyin, moda fotoğrafına dönüştürün."
                                                        : "Upload your outfit, transform it into a fashion photo."}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-4">
                                            <AssetCard
                                                id="model"
                                                label={language === "tr" ? "MODEL" : "MODEL"}
                                                icon={TbUserCircle}
                                                required
                                                assets={{ model: modelImage, outfit: outfitImages }}
                                                activeLibraryAsset={activeLibraryAsset}
                                                setActiveLibraryAsset={(val) => setActiveLibraryAsset(val as any)}
                                                handleAssetUpload={handleAssetUpload}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                                orientation="vertical"
                                                description={language === "tr" ? "MODEL YÜKLEYİN VEYA SEÇİN" : "UPLOAD OR SELECT MODEL"}
                                            />
                                            <AssetCard
                                                id="outfit"
                                                label={language === "tr" ? "KOMBİN" : "OUTFIT"}
                                                icon={Layers}
                                                required={false}
                                                assets={{ model: modelImage, outfit: outfitImages }}
                                                activeLibraryAsset={null}
                                                setActiveLibraryAsset={() => { }}
                                                handleAssetUpload={handleAssetUpload}
                                                handleAssetRemove={handleAssetRemove}
                                                language={language}
                                                variant="portrait"
                                                allowMultiple
                                                description={language === "tr" ? "(OPSİYONEL)" : "(OPTIONAL)"}
                                                hideLibrary
                                            />
                                            <Button
                                                onClick={() => canMoveToStep(2) && setWizardStep(2)}
                                                className="w-full mt-2 h-12 rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[11px] uppercase tracking-[0.18em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 flex items-center justify-center gap-3 group"
                                            >
                                                {language === "tr" ? "İLERLE" : "NEXT"}
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8 hidden lg:grid flex-col relative overflow-hidden grid-cols-1 grid-rows-1 h-[540px] bg-[#18181B] rounded-2xl border border-white/10 shadow-2xl">
                                        <AnimatePresence>
                                            {activeLibraryAsset === 'model' ? (
                                                <motion.div
                                                    key="library-inline-model"
                                                    initial={{ opacity: 0, y: 48, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -48, scale: 0.97 }}
                                                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                                    className="h-full"
                                                    style={{ gridArea: '1 / 1 / 2 / 2' }}
                                                >
                                                    <EditorialModelLibraryInline
                                                        language={language}
                                                        gender={gender}
                                                        setGender={(val) => setGender(val as "male" | "female")}
                                                        modelImage={modelImage}
                                                        modelImageHighRes={modelImageHighRes}
                                                        setModelImage={setModelImage}
                                                        setModelImageHighRes={setModelImageHighRes}
                                                        handleAssetUpload={handleAssetUpload}
                                                        handleAssetRemove={handleAssetRemove}
                                                        savedModels={savedModels}
                                                        modelDescription={modelDescription}
                                                        setModelDescription={setModelDescription}
                                                        onClose={() => setActiveLibraryAsset(null)}
                                                        gridCols={6}
                                                    />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="tutorial-step1"
                                                    initial={{ opacity: 0, y: -48, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 48, scale: 0.97 }}
                                                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                                    className="w-full h-full flex flex-col items-center justify-center pt-10 pb-[51px] px-6 text-center relative overflow-hidden"
                                                    style={{ gridArea: '1 / 1 / 2 / 2' }}
                                                >
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
                                                                    <span className="w-6 h-6 rounded-full bg-[#1F1F23] text-zinc-400 border border-white/10 flex items-center justify-center text-[10px] font-black italic shadow-lg">1</span>
                                                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{language === "tr" ? "MODEL SEÇİMİ" : "MODEL SELECTION"}</span>
                                                                </div>
                                                                <p className="text-[11px] text-[var(--text-primary)] font-bold leading-relaxed">
                                                                    {language === "tr"
                                                                        ? "Model seçiminizi yapın, ya da yeni bir tane üretin."
                                                                        : "Select your model or generate a new one."}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2 border-x border-white/5 px-8">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-[#1F1F23] text-zinc-400 border border-white/10 flex items-center justify-center text-[10px] font-black italic shadow-lg">2</span>
                                                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{language === "tr" ? "KOMBİN SEÇİMİ" : "OUTFIT SELECTION"}</span>
                                                                </div>
                                                                <p className="text-[11px] text-[var(--text-primary)] font-bold leading-relaxed">
                                                                    {language === "tr"
                                                                        ? "İster tek görselden oluşan kombin fotoğrafınızı yükleyin, isterseniz ürün görsellerinizi yükleyin AI robotumuz kombinlesin."
                                                                        : "Select your single-image outfit visual, or upload product images and let our AI robot curate the look."}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-[#1F1F23] text-zinc-400 border border-white/10 flex items-center justify-center text-[10px] font-black italic shadow-lg">3</span>
                                                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{language === "tr" ? "SONUÇ" : "RESULT"}</span>
                                                                </div>
                                                                <p className="text-[11px] text-[var(--text-primary)] font-bold leading-relaxed">
                                                                    {language === "tr"
                                                                        ? "Gelişmiş sahne analizi teknolojisi ile yüksek moda standartlarında, gerçekçi ve estetik editoryal fotoğraflarınızı oluşturun."
                                                                        : "Generate high-fashion, realistic editorial imagery through advanced scene analysis and aesthetic processing."}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>


                            </div>
                        )}

                        {/* ===== STEP 2: STUDIO ROOM (SIDE-BY-SIDE) ===== */}
                        {wizardStep === 2 && (
                            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch h-full">
                                {/* Left Column: Config & Action */}
                                <div className="lg:col-span-3 space-y-4">
                                    {/* 1. Header Information */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                                            <TbGlobe className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                                                {language === "tr" ? "EDİTORYAL" : "EDITORIAL"}
                                            </label>
                                            <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                                                {language === "tr" ? "Dergi kalitesinde moda çekimleri oluşturun." : "Create magazine-quality fashion shots."}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Assets (Background & Library Access) */}
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-4 p-5 bg-[#18181B] border border-white/10 rounded-2xl shadow-sm">
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

                                            <div className="group/pose">
                                                <button
                                                    onClick={() => setUseReferencePose(!useReferencePose)}
                                                    className={cn(
                                                        "w-full p-3 rounded-md border flex items-center justify-between transition-all duration-300",
                                                        useReferencePose ? "bg-white/10 border-white/20" : "bg-[#121214] border-white/10 hover:border-white/25"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 text-left">
                                                        <div className={cn("p-2 rounded-lg", useReferencePose ? "bg-white text-black shadow-lg" : "bg-white/5 text-zinc-500")}>
                                                            <TbUserCircle className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black uppercase tracking-[0.18em] transition-colors mt-0.5">
                                                                {language === "tr" ? "POZ REFERANSI" : "POSE REFERENCE"}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">ANALİZ MODU</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("w-8 h-4.5 rounded-full relative transition-all", useReferencePose ? "bg-white" : "bg-white/10")}>
                                                        <div className={cn("absolute top-1 w-2.5 h-2.5 rounded-full transition-all", useReferencePose ? "right-1 bg-black" : "left-1 bg-zinc-600")} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                                    <TbAspectRatio className="w-4 h-4 text-zinc-500" />
                                                    {language === "tr" ? "ORAN" : "RATIO"}
                                                </label>
                                                <div className="relative">
                                                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-[#121214] rounded-md border border-white/10 text-white text-[13px] font-medium pl-4 pr-10 py-3 focus:border-white/25 focus:outline-none transition-colors duration-150 appearance-none shadow-sm">
                                                        {ASPECT_RATIOS.map(r => (
                                                            <option key={r.id} value={r.id} className="bg-[#121214]">{language === "tr" ? r.labelTr : r.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                                    <Maximize2 className="w-4 h-4 text-zinc-500" />
                                                    {language === "tr" ? "KALİTE" : "QUALITY"}
                                                </label>
                                                <div className="relative">
                                                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full bg-[#121214] rounded-md border border-white/10 text-white text-[13px] font-medium pl-4 pr-10 py-3 focus:border-white/25 focus:outline-none transition-colors duration-150 appearance-none shadow-sm">
                                                        {RESOLUTION_OPTIONS.map(opt => (
                                                            <option key={opt.id} value={opt.id} className="bg-[#121214]">{language === "tr" ? opt.labelTr : opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2">
                                                <TbSignature className="w-4 h-4 text-zinc-500" />
                                                {language === "tr" ? "SAÇ STİLİ" : "HAIR STYLE"}
                                            </label>
                                            <div className="relative">
                                                <select value={hairStyle} onChange={(e) => setHairStyle(e.target.value)} className="w-full bg-[#121214] rounded-md border border-white/10 text-white text-[13px] font-medium pl-4 pr-10 py-3 focus:border-white/25 focus:outline-none transition-colors duration-150 appearance-none shadow-sm">
                                                    {HAIR_STYLES.map(s => (
                                                        <option key={s.id} value={s.id} className="bg-[#121214]">{language === "tr" ? s.name.toUpperCase() : s.nameEn.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none rotate-90" />
                                            </div>
                                        </div>

                                        <Button
                                            variant="default"
                                            disabled={isProcessing || isAnalyzing}
                                            onClick={handleGenerate}
                                            className="w-full h-12 mt-4 bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white rounded-md flex items-center justify-center font-black"
                                        >
                                            {isAnalyzing || isProcessing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                    {language === "tr" ? "İşleniyor..." : "Processing..."}
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center whitespace-nowrap text-white font-black text-[11px] uppercase tracking-[0.18em]">
                                                    <Camera className="w-4 h-4 mr-2 flex-none" />
                                                    <span>{language === "tr" ? "OLUŞTUR" : "GENERATE"}</span>
                                                    <div className="h-4 w-px bg-white/30 mx-3 shrink-0" />
                                                    <div className="flex items-center gap-1.5">
                                                        <TbCoins className="w-4 h-4" />
                                                        <span className="text-[11px] font-black tracking-tighter">
                                                            {estimatedCost + 20}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </Button>
                                    </div>


                                </div>

                                {/* Right Side: Result Section */}
                                <div className="lg:col-span-8 flex flex-col space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 px-1 flex items-center gap-1.5 mb-1.5">
                                        <Sparkles className="w-4 h-4 text-zinc-500" />
                                        {language === 'tr' ? 'SONUÇ' : 'RESULT'}
                                    </label>

                                    <div className="relative flex-1 min-h-[500px] lg:min-h-0 bg-[#121214] border border-dashed border-white/20 overflow-hidden flex items-center justify-center group rounded-2xl shadow-none hover:border-white/40 transition-colors">
                                        {isProcessing ? (
                                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                                <div className="relative">
                                                    <div className="w-24 h-24 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                                                    <div className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center">
                                                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">{language === "tr" ? "OLUŞTURULUYOR" : "GENERATING"}</h3>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-all duration-300 min-h-[1.5em] max-w-[240px] mx-auto">
                                                        {language === 'tr' ? "Sahne hazırlanıyor..." : "Preparing scene..."}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : resultImages.length > 0 ? (
                                            <div className="w-full h-full flex flex-col p-4 space-y-4 animate-in fade-in zoom-in duration-500">
                                                <div className="relative flex-1 overflow-hidden rounded-2xl shadow-inner bg-black/5">
                                                    <img src={resultImages[0]} className="w-full h-full object-contain" alt="Result" />
                                                    <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="secondary" className="bg-[#F5F5F5] text-black hover:bg-zinc-200 font-black h-10 px-5 rounded-md uppercase tracking-[0.18em] text-[11px]" onClick={() => window.open(resultImages[0], '_blank')}>{language === "tr" ? "TAM BOYUT" : "FULL SIZE"}</Button>
                                                        <Button variant="secondary" size="icon" className="bg-[#F5F5F5] text-black hover:bg-zinc-200 h-10 w-10 rounded-md" onClick={() => downloadImage(resultImages[0], `editorial_${Date.now()}.png`)}>
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
                                                        <Button variant="secondary" size="sm" onClick={() => setResultImages([])} className="h-10 bg-[#F5F5F5] text-black hover:bg-zinc-200 text-[11px] font-black uppercase tracking-[0.18em] rounded-md px-5 transition-all">
                                                            <TbRefresh className="w-4 h-4 mr-2" />
                                                            {language === 'tr' ? 'YENİ' : 'NEW'}
                                                        </Button>
                                                        <Button size="sm" onClick={() => downloadImage(resultImages[0], `editorial_${Date.now()}.png`)} className="h-10 bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white text-[11px] font-black uppercase tracking-[0.18em] rounded-md px-5 shadow-xl transition-all">
                                                            <Download className="w-4 h-4 mr-2" />
                                                            {language === 'tr' ? 'İNDİR' : 'DOWNLOAD'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-center p-12">
                                                <div className="w-20 h-20 rounded-full bg-[#18181b] border border-white/5 flex items-center justify-center">
                                                    <TbGlobe className="w-10 h-10 text-white/50" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-2xl uppercase tracking-[0.2em] text-[#f5f5f5]">{language === "tr" ? "EDİTORYAL" : "EDITORIAL"}</h4>
                                                    <p className="text-[11px] font-bold text-zinc-400 max-w-[280px] mx-auto">
                                                        {language === "tr"
                                                            ? "Görselinizi oluşturmak için sol paneldeki seçenekleri kullanabilirsiniz."
                                                            : "You can use the options on the left panel to generate your visual."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Session Roll Inline */}
                                        {resultImages.length > 1 && (
                                            <div className="p-4 border-t border-dashed border-white/20 bg-black/20 mt-auto">
                                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 px-2">RECENT CAPTURES</p>
                                                <div className="flex gap-3 overflow-x-auto pb-2 px-2 scrollbar-none">
                                                    {resultImages.map((img, idx) => (
                                                        <div key={idx} className="relative shrink-0 group/item cursor-pointer" onClick={() => setResultImages([img, ...resultImages.filter(i => i !== img)])}>
                                                            <img src={img} className="h-20 w-16 object-cover rounded-lg border border-white/10 hover:border-white/40 transition-all group-hover/item:scale-105" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Background Library (Overlay Mode) */}
                                <AnimatePresence>
                                    {activeLibraryAsset === 'background' && (
                                        <motion.div
                                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 md:p-12"
                                            onClick={() => setActiveLibraryAsset(null)}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.95, y: 20 }}
                                                animate={{ scale: 1, y: 0 }}
                                                exit={{ scale: 0.95, y: 20 }}
                                                className="w-full max-w-6xl h-full max-h-[85vh] bg-[#0e0e0e] border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex-1 overflow-hidden relative">
                                                    <EditorialLibraryInline
                                                        activeType="background"
                                                        language={language}
                                                        onClose={() => setActiveLibraryAsset(null)}
                                                        onSelect={(item) => {
                                                            setAssets(prev => ({ ...prev, background: item.url }));
                                                            if (item.customPrompt) {
                                                                setSelectedBackgroundPrompt(item.customPrompt);
                                                            }
                                                            setActiveLibraryAsset(null);
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* PROMPT APPROVAL DIALOG */}
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                    <DialogContent className="max-w-2xl bg-background border-white/5 text-white overflow-hidden p-0 rounded-[30px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                        <DialogHeader className="p-8 pb-0 relative">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-md shadow-[0_0_20px_rgba(255,255,255,0.15)]"><Sparkles size={20} className="text-white" /></div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black tracking-tighter uppercase italic">{language === "tr" ? "ÜRETİM ANALİZİ" : "PRODUCTION ANALYSIS"}</span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI MASTER ENGINE</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-8 space-y-6 relative">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Monitor size={14} />{language === "tr" ? "SAHNE ESTETİĞİ" : "SCENE AESTHETICS"}</label>
                                <div className="p-4 bg-white/5 rounded-md border border-white/5 text-xs text-zinc-300 leading-relaxed italic">{analyzedAesthetic}</div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><FileText size={14} />{language === "tr" ? "BİRLEŞTİRİLMİŞ PROMPT" : "COMBINED PROMPT"}</label>
                                <div className="p-4 bg-black/40 rounded-md border border-white/5 font-mono text-[10px] text-zinc-400 h-32 overflow-y-auto scrollbar-thin">
                                    <div className="space-y-2">
                                        <p><span className="text-zinc-400">SCENE:</span> {selectedBackgroundPrompt || "Custom"}</p>
                                        <p><span className="text-zinc-400">STYLE:</span> {prompt || "None"}</p>
                                        <p><span className="text-zinc-400">ATMOSPHERE:</span> {analyzedAesthetic}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="secondary" className="flex-1 h-12 rounded-md bg-[#F5F5F5] text-black hover:bg-zinc-200 text-[11px] font-black uppercase tracking-[0.18em]" onClick={() => setShowApprovalDialog(false)}>{language === "tr" ? "İPTAL" : "CANCEL"}</Button>
                                <Button variant="default" className="flex-[2] h-12 rounded-md bg-[#FF3D5A] hover:bg-[#FF3D5A]/90 text-white shadow-xl transition-all" onClick={() => { setShowApprovalDialog(false); executeGeneration(); }}>
                                    <div className="flex items-center justify-center font-black text-[11px] uppercase tracking-[0.18em]">
                                        <Camera className="w-4 h-4 mr-2 flex-none" />
                                        <span>{language === "tr" ? "OLUŞTUR" : "GENERATE"}</span>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* PROCESSING OVERLAY */}
                {isAnalyzing && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-t-4 border-white animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-white animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black mt-8 tracking-[0.18em] uppercase">{language === "tr" ? "TEKNİK ANALİZ" : "TECHNICAL ANALYSIS"}</h3>
                        <p className="text-[11px] font-bold text-zinc-400 mt-2">GEMINI 2.0 VISION // MASTERING AESTHETICS</p>
                    </div>
                )}
            </div>
        </div>
    );
}
