"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Upload, Loader2, Trash2, Camera, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Image as ImageIcon, Sparkles, X, FileText, Globe, CheckCircle2, AlertCircle, Maximize2, Zap, Layers, Pencil
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
import { resizeImageToThumbnail } from "@/lib/utils"
import { CAMERAS, LOCATIONS, type CameraSpec, type LensSpec, type EditorialLocation } from "@/lib/editorial-data"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { PlusCircle, Plus, Settings2, Info, Download, Maximize, Sliders, Monitor, Command, Compass } from "lucide-react"

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
    const [selectedLocation, setSelectedLocation] = useState<EditorialLocation | null>(null);
    const [selectedCity, setSelectedCity] = useState<any>(null);
    const [selectedBackground, setSelectedBackground] = useState<any>(null);

    const [resolution, setResolution] = useState("4K");
    const [aspectRatio, setAspectRatio] = useState("3:4");
    const [seed, setSeed] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");

    // Camera States
    const [activeCameraIndex, setActiveCameraIndex] = useState(0);
    const [activeLensIndex, setActiveLensIndex] = useState(0);
    const [focalLength, setFocalLength] = useState<number>(35);
    const [aperture, setAperture] = useState<string>("f/4");

    // Library States
    const [sidebarMode, setSidebarMode] = useState<'controls' | 'library'>('controls');
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

    // Load custom locations from local storage
    useEffect(() => {
        const saved = localStorage.getItem("ozfabric_custom_locations");
        if (saved) {
            try {
                const custom = JSON.parse(saved);
                setAllLocations([...LOCATIONS, ...custom]);
            } catch (e) {
                console.error("Failed to load custom locations", e);
            }
        }
    }, []);

    // Save or Update custom locations
    const saveCustomLocation = (location: any) => {
        const custom = JSON.parse(localStorage.getItem("ozfabric_custom_locations") || "[]");

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
            localStorage.setItem("ozfabric_custom_locations", JSON.stringify(updated));
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

            localStorage.setItem("ozfabric_custom_locations", JSON.stringify(custom));
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

    // Handle Initial "Generate" Click - Triggers Analysis
    const handleGenerate = async () => {
        if (!modelImage) {
            toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin" : "Please upload a model image");
            return;
        }
        if (!selectedBackground) {
            toast.error(language === "tr" ? "Lütfen kütüphaneden bir arka plan seçin" : "Please select a background from library");
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch("/api/editorial/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    camera: activeCamera.name,
                    lens: activeLens.name,
                    focalLength,
                    aperture,
                    language
                })
            });

            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setAnalyzedAesthetic(data.analysis);
            setShowApprovalDialog(true);
        } catch (error) {
            console.error(error);
            toast.error(language === "tr" ? "Analiz sırasında bir hata oluştu" : "Error during analysis");
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
                    image: modelImage,
                    backgroundPrompt: selectedBackground.prompt,
                    camera: activeCamera.name,
                    lens: activeLens.name,
                    focalLength,
                    aperture,
                    resolution,
                    aspectRatio,
                    prompt: `${prompt ? prompt + ". " : ""}${analyzedAesthetic}`,
                    seed: seed || null
                })
            });

            if (!response.ok) throw new Error("Generation failed");

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setModelImage(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-background overflow-hidden">
            <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-background shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#14171f] dark:bg-white rounded-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform cursor-pointer shadow-lg">
                        <TbCamera className="w-6 h-6 text-white dark:text-[#14171f]" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter uppercase italic">{language === "tr" ? t("sidebar.editorial") : "IMAGE STUDIO"}</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] -mt-1 leading-none shadow-sm shadow-white/10">PROFESSIONAL OPTICS ENGINE</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/10">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ENGINE ONLINE</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Primary Content */}
                <aside className="w-full lg:w-[450px] border-r bg-white dark:bg-card flex flex-col shrink-0 relative z-20 overflow-hidden shadow-xl">
                    <AnimatePresence mode="wait">
                        {sidebarMode === 'controls' ? (
                            <motion.div
                                key="controls"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                                    {/* Model Upload */}
                                    <section className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <TbUserCircle className="w-4 h-4 text-violet-500" />
                                            {language === "tr" ? "MODEL GÖRSELİ" : "MODEL IMAGE"}
                                        </label>
                                        <div className="relative group">
                                            {modelImage ? (
                                                <div className="relative h-28 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                                                    <img src={modelImage} className="w-full h-full object-cover" alt="Model" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <label className="cursor-pointer bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md transition-colors">
                                                            <Upload className="w-5 h-5 text-white" />
                                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                                        </label>
                                                        <button
                                                            onClick={() => setModelImage(null)}
                                                            className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-full backdrop-blur-md transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5 text-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-20 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/5 dark:bg-black/40 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                                            <Upload className="w-4 h-4 text-violet-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-foreground">
                                                                {language === "tr" ? "MODEL GÖRSELİ YÜKLEYİN" : "UPLOAD MODEL IMAGE"}
                                                            </span>
                                                            <span className="text-[8px] text-muted-foreground uppercase font-bold">
                                                                {language === "tr" ? "JPG, PNG veya WEBP" : "JPG, PNG or WEBP"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <input type="file" className="hidden" onChange={handleFileUpload} />
                                                </label>
                                            )}
                                        </div>
                                    </section>


                                    {/* Background Library Trigger */}
                                    <section className="space-y-3 px-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <TbGlobe className="w-4 h-4 text-violet-500" />
                                                {language === "tr" ? "STÜDYO & LOKASYON" : "STUDIO & LOCATION"}
                                            </div>
                                            <button
                                                className="text-white bg-violet-600 text-[9px] font-bold hover:bg-violet-700 px-2 py-0.5 rounded-full transition-colors"
                                                onClick={() => setSidebarMode('library')}
                                            >
                                                {language === "tr" ? "LİSTEYE GİT" : "BROWSE"}
                                            </button>
                                        </label>

                                        {selectedBackground ? (
                                            <div className="relative group rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-white/10 h-28 cursor-pointer group shadow-xl hover:shadow-2xl transition-all" onClick={() => setSidebarMode('library')}>
                                                <img src={selectedBackground.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Background" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                                    <div className="absolute bottom-3 left-3">
                                                        <p className="text-[8px] font-bold text-white/60 uppercase tracking-tighter mb-0.5">SELECTED SCENE</p>
                                                        <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">{selectedLocation?.name}, {selectedCity?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
                                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSidebarMode('library')}
                                                className="w-full h-20 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/5 dark:bg-black/40 flex flex-col items-center justify-center hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{language === "tr" ? "ARKA PLAN SEÇİN" : "SELECT BACKGROUND"}</span>
                                            </button>
                                        )}
                                    </section>

                                    <Separator />

                                    {/* Settings: Aspect Ratio */}
                                    <section className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <TbAspectRatio className="w-4 h-4 text-violet-500" />
                                                {language === "tr" ? "GÖRÜNTÜ ORANI" : "ASPECT RATIO"}
                                            </label>
                                            <select
                                                className="w-full h-10 px-3 rounded-lg border bg-zinc-50 dark:bg-white/5 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                            >
                                                <option value="1:1">Square (1:1)</option>
                                                <option value="3:4">Portrait (3:4)</option>
                                                <option value="4:3">Landscape (4:3)</option>
                                                <option value="9:16">Story (9:16)</option>
                                                <option value="16:9">Cinematic (16:9)</option>
                                                <option value="2:3">Classic (2:3)</option>
                                                <option value="3:2">Photo (3:2)</option>
                                                <option value="21:9">UltraWide (21:9)</option>
                                            </select>
                                        </div>
                                    </section>

                                    <Separator />

                                    <section className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <TbAdjustmentsHorizontal className="w-4 h-4 text-violet-500" />
                                                {language === "tr" ? "KAMERA KONTROL" : "CAMERA CONTROL"}
                                            </label>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                                {language === "tr"
                                                    ? "Optik seçimler çekimin perspektifini ve dijital dokusunu belirler. Fokal uzaklık bakış açısını, diyafram ise derinlik algısını ve arka plan fluluğunu (bokeh) kontrol eder."
                                                    : "Optical selections define the perspective and digital texture of the shot. Focal length controls FOV, while aperture manages depth perception and background blur (bokeh)."
                                                }
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* PRO PRECISION DRUM PICKER - Solid Dashboard with Direct Controls */}
                                            <div className="relative h-[210px] bg-muted/40 dark:bg-background rounded-[30px] border border-border dark:border-white/5 overflow-hidden shadow-2xl">
                                                {/* HUD Backdrop - Lower Layer */}
                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[110px] pointer-events-none z-10">
                                                    <div className="absolute inset-0 bg-white/[0.03] border-y border-white/10" />
                                                </div>

                                                {/* HUD Labels - Background Layer to prevent blocking */}
                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[110px] pointer-events-none z-20">
                                                    <div className="grid grid-cols-4 h-full relative">
                                                        <div className="flex flex-col items-center justify-between py-2.5 px-1 opacity-20">
                                                            <span className="text-[7px] font-black tracking-[0.3em] uppercase">
                                                                {language === "tr" ? "KAMERA" : "CAMERA"}
                                                            </span>
                                                            <div className="bg-white/5 px-2 py-0.5 rounded text-[7px] font-black tracking-widest">FILM</div>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-between py-2.5 px-1 border-l border-white/5 opacity-20">
                                                            <span className="text-[7px] font-black tracking-[0.3em] uppercase">
                                                                {language === "tr" ? "LENS" : "LENS"}
                                                            </span>
                                                            <div className="bg-white/5 px-2 py-0.5 rounded text-[7px] font-black tracking-widest">SPHERICAL</div>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-between py-2.5 px-1 border-l border-white/5 opacity-20">
                                                            <span className="text-[7px] font-black tracking-[0.3em] uppercase">
                                                                {language === "tr" ? "FOKAL UZK." : "FOCAL"}
                                                            </span>
                                                            <span className="text-[7px] font-black tracking-widest">mm</span>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-between py-2.5 px-1 border-l border-white/5 opacity-20">
                                                            <span className="text-[7px] font-black tracking-[0.3em] uppercase">
                                                                {language === "tr" ? "DİYAFRAM" : "IRIS"}
                                                            </span>
                                                            <span className="text-[7px] font-black tracking-widest">{aperture}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* INTERACTIVE GEAR COLUMNS - Middle Layer (Scrollable) */}
                                                <div className="grid grid-cols-4 h-full relative z-40">
                                                    {/* COLUMN 1: CAMERA */}
                                                    <DrumColumn
                                                        items={CAMERAS}
                                                        activeIndex={activeCameraIndex}
                                                        onChange={(idx) => { setActiveCameraIndex(idx); setActiveLensIndex(0); }}
                                                        render={(cam, active) => (
                                                            <div className="flex flex-col items-center justify-center p-2">
                                                                <img src={cam.image} className={`object-contain drop-shadow-lg transition-all ${active ? 'w-14 h-11' : 'w-10 h-8'}`} alt={cam.name} />
                                                                <span className={`mt-2 text-[8px] font-bold uppercase transition-all ${active ? 'text-white' : 'text-white/40'}`}>
                                                                    {cam.name.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* COLUMN 2: LENS */}
                                                    <DrumColumn
                                                        items={activeCamera.lenses}
                                                        activeIndex={activeLensIndex}
                                                        onChange={setActiveLensIndex}
                                                        render={(lens, active) => (
                                                            <div className="flex flex-col items-center justify-center p-2">
                                                                <div className="w-12 h-12 flex items-center justify-center">
                                                                    <img src={lens.image} className={`max-w-full max-h-full object-contain drop-shadow-lg transition-all ${active ? 'scale-110' : 'scale-90'}`} alt={lens.name} />
                                                                </div>
                                                                <span className={`mt-2 text-[7px] font-bold uppercase transition-all text-center leading-tight line-clamp-1 w-full px-1 ${active ? 'text-white' : 'text-white/40'}`}>
                                                                    {lens.name.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* COLUMN 3: FOCAL */}
                                                    <DrumColumn
                                                        items={[8, 14, 33, 35, 50, 55, 75, 85, 100, 110, 135]}
                                                        activeIndex={[8, 14, 33, 35, 50, 55, 75, 85, 100, 110, 135].indexOf(focalLength)}
                                                        onChange={(idx) => setFocalLength([8, 14, 33, 35, 50, 55, 75, 85, 100, 110, 135][idx])}
                                                        render={(f, active) => (
                                                            <div className="flex flex-col items-center justify-center h-full">
                                                                <span className={`font-black font-mono tracking-tighter transition-all ${active ? 'text-2xl text-white' : 'text-lg text-white/40'}`}>
                                                                    {f}
                                                                </span>
                                                            </div>
                                                        )}
                                                    />

                                                    {/* COLUMN 4: APERTURE */}
                                                    <DrumColumn
                                                        items={["f/2", "f/4", "f/11"]}
                                                        activeIndex={["f/2", "f/4", "f/11"].indexOf(aperture)}
                                                        onChange={(idx) => setAperture(["f/2", "f/4", "f/11"][idx])}
                                                        render={(f, active) => (
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className={`w-10 h-10 flex items-center justify-center transition-all ${active ? 'opacity-100 scale-110' : 'opacity-40 scale-75'}`}>
                                                                    <img
                                                                        src={`/camera_control/${f.replace("f/", "f")}.webp`}
                                                                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                                                                        alt={f}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Action Section */}
                                <div className="p-6 border-t bg-white/80 dark:bg-card/80 backdrop-blur-xl shrink-0">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isProcessing}
                                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale group shadow-2xl shadow-violet-500/30"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />
                                                {language === "tr" ? "ÇEKİMİ BAŞLAT" : "START PHOTOSHOOT"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="library"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-background"
                            >
                                {/* Library Header */}
                                <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-card">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSidebarMode('controls')}
                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="text-sm font-bold">{language === "tr" ? "Seçim Yap" : "Pick Location"}</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">LOKASYON KÜTÜPHANESİ</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSidebarMode('controls')}
                                        className="text-zinc-400 hover:text-foreground"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 flex overflow-hidden">
                                    {/* Library Sidebar (Countries) */}
                                    <div className="w-20 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-card overflow-y-auto flex flex-col scrollbar-none">
                                        {allLocations.map((loc) => (
                                            <button
                                                key={loc.id}
                                                onClick={() => { setSelectedLocation(loc); setSelectedCity(null); setIsAddMode(false); }}
                                                className={`group flex flex-col items-center gap-1.5 py-4 transition-all relative
                                                                ${selectedLocation?.id === loc.id ? 'text-violet-500' : 'text-zinc-400 hover:text-zinc-600'}
                                                            `}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                                            ${selectedLocation?.id === loc.id ? 'bg-violet-500/10 scale-110 shadow-sm' : 'bg-transparent'}
                                                        `}>
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <span className={`text-[8px] font-bold text-center px-1 break-words leading-tight uppercase tracking-tighter ${selectedLocation?.id === loc.id ? 'opacity-100' : 'opacity-60'}`}>
                                                    {language === "tr" ? loc.nameTr : loc.name}
                                                </span>
                                                {selectedLocation?.id === loc.id && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-violet-500 rounded-l-full" />
                                                )}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setIsAddMode(true)}
                                            className="flex flex-col items-center gap-1.5 py-4 text-violet-500/40 hover:text-violet-500 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl border border-dashed border-violet-500/30 flex items-center justify-center">
                                                <Plus size={18} />
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-tighter">EKLE</span>
                                        </button>
                                    </div>

                                    {/* Library Main Content (Cities/Images) */}
                                    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-background">
                                        {isAddMode ? (
                                            <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-500">
                                                        {newLoc.id ? <Pencil size={14} /> : <Plus size={14} />}
                                                    </div>
                                                    <h4 className="text-xs font-bold uppercase tracking-widest">
                                                        {newLoc.id ? (language === "tr" ? "Lokasyonu Düzenle" : "Edit Location") : (language === "tr" ? "Yeni Lokasyon" : "New Location")}
                                                    </h4>
                                                </div>
                                                <div className="space-y-4">
                                                    {!newLoc.id && (
                                                        <>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ülke</label>
                                                                <Input
                                                                    placeholder="Örn: Türkiye"
                                                                    className="h-9 bg-white dark:bg-background border-zinc-200 dark:border-card text-xs"
                                                                    value={newLoc.country}
                                                                    onChange={(e) => setNewLoc({ ...newLoc, country: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Şehir</label>
                                                                <Input
                                                                    placeholder="Örn: İstanbul"
                                                                    className="h-9 bg-white dark:bg-background border-zinc-200 dark:border-card text-xs"
                                                                    value={newLoc.city}
                                                                    onChange={(e) => setNewLoc({ ...newLoc, city: e.target.value })}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Arka Plan Görseli</label>
                                                        <div className="relative group/add">
                                                            {newLoc.image ? (
                                                                <div className="relative aspect-square rounded-xl overflow-hidden border">
                                                                    <img src={newLoc.image} className="w-full h-full object-cover" alt="Preview" />
                                                                    <button
                                                                        onClick={() => setNewLoc({ ...newLoc, image: "" })}
                                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-card hover:border-violet-500 transition-all cursor-pointer">
                                                                    <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Yükle (512x512)</span>
                                                                    <input type="file" className="hidden" onChange={handleLibraryImageUpload} accept="image/*" />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prompt</label>
                                                        <textarea
                                                            placeholder="Görseli anlatan detaylı prompt..."
                                                            className="w-full min-h-[100px] bg-white dark:bg-background border border-zinc-200 dark:border-card rounded-xl p-3 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
                                                            value={newLoc.prompt}
                                                            onChange={(e) => setNewLoc({ ...newLoc, prompt: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setIsAddMode(false)}>İptal</Button>
                                                        <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs" onClick={() => saveCustomLocation(newLoc)} disabled={!newLoc.country || !newLoc.city || !newLoc.image || !newLoc.prompt}>Kaydet</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : selectedLocation ? (
                                            <>
                                                <div className="p-3 flex gap-2 overflow-x-auto border-b border-zinc-200 dark:border-card bg-white dark:bg-background scrollbar-none">
                                                    {selectedLocation.cities.map((city) => (
                                                        <button
                                                            key={city.id}
                                                            onClick={() => setSelectedCity(city)}
                                                            className={`px-3 py-1 rounded-full whitespace-nowrap text-[9px] font-bold transition-all border
                                                                            ${selectedCity?.id === city.id ? 'bg-violet-600 border-violet-600 text-white' : 'text-zinc-500 border-zinc-200 dark:border-card hover:border-violet-500/50'}
                                                                        `}
                                                        >
                                                            {language === "tr" ? city.nameTr : city.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                                                    {selectedCity ? (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {selectedCity.images.map((img: any) => (
                                                                <div
                                                                    key={img.id}
                                                                    onClick={() => { setSelectedBackground(img); setSidebarMode('controls'); }}
                                                                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all
                                                                                    ${selectedBackground?.id === img.id ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-transparent hover:border-violet-500/30'}
                                                                                `}
                                                                >
                                                                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={img.id} />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                        <span
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedBackground(img); setSidebarMode('controls'); }}
                                                                            className="bg-white text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase hover:scale-110 transition-transform"
                                                                        >
                                                                            Seç
                                                                        </span>
                                                                        {img.id.startsWith('img-') && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setIsAddMode(true);
                                                                                    setNewLoc({
                                                                                        id: img.id,
                                                                                        country: selectedLocation.name,
                                                                                        city: selectedCity.name,
                                                                                        prompt: img.prompt,
                                                                                        image: img.url
                                                                                    });
                                                                                }}
                                                                                className="p-1.5 bg-background/50 hover:bg-background text-white rounded-full backdrop-blur-md transition-all"
                                                                            >
                                                                                <Pencil size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {selectedBackground?.id === img.id && (
                                                                        <div className="absolute top-2 right-2 bg-violet-500 rounded-full p-0.5">
                                                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-40">
                                                            <ImageIcon className="w-10 h-10 mb-2" />
                                                            <p className="text-[9px] font-bold uppercase tracking-widest">Şehir Seçin</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-40 text-center p-6">
                                                <Globe className="w-12 h-12 mb-3" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Başlamak İçin Bir<br />Ülke Seçin</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </aside>

                {/* Right Panel: Preview */}
                <main className="flex-1 bg-zinc-100 dark:bg-[#09090b] p-4 lg:p-6 flex flex-col gap-6 overflow-y-auto relative perspective-1000">
                    <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.08),transparent_50%)] pointer-events-none" />

                    {/* Active Preview */}
                    <div className="flex-1 min-h-[400px] h-[calc(100vh-160px)] rounded-3xl bg-white dark:bg-background border border-zinc-200 dark:border-card overflow-hidden relative shadow-2xl group/preview ring-1 ring-black/5 dark:ring-white/5">
                        {/* Camera HUD Overlay */}
                        <div className="absolute inset-0 z-20 pointer-events-none p-6 flex flex-col justify-between opacity-40 group-hover/preview:opacity-100 transition-opacity duration-700">
                            {/* Top HUD */}
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-background dark:text-white uppercase">REC STUDIO 4K</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-500">ISO 100 • {focalLength}mm • {aperture}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-mono font-bold text-background dark:text-white mb-1">RAW • PRORES 422</p>
                                    <div className="w-12 h-0.5 bg-zinc-200 dark:bg-card overflow-hidden rounded-full">
                                        <div className="h-full bg-violet-500 w-[60%]" />
                                    </div>
                                </div>
                            </div>

                            {/* Center Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <div className="relative w-12 h-12">
                                    <div className="absolute top-0 left-0 w-2 h-0.5 bg-current" />
                                    <div className="absolute top-0 left-0 w-0.5 h-2 bg-current" />
                                    <div className="absolute bottom-0 right-0 w-2 h-0.5 bg-current" />
                                    <div className="absolute bottom-0 right-0 w-0.5 h-2 bg-current" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-red-500 rounded-full" />
                                </div>
                            </div>

                            {/* Bottom HUD */}
                            <div className="flex justify-between items-end">
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] text-zinc-500 font-bold">MODE</span>
                                        <span className="text-[10px] font-mono font-bold text-background dark:text-white">MANUAL</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] text-zinc-500 font-bold">WB</span>
                                        <span className="text-[10px] font-mono font-bold text-background dark:text-white">AUTO</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-[8px] text-zinc-500 font-bold">BATTERY</span>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-background dark:text-white">
                                        84% <div className="w-5 h-2.5 border border-zinc-200 dark:border-zinc-700 rounded-sm p-[1px]"><div className="w-full h-full bg-green-500/80 rounded-[1px] shadow-[0_0_5px_rgba(34,197,94,0.3)]" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Corners for viewfinder feel */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-background dark:border-white opacity-20" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-background dark:border-white opacity-20" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-background dark:border-white opacity-20" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-background dark:border-white opacity-20" />
                        </div>

                        {isProcessing ? (
                            <div className="absolute inset-0 z-30 bg-white/90 dark:bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-t-4 border-violet-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Monitor className="w-8 h-8 text-violet-600 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "İŞLENİYOR" : "PROCESSING"}</h3>
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1 h-1 bg-violet-600 rounded-full animate-bounce" />
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-xs">
                                        {activeCamera.name} // {activeLens.name} // {focalLength}MM // {aperture}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {resultImages.length > 0 ? (
                            <img src={resultImages[0]} className="w-full h-full object-contain bg-background shadow-inner" alt="Result" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,currentColor_20px,currentColor_21px)]" />
                                </div>
                                <Camera className="w-24 h-24 text-background dark:text-zinc-100 mb-8 opacity-20" />
                                <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase italic">EDITORIAL STUDIO</h2>
                                <p className="text-zinc-500 max-w-[340px] text-xs font-medium leading-relaxed uppercase tracking-widest">
                                    {language === "tr"
                                        ? "Modelinizi yükleyin, lokasyonunuzu belirleyin ve arzu ettiğiniz lens ayarlarıyla çekimi başlatın."
                                        : "Upload your model, define your scene, and initiate professional-grade shots with precision optics."}
                                </p>
                            </div>
                        )}

                        {/* Footer Overlay - Pro Info Bar */}
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
                                    <button
                                        onClick={() => window.open(resultImages[0], '_blank')}
                                        className="h-10 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Maximize size={14} />
                                        {language === "tr" ? "TAM BOYUT" : "FULL SIZE"}
                                    </button>
                                    <a
                                        href={resultImages[0]}
                                        download
                                        className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-95"
                                    >
                                        <Download size={14} />
                                        {language === "tr" ? "İNDİR" : "DOWNLOAD"}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History / Session Roll */}
                    {resultImages.length > 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Monitor size={14} />
                                    {language === "tr" ? "OTURUM RULOSU" : "SESSION ROLL"}
                                </label>
                                <span className="text-[10px] font-bold text-zinc-400">{resultImages.length} {language === "tr" ? "KARE" : "FRAMES"}</span>
                            </div>
                            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin">
                                {resultImages.map((img, idx) => (
                                    <div key={idx} className="group/item relative shrink-0">
                                        <img
                                            src={img}
                                            className="h-48 w-36 object-cover rounded-2xl border-2 border-transparent hover:border-violet-500 transition-all cursor-pointer shadow-lg group-hover/item:scale-105"
                                            alt="Result"
                                            onClick={() => setResultImages([img, ...resultImages.filter(i => i !== img)])}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* PROMPT APPROVAL DIALOG */}
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-2xl bg-background border-white/5 text-white overflow-hidden p-0 rounded-[30px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent pointer-events-none" />

                    <DialogHeader className="p-8 pb-0 relative">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-violet-600 rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter uppercase italic">
                                    {language === "tr" ? "ÜRETİM ANALİZİ" : "PRODUCTION ANALYSIS"}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PRO OPTICS ENGINE</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-8 space-y-6 relative">
                        {/* Technical Breakdown */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                                <Monitor size={14} />
                                {language === "tr" ? "OPTİK KARAKTERİSTİK" : "OPTICAL CHARACTERISTICS"}
                            </label>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-zinc-300 leading-relaxed italic">
                                {analyzedAesthetic}
                            </div>
                        </div>

                        {/* Final Prompt Construction */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} />
                                {language === "tr" ? "BİRLEŞTİRİLMİŞ PROMPT" : "COMBINED PROMPT"}
                            </label>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-zinc-400 h-32 overflow-y-auto scrollbar-thin">
                                <div className="space-y-2">
                                    <p><span className="text-violet-500">SCENE:</span> {selectedBackground?.prompt}</p>
                                    <p><span className="text-violet-500">STYLE:</span> {prompt || "None"}</p>
                                    <p><span className="text-violet-500">OPTICS:</span> {analyzedAesthetic}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="ghost"
                                className="flex-1 h-12 rounded-2xl border border-white/5 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
                                onClick={() => setShowApprovalDialog(false)}
                            >
                                {language === "tr" ? "İPTAL" : "CANCEL"}
                            </Button>
                            <Button
                                className="flex-[2] h-12 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                onClick={executeGeneration}
                            >
                                {language === "tr" ? "ÜRETİMİ BAŞLAT" : "START PRODUCTION"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROCESSING OVERLAY */}
            {isAnalyzing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-t-4 border-violet-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-violet-600 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black mt-8 tracking-tighter uppercase italic">{language === "tr" ? "TEKNİK ANALİZ" : "TECHNICAL ANALYSIS"}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                        {activeCamera.name} // {activeLens.name} // {focalLength}MM
                    </p>
                </div>
            )}
        </div>
    );
}
