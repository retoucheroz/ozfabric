"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Upload, Plus, Loader2, Trash2, Edit2, ChevronRight, ChevronLeft, Sparkles, User, Image as ImageIcon, Camera, RotateCw, X, Maximize2, FileText, ShoppingBag, Gem, MoveHorizontal, Glasses, Footprints, Shirt, ScanLine, Scissors, Ruler, Download
} from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

// Preset Models
const MODEL_PRESETS = [
    { id: 1, src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=300&fit=crop", label: "Female 1", gender: "female" },
    { id: 2, src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop", label: "Male 1", gender: "male" },
    { id: 3, src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=300&fit=crop", label: "Female 2", gender: "female" },
    { id: 4, src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=300&fit=crop", label: "Male 2", gender: "male" },
    { id: 5, src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=300&fit=crop", label: "Female 3", gender: "female" },
    { id: 6, src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=300&fit=crop", label: "Male 3", gender: "male" },
];

// Define UserAddedPrompt state at module level or inside component?
// Inside component is better.


// Background Presets
const BACKGROUND_PRESETS = [
    { id: "studio", label: "Studio White", labelTr: "Stüdyo Beyaz", preview: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=200&h=200&fit=crop" },
    { id: "street", label: "Urban Street", labelTr: "Şehir Sokağı", preview: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop" },
    { id: "nature", label: "Nature", labelTr: "Doğa", preview: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop" },
    { id: "beach", label: "Beach", labelTr: "Plaj", preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop" },
    { id: "gradient", label: "Gradient", labelTr: "Gradyan", preview: null, color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
];

// Studio Steps Component for Loading Animation - Realistic 60-80 second process
const STUDIO_STEPS_TR = [
    { icon: "🚪", text: "Stüdyo kapısı açılıyor...", detail: "Set hazırlanıyor" },
    { icon: "🔌", text: "Ekipmanlar açılıyor...", detail: "Sistemler kontrol ediliyor" },
    { icon: "💡", text: "Ana ışıklar kuruluyor...", detail: "Key light pozisyonlanıyor" },
    { icon: "✨", text: "Fill light ayarlanıyor...", detail: "Gölge dengeleniyor" },
    { icon: "🌟", text: "Rim light ekleniyor...", detail: "Kontur aydınlatması" },
    { icon: "🎚️", text: "Işık şiddeti kalibre ediliyor...", detail: "Exposure ölçülüyor" },
    { icon: "📸", text: "Kamera ayarları yapılıyor...", detail: "ISO, aperture, shutter" },
    { icon: "🔍", text: "Odaklama kontrol ediliyor...", detail: "Auto-focus kalibrasyonu" },
    { icon: "👔", text: "Kıyafetler steamer ile ütüleniyor...", detail: "Kırışıklıklar gideriliyor" },
    { icon: "🧵", text: "Son dikişler kontrol ediliyor...", detail: "Detaylar inceleniyor" },
    { icon: "📐", text: "Styling düzenleniyor...", detail: "Fit ayarlanıyor" },
    { icon: "🎨", text: "Renk kartı ile beyaz dengesi...", detail: "White balance ayarı" },
    { icon: "👤", text: "Model set'e alınıyor...", detail: "Pozisyon ayarı" },
    { icon: "💄", text: "Son makyaj rötuşları...", detail: "Parlamalar kontrol ediliyor" },
    { icon: "📋", text: "Test çekimi yapılıyor...", detail: "Histogram kontrol" },
    { icon: "🖥️", text: "AI render başlatılıyor...", detail: "GPU hesaplaması" },
    { icon: "⚙️", text: "Görüntü işleniyor...", detail: "Neural network aktif" },
    { icon: "🎞️", text: "Son rötuşlar uygulanıyor...", detail: "Post-processing" },
    { icon: "📷", text: "Fotoğraf oluşturuluyor...", detail: "Export hazırlanıyor" },
];

const STUDIO_STEPS_EN = [
    { icon: "🚪", text: "Opening studio...", detail: "Preparing set" },
    { icon: "🔌", text: "Powering up equipment...", detail: "Running system checks" },
    { icon: "💡", text: "Setting up key light...", detail: "Positioning main light" },
    { icon: "✨", text: "Adjusting fill light...", detail: "Balancing shadows" },
    { icon: "🌟", text: "Adding rim light...", detail: "Creating contour" },
    { icon: "🎚️", text: "Calibrating light intensity...", detail: "Measuring exposure" },
    { icon: "📸", text: "Configuring camera...", detail: "ISO, aperture, shutter" },
    { icon: "🔍", text: "Checking focus...", detail: "Auto-focus calibration" },
    { icon: "👔", text: "Steaming garments...", detail: "Removing wrinkles" },
    { icon: "🧵", text: "Final stitch check...", detail: "Inspecting details" },
    { icon: "📐", text: "Adjusting styling...", detail: "Perfecting fit" },
    { icon: "🎨", text: "White balance with color card...", detail: "Color calibration" },
    { icon: "👤", text: "Model entering set...", detail: "Taking position" },
    { icon: "💄", text: "Final makeup touchups...", detail: "Checking shine" },
    { icon: "📋", text: "Test shot...", detail: "Histogram check" },
    { icon: "🖥️", text: "Starting AI render...", detail: "GPU processing" },
    { icon: "⚙️", text: "Processing image...", detail: "Neural network active" },
    { icon: "🎞️", text: "Applying final touches...", detail: "Post-processing" },
    { icon: "📷", text: "Generating photo...", detail: "Preparing export" },
];

function StudioSteps({ language }: { language: string }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const steps = language === "tr" ? STUDIO_STEPS_TR : STUDIO_STEPS_EN;

    // 19 steps over ~70 seconds = ~3.7 seconds per step
    const stepDuration = 3700;
    const estimatedTotal = 70; // seconds

    useEffect(() => {
        // Step timer
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
                // Don't loop - stay on last step until API responds
                if (prev >= steps.length - 1) return prev;
                return prev + 1;
            });
        }, stepDuration);

        // Elapsed time counter
        const timeInterval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => {
            clearInterval(stepInterval);
            clearInterval(timeInterval);
        };
    }, [steps.length]);

    const progress = Math.min((currentStep / (steps.length - 1)) * 100, 100);
    const estimatedRemaining = Math.max(estimatedTotal - elapsedTime, 0);

    return (
        <div className="w-full space-y-6">
            {/* Current Step Display */}
            <div className="text-center space-y-1">
                <div className="text-5xl mb-3" style={{ animation: 'pulse 1s ease-in-out infinite' }}>
                    {steps[currentStep].icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                    {steps[currentStep].text}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {steps[currentStep].detail}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
                <div className="h-2 w-full bg-zinc-800 overflow-hidden rounded-full">
                    <div
                        className="h-full bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}%</span>
                    <span>
                        {language === "tr"
                            ? `~${estimatedRemaining} saniye kaldı`
                            : `~${estimatedRemaining}s remaining`}
                    </span>
                </div>
            </div>

            {/* Step Indicators - Compact */}
            <div className="flex justify-center gap-1 flex-wrap max-w-[280px] mx-auto">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep
                            ? 'bg-violet-500 scale-150'
                            : idx < currentStep
                                ? 'bg-green-500'
                                : 'bg-zinc-700'
                            }`}
                    />
                ))}
            </div>

            {/* Elapsed Time */}
            <p className="text-xs text-center text-muted-foreground/70">
                {language === "tr"
                    ? `Geçen süre: ${elapsedTime}s • Adım ${currentStep + 1}/${steps.length}`
                    : `Elapsed: ${elapsedTime}s • Step ${currentStep + 1}/${steps.length}`}
            </p>
        </div>
    );
}


// Pose Presets
const POSE_PRESETS = [
    { id: "standing", label: "Standing", labelTr: "Ayakta", icon: "🧍", preview: null },
    { id: "walking", label: "Walking", labelTr: "Yürüyen", icon: "🚶", preview: null },
    { id: "sitting", label: "Sitting", labelTr: "Oturan", icon: "🪑", preview: null },
    { id: "hands-hips", label: "Hands on Hips", labelTr: "Eller Belde", icon: "💪", preview: null },
    { id: "casual", label: "Casual", labelTr: "Günlük", icon: "😎", preview: null },
    { id: "dynamic", label: "Dynamic", labelTr: "Dinamik", icon: "⚡", preview: null },
];

const ANGLE_PRESETS = [
    { id: "front-3/4", label: "Front 3/4", labelTr: "Ön 3/4" },
    { id: "back-3/4", label: "Back 3/4", labelTr: "Arka 3/4" },
];

// Full list of Aspect Ratios
// Full list of Aspect Ratios
const ASPECT_RATIOS = [
    { id: "1:1", label: "1:1", labelTr: "1:1 (Kare)" },
    { id: "2:3", label: "2:3", labelTr: "2:3 (Portre)" },
    { id: "3:4", label: "3:4", labelTr: "3:4 (Portre)" },
    { id: "4:3", label: "4:3", labelTr: "4:3 (Yatay)" },
    { id: "16:9", label: "16:9", labelTr: "16:9" },
    { id: "9:16", label: "9:16", labelTr: "9:16" },
];

// Full list of Resolutions
const RESOLUTION_OPTIONS = [
    { id: "1K", label: "1K Standard", labelTr: "1K Standart", credits: 4 },
    { id: "2K", label: "2K High", labelTr: "2K Yüksek", credits: 4 },
    { id: "4K", label: "4K Ultra", labelTr: "4K Ultra", credits: 8 },
];

export default function PhotoshootPage() {
    const { projects, addProject, deductCredits, models } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Smart Workflow State
    // Smart Workflow State
    const [productName, setProductName] = useState("");
    const [workflowType, setWorkflowType] = useState<"upper" | "lower" | "dress" | "set">("upper");

    // Asset State
    const [assets, setAssets] = useState<{ [key: string]: string | null }>({
        model: null,
        background: null,
        main_product: null, // For simple mode
        pose: null,
        top_front: null,
        bottom_front: null,
        shoes: null,
        top_back: null,
        bottom_back: null,
        jacket: null,
        bag: null,
        glasses: null,
        hat: null,
        jewelry: null,
        belt: null, // NEW: Belt support
        inner_wear: null // NEW: Inner wear support   
    });

    // Phase 3: Button/Zipper State
    const [buttonsOpen, setButtonsOpen] = useState(false);
    const [closureType, setClosureType] = useState<'buttons' | 'zipper' | 'none'>('buttons');

    // Phase 3: Prompt Editor
    const [userAddedPrompt, setUserAddedPrompt] = useState("");

    // Analyzed Pose & Product Descriptions
    const [poseDescription, setPoseDescription] = useState<string | null>(null);
    const [poseStickman, setPoseStickman] = useState<string | null>(null); // NEW: Stickman for ControlNet
    const [productDescription, setProductDescription] = useState<string | null>(null);
    const [fitDescription, setFitDescription] = useState<string | null>(null);

    // Phase 4: Tuck Logic (Default Untucked false)
    const [tucked, setTucked] = useState(false);
    const [hairBehindShoulders, setHairBehindShoulders] = useState(false);




    const [poseFocus, setPoseFocus] = useState<'upper' | 'full' | 'lower' | 'closeup'>('full');
    const [detailView, setDetailView] = useState<'front' | 'angled' | 'back'>('front');

    // AUTO-SET poseFocus based on workflowType
    // Upper body products → cowboy shot (upper focus)
    // Lower/dress/set → full body shot
    useEffect(() => {
        if (workflowType === 'upper') {
            setPoseFocus('upper'); // Cowboy shot for upper body products
        } else {
            setPoseFocus('full'); // Full body for lower/dress/set
        }
    }, [workflowType]);

    // === IMAGE RESIZE CONFIGURATION ===
    const getMaxSizeForAsset = (key: string): number => {
        // Model and main product fronts: 2048px
        if (['model', 'main_product', 'top_front', 'bottom_front', 'detail_1', 'detail_2', 'detail_3'].includes(key)) {
            return 2048;
        }
        // Back views and inner wear: 1536px
        if (['top_back', 'bottom_back', 'inner_wear', 'background', 'backRefUpload', 'fit_pattern'].includes(key)) {
            return 1536;
        }
        // Pose reference: 1024px
        if (key === 'pose') {
            return 1024;
        }
        // Default for accessories: 1536px
        return 1536;
    };

    // === RESIZE IMAGE UTILITY ===
    const resizeImage = (file: File, maxSize: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    let { width, height } = img;

                    // Only resize if larger than maxSize
                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }

                    // Use high quality resizing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to JPEG for smaller file size (quality 0.92)
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    console.log(`Resized ${file.name}: ${img.naturalWidth}x${img.naturalHeight} → ${width}x${height}`);
                    resolve(resizedDataUrl);
                };

                img.onerror = () => reject(new Error('Image load failed'));
                img.src = e.target?.result as string;
            };

            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    };

    // Auto-detect workflow type
    useEffect(() => {
        const lowerKeywords = ["pantolon", "etek", "şort", "jean", "trousers", "skirt", "shorts", "denim", "tayt"];
        const isLower = lowerKeywords.some(k => productName.toLowerCase().includes(k));
        setWorkflowType(isLower ? "lower" : "upper");

        // Auto-set focus based on product
        // If upper garment, focus upper. If lower garment, need full body to see it.
        setPoseFocus(isLower ? 'full' : 'upper');
    }, [productName]);

    const handleAssetUpload = async (key: string, file: File) => {
        try {
            const maxSize = getMaxSizeForAsset(key);
            const resizedDataUrl = await resizeImage(file, maxSize);
            setAssets(prev => ({ ...prev, [key]: resizedDataUrl }));

            // Analyze Pose if uploaded to 'pose' slot
            // AUTO-CONVERT TO STICKMAN immediately
            if (key === 'pose') {
                setPoseDescription(null); // Reset previous analysis
                // AUTO-CONVERT: Stickman'e çevir
                try {
                    toast.info(language === "tr" ? "Stickman oluşturuluyor..." : "Converting to Stickman...");
                    const res = await fetch("/api/pose", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image_url: resizedDataUrl })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.pose_image) {
                            // Replace with stickman
                            setAssets(prev => ({ ...prev, pose: data.pose_image }));
                            setPoseStickman(data.pose_image);
                            setPoseDescription("Use stickman reference");
                            toast.success(language === "tr" ? "Stickman oluşturuldu!" : "Stickman created!");
                        }
                    } else {
                        console.error("Stickman API Error:", res.status, res.statusText);
                        toast.error(language === "tr" ? `Stickman hatası: ${res.status}` : `Stickman failed: ${res.status}`);
                    }
                } catch (e: any) {
                    console.error("Stickman conversion failed:", e);
                    toast.error(`Error: ${e.message}`);
                }
            }

            // Analyze Product if uploaded to main slots, Details, OR bottom_front (for lower workflow)
            if (key === 'main_product' || key === 'top_front' || key === 'detail_1' || key === 'detail_2' || key === 'bottom_front') {
                if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') {
                    setProductDescription(null); // Reset previous analysis only if main product changes
                    setUserAddedPrompt(""); // Reset manual prompt on new product upload
                }
                analyzeProduct(file);
            }

            // Analyze Fit/Pattern if uploaded to fit_pattern slot
            if (key === 'fit_pattern') {
                setFitDescription(null); // Reset previous analysis
                analyzeFit(file);
            }
        } catch (error) {
            console.error('Image resize failed:', error);
            toast.error(language === "tr" ? "Görsel işlenemedi" : "Image processing failed");
        }
    };

    const analyzeProduct = async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                toast.info(language === "tr" ? "Kumaş & Doku analiz ediliyor..." : "Analyzing fabric & texture...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: base64,
                        type: 'techPack',
                        language
                    })
                });

                if (!res.ok) throw new Error("Product Analysis failed");

                const data = await res.json();
                // Extract relevant fabric info from JSON
                if (data.data) {
                    if (data.data.productName) setProductName(data.data.productName);

                    let desc = "";

                    // Priority: Use the "Textile Technologist" formatted visualPrompt
                    if (data.data.visualPrompt) {
                        desc = data.data.visualPrompt;
                    } else {
                        // Fallback to old format
                        desc = `Fabric: ${data.data.fabric?.main}, ${data.data.fabric?.finish}. Texture: ${data.data.designNotes}.`;
                    }

                    setProductDescription(desc);

                    // Auto-detect closure type (buttons vs zipper)
                    if (data.data.closureType) {
                        const detected = data.data.closureType.toLowerCase();
                        if (detected.includes('zipper') || detected.includes('zip')) {
                            setClosureType('zipper');
                        } else if (detected.includes('button')) {
                            setClosureType('buttons');
                        } else {
                            setClosureType('none');
                        }
                        console.log("Detected closure type:", data.data.closureType);
                    }

                    toast.success(language === "tr" ? "Ürün analizi tamamlandı" : "Product analysis complete");
                    console.log("Product Analysis:", desc);
                }
            } catch (err) {
                console.error("Product analysis error:", err);
                // Don't toast error to avoid spamming user if API fails silently
            }
        };
        reader.readAsDataURL(file);
    };

    const analyzePose = async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                toast.info(language === "tr" ? "Poz analiz ediliyor..." : "Analyzing pose...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: base64,
                        type: 'pose',
                        language
                    })
                });

                if (!res.ok) throw new Error("Analysis failed");

                const data = await res.json();
                if (data.data?.description) {
                    setPoseDescription(data.data.description);
                    toast.success(language === "tr" ? "Poz analizi tamamlandı" : "Pose analysis complete");
                }
            } catch (err) {
                console.error("Pose analysis error:", err);
                toast.error(language === "tr" ? "Poz analizi başarısız" : "Pose analysis failed");
            }
        };
        reader.readAsDataURL(file);
    };

    // Manual Stickman Conversion
    const convertToStickman = async () => {
        const currentPose = assets.pose;
        if (!currentPose) return;

        try {
            toast.info(language === "tr" ? "Stickman oluşturuluyor..." : "Applying Skeletal Pose...");

            // Assume currentPose is base64 or url. If url, we pass it. If base64 we pass it.
            // Our api/pose handles image_url which accepts data uri.

            const res = await fetch("/api/pose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: currentPose })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || `Stickman failed: ${res.status}`);
            }
            const data = await res.json();

            if (data.pose_image) {
                const stickmanUrl = data.pose_image;

                // 1. Replace Asset Visual
                setAssets(prev => ({ ...prev, pose: stickmanUrl }));

                // 2. Set State
                setPoseStickman(stickmanUrl);

                // 3. Add to Library (Both original and stickman if possible, but here just stickman)
                if (!sessionLibrary.includes(stickmanUrl)) {
                    setSessionLibrary(prev => [stickmanUrl, ...prev]);
                }

                toast.success(language === "tr" ? "Poz dönüştürüldü!" : "Pose converted to Stickman!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to convert pose");
        }
    };

    // FIT/PATTERN ANALYSIS for pants/jeans
    const analyzeFit = async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                toast.info(language === "tr" ? "Kalıp/Fit analiz ediliyor..." : "Analyzing fit/pattern...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: base64,
                        type: 'fit',
                        language
                    })
                });

                if (!res.ok) throw new Error("Fit analysis failed");

                const data = await res.json();
                if (data.data?.fitDescription) {
                    setFitDescription(data.data.fitDescription);
                    toast.success(language === "tr" ? "Kalıp analizi tamamlandı" : "Fit analysis complete");
                    console.log("Fit Description:", data.data.fitDescription);
                }
            } catch (err) {
                console.error("Fit analysis error:", err);
                toast.error(language === "tr" ? "Kalıp analizi başarısız" : "Fit analysis failed");
            }
        };
        reader.readAsDataURL(file);
    };

    const removeAsset = (key: string) => {
        setAssets(prev => ({ ...prev, [key]: null }));
        if (key === 'pose') {
            setPoseDescription(null);
            setPoseStickman(null);
        }
        if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') setProductDescription(null);
        if (key === 'fit_pattern') setFitDescription(null);
    };

    // State for Generation
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImages, setResultImages] = useState<string[] | null>(null);
    const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'complete'>('idle');
    const [previewData, setPreviewData] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [pendingOptions, setPendingOptions] = useState<any>(null);

    const handleGenerate = async (options: { isThreeAngles?: boolean, isReStyling?: boolean, targetView?: string } = {}) => {
        const { isThreeAngles = false, isReStyling = false, targetView } = options;

        if (isReStyling) {
            setStylingIteration(prev => prev + 1);
        } else if (!isThreeAngles) {
            setStylingIteration(0);
        }

        if (!assets.model) {
            toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin" : "Please upload a model image");
            return;
        }

        setIsProcessing(true);
        if (!isReStyling && !isThreeAngles) setResultImages(null);

        // Auto-close asset drawer
        setActiveLibraryAsset(null);

        // === PRE-ANALYSIS STEP ===
        // Analyze assets if descriptions are missing
        let currentPoseDesc = poseDescription;
        let currentProductDesc = productDescription;
        let currentClosureType = closureType;
        let currentProductName = productName;

        if (!isReStyling) {
            // 1. Pose Analysis
            // FIX: If stickman exists, skip analysis and use generic description
            if (poseStickman) {
                if (!currentPoseDesc) {
                    currentPoseDesc = "Use stickman reference";
                    setPoseDescription(currentPoseDesc);
                }
            } else if (assets.pose && !currentPoseDesc) {
                toast.info(language === "tr" ? "Poz analizi yapılıyor..." : "Analyzing pose...");
                try {
                    const res = await fetch("/api/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: assets.pose, type: 'pose', language })
                    });
                    const data = await res.json();
                    if (data.data?.description) {
                        currentPoseDesc = data.data.description;
                        setPoseDescription(currentPoseDesc);
                    }
                } catch (e) { console.error("Pose analysis failed", e); }
            }

            // 2. Product Analysis
            // Select the correct asset based on WORKFLOW TYPE state (not keyword detection)
            // workflowType state is set by user in the UI (upper/lower/dress/set)
            let targetAsset: string | null = null;
            if (workflowType === 'lower') {
                targetAsset = assets.bottom_front || assets.main_product;
            } else if (workflowType === 'dress') {
                targetAsset = assets.dress_front || assets.main_product;
            } else if (workflowType === 'set') {
                // Set: Use main_product or fallback
                targetAsset = assets.main_product || assets.top_front || assets.bottom_front;
            } else {
                // Upper or default
                targetAsset = assets.top_front || assets.main_product;
            }

            if (targetAsset && !currentProductDesc) {
                toast.info(language === "tr" ? "Ürün analizi yapılıyor..." : "Analyzing garment...");
                try {
                    // Determine analysis mode based on selection
                    // Use 'fabric' mode generally to get details
                    const res = await fetch("/api/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: targetAsset, type: 'fabric', language })
                    });
                    const data = await res.json();
                    if (data.data) {
                        if (data.data.visualPrompt) {
                            currentProductDesc = data.data.visualPrompt;
                            setProductDescription(currentProductDesc);
                        }
                        if (data.data.productName && !currentProductName) {
                            currentProductName = data.data.productName;
                            setProductName(currentProductName);
                        }
                        if (data.data.closureType) {
                            const detected = data.data.closureType.toLowerCase();
                            if (detected.includes('zipper') || detected.includes('zip')) {
                                currentClosureType = 'zipper';
                                setClosureType('zipper');
                            } else if (detected.includes('button')) {
                                currentClosureType = 'buttons';
                                setClosureType('buttons');
                            } else {
                                currentClosureType = 'none';
                                setClosureType('none');
                            }
                        }
                    }
                } catch (e) { console.error("Product analysis failed", e); }
            }
        }

        // If product name is still missing, warn user but proceed if we have images
        if (!currentProductName && !productName) {
            // Optional: Force user to enter name?
            // toast.warning("Product name missing, using generic name.");
            currentProductName = "Fashion Garment";
        }


        try {
            const detailImages = [assets.detail_1, assets.detail_2, assets.detail_3].filter(Boolean);

            // Workflow type is now manually selected via state 'workflowType'
            // No need to calculate it from keywords.

            let currentFocus = poseFocus;
            // Alternating logic for "New Styling"
            if (!isThreeAngles && generationStage === 'complete') {
                // If we are generating AGAIN (New Styling), toggle focus
                const base = 'full';
                const alternate = 'upper';
                // 0=Full, 1=Upper, 2=Full...
                currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
            }

            // Determine gender
            const selectedModel = MODEL_PRESETS.find(m => m.src === assets.model);
            let modelGender = selectedModel ? selectedModel.gender : "model";

            // If custom model, try to infer gender from text inputs
            if (modelGender === "model") {
                const combinedText = (currentProductName + " " + (assets.prompt || "")).toLowerCase();
                if (combinedText.includes("erkek") || combinedText.includes("bay ") || combinedText.includes("male") || combinedText.includes("man")) {
                    modelGender = "male";
                } else if (combinedText.includes("kadın") || combinedText.includes("bayan") || combinedText.includes("female") || combinedText.includes("woman")) {
                    modelGender = "female";
                }
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName: currentProductName || productName, // Use analyzed or manual name
                    workflowType, // Use STATE
                    uploadedImages: assets,
                    detailImages,
                    gender: gender || modelGender,
                    hasOwnOutfit,
                    prompt: assets.prompt,
                    poseFocus: currentFocus,
                    isAngles: isThreeAngles,
                    resolution,
                    aspectRatio,
                    buttonsOpen: buttonsOpen, // Always pass state
                    tucked: tucked, // Always pass tucked state for all workflows
                    hairBehindShoulders, // Hair position
                    closureType: currentClosureType,
                    productDescription: currentProductDesc,
                    poseDescription: currentPoseDesc,
                    poseStickman, // Pass stickman URL
                    fitDescription,
                    detailView, // Pass Detail View Angle
                    targetView, // Pass specific target view for 3-angle-mode single generation
                    preview: true // Phase 3: FORCE PREVIEW first
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || errData.message || "Generation failed");
            }

            const data = await response.json();

            // Direct success handling
            if (data.images) {
                setResultImages(data.images);
                setGenerationStage('complete');
                toast.success(language === "tr" ? "Oluşturuldu!" : "Generated!");
                setIsProcessing(false);
                return;
            }

            if (data.status === "preview") {
                setPreviewData(data.previews); // Array of preview objects
                setPendingOptions(options); // Store options to re-use for confirmation
                setShowPreview(true);
                setIsProcessing(false); // Stop loading, show modal
                return;
            }

            // Fallback if preview flag ignored (should not happen)
            if (data.images) {
                setResultImages(data.images);
                setGenerationStage('complete');
                toast.success("Generated!");

                // PERSISTENCE (Auto-Save) - Fallback
                if (data.images && data.images.length > 0) {
                    data.images.forEach((img: string) => {
                        addProject({
                            title: `Photoshoot - ${productName} - ${new Date().toLocaleTimeString()}`,
                            type: "Photoshoot",
                            imageUrl: img,
                            description: `Generated for ${productName} (${workflowType})`
                        });
                    });
                }
            }

        } catch (error) {
            console.error("Generation error:", error);
            // @ts-ignore
            toast.error(error.message || (language === "tr" ? "Oluşturma başarısız oldu" : "Generation failed"));
            setIsProcessing(false);
        }
    };

    const handleConfirmGeneration = async () => {
        setShowPreview(false);
        setIsProcessing(true);
        const isReStyling = pendingOptions?.isReStyling || false;
        if (!isReStyling && !pendingOptions?.isThreeAngles) setResultImages(null);

        try {
            // We need to re-call the API but with preview: false. 
            // We need to reconstruct the payload logic or just pass the SAME logic?
            // The API is stateless, so we must send all data again.
            // To reuse logic, we can extract the payload construction, OR just re-run the body construction.
            // Since `handleGenerate` uses current state `assets`, `productName`, etc., and they haven't changed, 
            // we can just re-run the fetch.

            // Issue: `handleGenerate` had local variables like `workflowType` derived from state.
            // We should probably allow `handleGenerate` to accept a `skipPreview` flag?

            // We need to pass the EDITED prompt if it changed.
            // But `executeRealGeneration` calls API which REBUILDS prompt.
            // So we need to pass `editedPrompt` as an override/append.

            // Map the edits from `previewData` to a simpler structure? 
            // Actually, since we only edit ONE prompt usually (or multiple), 
            // for simplicity let's assume valid detailed edit for now.
            // If the user edited specific text, we pass that as `editedPrompt` param.
            // Let's grab the first prompt's text as "extra instruction" maybe?
            // Or ideally, `customPrompt` (assets.prompt) + `editedSuffix`.

            // Simplest approach: Pass an `editedPrompt` string that backend APPENDS.
            // In the modal, we likely edited the FULL text.
            // So we might need `editedPrompt` to be the *difference* or just append.
            // User requirement: "Ekleyeceğim prompt varolana ek olarak işlensin." -> Append.

            // So in the modal we should have an "Additional Prompt" field? 
            // Or edit the full thing? "final promptuna düzenleme yapabileyim" implies editing result.
            // If technical constraint prevents replacing full prompt easily on backend (dynamic logic),
            // let's pass the "Extra" text.

            // For this implementation: Let's extract the "User Edits".
            // If the user modified the text in the text area, we send that entire string as `editedPrompt`.
            // But backend appends it. So if I send "Full Prompt", it becomes "Full Prompt Full Prompt".
            // Backend change: `if (editedPrompt) finalPrompt += editedPrompt`.

            // Let's use a specialized state `userAddedPrompt` in the Preview Dialog.

            await executeRealGeneration({
                ...pendingOptions,
                targetView: pendingOptions?.targetView, // Critical: Pass targetView for single-angle mode
                editedPrompt: userAddedPrompt // New param
            });

        } catch (error) {
            console.error(error);
            toast.error("Failed");
            setIsProcessing(false);
        }
    };

    const executeRealGeneration = async (options: { isThreeAngles?: boolean, isReStyling?: boolean, targetView?: string, editedPrompt?: string } = {}) => {
        const { isThreeAngles = false, isReStyling = false, targetView, editedPrompt } = options;

        // Re-derive logic (copy-paste from handleGenerate mostly, or refactor?)
        // Refactoring `handleGenerate` to separate function is risky with tool limits.
        // I will implement the fetch call here directly using current state.

        const detailImages = [assets.detail_1, assets.detail_2].filter(Boolean);
        const lowerKeywords = ['pantolon', 'etek', 'şort', 'jean', 'trousers', 'skirt', 'short', 'denim', 'tayt', 'legging'];
        const workflowType = lowerKeywords.some(k => productName.toLowerCase().includes(k)) ? 'lower' : 'upper';

        let currentFocus = poseFocus;
        if (!isThreeAngles && generationStage === 'complete') {
            const base = 'full';
            const alternate = 'upper';
            currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
        }

        const selectedModel = MODEL_PRESETS.find(m => m.src === assets.model);
        let modelGender = selectedModel ? selectedModel.gender : "model";
        if (modelGender === "model") {
            const combinedText = (productName + " " + (assets.prompt || "")).toLowerCase();
            if (combinedText.includes("erkek") || combinedText.includes("bay ") || combinedText.includes("male") || combinedText.includes("man")) {
                modelGender = "male";
            } else if (combinedText.includes("kadın") || combinedText.includes("bayan") || combinedText.includes("female") || combinedText.includes("woman")) {
                modelGender = "female";
            }
        }

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productName,
                workflowType,
                uploadedImages: assets,
                gender: gender || modelGender, // Pass manual gender OR inferred
                prompt: assets.prompt, // Use assets.prompt
                poseFocus: poseFocus, // Use state directly
                resolution: resolution, // Pass explicitly
                aspectRatio: aspectRatio, // Pass explicitly
                isAngles: isThreeAngles,
                preview: false, // REAL GENERATION
                poseDescription, // Pass analyzed pose
                poseStickman, // Pass stickman URL
                buttonsOpen: buttonsOpen, // Always pass
                tucked: tucked, // Always pass tucked state
                hairBehindShoulders, // Hair position
                detailView, // Pass Detail View selection
                targetView, // Pass single-view target (front/side/back)
                productDescription, // Pass fabric analysis
                fitDescription, // Pass fit analysis
                editedPrompt // Pass user additional prompt
            })
        });

        if (!response.ok) {
            let errorMessage = "Generation failed";
            try {
                const err = await response.json();
                errorMessage = err.error || err.message || errorMessage;
            } catch (jsonErr) {
                errorMessage = `HTTP Error ${response.status} - ${response.statusText}`;
            }
            console.error("GENERATE API ERROR:", errorMessage);
            throw new Error(errorMessage);
        }
        const data = await response.json();

        if (data.images) {
            setResultImages(data.images);
            setGenerationStage('complete');

            toast.success(isThreeAngles
                ? (language === "tr" ? "3'lü açı seti oluşturuldu!" : "3-Angle set generated!")
                : (language === "tr" ? "Styling görseli oluşturuldu!" : "Styling shot generated!")
            );

            // PERSISTENCE (Auto-Save) - REAL Generation
            data.images.forEach((img: string) => {
                addProject({
                    title: `Photoshoot - ${productName} - ${new Date().toLocaleTimeString()}`,
                    type: "Photoshoot",
                    imageUrl: img,
                    description: `Generated for ${productName} (${workflowType})`
                });
            });

            if (!isThreeAngles) setStylingIteration(prev => prev + 1);
        }
        setIsProcessing(false);
    };

    const handleNewStyling = () => handleGenerate({ isReStyling: true });
    const handleThreeAngles = () => handleGenerate({ isThreeAngles: true });
    const handleUpscale = (imgUrl: string) => {
        // Navigate or show upscale modal
        toast.info(language === "tr" ? "Upscale sayfasına yönlendiriliyor..." : "Navigating to Upscale...");
        // For now, simple link
        window.open(`/upscale?img=${encodeURIComponent(imgUrl)}`, '_blank');
    };


    // State for Settings
    const [resolution, setResolution] = useState("4K"); // Default 4K
    const [aspectRatio, setAspectRatio] = useState("2:3"); // Default 2:3
    const [gender, setGender] = useState<string>(""); // "" = Unspecified, "male", "female"
    const [hasOwnOutfit, setHasOwnOutfit] = useState(false)
    const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(false); // Toggle for simple/advanced mode

    // State for Library Drawer
    const [activeLibraryAsset, setActiveLibraryAsset] = useState<string | null>(null);
    const [activeGroup, setActiveGroup] = useState<'product' | 'accessories' | null>(null); // For nested drawer
    const [internalAsset, setInternalAsset] = useState<string | null>(null); // For persistence during animation
    const [libraryTab, setLibraryTab] = useState("templates"); // templates | prompt | assets
    const [sessionLibrary, setSessionLibrary] = useState<string[]>([]); // Max 3 items per session

    // Sync internal asset for animation persistence
    useEffect(() => {
        if (activeLibraryAsset) setInternalAsset(activeLibraryAsset);
        // Reset tab to library or templates appropriately
        if (activeLibraryAsset) {
            if (['model', 'pose'].includes(activeLibraryAsset)) {
                setLibraryTab("templates");
            } else {
                setLibraryTab("library");
            }
        }
    }, [activeLibraryAsset]);


    // Library Filter States (Mock)
    const [filterAge, setFilterAge] = useState("All");
    const [filterGender, setFilterGender] = useState("All");
    const [filterEthnicity, setFilterEthnicity] = useState("All");

    // library items mapping
    const getLibraryItems = (assetKey: string) => {
        if (assetKey === 'model') return MODEL_PRESETS.map(m => ({ id: m.id, src: m.src, label: m.label }));
        if (assetKey === 'background') return BACKGROUND_PRESETS.map(b => ({ id: b.id, src: b.preview!, label: language === "tr" ? b.labelTr : b.label }));
        if (assetKey === 'pose') return POSE_PRESETS.map(p => ({ id: p.id, src: p.preview, icon: p.icon, label: language === "tr" ? p.labelTr : p.label }));
        return [];
    };

    const [stylingIteration, setStylingIteration] = useState(0);

    const handleLibrarySelect = (item: any, isUpload: boolean = false) => {
        if (!activeLibraryAsset) return;

        // Add to session library if uploaded and not already full
        if (isUpload && item.src) {
            if (!sessionLibrary.includes(item.src)) {
                // Add to library up to 3 for free (mock limit), but we allow adding more as per "Upgrade" text logic?
                // The requirement: "Kütüphane max 3 görsel kaydedilen bir alan olmalı."
                if (sessionLibrary.length < 3) {
                    setSessionLibrary(prev => [item.src, ...prev]);
                }
            }
        }

        if (item.src) {
            setAssets(prev => ({ ...prev, [activeLibraryAsset]: item.src }));
        } else if (item.icon) {
            // For poses, we might store the icon or a specific ID
            setAssets(prev => ({ ...prev, [activeLibraryAsset]: item.id }));
        }

        // RESET DESCRIPTIONS to prevent stale analysis
        if (activeLibraryAsset === 'pose') setPoseDescription(null);
        if (activeLibraryAsset === 'main_product' || activeLibraryAsset === 'top_front' || activeLibraryAsset === 'bottom_front') setProductDescription(null);
        if (activeLibraryAsset === 'fit_pattern') setFitDescription(null);

        // Logic for navigation after selection - REMOVED so it stays open
        // User request: "X e basmadan ... kaybolmasın geri gitmesin"
        // We do nothing here, letting the user manually Close (X) or Go Back.
    };

    const handleAssetRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeAsset(id);
    };

    // Click outside handler for Library Drawer
    // Click outside handler Removed as requested to only close with X or Back
    // const drawerRef = useRef<HTMLDivElement>(null);
    // useEffect(() => {...}, [activeLibraryAsset]);

    {/* Updated AssetCard: Split Interaction (Direct Upload vs Library) */ }
    const AssetCard = ({ id, label, icon: Icon, required = false }: { id: string, label: string, icon: any, required?: boolean }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleDirectUploadClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            fileInputRef.current?.click();
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                handleAssetUpload(id, e.target.files[0]);
            }
        };

        return (
            <div
                className={`asset-card-trigger relative group h-14 rounded-lg border flex items-center gap-0 overflow-hidden transition-all
                ${assets[id] ? 'border-violet-500 bg-violet-50/10' : 'border-border hover:border-violet-400 hover:bg-muted/50'}
                ${required && !assets[id] ? 'ring-1 ring-red-400/50' : ''}
                ${activeLibraryAsset === id ? 'ring-2 ring-violet-500 border-violet-500 bg-violet-50/20' : ''}
            `}
            >
                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* LEFT: Direct Upload / Preview Area */}
                <div
                    className="h-full w-14 flex items-center justify-center border-r bg-muted/30 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors relative"
                    onClick={handleDirectUploadClick}
                    title={language === "tr" ? "Direkt Yükle" : "Direct Upload"}
                >
                    {assets[id] ? (
                        <>
                            {/* Preview Image */}
                            {assets[id]?.startsWith("data:") || assets[id]?.startsWith("http") || assets[id]?.startsWith("blob:") ? (
                                <img src={assets[id]!} className="w-full h-full object-cover" />
                            ) : (
                                <Icon className="w-5 h-5 text-violet-600" />
                            )}
                            {/* Hover Edit Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-4 h-4 text-white" />
                            </div>
                        </>
                    ) : (
                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-violet-600" />
                    )}
                </div>

                {/* RIGHT: Library / Label Area */}
                <div
                    className="flex-1 h-full flex items-center justify-between px-3 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveLibraryAsset(activeLibraryAsset === id ? null : id);
                    }}
                >
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground truncate">{label}</span>
                        {assets[id] && <span className="text-[10px] text-violet-500 font-medium">{language === "tr" ? "Seçildi" : "Selected"}</span>}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Stickman Button for Pose */}
                        {id === 'pose' && assets[id] && !assets[id]?.includes('fal.media') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    convertToStickman();
                                }}
                                className="text-muted-foreground hover:text-violet-500 transition-colors p-1"
                                title={language === "tr" ? "Çöp Adam'a (Stickman) Çevir" : "Convert to Stickman"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-person-standing"><circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></svg>
                            </button>
                        )}

                        {assets[id] ? (
                            <button
                                onClick={(e) => handleAssetRemove(id, e)}
                                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                title={language === "tr" ? "Kaldır" : "Remove"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <>
                                {required && <span className="text-[10px] text-red-500 font-bold">*</span>}
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] overflow-hidden relative">

            {/* Library Sidebar (Expanded Slide-out) */}
            <div
                // ref={drawerRef} // Ref removed
                className={`absolute left-[420px] top-0 bottom-0 w-80 bg-background border-r shadow-2xl z-10 flex flex-col transition-all duration-300 ease-in-out
                    ${activeLibraryAsset ? 'translate-x-0 opacity-100' : 'translate-x-[-100%] opacity-0 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        {/* Back Button for Nested Navigation */}
                        {(activeLibraryAsset && !['product_group', 'accessories_group'].includes(activeLibraryAsset) && activeGroup) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-1 mr-1"
                                onClick={() => setActiveLibraryAsset(activeGroup === 'product' ? 'product_group' : 'accessories_group')}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        )}

                        <span className="text-sm font-bold truncate max-w-[150px]">
                            {activeLibraryAsset === 'product_group' ? (language === "tr" ? "Ürün" : "Product") :
                                activeLibraryAsset === 'accessories_group' ? (language === "tr" ? "Aksesuarlar" : "Accessories") :
                                    (language === "tr" ? "Seçim Yap" : "Select Asset")}
                        </span>
                        {/* Removed Group Badge as requested */}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setActiveLibraryAsset(null); setActiveGroup(null); }}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* GROUP SELECTION VIEW */}
                {(activeLibraryAsset === 'product_group' || activeLibraryAsset === 'accessories_group') ? (
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {activeLibraryAsset === 'product_group' && (
                            <>
                                <AssetCard id="top_front" label={language === "tr" ? "Üst Ürün Ön Kare" : "Top Front"} icon={FileText} />
                                <AssetCard id="top_back" label={language === "tr" ? "Üst Ürün Arka Kare" : "Top Back"} icon={MoveHorizontal} />
                                <AssetCard id="bottom_front" label={language === "tr" ? "Alt Ürün Ön Kare" : "Bottom Front"} icon={FileText} />
                                <AssetCard id="bottom_back" label={language === "tr" ? "Alt Ürün Arka Kare" : "Bottom Back"} icon={MoveHorizontal} />
                                <div className="my-2 border-t" />
                                <AssetCard id="inner_wear" label={language === "tr" ? "İç Giyim (Opsiyonel)" : "Inner Wear (Optional)"} icon={Shirt} />
                                <div className="my-2 border-t" />
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{language === "tr" ? "Detaylar" : "Details"}</h4>
                                <AssetCard id="detail_1" label={language === "tr" ? "Detay 1 (Kumaş/Doku)" : "Detail 1 (Fabric)"} icon={ScanLine} />
                                <AssetCard id="detail_2" label={language === "tr" ? "Detay 2 (Dikiş/Kesim)" : "Detail 2 (Stitching)"} icon={Scissors} />
                                <AssetCard id="detail_3" label={language === "tr" ? "Detay 3 (Ek Özellik)" : "Detail 3 (Extra)"} icon={Maximize2} />

                            </>
                        )}

                        {activeLibraryAsset === 'accessories_group' && (
                            <>
                                <AssetCard id="jacket" label={language === "tr" ? "Dış Giyim" : "Outerwear"} icon={Shirt} />
                                <AssetCard id="bag" label={language === "tr" ? "Çanta" : "Bag"} icon={ShoppingBag} />
                                <AssetCard id="glasses" label={language === "tr" ? "Gözlük" : "Glasses"} icon={Glasses} />
                                <AssetCard id="hat" label={language === "tr" ? "Şapka" : "Hat"} icon={Sparkles} />
                                <AssetCard id="jewelry" label={language === "tr" ? "Takı" : "Jewelry"} icon={Gem} />
                                <AssetCard id="belt" label={language === "tr" ? "Kemer" : "Belt"} icon={ScanLine} />
                            </>
                        )}
                    </div>
                ) : (
                    /* NORMAL LIBRARY VIEW */
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* POSE FOCUS TOGGLE (Only for Pose) */}
                        {/* POSE FOCUS TOGGLE (Only for Pose) */}
                        {internalAsset === 'pose' && (
                            <div className="px-3 py-2 border-b bg-muted/20 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{language === "tr" ? "Odak Alanı" : "Focus Area"}</span>
                                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                                    <button
                                        onClick={() => setPoseFocus('full')}
                                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${poseFocus === 'full' ? 'bg-background shadow text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {language === "tr" ? "Tam Boy" : "Full Body"}
                                    </button>
                                    <button
                                        onClick={() => setPoseFocus('upper')}
                                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${poseFocus === 'upper' ? 'bg-background shadow text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {language === "tr" ? "Üst Beden" : "Upper Body"}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Tabs value={libraryTab} onValueChange={setLibraryTab} className="flex-1 flex flex-col">
                            <div className="px-3 pt-3">
                                <TabsList className="w-full grid grid-cols-3">
                                    {/* SHOW TEMPLATES ONLY FOR MODEL & POSE */}
                                    {!['model', 'pose'].includes(internalAsset || "") ? (
                                        <>
                                            <TabsTrigger value="library" className="text-xs col-span-1">{language === "tr" ? "Kütüphane" : "Library"}</TabsTrigger>
                                            <TabsTrigger value="assets" className="text-xs col-span-2">{language === "tr" ? "Yükle" : "Upload"}</TabsTrigger>
                                        </>
                                    ) : (
                                        <>
                                            <TabsTrigger value="templates" className="text-xs">{language === "tr" ? "Şablonlar" : "Templates"}</TabsTrigger>
                                            <TabsTrigger value="prompt" className="text-xs">Prompt</TabsTrigger>
                                            <TabsTrigger value="assets" className="text-xs">{language === "tr" ? "Yükle" : "Upload"}</TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                            </div>

                            {/* TAB: LIBRARY (Session Based, Max 3) */}
                            <TabsContent value="library" className="flex-1 overflow-y-auto p-3 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {sessionLibrary.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleLibrarySelect({ src: item })}
                                            className="aspect-[3/4] rounded-lg border bg-muted overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-violet-500"
                                        >
                                            <img src={item} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {sessionLibrary.length === 0 && (
                                        <div className="col-span-2 text-center text-xs text-muted-foreground py-10">
                                            {language === "tr" ? "Kütüphane boş." : "Library is empty."}
                                        </div>
                                    )}
                                </div>
                                {/* Upgrade Warning (Show if 3 items used) */}
                                {sessionLibrary.length >= 3 && (
                                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-center mt-2">
                                        <p className="text-[10px] text-indigo-800 font-medium leading-tight">
                                            {language === "tr" ? "Daha fazla görsel için planınızı yükseltin." : "Upgrade plan to store more images."}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB: TEMPLATES (Only for Model & Pose) */}
                            {['model', 'pose'].includes(internalAsset || "") && (
                                <TabsContent value="templates" className="flex-1 overflow-y-auto p-3 space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {getLibraryItems(internalAsset || "").map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleLibrarySelect(item)}
                                                className="group relative aspect-[3/4] rounded-lg border border-border overflow-hidden cursor-pointer hover:border-violet-500 transition-all"
                                            >
                                                {item.src && <img src={item.src} className="w-full h-full object-cover" />}
                                                {item.icon && !item.src && (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">
                                                        {item.icon}
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-[10px] font-medium truncate backdrop-blur-sm">
                                                    {item.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            )}

                            {/* TAB: UPLOAD (Previously Assets) */}
                            <TabsContent value="assets" className="flex-1 overflow-y-auto p-3 space-y-4">
                                {/* Upload Box */}
                                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 hover:border-violet-500/50 transition-all relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    handleLibrarySelect({ src: reader.result as string }, true);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <div className="p-3 bg-violet-100 dark:bg-violet-900/20 rounded-full">
                                        <Upload className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium">{language === "tr" ? "Yüklemek için Tıkla" : "Click to Upload"}</p>
                                        <p className="text-[10px] text-muted-foreground">{language === "tr" ? "veya sürükleyip bırak" : "or drag and drop"}</p>
                                    </div>
                                </div>

                                {/* Trained LoRAs Section */}
                                {(internalAsset === 'model' || internalAsset === 'pose') && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {language === "tr" ? "Eğitilmiş Modellerim" : "My Trained Models"}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {models.map(model => (
                                                <div
                                                    key={model.id}
                                                    onClick={() => {
                                                        if (model.thumbnailUrl) {
                                                            setAssets(prev => ({ ...prev, [internalAsset!]: model.thumbnailUrl as string }));
                                                        }
                                                        setActiveLibraryAsset(null);
                                                    }}
                                                    className="aspect-square rounded-lg border bg-muted overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-violet-500"
                                                >
                                                    {model.thumbnailUrl ? (
                                                        <img src={model.thumbnailUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 font-bold text-xs p-2 text-center">
                                                            {model.name}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB: PROMPT */}
                            <TabsContent value="prompt" className="flex-1 p-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">{language === "tr" ? "Özel İstem" : "Custom Prompt"}</label>
                                    <textarea
                                        className="w-full h-32 p-2 text-xs rounded-lg border bg-background resize-none focus:ring-1 focus:ring-violet-500"
                                        placeholder={language === "tr" ? "Tam olarak ne istediğinizi tarif edin..." : "Describe exactly what you want..."}
                                    ></textarea>
                                    <Button size="sm" className="w-full text-xs">{language === "tr" ? "İstemi Uygula" : "Apply Prompt"}</Button>
                                    <p className="text-[10px] text-muted-foreground mt-2">
                                        {language === "tr" ? "Bu varlık için özel prompt kullanın." : "Use a custom prompt for this asset slot."}
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            {/* COLUMN 1: Settings & Uploads (Sidebar) */}
            <div className="w-full lg:w-[420px] lg:border-r border-b lg:border-b-0 bg-background flex flex-col shrink-0 relative z-20">
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Page Title */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold">{t("home.photoshootTitle")}</h1>
                        <p className="text-sm text-muted-foreground">{t("home.photoshootDesc")}</p>
                    </div>

                    {/* 1. Product Context & Settings */}
                    <div className="space-y-4">
                        {/* Product Name */}
                        <div className="space-y-4 mb-4">
                            {/* Product Type Selector */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Ürün Tipi" : "Product Type"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={workflowType}
                                    onChange={(e) => setWorkflowType(e.target.value as any)}
                                >
                                    <option value="upper">{language === "tr" ? "Üst Giyim (Ceket, Gömlek, T-shirt)" : "Upper Body (Jacket, Shirt)"}</option>
                                    <option value="lower">{language === "tr" ? "Alt Giyim (Pantolon, Etek, Şort)" : "Lower Body (Pants, Skirt)"}</option>
                                    <option value="dress">{language === "tr" ? "Elbise / Tulum / Kaban" : "Dress / Jumpsuit / Coat"}</option>
                                    <option value="set">{language === "tr" ? "Takım (Alt + Üst)" : "Set (Top + Bottom)"}</option>
                                </select>
                            </div>

                            {/* Product Name Input - EDITABLE */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Ürün Adı" : "Product Name"}</label>
                                <div className="bg-muted/30 p-2 rounded-xl ring-1 ring-border">
                                    <input
                                        type="text"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder={language === "tr" ? "Görsel yüklenince otomatik dolar" : "Auto-detected or type manually"}
                                        className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 p-1 placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid (Resolution & Ratio) */}
                        <div className="space-y-1 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Model Cinsiyeti" : "Model Gender"}</label>
                                {gender && (
                                    <button onClick={() => setGender("")} className="text-[10px] text-red-500 hover:underline">
                                        {language === "tr" ? "Sıfırla" : "Reset"}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    onClick={() => setGender("female")}
                                    className={`cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all ${gender === 'female' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'bg-muted/30 border-transparent hover:bg-muted'}`}
                                >
                                    <span className="text-xs font-medium">{language === "tr" ? "Kadın" : "Female"}</span>
                                </div>
                                <div
                                    onClick={() => setGender("male")}
                                    className={`cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all ${gender === 'male' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-muted/30 border-transparent hover:bg-muted'}`}
                                >
                                    <span className="text-xs font-medium">{language === "tr" ? "Erkek" : "Male"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid (Resolution & Ratio) */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Çözünürlük" : "Resolution"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                >
                                    {RESOLUTION_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{language === "tr" ? opt.labelTr : opt.label}</option>
                                    ))}
                                </select>
                                {/* Credit Cost Display */}
                                <div className="flex items-center gap-1.5 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                                    <p className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                                        {RESOLUTION_OPTIONS.find(r => r.id === resolution)?.credits} {language === "tr" ? "Kredi" : "Credits"}
                                    </p>
                                </div>
                            </div>
                            {/* Aspect Ratio */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "En/Boy Oranı" : "Aspect Ratio"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                >
                                    {ASPECT_RATIOS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{language === "tr" ? opt.labelTr : opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Hair Setting - Only relevant for female or neutral models */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer select-none"
                                onClick={() => setHairBehindShoulders(!hairBehindShoulders)}>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-foreground">{language === "tr" ? "Saç Arkada" : "Hair Behind"}</span>
                                    <span className="text-[10px] text-muted-foreground">{language === "tr" ? "Saçı omuzların arkasına alır" : "Puts hair behind shoulders"}</span>
                                </div>
                                <Switch checked={hairBehindShoulders} onCheckedChange={setHairBehindShoulders} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Visual Assets */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === "tr" ? "Görsel Materyaller" : "Visual Assets"}
                            </h3>

                            {/* Toggle for Outfit Mode */}
                            <div className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => setHasOwnOutfit(!hasOwnOutfit)}>
                                <Switch checked={hasOwnOutfit} onCheckedChange={setHasOwnOutfit} />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {language === "tr" ? "Kombinim Var" : "I have styling"}
                                </span>
                            </div>
                        </div>

                        {/* Modified: Grid Layout for Visual Assets */}
                        <div className="grid grid-cols-2 gap-2">

                            {!hasOwnOutfit ? (
                                /* SIMPLE MODE */
                                <>
                                    <AssetCard id="model" label={language === "tr" ? "Model" : "Model"} icon={User} required />
                                    <AssetCard id="main_product" label={language === "tr" ? "Ürün Görseli" : "Product Image"} icon={Shirt} required />
                                    <div className="col-span-2 space-y-2">
                                        <AssetCard id="background" label={language === "tr" ? "Arka Plan" : "Background"} icon={ImageIcon} />
                                        <AssetCard id="fit_pattern" label={language === "tr" ? "Kalıp / Silüet" : "Fit / Silhouette"} icon={Ruler} />
                                    </div>
                                </>
                            ) : (
                                /* ADVANCED MODE (Kombinim Var) */
                                <>
                                    {/* ROW 1: Model / Product Group */}
                                    <AssetCard id="model" label={language === "tr" ? "Model" : "Model"} icon={User} required />

                                    <div
                                        onClick={() => {
                                            setActiveLibraryAsset('product_group');
                                            setActiveGroup('product');
                                            setLibraryTab('assets');
                                        }}
                                        className="h-14 rounded-lg border border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-50 hover:border-violet-500 cursor-pointer flex items-center px-3 gap-3 transition-colors"
                                    >
                                        <div className="p-1.5 rounded-md bg-violet-100 text-violet-600">
                                            <Shirt className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-xs font-medium text-foreground">{language === "tr" ? "Ürün" : "Product"}</span>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* ROW 2: Background / Pose */}
                                    <AssetCard id="background" label={language === "tr" ? "Arka Plan" : "Background"} icon={ImageIcon} />
                                    <AssetCard id="pose" label={language === "tr" ? "Poz" : "Pose"} icon={User} />

                                    {/* ROW 3: Shoes / Accessories Group */}
                                    <AssetCard id="shoes" label={language === "tr" ? "Ayakkabı" : "Shoes"} icon={Footprints} />

                                    <div
                                        onClick={() => {
                                            setActiveLibraryAsset('accessories_group');
                                            setActiveGroup('accessories');
                                            setLibraryTab('assets');
                                        }}
                                        className="h-14 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/30 cursor-pointer flex items-center px-3 gap-3 transition-colors"
                                    >
                                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                                            <Gem className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-xs font-medium text-foreground">{language === "tr" ? "Aksesuarlar" : "Accessories"}</span>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="col-span-2 mt-1">
                                        <AssetCard id="fit_pattern" label={language === "tr" ? "Kalıp / Silüet" : "Fit / Silhouette"} icon={Ruler} />
                                    </div>
                                </>
                            )}
                        </div>


                    </div>



                    {/* Framing Toggle for Styling - 4 Options */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border my-3">
                        <span className="text-xs font-medium">{language === "tr" ? "Kadraj" : "Framing"}</span>
                        <div className="grid grid-cols-2 gap-1 bg-background p-1 rounded-md border">
                            <button
                                onClick={() => setPoseFocus('closeup')}
                                className={`text-[10px] px-2 py-1.5 rounded transition-all ${poseFocus === 'closeup' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {language === "tr" ? "Yakın Plan" : "Close-Up"}
                            </button>
                            <button
                                onClick={() => setPoseFocus('upper')}
                                className={`text-[10px] px-2 py-1.5 rounded transition-all ${poseFocus === 'upper' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {language === "tr" ? "Üst Vücut" : "Upper Body"}
                            </button>
                            <button
                                onClick={() => setPoseFocus('full')}
                                className={`text-[10px] px-2 py-1.5 rounded transition-all ${poseFocus === 'full' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {language === "tr" ? "Tam Boy" : "Full Body"}
                            </button>
                            <button
                                onClick={() => setPoseFocus('lower')}
                                className={`text-[10px] px-2 py-1.5 rounded transition-all ${poseFocus === 'lower' ? 'bg-violet-600 text-white font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {language === "tr" ? "Alt Vücut" : "Lower Body"}
                            </button>
                        </div>
                    </div>

                    {/* Button/Zipper Toggle (All Workflows + Styling Only) */}
                    {closureType !== 'none' && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border my-3">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                    {closureType === 'zipper'
                                        ? (language === "tr" ? "Fermuar (Üst Giyim)" : "Zipper (Top)")
                                        : (language === "tr" ? "Düğmeler (Üst Giyim)" : "Buttons (Top)")}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {closureType === 'zipper'
                                        ? (language === "tr" ? "Ceket/Mont için" : "Jacket/Coat styling")
                                        : (language === "tr" ? "Ceket/Gömlek için" : "Jacket/Shirt styling")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] ${!buttonsOpen ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {language === "tr" ? "Kapalı" : "Closed"}
                                </span>
                                <Switch checked={buttonsOpen} onCheckedChange={setButtonsOpen} />
                                <span className={`text-[10px] ${buttonsOpen ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {language === "tr" ? "Açık" : "Open"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tuck Toggle (All Workflows) */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border my-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium">
                                {language === "tr" ? "Etek Ucu (İç Giyim)" : "Hemline (Inner)"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {language === "tr" ? "Tişört/Gömlek pantolona" : "T-shirt/Shirt into pants"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${!tucked ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {language === "tr" ? "Dışarıda" : "Untucked"}
                            </span>
                            <Switch checked={tucked} onCheckedChange={setTucked} />
                            <span className={`text-[10px] ${tucked ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                {language === "tr" ? "İçeride" : "Tucked"}
                            </span>
                        </div>
                    </div>

                    {/* 5. Persistent Generation Settings */}
                    <div className="space-y-3 pt-2 pb-2 bg-muted/20 p-3 rounded-lg border">
                        <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-2">
                            {language === "tr" ? "STİL AYARLARI" : "STYLE SETTINGS"}
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                onClick={() => handleGenerate({ isThreeAngles: true, targetView: 'front' })}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-background hover:border-violet-500 hover:text-violet-600 transition-all"
                            >
                                <span className="text-[10px] font-medium text-center leading-tight">
                                    {language === "tr" ? "Ön Açı" : "Front"}
                                </span>
                            </button>
                            <button
                                onClick={() => handleGenerate({ isThreeAngles: true, targetView: 'side' })}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-background hover:border-blue-500 hover:text-blue-600 transition-all"
                            >
                                <span className="text-[10px] font-medium text-center leading-tight">
                                    {language === "tr" ? "Yan Açı" : "Side"}
                                </span>
                            </button>
                            <button
                                onClick={() => handleGenerate({ isThreeAngles: true, targetView: 'back' })}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-background hover:border-amber-500 hover:text-amber-600 transition-all"
                            >
                                <span className="text-[10px] font-medium text-center leading-tight">
                                    {language === "tr" ? "Arka Açı" : "Back"}
                                </span>
                            </button>
                            <button
                                onClick={() => resultImages && resultImages.length > 0 && router.push(`/resize?image=${encodeURIComponent(resultImages[0])}`)}
                                disabled={!resultImages || resultImages.length === 0}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-background hover:border-emerald-500 hover:text-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span className="text-[10px] font-medium text-center leading-tight">Upscale</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="p-4 border-t bg-background z-10">
                    <Button
                        size="lg"
                        className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                        onClick={() => handleGenerate()}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <div className="flex items-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>{language === "tr" ? "İşleniyor..." : "Processing..."}</span>
                            </div>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {language === "tr" ? "Fotoğraf Çek" : "Generate Photo"}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-stone-50/50 dark:bg-stone-950/50 overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center">
                {isProcessing ? (
                    /* STUDIO PREPARATION OVERLAY */
                    <div className="h-full flex flex-col items-center justify-center space-y-8 my-auto w-full max-w-md">
                        {/* Studio Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl flex items-center justify-center border border-zinc-700">
                                <Camera className="w-10 h-10 text-white" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                            </div>
                        </div>

                        {/* Studio Steps */}
                        <StudioSteps language={language} />

                        {/* Progress Ring */}
                        <div className="w-full max-w-xs">
                            <div className="h-1 w-full bg-zinc-800 overflow-hidden rounded-full">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600 rounded-full"
                                    style={{
                                        width: '100%',
                                        animation: 'shimmer 2s linear infinite',
                                        backgroundSize: '200% 100%'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : resultImages && resultImages.length > 0 ? (
                    <div className="w-full max-w-2xl flex flex-col gap-6">
                        {resultImages.length === 3 ? (
                            <div className="grid grid-cols-3 gap-4 w-full">
                                {resultImages.map((img, i) => (
                                    <div key={i} className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border bg-white group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md shadow-sm"
                                                onClick={() => router.push(`/resize?image=${encodeURIComponent(img)}`)}
                                                title="Upscale"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-sm transition-all"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    const response = await fetch(img);
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `angle_${i}_${Date.now()}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                title={language === "tr" ? "İndir" : "Download"}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Single Main Image */
                            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border bg-white group">
                                <img src={resultImages[0]} className="w-full h-full object-cover" />
                                {/* Download Button - Always Visible */}
                                <Button
                                    size="icon"
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg z-20 flex items-center justify-center h-10 w-10"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const response = await fetch(resultImages[0]);
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `styling_${Date.now()}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    title={language === "tr" ? "İndir" : "Download"}
                                >
                                    <Download className="w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* Action Buttons Row */}
                    </div>
                ) : (
                    <div className="my-auto flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                        <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-4">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                        <h3 className="font-semibold text-lg">{language === "tr" ? "Önizleme Alanı" : "Preview Area"}</h3>
                        <p className="text-sm">{language === "tr" ? "Oluşturulan görsel burada görünecek" : "Generated image will appear here"}</p>
                    </div>
                )}
            </div>

            {/* COLUMN 3: History (Right Sidebar) */}
            <div className="hidden xl:block w-[200px] border-l bg-background p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">{language === "tr" ? "Geçmiş" : "History"}</h3>
                </div>
                <div className="space-y-3">
                    {projects.filter(p => p.type === "Photoshoot").length > 0 ? (
                        projects.filter(p => p.type === "Photoshoot").slice(0, 10).map((item) => (
                            <div
                                key={item.id}
                                className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all relative group"
                                onClick={() => router.push(`/history?id=${item.id}`)}
                            >
                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <p className="text-[10px] text-white font-medium truncate">{item.title}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground text-center py-8">
                            {language === "tr" ? "Henüz işlem yok" : "No history yet"}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {language === "tr" ? "Oluşturma Önizlemesi" : "Generation Preview"}
                            {pendingOptions?.isThreeAngles && (
                                <span className="text-sm font-normal text-muted-foreground ml-2 block sm:inline mt-1 sm:mt-0">
                                    {language === "tr" ? "(3 Açılı Çekim - Ön Referans)" : "(3-Angle Shot - Front Reference)"}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-6">
                            {previewData.map((item: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4 bg-muted/50">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {item.title || (language === "tr" ? "Oluşturma İstemi" : "Generation Prompt")}
                                    </h4>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs text-muted-foreground">
                                            {language === "tr" ? "API'ye Gidecek Prompt (Düzenlenebilir):" : "Prompt to API (Editable):"}
                                        </p>
                                        <textarea
                                            className="w-full p-3 text-sm border rounded-md bg-card text-foreground min-h-[180px] font-mono"
                                            value={userAddedPrompt || (() => {
                                                // Dynamically update prompt based on current state
                                                let dynamicPrompt = item.prompt;

                                                // Update buttons status
                                                if (buttonsOpen) {
                                                    dynamicPrompt = dynamicPrompt.replace(/Buttons: fully buttoned up, closed front\./g, 'Buttons: open front, showing inner layers.');
                                                } else {
                                                    dynamicPrompt = dynamicPrompt.replace(/Buttons: open front, showing inner layers\./g, 'Buttons: fully buttoned up, closed front.');
                                                }

                                                // Update tucked status - use simpler patterns
                                                if (tucked) {
                                                    // Replace untucked with tucked
                                                    if (dynamicPrompt.includes('Shirt worn untucked')) {
                                                        dynamicPrompt = dynamicPrompt.replace(/Shirt worn untucked, hemline visible hanging outside pants\./g, 'Shirt/Top is FULLY TUCKED INTO PANTS - the ENTIRE hemline (front, sides, AND back) is completely inside the waistband. No part of the shirt is hanging outside. Waistband clearly visible all around.');
                                                    }
                                                    if (dynamicPrompt.includes('Inner t-shirt hangs loose')) {
                                                        dynamicPrompt = dynamicPrompt.replace(/Inner t-shirt hangs loose over waistband, hemline visible outside pants\./g, 'Inner t-shirt is FULLY TUCKED INTO PANTS - the ENTIRE t-shirt (front, sides, AND back) is completely inside the waistband. No fabric visible outside the pants at any angle.');
                                                    }
                                                } else {
                                                    // Replace tucked with untucked
                                                    if (dynamicPrompt.includes('Shirt/Top is FULLY TUCKED INTO PANTS')) {
                                                        dynamicPrompt = dynamicPrompt.replace(/Shirt\/Top is FULLY TUCKED INTO PANTS - the ENTIRE hemline \(front, sides, AND back\) is completely inside the waistband\. No part of the shirt is hanging outside\. Waistband clearly visible all around\./g, 'Shirt worn untucked, hemline visible hanging outside pants.');
                                                    }
                                                    if (dynamicPrompt.includes('Inner t-shirt is FULLY TUCKED INTO PANTS')) {
                                                        dynamicPrompt = dynamicPrompt.replace(/Inner t-shirt is FULLY TUCKED INTO PANTS - the ENTIRE t-shirt \(front, sides, AND back\) is completely inside the waistband\. No fabric visible outside the pants at any angle\./g, 'Inner t-shirt hangs loose over waistband, hemline visible outside pants.');
                                                    }
                                                }

                                                return dynamicPrompt;
                                            })()}
                                            onChange={(e) => setUserAddedPrompt(e.target.value)}
                                        />

                                        {/* Structured JSON View */}
                                        {item.structured && (
                                            <details className="mt-3">
                                                <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
                                                    {language === "tr" ? "📦 Yapılandırılmış JSON Görüntüle" : "📦 View Structured JSON"}
                                                </summary>
                                                <pre className="text-xs bg-black/80 text-green-400 p-3 rounded border mt-2 overflow-x-auto max-h-[300px] overflow-y-auto">
                                                    {JSON.stringify(item.structured, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>

                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-primary" />
                                        Assets & Settings
                                    </h4>
                                    <div className="text-xs font-mono bg-card p-3 rounded border overflow-x-auto">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-muted-foreground">Resolution:</span> {item.settings.resolution}
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Ratio:</span> {item.settings.aspect_ratio}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground">Active Assets:</span> {item.assets.length} file(s) included
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                    {language === "tr" ? "İptal" : "Cancel"}
                                </Button>
                                {userAddedPrompt && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            // Update previewData with edited prompt
                                            setPreviewData((prev: any) =>
                                                prev?.map((item: any, idx: number) =>
                                                    idx === 0 ? { ...item, prompt: userAddedPrompt } : item
                                                )
                                            );
                                            toast.success(language === "tr" ? "Prompt güncellendi!" : "Prompt updated!");
                                        }}
                                    >
                                        {language === "tr" ? "Prompt Güncelle" : "Update Prompt"}
                                    </Button>
                                )}
                                <Button onClick={handleConfirmGeneration} className="bg-violet-600 hover:bg-violet-700">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {language === "tr" ? "Onayla ve Oluştur" : "Confirm & Generate"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}


