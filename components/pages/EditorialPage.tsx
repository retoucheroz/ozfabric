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
import { downloadImage, resizeImageToThumbnail, optimizeImageForApi, mergeImages, cn } from "@/lib/utils"
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
    const [outfitImages, setOutfitImages] = useState<string[]>([]);

    const [resolution, setResolution] = useState("1K");
    const [aspectRatio, setAspectRatio] = useState("3:4");
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
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
                    camera: isManualCamera ? activeCamera?.name : "Auto",
                    lens: isManualCamera ? activeLens?.name : "Auto",
                    focalLength: isManualCamera ? focalLength : "Auto",
                    aperture: isManualCamera ? aperture : "Auto",
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
                    camera: isManualCamera ? activeCamera.name : "Auto",
                    lens: isManualCamera ? activeLens.name : "Auto",
                    focalLength: isManualCamera ? focalLength : "Auto",
                    aperture: isManualCamera ? aperture : "Auto",
                    resolution,
                    aspectRatio,
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
        } catch (error) {
            console.error(error);
            toast.error(language === "tr" ? "Bir hata oluştu" : "An error occurred");
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
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--bg-sidebar)] overflow-hidden relative">


            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className={cn(
                        "p-4 md:p-8 mx-auto space-y-8 transition-all duration-500 flex-1 w-full",
                        wizardStep === 1 ? "max-w-[1230px]" : wizardStep === 3 ? "max-w-[1182px]" : "max-w-[926px]"
                    )}>
                        {/* Progress */}
                        <div>
                            <WizardProgress currentStep={wizardStep} onStepClick={(s) => { if (canMoveToStep(s)) setWizardStep(s as any); }} language={language} />
                        </div>


                        {/* ===== STEP 1: MODEL & ASSETS ===== */}
                        {wizardStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                                    {/* Left: Asset Cards */}
                                    <div className="lg:col-span-3 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4 px-1">
                                            <div className="p-2.5 rounded-md bg-white/5 text-white border border-white/10 shadow-lg"><TbUserCircle className="w-5 h-5" /></div>
                                            <div className="flex flex-col">
                                                <label className="text-xs uppercase font-black text-white tracking-[0.2em]">{language === "tr" ? "MODEL SEÇİMİ" : "MODEL SELECTION"}</label>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter opacity-80">{language === "tr" ? "ÜRETİM İÇİN MODEL BELİRLE" : "DEFINE MODEL FOR PRODUCTION"}</span>
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
                                                description={language === "tr" ? "KOMBİNLİ BOY FOTOĞRAFI" : "FULL BODY WITH OUTFIT"}
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
                                        </div>

                                        <div className="mt-auto p-3 rounded-2xl border flex gap-3 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 trasition-colors">
                                            <Info size={16} className="shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold leading-relaxed uppercase tracking-tight">
                                                {language === "tr" ? "KOMBİNLİ GÖRSEL SEÇTİNİZ. MODEL ÜZERİNDEKİ KIYAFET KORUNACAKTIR." : "OUTFIT INCLUDED SELECTED. THE CLOTHING ON THE MODEL WILL BE PRESERVED."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Tutorial / Model Library */}
                                    <div className="lg:col-span-8 hidden lg:grid flex-col relative overflow-hidden grid-cols-1 grid-rows-1 h-[540px] bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl">
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
                                                                    <span className="w-6 h-6 rounded-full bg-white text-black text-[11px] flex items-center justify-center font-black italic shadow-lg">1</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{language === "tr" ? "VARLIK YÜKLEME" : "ASSET UPLOAD"}</span>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tighter">
                                                                    {language === "tr"
                                                                        ? "Model portrenizi yükleyin; çekim moduna göre mevcut kıyafeti koruyabilir veya tamamen yeni bir stil kurgulayabilirsiniz."
                                                                        : "Upload your model portrait; depending on the mode, preserve the existing outfit or curate a completely new style."}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2 border-x border-white/5 px-8">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-white text-black text-[11px] flex items-center justify-center font-black italic shadow-lg">2</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{language === "tr" ? "EDİTORYAL KURGU" : "EDITORIAL CURATION"}</span>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tighter">
                                                                    {language === "tr"
                                                                        ? "Dünya çapındaki ikonik lokasyonlar arasından seçim yapın, gelişmiş kamera ve ışık ayarlarıyla çekim atmosferinizi tasarlayın."
                                                                        : "Choose from iconic global locations and design your shoot atmosphere with professional camera and lighting controls."}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-white text-black text-[11px] flex items-center justify-center font-black italic shadow-lg">3</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{language === "tr" ? "PROFESYONEL ÜRETİM" : "PRODUCTION"}</span>
                                                                </div>
                                                                <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tighter">
                                                                    {language === "tr"
                                                                        ? "Gelişmiş sahne analizi teknolojisi ile yüksek moda standartlarında, gerçekçi ve estetik editoryal karelerinizi oluşturun."
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

                                {/* Step 1 Footer */}
                                <div className="flex justify-end pt-6 border-t border-white/5">
                                    <Button onClick={() => canMoveToStep(2) && setWizardStep(2)} className="px-4 py-2 h-auto rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] group">
                                        {language === "tr" ? "İLERLE" : "NEXT"} <ChevronRight className="ml-2 w-3.5 h-3.5" />
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
                                        <div className="flex items-center gap-3 mb-4 px-1">
                                            <div className="p-2.5 rounded-md bg-white/5 text-white border border-white/10 shadow-lg"><TbGlobe className="w-5 h-5" /></div>
                                            <div className="flex flex-col">
                                                <label className="text-xs uppercase font-black text-white tracking-[0.2em]">{language === "tr" ? "KÜTÜPHANE ÖĞELERİ" : "LIBRARY ASSETS"}</label>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter opacity-80">{language === "tr" ? "ARKAPLAN VE POZ SEÇİN" : "CHOOSE BACKGROUND & POSE"}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
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

                                            {/* Reference Pose Toggle */}
                                            <div className="group/pose">
                                                <button
                                                    onClick={() => setUseReferencePose(!useReferencePose)}
                                                    className={cn(
                                                        "w-full p-2.5 rounded-md border flex items-center justify-between transition-all duration-300",
                                                        useReferencePose
                                                            ? "bg-white/10 border-white/20 ring-1 ring-white/10"
                                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500",
                                                            useReferencePose ? "bg-white text-black shadow-lg shadow-white/10 rotate-[360deg]" : "bg-white/5 text-zinc-500"
                                                        )}>
                                                            <TbUserCircle className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col items-start translate-y-[1px]">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider transition-colors",
                                                                useReferencePose ? "text-white" : "text-zinc-500"
                                                            )}>
                                                                {language === "tr" ? "POZ REFERANSI OLARAK KULLAN" : "USE AS POSE REFERENCE"}
                                                            </span>
                                                            <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tight">
                                                                {language === "tr" ? "GÖRSELDEKİ POZU VE KADRAJI ANALİZ EDER" : "ANALYZES POSE AND FRAMING FROM IMAGE"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-7 h-4 rounded-full relative transition-all duration-300",
                                                        useReferencePose ? "bg-white" : "bg-white/10"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-1 w-2 h-2 rounded-full transition-all duration-300",
                                                            useReferencePose ? "right-1 bg-black" : "left-1 bg-zinc-600"
                                                        )} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Aspect Ratio */}
                                        <section className="space-y-4">
                                            <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><TbAspectRatio className="w-4 h-4 text-white" />{language === "tr" ? "GÖRÜNTÜ ORANI" : "ASPECT RATIO"}</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "21:9"].map((ratio) => (
                                                    <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`h-11 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${aspectRatio === ratio ? 'bg-white border-white text-black shadow-xl ring-2 ring-white/20' : 'bg-white/5 border-white/5 hover:border-white/20 text-zinc-500 hover:text-white'}`}>{ratio}</button>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right: Camera Settings or Library */}
                                    <div className="lg:col-span-7 h-full min-h-[500px] relative overflow-hidden grid grid-cols-1 grid-rows-1">
                                        <AnimatePresence>
                                            {activeLibraryAsset === 'background' ? (
                                                <motion.div
                                                    key="library-inline"
                                                    initial={{ opacity: 0, y: 48, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -48, scale: 0.97 }}
                                                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                                    className="h-full"
                                                    style={{ gridArea: '1 / 1 / 2 / 2' }}
                                                >
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
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="camera-settings"
                                                    initial={{ opacity: 0, y: -48, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 48, scale: 0.97 }}
                                                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                                    className="space-y-4"
                                                    style={{ gridArea: '1 / 1 / 2 / 2' }}
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-4 px-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 rounded-md bg-white/5 text-white border border-white/10 shadow-lg"><TbSettings2 className="w-5 h-5" /></div>
                                                            <div className="flex flex-col">
                                                                <label className="text-xs uppercase font-black text-white tracking-[0.2em]">{language === "tr" ? "KAMERA KONTROL" : "CAMERA CONTROL"}</label>
                                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter opacity-80">{language === "tr" ? "PROFESYONEL KAMERA AYARLARI" : "PROFESSIONAL CAMERA SETTINGS"}</span>
                                                            </div>
                                                        </div>

                                                        {/* Camera Mode Toggle */}
                                                        <div className="bg-white/5 border border-white/5 p-1 rounded-md flex">
                                                            <button
                                                                onClick={() => setIsManualCamera(false)}
                                                                className={cn(
                                                                    "px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                                                                    !isManualCamera ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
                                                                )}
                                                            >
                                                                AUTO
                                                            </button>
                                                            <button
                                                                onClick={() => setIsManualCamera(true)}
                                                                className={cn(
                                                                    "px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                                                                    isManualCamera ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-white"
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
                                                            <div className="grid grid-cols-6 h-full relative z-40">
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

                                                    {/* Hair Style Selection */}
                                                    <div className="space-y-4 mb-6">
                                                        <div className="flex items-center gap-2 mb-2 px-1">
                                                            <div className="p-1 rounded-md bg-white/5 text-zinc-400 border border-white/5"><TbSignature className="w-3 h-3" /></div>
                                                            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mt-1">{language === "tr" ? "SAÇ STİLİ" : "HAIR STYLE"}</label>
                                                        </div>
                                                        <select
                                                            value={hairStyle}
                                                            onChange={(e) => setHairStyle(e.target.value)}
                                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-md px-4 text-[10px] font-bold text-white uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-white/20 transition-all cursor-pointer"
                                                        >
                                                            {HAIR_STYLES.map((style) => (
                                                                <option key={style.id} value={style.id} className="bg-[#0e0e0e] text-white py-2">
                                                                    {language === "tr" ? style.name.toUpperCase() : style.nameEn.toUpperCase()}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Resolution */}
                                                    <div className="grid grid-cols-1 gap-4 pt-4">
                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-white uppercase tracking-widest px-1">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}</label>
                                                            <select className="w-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-md h-11 px-4 outline-none focus:ring-1 focus:ring-white/20 transition-all cursor-pointer" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                                                <option value="4K" className="bg-zinc-900">4K Ultra HD (100 Kredi)</option>
                                                                <option value="2K" className="bg-zinc-900">2K Digital (60 Kredi)</option>
                                                                <option value="1K" className="bg-zinc-900">1K Standard (40 Kredi)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Step 2 Footer */}
                                <div className="flex justify-between pt-8 border-t border-white/5">
                                    <Button variant="ghost" onClick={() => setWizardStep(1)} className="px-4 py-2 h-auto rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all group">
                                        <ChevronLeft size={14} /> {language === "tr" ? "GERİ" : "BACK"}
                                    </Button>
                                    <Button onClick={handleGenerate} disabled={isProcessing} className="px-5 py-2 h-auto rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black uppercase tracking-widest shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group">
                                        {isProcessing ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className="text-[10px]">{language === "tr" ? "ÇEKİMİ BAŞLAT" : "START PRODUCTION"}</span>
                                            <span className="text-[8px] opacity-60 font-mono tracking-tighter">{estimatedCost + 20} {language === "tr" ? "KREDİ" : "CREDITS"}</span>
                                        </div>
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
                                                <div className="w-12 h-0.5 bg-zinc-200 dark:bg-card overflow-hidden rounded-full"><div className="h-full bg-white w-[60%]" /></div>
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
                                            <div className="relative"><div className="w-24 h-24 rounded-full border-t-4 border-white animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Monitor className="w-8 h-8 text-white animate-pulse" /></div></div>
                                            <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "İŞLENİYOR" : "PROCESSING"}</h3>
                                            <div className="mt-4 flex flex-col items-center gap-2">
                                                <div className="flex gap-1"><div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]\" /><div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]\" /><div className="w-1 h-1 bg-white rounded-full animate-bounce\" /></div>
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
                                        <div className="absolute bottom-10 left-10 right-10 p-5 rounded-md bg-black/80 backdrop-blur-2xl border border-white/10 flex items-center justify-between text-white shadow-2xl z-20">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 bg-white rounded text-[9px] font-black tracking-widest uppercase text-black italic">{activeCamera.name}</span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-white tracking-widest">{activeLens.name}</span>
                                                </div>
                                                <div className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-tighter">{focalLength}MM • {aperture} • ISO 100 • {resolution}</div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => window.open(resultImages[0], '_blank')} className="h-11 px-6 rounded-md bg-white/5 hover:bg-white hover:text-black border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Maximize size={14} />{language === "tr" ? "TAM BOYUT" : "FULL SIZE"}</button>
                                                <Button
                                                    onClick={() => downloadImage(resultImages[0], `editorial_${Date.now()}.png`)}
                                                    className="h-11 px-8 rounded-md bg-white hover:bg-zinc-200 text-black transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl active:scale-95 border-none"
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
                                                    <img src={img} className="h-48 w-36 object-cover rounded-2xl border-2 border-transparent hover:border-white transition-all cursor-pointer shadow-lg group-hover/item:scale-105" alt="Result" onClick={() => setResultImages([img, ...resultImages.filter(i => i !== img)])} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 Footer */}
                                <div className="flex justify-between pt-8 border-t border-white/5">
                                    <Button variant="ghost" onClick={() => setWizardStep(2)} className="px-4 py-2 h-auto rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white hover:text-black transition-all group">
                                        <ChevronLeft size={14} /> {language === "tr" ? "DÜZENLE" : "EDIT"}
                                    </Button>
                                    <Button onClick={() => { setResultImages([]); setWizardStep(1); }} className="px-4 py-2 h-auto rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group">
                                        <Plus className="w-4 h-4" />
                                        {language === "tr" ? "YENİ ÇEKİM" : "NEW SHOOT"}
                                    </Button>
                                </div>
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
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PRO OPTICS ENGINE</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-8 space-y-6 relative">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Monitor size={14} />{language === "tr" ? "OPTİK KARAKTERİSTİK" : "OPTICAL CHARACTERISTICS"}</label>
                                <div className="p-4 bg-white/5 rounded-md border border-white/5 text-xs text-zinc-300 leading-relaxed italic">{analyzedAesthetic}</div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><FileText size={14} />{language === "tr" ? "BİRLEŞTİRİLMİŞ PROMPT" : "COMBINED PROMPT"}</label>
                                <div className="p-4 bg-black/40 rounded-md border border-white/5 font-mono text-[10px] text-zinc-400 h-32 overflow-y-auto scrollbar-thin">
                                    <div className="space-y-2">
                                        <p><span className="text-zinc-400">SCENE:</span> {selectedBackgroundPrompt || "Custom"}</p>
                                        <p><span className="text-zinc-400">STYLE:</span> {prompt || "None"}</p>
                                        <p><span className="text-zinc-400">OPTICS:</span> {analyzedAesthetic}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" className="flex-1 h-12 rounded-md border border-white/5 hover:bg-white/5 text-xs font-bold uppercase tracking-widest" onClick={() => setShowApprovalDialog(false)}>{language === "tr" ? "İPTAL" : "CANCEL"}</Button>
                                <Button className="flex-[2] h-12 rounded-md bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]" onClick={() => { setShowApprovalDialog(false); setWizardStep(3); executeGeneration(); }}>{language === "tr" ? "ÜRETİMİ BAŞLAT" : "START PRODUCTION"}</Button>
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
                        <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "TEKNİK ANALİZ" : "TECHNICAL ANALYSIS"}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{activeCamera?.name} // {activeLens?.name} // {focalLength}MM</p>
                    </div>
                )}
            </div>
        </div>
    );
}
