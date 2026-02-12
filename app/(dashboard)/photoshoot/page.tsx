"use client"
import { uploadToR2 } from "@/lib/uploadToR2";
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
    Upload, Plus, Loader2, Trash2, Edit2, ChevronRight, ChevronLeft, ChevronDown, Sparkles, User, Image as ImageIcon, Camera, RotateCw, X, Maximize2, FileText, ShoppingBag, Gem, MoveHorizontal, Glasses, Footprints, Shirt, ScanLine, Scissors, Ruler, Download, Package, Zap, ShieldAlert, Globe, CheckCircle2, AlertCircle, Eraser, Layers, Eye, EyeOff
} from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { resizeImageToThumbnail } from "@/lib/utils"
import { dbOperations, STORES } from "@/lib/db"
import { buildBatchSpecs, extractDominantColor, generateColorPaletteSVG, type BatchSpec } from "@/lib/batch-helpers"
import {
    BACKGROUND_PRESETS,
    STUDIO_STEPS_TR,
    STUDIO_STEPS_EN,
    POSE_PRESETS,
    ANGLE_PRESETS,
    ASPECT_RATIOS,
    RESOLUTION_OPTIONS
} from "@/lib/photoshoot-constants"



// Define UserAddedPrompt state at module level or inside component?
// Inside component is better.


// Studio Steps Component

function StudioSteps({ language, isSuccess }: { language: string, isSuccess?: boolean }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const steps = language === "tr" ? STUDIO_STEPS_TR : STUDIO_STEPS_EN;

    const FINAL_STEP = {
        icon: "🖼️",
        text: language === "tr" ? "Görseller ekrana yansıtılıyor..." : "Projecting images to screen...",
        detail: language === "tr" ? "Sonuçlar hazırlanıyor" : "Preparing results"
    };

    // 19 steps over ~70 seconds = ~3.7 seconds per step
    const stepDuration = 3700;
    const estimatedTotal = 70; // seconds

    useEffect(() => {
        if (isSuccess) return;

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
    }, [steps.length, isSuccess]);

    const activeStep = isSuccess ? FINAL_STEP : steps[currentStep];
    const progress = isSuccess ? 100 : Math.min((currentStep / (steps.length - 1)) * 100, 100);
    const estimatedRemaining = isSuccess ? 0 : Math.max(estimatedTotal - elapsedTime, 0);

    return (
        <div className="w-full space-y-6">
            {/* Current Step Display */}
            <div className="text-center space-y-1">
                <div className="text-5xl mb-3" style={{ animation: 'pulse 1s ease-in-out infinite' }}>
                    {activeStep.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                    {activeStep.text}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {activeStep.detail}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-2">
                <div className="h-2 w-full bg-zinc-800 overflow-hidden rounded-full">
                    <div
                        className={`h-full bg-gradient-to-r from-violet-600 via-pink-500 to-violet-600 rounded-full transition-all ease-out ${isSuccess ? 'duration-1000' : 'duration-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}%</span>
                    <span>
                        {isSuccess ? (
                            language === "tr" ? "Tamamlandı" : "Complete"
                        ) : (
                            language === "tr"
                                ? `~${estimatedRemaining} saniye kaldı`
                                : `~${estimatedRemaining}s remaining`
                        )}
                    </span>
                </div>
            </div>

            {/* Step Indicators - Compact */}
            <div className="flex justify-center gap-1 flex-wrap max-w-[280px] mx-auto">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${isSuccess ? 'bg-green-500' : (idx === currentStep
                            ? 'bg-violet-500 scale-150'
                            : idx < currentStep
                                ? 'bg-green-500'
                                : 'bg-zinc-700'
                        )}`}
                    />
                ))}
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isSuccess ? 'bg-violet-500 scale-150' : 'bg-zinc-700'}`} />
            </div>

            {/* Elapsed Time */}
            <p className="text-xs text-center text-muted-foreground/70">
                {language === "tr"
                    ? `Geçen süre: ${elapsedTime}s • Adım ${isSuccess ? 20 : currentStep + 1}/${steps.length + 1}`
                    : `Elapsed: ${elapsedTime}s • Step ${isSuccess ? 20 : currentStep + 1}/${steps.length + 1}`}
            </p>
        </div>
    );
}


// Specialized interfaces

// Defines a saved item structure with custom thumbnail support
interface LibraryItem {
    id: string;
    url: string;        // The actual asset URL (base64 or cloud)
    name: string;       // Display name
    thumbUrl?: string;  // OPTIONAL: Custom preview image
    createdAt: number;
}

// Specialized interfaces
interface SavedPose extends LibraryItem {
    originalThumb: string; // The thumb used currently, we'll merge this into thumbUrl soon
    stickmanUrl: string;   // The API result
    gender: 'male' | 'female';
    customPrompt?: string; // New: Custom prompt for this pose
    tags?: string[]; // New: Tags for categorizing poses (e.g., "yan_aci", "on_aci", "arka_aci")
}

interface SavedModel extends LibraryItem {
    gender: 'male' | 'female';
    customPrompt?: string; // New: Custom physical description for this model
}

interface SavedBackground extends LibraryItem { }
interface SavedFit extends LibraryItem {
    customPrompt?: string; // New: Custom prompt for this fit/pattern
}
interface SavedShoe extends LibraryItem {
    customPrompt?: string;
}
interface SavedLighting extends LibraryItem {
    positivePrompt: string;
    negativePrompt: string;
    sendImageAsAsset: boolean;
}

interface SavedJacket extends LibraryItem { customPrompt?: string; }
interface SavedBag extends LibraryItem { customPrompt?: string; }
interface SavedGlasses extends LibraryItem { customPrompt?: string; }
interface SavedHat extends LibraryItem { customPrompt?: string; }
interface SavedJewelry extends LibraryItem { customPrompt?: string; }
interface SavedBelt extends LibraryItem { customPrompt?: string; }

const LIGHTING_PRESETS: SavedLighting[] = [
    {
        id: "hard-flash-5200k",
        name: "SERT/FLAŞ 5200K SETUP",
        url: "",
        positivePrompt: "Single hard strobe/flash look (small source), neutral daylight balance 5200 Kelvin. Place the key light near camera but slightly camera‑left and slightly above eye level, producing crisp specular highlights on forehead/cheekbones/shoulders and a defined, sharp shadow cast onto the background that falls toward camera‑right. Minimal fill (keep contrast), no rim light, no colored gels, no haze; modern editorial fashion studio aesthetic, punchy but clean.",
        negativePrompt: "softbox look, diffused lighting, multiple light sources, rim light, colored gels, cinematic moody low‑key lighting, heavy film grain, HDR glow, background bokeh.",
        sendImageAsAsset: false,
        createdAt: 1770124800000
    },
    {
        id: "soft-5200k",
        name: "SOFT 5200K SETUP",
        url: "",
        positivePrompt: "High-key e-commerce studio lighting, neutral daylight white balance 5200 Kelvin. Large diffused key light (big softbox/octabox look) placed close to camera axis but slightly camera-left and slightly above eye level (about 15–25° off-axis), creating very soft, low-contrast shadows under the chin/arms and smooth, even highlights (no harsh specular hotspots). Add broad, low-contrast fill from camera-right near axis to keep shadows open and clean. Keep contrast low-to-medium, clean edges, accurate skin and fabric tones. No visible rim light, no colored gels, no haze.",
        negativePrompt: "Single hard flash look, small-source strobe, sharp cast shadows, dramatic side lighting, strong rim light, colored gels, cinematic moody low-key lighting, heavy film grain, HDR glow, over-sharpening halos, plastic skin, oily hotspots.",
        sendImageAsAsset: false,
        createdAt: 1770124800001
    }
];




export default function PhotoshootPage() {
    const { projects, addProject, deductCredits, models } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const [showExpert, setShowExpert] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Smart Workflow State
    // Smart Workflow State
    const [productName, setProductName] = useState("");
    const [isManualProductName, setIsManualProductName] = useState(false); // Track manual edits
    const [workflowType, setWorkflowType] = useState<"upper" | "lower" | "dress" | "set">("upper");

    // Asset State (LOW-RES for preview & sessionStorage)
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
        inner_wear: null, // NEW: Inner wear support   
        lighting: null // NEW: Lighting setup
    });

    // Asset State (HIGH-RES for API, RAM only)
    const [assetsHighRes, setAssetsHighRes] = useState<{ [key: string]: string | null }>({
        model: null,
        background: null,
        main_product: null,
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
        belt: null,
        inner_wear: null,
        lighting: null
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
    const [upperGarmentDescription, setUpperGarmentDescription] = useState<string | null>(null); // NEW
    const [lowerGarmentDescription, setLowerGarmentDescription] = useState<string | null>(null); // NEW
    const [innerWearDescription, setInnerWearDescription] = useState<string | null>(null); // NEW
    const [shoesDescription, setShoesDescription] = useState<string | null>(null); // NEW
    const [modelDescription, setModelDescription] = useState<string | null>(null); // New: physical description override

    // Phase 4: Tuck Logic (Default Untucked false)
    const [tucked, setTucked] = useState(false);
    const [sleevesRolled, setSleevesRolled] = useState(false); // NEW
    const [lookAtCamera, setLookAtCamera] = useState(true);
    const [enableWind, setEnableWind] = useState(false); // NEW: Subtle airflow toggle
    const [enableExpression, setEnableExpression] = useState(false); // NEW
    const [enableGaze, setEnableGaze] = useState(false); // NEW
    const [hairBehindShoulders, setHairBehindShoulders] = useState(false);
    const [socksType, setSocksType] = useState<'none' | 'white' | 'black'>('none');

    // Conditional styling options
    const [collarType, setCollarType] = useState<'none' | 'standard' | 'v-neck' | 'polo'>('none');
    const [shoulderType, setShoulderType] = useState<'none' | 'standard' | 'dropped' | 'padded'>('none');
    const [waistType, setWaistType] = useState<'none' | 'standard' | 'elastic' | 'high-waisted'>('none');
    const [riseType, setRiseType] = useState<'none' | 'low' | 'mid' | 'high'>('none');
    const [legType, setLegType] = useState<'none' | 'skinny' | 'straight' | 'wide'>('none');
    const [hemType, setHemType] = useState<'none' | 'standard' | 'cuffed' | 'raw'>('none');

    const [lightingPositive, setLightingPositive] = useState<string>("");
    const [lightingNegative, setLightingNegative] = useState<string>("");
    const [lightingSendImage, setLightingSendImage] = useState(true);

    // BATCH GENERATION (Mavi Almanya Integration)
    const [productCode, setProductCode] = useState("");
    const [batchMode, setBatchMode] = useState(false);
    const [upperFraming, setUpperFraming] = useState<"full" | "medium_full">("full");
    const [batchPreviewPrompts, setBatchPreviewPrompts] = useState<any[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [editedBatchPrompts, setEditedBatchPrompts] = useState<string[]>([]);
    const [batchResultImages, setBatchResultImages] = useState<any[]>([]);
    const [selectedBatchImages, setSelectedBatchImages] = useState<boolean[]>([]); // Track which images to generate
    const [colorPalette, setColorPalette] = useState<string | null>(null);
    const [isGenerationSuccess, setIsGenerationSuccess] = useState(false);

    // PRE-GENERATION SHOT SELECTION
    const UPPER_SHOTS = [
        { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front' },
        { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled' },
        { id: 'styling_front_2', label: 'Styling 3. Kare', labelEn: 'Styling Front 2' },
        { id: 'technical_back', label: 'Düz Arka Kare', labelEn: 'Technical Back' },
        { id: 'closeup_front', label: 'Yakın Çekim Ön', labelEn: 'Close-Up Front' },
    ];
    const LOWER_SHOTS = [
        { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front' },
        { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled' },
        { id: 'technical_front', label: 'Düz Ön 3. Kare', labelEn: 'Technical Front' },
        { id: 'technical_back', label: 'Düz Arka 4. Kare', labelEn: 'Technical Back' },
        { id: 'detail_front', label: 'Detay Ön Kare', labelEn: 'Detail Front' },
        { id: 'detail_back', label: 'Detay Arka Kare', labelEn: 'Detail Back' },
    ];
    const availableBatchShots = workflowType === 'upper' ? UPPER_SHOTS : LOWER_SHOTS;
    const [batchShotSelection, setBatchShotSelection] = useState<Record<string, boolean>>({});

    // Reset shot selection when workflow or batch mode changes
    useEffect(() => {
        if (batchMode) {
            const defaults: Record<string, boolean> = {};
            availableBatchShots.forEach(s => { defaults[s.id] = true; });
            setBatchShotSelection(defaults);
        }
    }, [batchMode, workflowType]);


    const [poseFocus, setPoseFocus] = useState<'upper' | 'full' | 'lower' | 'closeup'>('full');
    const [detailView, setDetailView] = useState<'front' | 'angled' | 'back'>('front');

    // Section 4: Framing Logic - Strictly decoupled from workflowType
    const effectiveFraming = (() => {
        if (poseFocus === 'closeup') return 'chest_and_face';
        if (poseFocus === 'upper') return 'cowboy_shot';
        if (poseFocus === 'lower') return 'head_to_toe'; // Focus on lower implies legs/feet visible
        if (poseFocus === 'full') return 'head_to_toe';

        // Default fallback if focus is somehow missing (should be 'full')
        return 'head_to_toe';
    })();

    const isFullBody = effectiveFraming === 'head_to_toe';
    const isCowboy = effectiveFraming === 'cowboy_shot';
    const isCloseup = effectiveFraming === 'chest_and_face';

    // Explicit Mapping Implementation
    const hasFeet = isFullBody || isCowboy;
    const hasLegHem = isFullBody || isCowboy;
    const hasStance = isFullBody || isCowboy; // Pose geometry focus

    const hasWaist = isCowboy || isFullBody; // Physically visible in both
    const enableWaistControls = isCowboy || isFullBody; // waist, rise, fit, tuck

    const hasHead = isCloseup || isCowboy || isFullBody;
    const enableFaceDetails = isCloseup; // gaze, expression
    const enableCollarButtonsHair = isCloseup || isCowboy || isFullBody; // hair is visible in all 3, user explicitly enabled for closeup but it's part of the head block.
    // However, the request says: 
    // head_to_toe -> DISABLE: close-up face details
    // cowboy_shot -> DISABLE: footwear
    // chest_and_face -> DISABLE: leg, hem, footwear

    const canShowFootwear = isFullBody;
    const canShowLegHem = isFullBody;
    const canShowWaistRiseFitTuck = isCowboy || isFullBody;
    const canShowFaceDetails = isCloseup;
    const canShowCollarHairButtons = isCloseup || isCowboy || isFullBody;

    // Minimal micro-feedback hint
    const [microFeedback, setMicroFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (assets.pose) {
            setMicroFeedback(language === "tr" ? "Bu poz bel ve bacak uyumunu vurguluyor." : "This pose highlights waist and leg alignment.");
            const timer = setTimeout(() => setMicroFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [assets.pose, language]);

    useEffect(() => {
        if (assets.lighting) {
            setMicroFeedback(language === "tr" ? "Bu ışık kumaş dokusunu ön plana çıkarıyor." : "This lighting emphasizes fabric texture.");
            const timer = setTimeout(() => setMicroFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [assets.lighting, language]);

    // === IMAGE RESIZE CONFIGURATION ===
    const getMaxSizeForAsset = (key: string): number => {
        // Pose reference, Lighting & Detail images: 1024px
        if (key === 'pose' || key === 'lighting' || key.startsWith('detail_')) {
            return 1024;
        }
        // All other assets: 2048px (high quality)
        return 2048;
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

                img.onerror = (err) => {
                    console.error('Image load failed:', file.name, err);
                    reject(new Error(`Image load failed: ${file.name}`));
                };
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
    }, [productName]);

    // === DUAL-VERSION RESIZE: Creates both LOW-RES and HIGH-RES ===
    const resizeImageDual = async (file: File, key: string): Promise<{ lowRes: string, highRes: string }> => {
        const highResSize = getMaxSizeForAsset(key); // 2048px or 1024px for pose
        const lowResSize = key === 'pose' ? 512 : 768; // LOW-RES for sessionStorage

        // Create HIGH-RES version
        const highRes = await resizeImage(file, highResSize);

        // Create LOW-RES version
        const lowRes = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    let { width, height } = img;

                    // Resize to lowResSize
                    if (width > lowResSize || height > lowResSize) {
                        const ratio = Math.min(lowResSize / width, lowResSize / height);
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

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Lower quality for smaller file size
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
                    resolve(resizedDataUrl);
                };

                img.onerror = (err) => {
                    console.error('LOW-RES image load failed:', file.name, err);
                    reject(new Error(`LOW-RES image load failed: ${file.name}`));
                };
                img.src = e.target?.result as string;
            };

            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });

        console.log(`Dual-resize ${file.name}: HIGH=${highResSize}px, LOW=${lowResSize}px`);
        return { lowRes, highRes };
    };

    const handleAssetUpload = async (key: string, file: File) => {
        try {
            // Create both LOW-RES and HIGH-RES versions
            const { lowRes, highRes } = await resizeImageDual(file, key);

            // Store LOW-RES for preview & sessionStorage
            setAssets(prev => ({ ...prev, [key]: lowRes }));

            // Store HIGH-RES for API (RAM only)
            setAssetsHighRes(prev => ({ ...prev, [key]: highRes }));

            // Analyze Pose if uploaded to 'pose' slot
            // ASK TO SAVE BEFORE CONVERTING
            if (key === 'pose') {
                setPoseDescription(null); // Reset previous analysis

                // Set temp data for potential save
                setTempPoseData({
                    original: highRes, // Use HIGH-RES for pose conversion
                    stickman: "" // Not yet generated
                });

                // Show Pre-Conversion Dialog
                setShowSavePoseDialog(true);
            }

            // MODEL UPLOAD - PROMPT TO SAVE
            if (key === 'model') {
                setTempModelData({
                    url: lowRes,
                    name: "",
                    gender: 'female' // Default, user can change
                });
                setShowSaveModelDialog(true);
            }

            if (key === 'lighting') {
                setTempLightingData({
                    url: highRes, // Using highRes (1024px) for lighting reference
                    name: "",
                    positivePrompt: "",
                    negativePrompt: "",
                    sendImageAsAsset: true
                });
                setShowSaveLightingDialog(true);
            }
            if (key === 'background') {
                setTempAssetData({ key: 'background', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'fit_pattern') {
                setTempAssetData({ key: 'fit_pattern', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'shoes') {
                setTempAssetData({ key: 'shoes', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'jacket') {
                setTempAssetData({ key: 'jacket', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'bag') {
                setTempAssetData({ key: 'bag', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'glasses') {
                setTempAssetData({ key: 'glasses', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'hat') {
                setTempAssetData({ key: 'hat', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'jewelry') {
                setTempAssetData({ key: 'jewelry', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }
            if (key === 'belt') {
                setTempAssetData({ key: 'belt', url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }

            // Reset descriptions if main items change, but DO NOT ANALYZE yet
            const detailKeys = ['detail_front_1', 'detail_front_2', 'detail_front_3', 'detail_front_4', 'detail_back_1', 'detail_back_2', 'detail_back_3', 'detail_back_4'];
            if (['main_product', 'top_front', 'bottom_front', ...detailKeys].includes(key)) {
                if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') {
                    setProductDescription(null);
                    setUpperGarmentDescription(null);
                    setInnerWearDescription(null);
                    setUserAddedPrompt("");
                }
            }

            if (key === 'fit_pattern') {
                setFitDescription(null);
            }
        } catch (error) {
            console.error('Image resize failed:', error);
            toast.error(language === "tr" ? "Görsel işlenemedi" : "Image processing failed");
        }
    };

    const analyzePose = async (imageUrl: string) => {
        try {
            toast.info(language === "tr" ? "Poz analizi yapılıyor..." : "Analyzing pose...");
            const res = await fetch("/api/analyze-pose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl })
            });
            const data = await res.json();
            if (data.description) {
                setPoseDescription(data.description);
                toast.success(language === "tr" ? "Poz analizi tamamlandı" : "Pose analysis complete");
            }
        } catch (e) {
            console.error("Pose analysis failed", e);
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
                setAssetsHighRes(prev => ({ ...prev, pose: null }));

                // 2. Set State
                setPoseStickman(stickmanUrl);

                // 3. Trigger Save Dialog
                setTempPoseData({
                    original: currentPose, // The original upload (base64/url)
                    stickman: stickmanUrl
                });
                setShowSavePoseDialog(true);

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
        setAssetsHighRes(prev => ({ ...prev, [key]: null }));
        if (key === 'pose') {
            setPoseDescription(null);
            setPoseStickman(null);
        }
        if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') {
            setProductDescription(null);
            setUpperGarmentDescription(null);
            setInnerWearDescription(null);
        }
        if (key === 'fit_pattern') setFitDescription(null);
        if (key === 'lighting') {
            setLightingPositive("");
            setLightingNegative("");
        }
    };

    // State for Generation
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImages, setResultImages] = useState<string[] | null>(null);
    const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'complete'>('idle');
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewMode, setPreviewMode] = useState<'text' | 'json'>('json'); // Default to JSON as requested
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

        // === PRE-ANALYSIS STEP (Wait for analyses to complete) ===
        // Analyze assets if descriptions are missing
        let currentPoseDesc = poseDescription;
        let currentProductDesc = productDescription;
        let currentClosureType = closureType;
        let currentProductName = productName;
        let currentUpperDesc = upperGarmentDescription;
        let currentInnerDesc = innerWearDescription;

        // 1. Pose Analysis - DISABLED as per user request. 
        // Descriptions are now either from library (handleSavedPoseClick) or manual JSON edits.
        if (!isReStyling) {
            if (poseStickman && !currentPoseDesc) {
                currentPoseDesc = "Use stickman reference";
                setPoseDescription(currentPoseDesc);
            }
        }

        // 2. Collective Garment Analysis (Analyze all primary garment angles together)
        let garmentImages: string[] = [];
        const allDetails = [
            assets.detail_front_1, assets.detail_front_2, assets.detail_front_3, assets.detail_front_4,
            assets.detail_back_1, assets.detail_back_2, assets.detail_back_3, assets.detail_back_4
        ].filter(Boolean) as string[];

        // Include EVERYTHING available, Gemini will distinguish based on workflowType
        garmentImages = [
            assets.main_product,
            assets.top_front, assets.top_back,
            assets.bottom_front, assets.bottom_back,
            assets.dress_front,
            assets.inner_wear,
            assets.shoes,
            ...allDetails
        ].filter(Boolean) as string[];

        if (!isReStyling && garmentImages.length > 0 && !currentProductDesc) {
            try {
                toast.info(language === "tr" ? "Ürün toplu analizi yapılıyor..." : "Analyzing garment collective views...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: garmentImages, type: 'fabric', language, workflowType })
                });
                const data = await res.json();
                if (data.data) {
                    if (data.data.visualPrompt) {
                        currentProductDesc = data.data.visualPrompt;
                        setProductDescription(currentProductDesc);
                    }
                    if (data.data.fitDescription) {
                        setFitDescription(data.data.fitDescription);
                    }
                    if (data.data.productName && !currentProductName) {
                        currentProductName = data.data.productName;
                        setProductName(currentProductName);
                    }

                    // SAVE BRIEF DESCRIPTIONS for secondary items
                    if (data.data.upperBrief) {
                        setUpperGarmentDescription(data.data.upperBrief);
                        currentUpperDesc = data.data.upperBrief;
                    }
                    if (data.data.lowerBrief) {
                        // Normally we don't need lowerBrief if we are in 'lower' workflow (main is visualPrompt)
                        // but it's good for 'upper' workflow
                        if (workflowType !== 'lower') {
                            setLowerGarmentDescription(data.data.lowerBrief);
                        }
                    }
                    if (data.data.innerBrief) {
                        setInnerWearDescription(data.data.innerBrief);
                        currentInnerDesc = data.data.innerBrief;
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
            } catch (e) {
                console.error("Collective product analysis failed", e);
            }
        }

        // NOTE: Secondary analyses (upper/inner/pose/fit) are skipped or consolidated into the main collective flow per user request.

        // If product name is still missing, warn user but proceed if we have images
        if (!currentProductName && !productName) {
            // Optional: Force user to enter name?
            // toast.warning("Product name missing, using generic name.");
            currentProductName = "Fashion Garment";
        }


        setUserAddedPrompt(""); // CRITICAL: Reset prompt override at start of new generation
        try {
            const detailImages = [
                assets.detail_front_1, assets.detail_front_2, assets.detail_front_3, assets.detail_front_4,
                assets.detail_back_1, assets.detail_back_2, assets.detail_back_3, assets.detail_back_4
            ].filter(Boolean);

            // Workflow type is now manually selected via state 'workflowType'
            // No need to calculate it from keywords.

            let currentFocus = poseFocus;
            // Alternating logic for "New Styling" (ONLY for Upper Body workflows)
            // For Lower/Dress/Set, we usually want to keep Full Body or Lower Focus to see the product.
            if (!isThreeAngles && generationStage === 'complete' && workflowType === 'upper') {
                // If we are generating AGAIN (New Styling), toggle focus
                const base = 'full';
                const alternate = 'upper';
                // 0=Full, 1=Upper, 2=Full...
                currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
            }

            // Determine gender
            const selectedModel = savedModels.find(m => m.url === assets.model);
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
            // Get shoe from library if selected
            let currentShoesDesc = shoesDescription;
            if (!currentShoesDesc && assets.shoes) {
                const selectedShoe = savedShoes.find(s => s.url === assets.shoes);
                if (selectedShoe?.customPrompt) {
                    currentShoesDesc = selectedShoe.customPrompt;
                    setShoesDescription(currentShoesDesc);
                }
            }

            const useR2 = process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true";

            let uploadedImages: any;

            if (useR2) {
                uploadedImages = {};
                for (const key of Object.keys(assets)) {
                    const imageData = assetsHighRes[key] || assets[key];
                    if (imageData) {
                        uploadedImages[key] = await uploadToR2(imageData, `${key}.png`);
                    }
                }
            } else {
                uploadedImages = Object.keys(assets).reduce((acc, k) => {
                    acc[k] = assetsHighRes[k] || assets[k];
                    return acc;
                }, {} as any);
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName: currentProductName || productName, // Use analyzed or manual name
                    workflowType, // Use STATE
                    uploadedImages,
                    detailImages,
                    gender: gender || modelGender,
                    prompt: assets.prompt,
                    poseFocus: currentFocus,
                    isAngles: isThreeAngles,
                    resolution,
                    aspectRatio,
                    upperGarmentDescription: currentUpperDesc,
                    innerWearDescription: currentInnerDesc,
                    closureType: currentClosureType,
                    // Pass missing analysis fields so Preview is accurate
                    productDescription: currentProductDesc,
                    fitDescription,
                    poseDescription: currentPoseDesc,
                    poseStickman,
                    modelDescription, // NEW: physical description
                    shoesDescription: currentShoesDesc,
                    enableExpression,
                    enableGaze,

                    hairBehindShoulders,
                    lookAtCamera,
                    enableWind, // NEW
                    isStylingShot: !isThreeAngles && (poseFocus as string) !== 'closeup',
                    shotIndex: stylingIteration + 1,
                    shotRole: (isThreeAngles || (poseFocus as string) === 'closeup') ? 'technical' : 'styling',
                    buttonsOpen,
                    tucked,
                    sleevesRolled,
                    socksType,
                    collarType,
                    shoulderType,
                    waistType,
                    riseType,
                    legType,
                    hemType,
                    lightingPositive,
                    lightingNegative,
                    seed: seed === "" ? null : Number(seed),
                    enableWebSearch,
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
                setIsGenerationSuccess(true);
                await new Promise(r => setTimeout(r, 1000));
                setResultImages(data.images);
                setGenerationStage('complete');
                toast.success(language === "tr" ? "Oluşturuldu!" : "Generated!");
                setIsProcessing(false);
                setIsGenerationSuccess(false);
                return;
            }

            if (data.status === "preview") {
                setPreviewData(data.previews); // Array of preview objects
                // Populate editor with first preview's prompt
                // Populate editor with JSON or Text depending on mode
                if (data.previews && data.previews.length > 0) {
                    if (previewMode === 'json') {
                        setUserAddedPrompt(JSON.stringify(data.previews[0].structured, null, 2));
                    } else {
                        setUserAddedPrompt(data.previews[0].prompt);
                    }
                }
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

        // Use state instead of re-calculating to ensure consistency
        // const workflowType = lowerKeywords.some(k => productName.toLowerCase().includes(k)) ? 'lower' : 'upper';

        let currentFocus = poseFocus;
        if (!isThreeAngles && generationStage === 'complete') {
            const base = 'full';
            const alternate = 'upper';
            currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
        }

        const selectedModel = savedModels.find(m => m.url === assets.model);
        let modelGender = selectedModel ? selectedModel.gender : "model";
        if (modelGender === "model") {
            const combinedText = (productName + " " + (assets.prompt || "")).toLowerCase();
            if (combinedText.includes("erkek") || combinedText.includes("bay ") || combinedText.includes("male") || combinedText.includes("man")) {
                modelGender = "male";
            } else if (combinedText.includes("kadın") || combinedText.includes("bayan") || combinedText.includes("female") || combinedText.includes("woman")) {
                modelGender = "female";
            }
        }

        const finalSeed = (seed !== null && seed !== "") ? Number(seed) : Math.floor(Math.random() * 1000000000);
        if (seed === "") setSeed(finalSeed);

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productName,
                workflowType,
                uploadedImages: Object.keys(assets).reduce((acc, k) => {
                    if (k === 'lighting' && !lightingSendImage) return acc;
                    acc[k] = assetsHighRes[k] || assets[k];
                    return acc;
                }, {} as any),
                gender: gender || modelGender, // Pass manual gender OR inferred
                prompt: assets.prompt, // Use assets.prompt
                poseFocus: poseFocus, // Use state directly
                resolution: resolution, // Pass explicitly
                aspectRatio: aspectRatio, // Pass explicitly
                isAngles: isThreeAngles,
                preview: false, // REAL GENERATION
                poseDescription, // Pass analyzed pose
                poseStickman, // Pass stickman URL
                hairBehindShoulders,
                lookAtCamera,
                enableWind,
                buttonsOpen,
                tucked,
                socksType,
                detailView, // Pass Detail View selection
                targetView, // Pass single-view target (front/side/back)
                upperGarmentDescription,
                lowerGarmentDescription,
                innerWearDescription,
                shoesDescription,
                closureType,
                productDescription, // Pass fabric analysis
                fitDescription, // Pass fit analysis
                editedPrompt, // Pass user additional prompt
                seed: finalSeed,
                enableWebSearch,
                enableExpression,
                enableGaze,
                lightingPositive,
                lightingNegative
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
            data.images.forEach((img: string, idx: number) => {
                const finalPrompt = (data.prompts && data.prompts[idx]) ? data.prompts[idx] : `Generated for ${productName}`;
                addProject({
                    title: `Photoshoot - ${productName} - ${new Date().toLocaleTimeString()}`,
                    type: "Photoshoot",
                    imageUrl: img,
                    description: `Seed: ${finalSeed} | Prompt: ${finalPrompt}` // Save the seed and prompt!
                });
            });

            if (!isThreeAngles) setStylingIteration(prev => prev + 1);
        }
        setIsProcessing(false);
    };

    // === BATCH GENERATION FUNCTIONS (Mavi Almanya Integration) ===


    const handleBatchGenerate = async () => {
        if (!productCode.trim()) {
            toast.error(language === "tr" ? "Ürün kodu gerekli!" : "Product code required!");
            return;
        }
        if (!assets.model) {
            toast.error(language === "tr" ? "Model görseli gerekli!" : "Model image required!");
            return;
        }

        setIsProcessing(true);

        try {
            // Analysis
            let currentProductDesc = productDescription;
            let currentFitDesc = fitDescription;
            let currentProductName = productName;

            // Get pose from library if selected
            const selectedPose = savedPoses.find(p => p.url === assets.pose);
            const libraryPosePrompt = selectedPose?.customPrompt || poseDescription;

            // Get angled pose from library (tagged with "yan_aci")
            const selectedModel = savedModels.find(m => m.url === assets.model);
            const modelGender = (selectedModel?.gender || gender || "female") as 'male' | 'female';

            const angledPoses = savedPoses.filter(p =>
                p.gender === modelGender &&
                p.tags &&
                p.tags.includes('yan_aci')
            );
            const randomAngledPose = angledPoses.length > 0
                ? angledPoses[Math.floor(Math.random() * angledPoses.length)]
                : null;
            const angledPosePrompt = randomAngledPose?.customPrompt || null;


            // Get fit from library if selected
            const selectedFit = savedFits.find(f => f.url === assets.fit_pattern);
            if (selectedFit?.customPrompt && !currentFitDesc) {
                currentFitDesc = selectedFit.customPrompt;
                setFitDescription(currentFitDesc);
            }


            const garmentImages = [
                assets.main_product,
                assets.top_front, assets.top_back,
                assets.bottom_front, assets.bottom_back,
                assets.dress_front,
                assets.inner_wear
            ].filter(Boolean) as string[];

            if (garmentImages.length > 0 && !currentProductDesc) {
                toast.info(language === "tr" ? "Ürün analizi..." : "Analyzing...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: garmentImages, type: 'fabric', language: 'en', workflowType })
                });
                const data = await res.json();
                if (data.data) {
                    if (data.data.visualPrompt) {
                        currentProductDesc = data.data.visualPrompt;
                        setProductDescription(currentProductDesc);
                    }
                    if (data.data.fitDescription && !currentFitDesc) {
                        currentFitDesc = data.data.fitDescription;
                        setFitDescription(currentFitDesc);
                    }
                    if (data.data.productName && !currentProductName) {
                        currentProductName = data.data.productName;
                        setProductName(currentProductName);
                    }

                    // Briefs
                    if (data.data.upperBrief) setUpperGarmentDescription(data.data.upperBrief);
                    if (data.data.lowerBrief) {
                        if (workflowType !== 'lower') setLowerGarmentDescription(data.data.lowerBrief);
                    }
                    if (data.data.innerBrief) setInnerWearDescription(data.data.innerBrief);
                    if (data.data.shoesBrief) setShoesDescription(data.data.shoesBrief);
                }
            }

            if (!currentProductName) currentProductName = "Fashion Garment";

            const allBatchSpecs = buildBatchSpecs(workflowType, upperFraming, libraryPosePrompt, hairBehindShoulders, modelGender, savedPoses, angledPosePrompt, enableWind);
            // Filter by pre-selection checkboxes
            const batchSpecs = allBatchSpecs.filter(spec => batchShotSelection[spec.view] !== false);
            if (batchSpecs.length === 0) {
                toast.error(language === "tr" ? "En az bir kare seçmelisiniz!" : "Select at least one shot!");
                setIsProcessing(false);
                return;
            }
            const previews = batchSpecs.map((spec, idx) => {
                // Truncate fitDescription for detail shots
                let previewFitDesc = currentFitDesc;
                if (spec.fitDescriptionMode === 'first_sentence_only' && previewFitDesc) {
                    const firstSentenceMatch = previewFitDesc.match(/^[^.!?]+[.!?]/);
                    if (firstSentenceMatch) {
                        previewFitDesc = firstSentenceMatch[0].trim();
                    }
                }

                // For detail shots, exclude hair and lookAtCamera info
                const isDetailShot = spec.view.includes('detail');

                const structured: any = {
                    productName: currentProductName,
                    productDescription: currentProductDesc,
                    fitDescription: previewFitDesc,
                    pose: spec.pose,
                    view: spec.view,
                    camera: spec.camera
                };

                // Only add lookAtCamera and hairBehind for non-detail shots
                if (!isDetailShot) {
                    structured.lookAtCamera = spec.lookAtCamera;
                    structured.hairBehind = spec.hairBehind;
                }

                return {
                    title: `${productCode}_image_${String(idx + 1).padStart(3, '0')}`,
                    spec: spec,
                    structured
                };
            });

            // Fetch REAL text prompts from API for preview
            toast.info(language === "tr" ? "Promptlar hazırlanıyor..." : "Preparing prompts...");

            const textPrompts = await Promise.all(previews.map(async (preview, idx) => {
                const payload = {
                    productName: preview.structured.productName,
                    workflowType: workflowType,
                    uploadedImages: Object.keys(assets).reduce((acc: any, k: string) => {
                        // Exclude ALL accessories for technical shots in lower workflow
                        if (preview.spec.excludeAllAccessories && ['glasses', 'hat', 'bag', 'belt', 'jewelry'].includes(k)) {
                            return acc;
                        }
                        if (k === 'glasses') {
                            acc[k] = preview.spec.includeGlasses ? (assetsHighRes.glasses || assets.glasses) : undefined;
                        } else if (k === 'lighting' && !lightingSendImage) {
                            acc[k] = undefined;
                        } else {
                            acc[k] = assetsHighRes[k] || assets[k];
                        }
                        return acc;
                    }, {}),
                    gender: modelGender,
                    resolution: "1K",
                    aspectRatio: "3:4",

                    buttonsOpen,
                    tucked,
                    socksType: preview.spec.excludeSocksInfo ? 'none' : socksType,
                    closureType,
                    upperGarmentDescription,
                    lowerGarmentDescription,
                    innerWearDescription,
                    modelDescription,
                    shoesDescription,
                    sleevesRolled,
                    excludeBeltAsset: preview.spec.excludeAllAccessories ? true : preview.spec.excludeBeltAsset,
                    excludeHatAsset: preview.spec.excludeAllAccessories ? true : preview.spec.excludeHatAsset,
                    excludeShoesAsset: preview.spec.excludeShoesAsset,
                    hat: preview.spec.excludeAllAccessories ? undefined : ((assetsHighRes.hat || assets.hat) ? { visible: true } : undefined),
                    bag: preview.spec.excludeAllAccessories ? undefined : ((assetsHighRes.bag || assets.bag) ? { visible: true } : undefined),
                    belt: preview.spec.excludeAllAccessories ? undefined : ((assetsHighRes.belt || assets.belt) ? { visible: true } : undefined),

                    productDescription: preview.structured.productDescription,
                    fitDescription: preview.structured.fitDescription,
                    poseDescription: preview.structured.pose,
                    poseStickman: (preview.spec.useStickman && preview.structured.pose === libraryPosePrompt) ? poseStickman : undefined,

                    targetView: preview.spec.view.includes('back') ? 'back' : (preview.spec.view.includes('angled') ? 'side' : 'front'),
                    poseFocus: preview.spec.view.includes('detail') ? 'detail' : (preview.spec.camera.shot_type === 'close_up' ? 'closeup' : (preview.spec.camera.shot_type === 'cowboy_shot' ? 'upper' : 'full')),

                    hairBehindShoulders: (preview.spec.excludeHairInfo && modelGender !== 'male') ? undefined : preview.spec.hairBehind,
                    lookAtCamera: (preview.spec.excludeHairInfo && modelGender !== 'male') ? undefined : preview.spec.lookAtCamera,
                    enableWind: preview.spec.enableWind,

                    isStylingShot: preview.spec.isStyling,
                    shotIndex: idx + 1,
                    shotRole: preview.spec.isStyling ? 'styling' : 'technical',
                    lightingPositive,
                    lightingNegative,

                    seed: seed === "" ? null : Number(seed),
                    enableWebSearch,
                    enableExpression,
                    enableGaze,
                    preview: true,
                    isAngles: false
                };

                try {
                    const res = await fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    return data.previews?.[0]?.prompt || JSON.stringify(preview.structured, null, 2);
                } catch (e) {
                    console.error("Prompt fetch fail", e);
                    return JSON.stringify(preview.structured, null, 2);
                }
            }));

            setBatchPreviewPrompts(previews);
            setEditedBatchPrompts(textPrompts);
            setSelectedBatchImages(previews.map(() => true)); // All selected by default
            setShowBatchPreview(true);

        } catch (e: any) {
            console.error("BATCH GENERATE ERROR:", e);
            toast.error(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmBatchGeneration = async () => {
        setShowBatchPreview(false);
        setIsProcessing(true);

        // Ensure we use a consistent seed for the whole batch
        const finalSeed = (seed !== null && seed !== "") ? Number(seed) : Math.floor(Math.random() * 1000000000);
        // We update the state so UX shows which seed was actually used
        if (seed === "") setSeed(finalSeed);

        try {
            const generatedImages: any[] = [];
            const resultUrls: string[] = [];

            for (let i = 0; i < batchPreviewPrompts.length; i++) {
                // Skip if not selected
                if (!selectedBatchImages[i]) {
                    continue;
                }

                const preview = batchPreviewPrompts[i];
                const selectedCount = selectedBatchImages.filter(Boolean).length;
                const currentIndex = selectedBatchImages.slice(0, i + 1).filter(Boolean).length;
                toast.info(`${language === "tr" ? "Üretiliyor" : "Generating"} ${currentIndex}/${selectedCount}...`);

                const uploadedImages: any = {
                    model: assetsHighRes.model || assets.model, // Use HIGH-RES if available
                    background: assetsHighRes.background || assets.background
                };

                // Add glasses ONLY if specified in specs (first styling shot only)
                if (preview.spec.includeGlasses && (assetsHighRes.glasses || assets.glasses)) {
                    uploadedImages.glasses = assetsHighRes.glasses || assets.glasses;
                }

                // Add shoes only if not excluded by spec
                if (!preview.spec.excludeShoesAsset) {
                    uploadedImages.shoes = assetsHighRes.shoes || assets.shoes; // HIGH-RES fallback
                }

                // Add common assets (inner wear, accessories)
                if (assetsHighRes.inner_wear || assets.inner_wear) {
                    uploadedImages.inner_wear = assetsHighRes.inner_wear || assets.inner_wear;
                }
                if (assetsHighRes.hat || assets.hat) uploadedImages.hat = assetsHighRes.hat || assets.hat;
                if (assetsHighRes.bag || assets.bag) uploadedImages.bag = assetsHighRes.bag || assets.bag;
                if (assetsHighRes.belt || assets.belt) uploadedImages.belt = assetsHighRes.belt || assets.belt;
                if (lightingSendImage && (assetsHighRes.lighting || assets.lighting)) {
                    uploadedImages.lighting = assetsHighRes.lighting || assets.lighting;
                }

                // User specific exclusions
                if (preview.spec.excludeBeltAsset) delete uploadedImages.belt;
                if (preview.spec.excludeHatAsset) delete uploadedImages.hat;
                if (preview.spec.excludeShoesAsset) delete uploadedImages.shoes;

                // LOWER WORKFLOW: Strip ALL accessories for technical shots (3rd & 4th)
                if (preview.spec.excludeAllAccessories) {
                    delete uploadedImages.belt;
                    delete uploadedImages.bag;
                    delete uploadedImages.hat;
                    delete uploadedImages.glasses;
                    delete uploadedImages.jewelry;
                }

                // CRITICAL: Only send relevant assets based on spec.assets
                if (preview.spec.assets.includes('front')) {
                    uploadedImages.top_front = assetsHighRes.top_front || assets.top_front;
                    uploadedImages.bottom_front = assetsHighRes.bottom_front || assets.bottom_front;
                    // Add Front Details
                    for (let j = 1; j <= 4; j++) {
                        const key = `detail_front_${j}`;
                        uploadedImages[key] = assetsHighRes[key] || assets[key];
                    }
                }
                if (preview.spec.assets.includes('back')) {
                    uploadedImages.top_back = assetsHighRes.top_back || assets.top_back;
                    uploadedImages.bottom_back = assetsHighRes.bottom_back || assets.bottom_back;
                    // Add Back Details
                    for (let j = 1; j <= 4; j++) {
                        const key = `detail_back_${j}`;
                        uploadedImages[key] = assetsHighRes[key] || assets[key];
                    }
                }

                // Handle fitDescription based on mode
                let finalFitDescription = preview.structured.fitDescription;
                if (preview.spec.fitDescriptionMode === 'first_sentence_only' && finalFitDescription) {
                    // Extract only first sentence
                    const firstSentenceMatch = finalFitDescription.match(/^[^.!?]+[.!?]/);
                    if (firstSentenceMatch) {
                        finalFitDescription = firstSentenceMatch[0].trim();
                    }
                }

                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productName: preview.structured.productName,
                        workflowType: workflowType,
                        uploadedImages: uploadedImages,
                        gender: gender,
                        resolution: resolution,
                        aspectRatio: aspectRatio,
                        hairBehindShoulders: preview.spec.excludeHairInfo ? undefined : preview.spec.hairBehind,
                        enableWind: preview.spec.enableWind,
                        isStylingShot: preview.spec.isStyling,
                        shotIndex: i + 1,
                        shotRole: preview.spec.isStyling ? 'styling' : 'technical',
                        lookAtCamera: preview.spec.excludeHairInfo ? undefined : preview.spec.lookAtCamera,
                        buttonsOpen: buttonsOpen,
                        tucked: tucked,
                        socksType: preview.spec.excludeSocksInfo ? 'none' : socksType,
                        closureType: closureType,
                        upperGarmentDescription: upperGarmentDescription,
                        lowerGarmentDescription: lowerGarmentDescription,
                        innerWearDescription: innerWearDescription,
                        shoesDescription: shoesDescription,
                        sleevesRolled: sleevesRolled,
                        excludeBeltAsset: preview.spec.excludeBeltAsset,
                        excludeHatAsset: preview.spec.excludeHatAsset,
                        excludeShoesAsset: preview.spec.excludeShoesAsset,
                        productDescription: preview.structured.productDescription,
                        fitDescription: finalFitDescription,
                        poseDescription: preview.structured.pose,
                        targetView: preview.spec.view.includes('back') ? 'back' : (preview.spec.view.includes('angled') ? 'side' : 'front'),
                        poseFocus: preview.spec.view.includes('detail') ? 'detail' : (preview.spec.camera.shot_type === 'close_up' ? 'closeup' : (preview.spec.camera.shot_type === 'cowboy_shot' ? 'upper' : 'full')),
                        editedPrompt: editedBatchPrompts[i],
                        seed: finalSeed,
                        enableWebSearch,
                        enableExpression,
                        enableGaze,
                        lightingPositive,
                        lightingNegative,
                        preview: false
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const imageUrl = data.images?.[0] || data.image_url;
                    if (imageUrl) {
                        generatedImages.push({
                            filename: `${preview.title}.jpg`,
                            url: imageUrl,
                            downloadName: `${preview.title}.jpg`
                        });
                        resultUrls.push(imageUrl);

                        // Save each one to history
                        addProject({
                            title: `Batch: ${productCode} - ${preview.title}`,
                            type: "Photoshoot",
                            imageUrl: imageUrl,
                            description: `Seed: ${finalSeed} | Prompt: ${editedBatchPrompts[i]}`
                        });
                    }
                }
            }

            // Update main preview area instead of using popup
            setIsGenerationSuccess(true);
            await new Promise(r => setTimeout(r, 1000));
            setResultImages(resultUrls);
            setBatchResultImages([]); // Clear batch result images to avoid popup trigger
            toast.success(language === "tr" ? "Toplu üretim tamamlandı!" : "Batch generation complete!");

        } catch (e: any) {
            console.error("BATCH CONFIRM ERROR:", e);
            toast.error(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
            setIsGenerationSuccess(false);
        }
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
    const [seed, setSeed] = useState<number | "">(""); // Default empty (random)
    const [isSeedManual, setIsSeedManual] = useState(false);
    const [enableWebSearch, setEnableWebSearch] = useState(false); // Default off
    const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(false); // Toggle for simple/advanced mode

    // State for Library Drawer
    const [activeLibraryAsset, setActiveLibraryAsset] = useState<string | null>(null);
    const [activeGroup, setActiveGroup] = useState<'product' | 'accessories' | null>(null);
    const [internalAsset, setInternalAsset] = useState<string | null>(null);
    const [libraryTab, setLibraryTab] = useState("templates");
    const [sessionLibrary, setSessionLibrary] = useState<string[]>([]);

    // LIBRARY STATES
    const [savedPoses, setSavedPoses] = useState<SavedPose[]>([]);
    const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
    const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBackground[]>([]);
    const [savedFits, setSavedFits] = useState<SavedFit[]>([]);
    const [savedShoes, setSavedShoes] = useState<SavedShoe[]>([]);
    const [savedJackets, setSavedJackets] = useState<SavedJacket[]>([]);
    const [savedBags, setSavedBags] = useState<SavedBag[]>([]);
    const [savedGlasses, setSavedGlasses] = useState<SavedGlasses[]>([]);
    const [savedHats, setSavedHats] = useState<SavedHat[]>([]);
    const [savedJewelry, setSavedJewelry] = useState<SavedJewelry[]>([]);
    const [savedBelts, setSavedBelts] = useState<SavedBelt[]>([]);
    const [savedLightings, setSavedLightings] = useState<SavedLighting[]>([]);

    // Dialog States
    const [showSavePoseDialog, setShowSavePoseDialog] = useState(false);
    const [showSaveModelDialog, setShowSaveModelDialog] = useState(false);
    const [showSaveAssetDialog, setShowSaveAssetDialog] = useState(false);
    const [showSaveLightingDialog, setShowSaveLightingDialog] = useState(false); // NEW

    // Temp Data for Saving
    const [tempPoseData, setTempPoseData] = useState<{ original: string, stickman: string } | null>(null);
    const [tempModelData, setTempModelData] = useState<{ url: string, name: string, gender: 'male' | 'female' } | null>(null);
    const [tempAssetData, setTempAssetData] = useState<{ key: string, url: string, name: string } | null>(null);
    const [tempLightingData, setTempLightingData] = useState<{ url: string, name: string, positivePrompt: string, negativePrompt: string, sendImageAsAsset: boolean } | null>(null); // NEW

    // Edit Thumbnail State
    const [editingThumbItem, setEditingThumbItem] = useState<{ type: string, id: string } | null>(null);
    const [editingItemPrompt, setEditingItemPrompt] = useState(""); // New: State for custom prompt editing
    const [editingItemTags, setEditingItemTags] = useState<string[]>([]); // New: State for pose tags
    const [editingItemNegativePrompt, setEditingItemNegativePrompt] = useState(""); // New: For lighting
    const [editingItemSendImage, setEditingItemSendImage] = useState(true); // New: For lighting toggle in edit

    // LOAD LIBRARIES from IndexedDB (with migration check)
    useEffect(() => {
        const loadLibraries = async () => {
            // First run migration if needed
            await dbOperations.migrateFromLocalStorage();

            // Load all stores
            try {
                const poses = await dbOperations.getAll<SavedPose>(STORES.POSES);
                setSavedPoses(poses.sort((a, b) => b.createdAt - a.createdAt));

                const models = await dbOperations.getAll<SavedModel>(STORES.MODELS);
                setSavedModels(models.sort((a, b) => b.createdAt - a.createdAt));

                const bgs = await dbOperations.getAll<SavedBackground>(STORES.BACKGROUNDS);
                setSavedBackgrounds(bgs.sort((a, b) => b.createdAt - a.createdAt));

                const fits = await dbOperations.getAll<SavedFit>(STORES.FITS);
                setSavedFits(fits.sort((a, b) => b.createdAt - a.createdAt));

                const shoes = await dbOperations.getAll<SavedShoe>(STORES.SHOES);
                setSavedShoes(shoes.sort((a, b) => b.createdAt - a.createdAt));

                const lightings = await dbOperations.getAll<SavedLighting>(STORES.LIGHTING);
                setSavedLightings(lightings.sort((a, b) => b.createdAt - a.createdAt));

                const jackets = await dbOperations.getAll<SavedJacket>(STORES.JACKETS);
                setSavedJackets(jackets.sort((a, b) => b.createdAt - a.createdAt));

                const bags = await dbOperations.getAll<SavedBag>(STORES.BAGS);
                setSavedBags(bags.sort((a, b) => b.createdAt - a.createdAt));

                const glasses = await dbOperations.getAll<SavedGlasses>(STORES.GLASSES);
                setSavedGlasses(glasses.sort((a, b) => b.createdAt - a.createdAt));

                const hats = await dbOperations.getAll<SavedHat>(STORES.HATS);
                setSavedHats(hats.sort((a, b) => b.createdAt - a.createdAt));

                const jewelry = await dbOperations.getAll<SavedJewelry>(STORES.JEWELRY);
                setSavedJewelry(jewelry.sort((a, b) => b.createdAt - a.createdAt));

                const belts = await dbOperations.getAll<SavedBelt>(STORES.BELTS);
                setSavedBelts(belts.sort((a, b) => b.createdAt - a.createdAt));

            } catch (e) {
                console.error("Failed to load libraries form DB", e);
                // Fallback to empty/default is handled by initial state
            }
        };

        loadLibraries();
    }, []);

    // RE-ANALYZE when workflow type changes (for batch mode)
    useEffect(() => {
        if (!batchMode) return; // Only for batch mode

        const reAnalyze = async () => {
            const garmentImages = [
                assets.main_product,
                assets.top_front, assets.top_back,
                assets.bottom_front, assets.bottom_back,
                assets.dress_front,
                assets.dress_front,
                assets.inner_wear,
                assets.shoes,
                assets.glasses // Include glasses in analysis
            ].filter(Boolean) as string[];

            if (garmentImages.length === 0) return; // No images to analyze

            try {
                toast.info(language === "tr" ? "Ürün tipi değişti, yeniden analiz ediliyor..." : "Workflow changed, re-analyzing...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: garmentImages, type: 'fabric', language: 'en', workflowType })
                });
                const data = await res.json();
                if (data.data) {
                    if (data.data.visualPrompt) {
                        setProductDescription(data.data.visualPrompt);
                    }
                    if (data.data.fitDescription) {
                        setFitDescription(data.data.fitDescription);
                    }
                    if (data.data.productName && !isManualProductName) {
                        setProductName(data.data.productName);
                    }

                    // Briefs
                    if (data.data.upperBrief) setUpperGarmentDescription(data.data.upperBrief);
                    if (data.data.lowerBrief) {
                        if (workflowType !== 'lower') setLowerGarmentDescription(data.data.lowerBrief);
                    }
                    if (data.data.innerBrief) setInnerWearDescription(data.data.innerBrief);
                    if (data.data.shoesBrief) setShoesDescription(data.data.shoesBrief);

                    toast.success(language === "tr" ? "Analiz güncellendi!" : "Analysis updated!");
                }
            } catch (e) {
                console.error("Re-analysis failed:", e);
            }
        };

        reAnalyze();
    }, [workflowType]); // Re-run when workflow type changes

    // Prevent accidental navigation if data exists
    useEffect(() => {
        const hasUnsavedChanges = Object.values(assets).some(val => val !== null);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [assets]);

    // Reset seed if assets change and it wasn't manual
    useEffect(() => {
        if (!isSeedManual && seed !== "") {
            setSeed("");
        }
    }, [assets, isSeedManual]);

    // === STATE PERSISTENCE: Save/Restore state on navigation ===
    useEffect(() => {
        // Restore state from sessionStorage on mount
        const savedState = sessionStorage.getItem('photoshoot-state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Restore LOW-RES assets (safe for sessionStorage)
                if (parsed.assets) {
                    setAssets(parsed.assets);
                    // Clear high-res when loading state since high-res is not persisted in sessionStorage
                    setAssetsHighRes(Object.keys(assetsHighRes).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
                }
                // NOTE: assetsHighRes is NOT restored (RAM only)
                if (parsed.productName) setProductName(parsed.productName);
                if (parsed.workflowType) setWorkflowType(parsed.workflowType);
                if (parsed.productDescription) setProductDescription(parsed.productDescription);
                if (parsed.fitDescription) setFitDescription(parsed.fitDescription);
                if (parsed.upperGarmentDescription) setUpperGarmentDescription(parsed.upperGarmentDescription);
                if (parsed.lowerGarmentDescription) setLowerGarmentDescription(parsed.lowerGarmentDescription);
                if (parsed.innerWearDescription) setInnerWearDescription(parsed.innerWearDescription);
                if (parsed.shoesDescription) setShoesDescription(parsed.shoesDescription);
                if (parsed.modelDescription) setModelDescription(parsed.modelDescription);
                if (parsed.buttonsOpen !== undefined) setButtonsOpen(parsed.buttonsOpen);
                if (parsed.tucked !== undefined) setTucked(parsed.tucked);
                if (parsed.socksType) setSocksType(parsed.socksType);
                if (parsed.closureType) setClosureType(parsed.closureType);
                if (parsed.gender) setGender(parsed.gender);
                if (parsed.resolution) setResolution(parsed.resolution);
                if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
                if (parsed.enableWind !== undefined) setEnableWind(parsed.enableWind);
                if (parsed.enableExpression !== undefined) setEnableExpression(parsed.enableExpression);
                if (parsed.enableGaze !== undefined) setEnableGaze(parsed.enableGaze);
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }
    }, []);

    // Save state to sessionStorage whenever key values change
    useEffect(() => {
        const stateToSave = {
            // Save LOW-RES assets (768px, safe for sessionStorage)
            assets,
            productName,
            workflowType,
            productDescription,
            fitDescription,
            upperGarmentDescription,
            lowerGarmentDescription,
            innerWearDescription,
            shoesDescription,
            modelDescription,
            buttonsOpen,
            tucked,
            socksType,
            closureType,
            gender,
            resolution,
            aspectRatio,
            enableWind,
            enableExpression,
            enableGaze
        };
        sessionStorage.setItem('photoshoot-state', JSON.stringify(stateToSave));
    }, [assets, productName, workflowType, productDescription, fitDescription, upperGarmentDescription, lowerGarmentDescription, innerWearDescription, shoesDescription, modelDescription, buttonsOpen, tucked, socksType, closureType, gender, resolution, aspectRatio, enableWind, enableExpression, enableGaze]);


    // POSE HANDLERS
    const handleSavePose = async (genderValue: 'male' | 'female' | 'skip') => {
        if (!tempPoseData) return;
        setShowSavePoseDialog(false);
        try {
            toast.info(language === "tr" ? "Stickman oluşturuluyor..." : "Converting to Stickman...");
            const res = await fetch("/api/pose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: tempPoseData.original })
            });
            if (!res.ok) throw new Error("Stickman conversion failed");
            const data = await res.json();
            const stickmanUrl = data.pose_image;
            setPoseStickman(stickmanUrl);

            // Pose analysis is now disabled. 
            // Pose analysis is now disabled.
            // The pose will be saved without automatic description.
            // analyzePose(tempPoseData.original);

            if (genderValue !== 'skip') {
                const optimizedThumb = await resizeImageToThumbnail(tempPoseData.original);

                // Upload to R2 if enabled - Using the Server Bridge for reliability
                let finalUrl = tempPoseData.original;
                let finalStickmanUrl = stickmanUrl;

                if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true") {
                    try {
                        toast.info(language === "tr" ? "Poz buluta kaydediliyor..." : "Saving pose to cloud...");

                        // Universal Server Upload helper
                        const serverUpload = async (b64: string, name: string) => {
                            const res = await fetch("/api/r2/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ base64: b64, fileName: name, folder: "poses" })
                            });
                            if (!res.ok) throw new Error("Server upload failed");
                            const data = await res.json();
                            return data.url;
                        };

                        const [r2Url, r2Stickman] = await Promise.all([
                            serverUpload(tempPoseData.original, "pose_original.png"),
                            serverUpload(stickmanUrl, "pose_stickman.png")
                        ]);
                        finalUrl = r2Url;
                        finalStickmanUrl = r2Stickman;
                    } catch (r2Error) {
                        console.error("R2 Pose Upload Error:", r2Error);
                        toast.error(language === "tr" ? "Buluta kaydedilemedi, yerel hafızaya alınıyor." : "Cloud save failed, using local storage.");
                    }
                }

                const newPose: SavedPose = {
                    id: crypto.randomUUID(),
                    url: finalUrl,
                    name: language === "tr" ? "Yeni Poz" : "New Pose",
                    thumbUrl: optimizedThumb,
                    originalThumb: optimizedThumb,
                    stickmanUrl: finalStickmanUrl,
                    gender: genderValue,
                    createdAt: Date.now()
                };
                const updated = [newPose, ...savedPoses];
                setSavedPoses(updated);
                await dbOperations.add(STORES.POSES, newPose);
                toast.success(language === "tr" ? "Poz kütüphaneye kaydedildi" : "Pose saved to library");

                // Update active assets
                setAssets(prev => ({ ...prev, pose: finalStickmanUrl }));
                setPoseStickman(finalStickmanUrl);
            }
            setTempPoseData(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to convert/save pose");
        }
    };

    const deleteSavedPose = async (id: string) => {
        const updated = savedPoses.filter(p => p.id !== id);
        setSavedPoses(updated);
        await dbOperations.delete(STORES.POSES, id);
        toast.info(language === "tr" ? "Poz silindi" : "Pose deleted");
    };

    // MODEL HANDLERS
    const handleSaveModel = async () => {
        if (!tempModelData) return;

        let finalUrl = tempModelData.url;
        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true") {
            try {
                toast.info(language === "tr" ? "Model buluta kaydediliyor..." : "Saving model to cloud...");
                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base64: tempModelData.url, fileName: "model.png", folder: "models" })
                });
                if (!res.ok) throw new Error("Server upload failed");
                const data = await res.json();
                finalUrl = data.url;
            } catch (r2Error) {
                console.error("R2 Model Upload Error:", r2Error);
                toast.error(language === "tr" ? "Buluta yükleme başarısız." : "Cloud upload failed.");
            }
        }

        const newModel: SavedModel = {
            id: crypto.randomUUID(),
            url: finalUrl,
            name: tempModelData.name || (language === "tr" ? "Yeni Model" : "New Model"),
            gender: tempModelData.gender,
            thumbUrl: finalUrl,
            createdAt: Date.now()
        };
        const updated = [newModel, ...savedModels];
        setSavedModels(updated);
        await dbOperations.add(STORES.MODELS, newModel);
        toast.success(language === "tr" ? "Model kütüphaneye kaydedildi" : "Model saved to library");
        setAssets(prev => ({ ...prev, model: newModel.url }));
        setAssetsHighRes(prev => ({ ...prev, model: null }));
        setGender(newModel.gender);
        setTempModelData(null);
        setShowSaveModelDialog(false);
    };

    const deleteSavedModel = async (id: string) => {
        const updated = savedModels.filter(m => m.id !== id);
        setSavedModels(updated);
        await dbOperations.delete(STORES.MODELS, id);
        toast.info(language === "tr" ? "Model silindi" : "Model deleted");
    };

    // GENERIC ASSET HANDLERS
    const handleSaveAsset = async () => {
        if (!tempAssetData) return;
        const { key, url, name } = tempAssetData;

        let finalUrl = url;
        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true") {
            try {
                toast.info(language === "tr" ? "Öğe buluta kaydediliyor..." : "Saving item to cloud...");
                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base64: url, fileName: `${key}.png`, folder: key })
                });
                if (!res.ok) throw new Error("Server upload failed");
                const data = await res.json();
                finalUrl = data.url;
            } catch (r2Error) {
                console.error(`R2 ${key} Upload Error:`, r2Error);
                toast.error(language === "tr" ? "Buluta yükleme başarısız." : "Cloud upload failed.");
            }
        }

        const newItem: LibraryItem = {
            id: crypto.randomUUID(),
            url: finalUrl,
            name: name || (language === "tr" ? "Yeni Öğe" : "New Item"),
            thumbUrl: finalUrl,
            createdAt: Date.now()
        };

        if (key === 'background') {
            const updated = [newItem as SavedBackground, ...savedBackgrounds];
            setSavedBackgrounds(updated);
            await dbOperations.add(STORES.BACKGROUNDS, newItem);
        } else if (key === 'fit_pattern') {
            const updated = [newItem as SavedFit, ...savedFits];
            setSavedFits(updated);
            await dbOperations.add(STORES.FITS, newItem);
        } else if (key === 'shoes') {
            const updated = [newItem as SavedShoe, ...savedShoes];
            setSavedShoes(updated);
            await dbOperations.add(STORES.SHOES, newItem);
        } else if (key === 'jacket') {
            const updated = [newItem as SavedJacket, ...savedJackets];
            setSavedJackets(updated);
            await dbOperations.add(STORES.JACKETS, newItem);
        } else if (key === 'bag') {
            const updated = [newItem as SavedBag, ...savedBags];
            setSavedBags(updated);
            await dbOperations.add(STORES.BAGS, newItem);
        } else if (key === 'glasses') {
            const updated = [newItem as SavedGlasses, ...savedGlasses];
            setSavedGlasses(updated);
            await dbOperations.add(STORES.GLASSES, newItem);
        } else if (key === 'hat') {
            const updated = [newItem as SavedHat, ...savedHats];
            setSavedHats(updated);
            await dbOperations.add(STORES.HATS, newItem);
        } else if (key === 'jewelry') {
            const updated = [newItem as SavedJewelry, ...savedJewelry];
            setSavedJewelry(updated);
            await dbOperations.add(STORES.JEWELRY, newItem);
        } else if (key === 'belt') {
            const updated = [newItem as SavedBelt, ...savedBelts];
            setSavedBelts(updated);
            await dbOperations.add(STORES.BELTS, newItem);
        }

        toast.success(language === "tr" ? "Öğe kütüphaneye kaydedildi" : "Item saved to library");
        setAssets(prev => ({ ...prev, [key]: finalUrl }));
        setAssetsHighRes(prev => ({ ...prev, [key]: null }));
        setTempAssetData(null);
        setShowSaveAssetDialog(false);
    };

    const deleteSavedAsset = async (key: string, id: string) => {
        if (key === 'background') {
            const updated = savedBackgrounds.filter(i => i.id !== id);
            setSavedBackgrounds(updated);
            await dbOperations.delete(STORES.BACKGROUNDS, id);
        } else if (key === 'fit_pattern') {
            const updated = savedFits.filter(i => i.id !== id);
            setSavedFits(updated);
            await dbOperations.delete(STORES.FITS, id);
        } else if (key === 'shoes') {
            const updated = savedShoes.filter(i => i.id !== id);
            setSavedShoes(updated);
            await dbOperations.delete(STORES.SHOES, id);
        } else if (key === 'jacket') {
            const updated = savedJackets.filter(i => i.id !== id);
            setSavedJackets(updated);
            await dbOperations.delete(STORES.JACKETS, id);
        } else if (key === 'bag') {
            const updated = savedBags.filter(i => i.id !== id);
            setSavedBags(updated);
            await dbOperations.delete(STORES.BAGS, id);
        } else if (key === 'glasses') {
            const updated = savedGlasses.filter(i => i.id !== id);
            setSavedGlasses(updated);
            await dbOperations.delete(STORES.GLASSES, id);
        } else if (key === 'hat') {
            const updated = savedHats.filter(i => i.id !== id);
            setSavedHats(updated);
            await dbOperations.delete(STORES.HATS, id);
        } else if (key === 'jewelry') {
            const updated = savedJewelry.filter(i => i.id !== id);
            setSavedJewelry(updated);
            await dbOperations.delete(STORES.JEWELRY, id);
        } else if (key === 'belt') {
            const updated = savedBelts.filter(i => i.id !== id);
            setSavedBelts(updated);
            await dbOperations.delete(STORES.BELTS, id);
        }
        toast.info(language === "tr" ? "Öğe silindi" : "Item deleted");
    };

    const handleSaveLighting = async () => {
        if (!tempLightingData) return;

        // Upload to R2 if enabled
        let finalUrl = tempLightingData.url;
        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true" && finalUrl.startsWith('data:')) {
            toast.info(language === "tr" ? "Işık referansı buluta kaydediliyor..." : "Saving lighting reference to cloud...");
            finalUrl = await uploadToR2(tempLightingData.url, "lighting_setup.png");
        }

        const newLighting: SavedLighting = {
            id: `lighting-${Date.now()}`,
            url: finalUrl,
            name: tempLightingData.name || (language === "tr" ? "Yeni Işık" : "New Lighting"),
            positivePrompt: tempLightingData.positivePrompt,
            negativePrompt: tempLightingData.negativePrompt,
            sendImageAsAsset: tempLightingData.sendImageAsAsset,
            createdAt: Date.now()
        };
        const updated = [newLighting, ...savedLightings];
        setSavedLightings(updated);
        await dbOperations.add(STORES.LIGHTING, newLighting);

        // Also set it as active
        setLightingPositive(newLighting.positivePrompt);
        setLightingNegative(newLighting.negativePrompt);
        setLightingSendImage(newLighting.sendImageAsAsset);
        setAssets(p => ({ ...p, lighting: newLighting.url }));
        setAssetsHighRes(p => ({ ...p, lighting: null }));

        setShowSaveLightingDialog(false);
        setTempLightingData(null);
        toast.success(language === "tr" ? "Işıklandırma kütüphaneye kaydedildi" : "Lighting saved to library");
    };

    // THUMBNAIL UPDATE HANDLER
    const handleUpdateThumbnail = async (file: File | null) => {
        if (!editingThumbItem) return;
        const { type, id } = editingThumbItem;
        try {
            let resizedThumb = "";
            if (file) {
                resizedThumb = await resizeImageToThumbnail(await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                }));
            }

            if (type === 'pose') {
                const updated = savedPoses.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt, tags: editingItemTags } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedPoses(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.POSES, itemToUpdate);
                    // Proactively update current session if this is the active pose
                    if (assets.pose === itemToUpdate.stickmanUrl) {
                        setPoseDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'model') {
                const updated = savedModels.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedModels(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.MODELS, itemToUpdate);
                    // Proactively update session
                    if (assets.model === itemToUpdate.url) {
                        setModelDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'background') {
                const updated = savedBackgrounds.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedBackgrounds(updated);
                if (itemToUpdate) await dbOperations.add(STORES.BACKGROUNDS, itemToUpdate);
            } else if (type === 'fit_pattern') {
                const updated = savedFits.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedFits(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.FITS, itemToUpdate);
                    // Proactively update current session if this is the active fit
                    if (assets.fit_pattern === itemToUpdate.url) {
                        setFitDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'shoes') {
                const updated = savedShoes.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedShoes(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.SHOES, itemToUpdate);
                    // Proactively update current session if this is the active shoes
                    if (assets.shoes === itemToUpdate.url) {
                        setShoesDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'lighting') {
                const updated = savedLightings.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, positivePrompt: editingItemPrompt, negativePrompt: editingItemNegativePrompt, sendImageAsAsset: editingItemSendImage } : item);
                let itemToUpdate = updated.find(i => i.id === id);

                if (!itemToUpdate && LIGHTING_PRESETS.some(lp => lp.id === id)) {
                    // Editing a preset for the first time
                    const preset = LIGHTING_PRESETS.find(lp => lp.id === id)!;
                    itemToUpdate = { ...preset, thumbUrl: resizedThumb || preset.thumbUrl, positivePrompt: editingItemPrompt, negativePrompt: editingItemNegativePrompt, sendImageAsAsset: editingItemSendImage };
                    setSavedLightings([itemToUpdate, ...savedLightings]);
                } else {
                    setSavedLightings(updated);
                }

                if (itemToUpdate) {
                    await dbOperations.add(STORES.LIGHTING, itemToUpdate);

                    // Proactively update current session if this is the active lighting
                    // We check if the OLD prompt matches what's currently in state
                    const oldItem = savedLightings.find(i => i.id === id) || LIGHTING_PRESETS.find(lp => lp.id === id);
                    if (oldItem && (lightingPositive === oldItem.positivePrompt || lightingNegative === oldItem.negativePrompt)) {
                        setLightingPositive(itemToUpdate.positivePrompt);
                        setLightingNegative(itemToUpdate.negativePrompt);
                        setLightingSendImage(itemToUpdate.sendImageAsAsset);
                    }
                }
            } else if (type === 'jacket') {
                const updated = savedJackets.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedJackets(updated);
                if (itemToUpdate) await dbOperations.add(STORES.JACKETS, itemToUpdate);
            } else if (type === 'bag') {
                const updated = savedBags.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedBags(updated);
                if (itemToUpdate) await dbOperations.add(STORES.BAGS, itemToUpdate);
            } else if (type === 'glasses') {
                const updated = savedGlasses.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedGlasses(updated);
                if (itemToUpdate) await dbOperations.add(STORES.GLASSES, itemToUpdate);
            } else if (type === 'hat') {
                const updated = savedHats.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedHats(updated);
                if (itemToUpdate) await dbOperations.add(STORES.HATS, itemToUpdate);
            } else if (type === 'jewelry') {
                const updated = savedJewelry.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedJewelry(updated);
                if (itemToUpdate) await dbOperations.add(STORES.JEWELRY, itemToUpdate);
            } else if (type === 'belt') {
                const updated = savedBelts.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedBelts(updated);
                if (itemToUpdate) await dbOperations.add(STORES.BELTS, itemToUpdate);
            }
            toast.success(language === "tr" ? "Güncellendi" : "Updated");
            setEditingThumbItem(null);
            setEditingItemPrompt("");
            setEditingItemTags([]); // Clear tags when closing dialog
        } catch (e) {
            console.error(e);
            toast.error("Update failed");
        }
    };

    // Sync internal asset for animation persistence
    useEffect(() => {
        if (activeLibraryAsset) setInternalAsset(activeLibraryAsset);
        // Reset tab to library appropriately
        if (activeLibraryAsset) {
            setLibraryTab("library");
        }
    }, [activeLibraryAsset]);


    // Library Filter States (Mock)
    const [filterAge, setFilterAge] = useState("All");
    const [filterGender, setFilterGender] = useState("All");
    const [filterEthnicity, setFilterEthnicity] = useState("All");

    // library items mapping
    const getLibraryItems = (assetKey: string) => {
        if (assetKey === 'model') return savedModels.map(m => ({ id: m.id, src: m.url, label: m.name }));
        if (assetKey === 'background') return BACKGROUND_PRESETS.map(b => ({ id: b.id, src: b.preview!, label: language === "tr" ? b.labelTr : b.label }));
        if (assetKey === 'pose') return POSE_PRESETS.map(p => ({ id: p.id, src: p.preview, icon: p.icon, label: language === "tr" ? p.labelTr : p.label }));
        if (assetKey === 'lighting') return [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))];
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
                // Unlimited storage for local app
                setSessionLibrary(prev => [item.src, ...prev]);
            }
        }

        if (item.src) {
            setAssets(prev => ({ ...prev, [activeLibraryAsset]: item.src }));
            setAssetsHighRes(prev => ({ ...prev, [activeLibraryAsset]: null }));
        } else if (item.icon) {
            // For poses, we might store the icon or a specific ID
            setAssets(prev => ({ ...prev, [activeLibraryAsset]: item.id }));
            setAssetsHighRes(prev => ({ ...prev, [activeLibraryAsset]: null }));
        }

        // RESET DESCRIPTIONS to prevent stale analysis
        if (activeLibraryAsset === 'pose') setPoseDescription(null);
        if (activeLibraryAsset === 'main_product' || activeLibraryAsset === 'top_front' || activeLibraryAsset === 'bottom_front') setProductDescription(null);
        if (activeLibraryAsset === 'fit_pattern') setFitDescription(null);
        if (activeLibraryAsset === 'shoes') {
            const shoe = savedShoes.find(s => s.url === item.src);
            if (shoe) {
                handleSavedShoeClick(shoe);
                return;
            }
        }
        if (activeLibraryAsset === 'jacket') {
            const jacket = savedJackets.find(j => j.url === item.src);
            if (jacket) {
                handleSavedJacketClick(jacket);
                return;
            }
        }
        if (activeLibraryAsset === 'bag') {
            const bag = savedBags.find(b => b.url === item.src);
            if (bag) {
                handleSavedBagClick(bag);
                return;
            }
        }
        if (activeLibraryAsset === 'glasses') {
            const gl = savedGlasses.find(g => g.url === item.src);
            if (gl) {
                handleSavedGlassesClick(gl);
                return;
            }
        }
        if (activeLibraryAsset === 'hat') {
            const h = savedHats.find(hat => hat.url === item.src);
            if (h) {
                handleSavedHatClick(h);
                return;
            }
        }
        if (activeLibraryAsset === 'jewelry') {
            const jw = savedJewelry.find(j => j.url === item.src);
            if (jw) {
                handleSavedJewelryClick(jw);
                return;
            }
        }
        if (activeLibraryAsset === 'belt') {
            const bl = savedBelts.find(b => b.url === item.src);
            if (bl) {
                handleSavedBeltClick(bl);
                return;
            }
        }
        if (activeLibraryAsset === 'model') {
            const model = savedModels.find(m => m.url === item.src);
            if (model) {
                handleSavedModelClick(model);
                return;
            }
        }

        // Logic for navigation after selection - REMOVED so it stays open
        // User request: "X e basmadan ... kaybolmasın geri gitmesin"
        // We do nothing here, letting the user manually Close (X) or Go Back.
    };

    const handleEditItemClick = (type: string, id: string) => {
        setEditingThumbItem({ type, id });
        if (type === 'pose') {
            const pose = savedPoses.find(p => p.id === id);
            setEditingItemPrompt(pose?.customPrompt || "");
            setEditingItemTags(pose?.tags || []); // Load tags for this specific pose
        } else if (type === 'model') {
            const model = savedModels.find(m => m.id === id);
            setEditingItemPrompt(model?.customPrompt || "");
            setEditingItemTags([]);
        } else if (type === 'fit_pattern') {
            const fit = savedFits.find(f => f.id === id);
            setEditingItemPrompt(fit?.customPrompt || "");
            setEditingItemTags([]); // Clear tags for non-pose items
        } else if (type === 'lighting') {
            const lighting = savedLightings.find(l => l.id === id) || LIGHTING_PRESETS.find(lp => lp.id === id);
            setEditingItemPrompt(lighting?.positivePrompt || "");
            setEditingItemNegativePrompt(lighting?.negativePrompt || "");
            setEditingItemSendImage(lighting?.sendImageAsAsset ?? true);
            setEditingItemTags([]);
        } else if (type === 'shoes') {
            const shoe = savedShoes.find(s => s.id === id);
            setEditingItemPrompt(shoe?.customPrompt || "");
            setEditingItemTags([]);
        } else {
            setEditingItemPrompt("");
            setEditingItemTags([]);
        }
    };

    const handleSavedModelClick = (model: SavedModel) => {
        setAssets(prev => ({ ...prev, model: model.url }));
        setAssetsHighRes(prev => ({ ...prev, model: null }));
        if (model.customPrompt) {
            setModelDescription(model.customPrompt);
        } else {
            setModelDescription(null);
        }
    };

    const handleSavedFitClick = (fit: SavedFit) => {
        setAssets(prev => ({ ...prev, fit_pattern: fit.url }));
        setAssetsHighRes(prev => ({ ...prev, fit_pattern: null }));
        if (fit.customPrompt) {
            setFitDescription(fit.customPrompt);
        } else {
            setFitDescription(null);
        }
    };

    const handleSavedShoeClick = (shoe: SavedShoe) => {
        setAssets(prev => ({ ...prev, shoes: shoe.url }));
        setAssetsHighRes(prev => ({ ...prev, shoes: null }));
        if (shoe.customPrompt) setShoesDescription(shoe.customPrompt);
        else setShoesDescription(null);
    };

    const handleSavedJacketClick = (jack: SavedJacket) => {
        setAssets(prev => ({ ...prev, jacket: jack.url }));
        setAssetsHighRes(prev => ({ ...prev, jacket: null }));
        // No specific jacket description state yet, but could be added if needed
    };

    const handleSavedBagClick = (bag: SavedBag) => {
        setAssets(prev => ({ ...prev, bag: bag.url }));
        setAssetsHighRes(prev => ({ ...prev, bag: null }));
    };

    const handleSavedGlassesClick = (gl: SavedGlasses) => {
        setAssets(prev => ({ ...prev, glasses: gl.url }));
        setAssetsHighRes(prev => ({ ...prev, glasses: null }));
    };

    const handleSavedHatClick = (h: SavedHat) => {
        setAssets(prev => ({ ...prev, hat: h.url }));
        setAssetsHighRes(prev => ({ ...prev, hat: null }));
    };

    const handleSavedJewelryClick = (jw: SavedJewelry) => {
        setAssets(prev => ({ ...prev, jewelry: jw.url }));
        setAssetsHighRes(prev => ({ ...prev, jewelry: null }));
    };

    const handleSavedBeltClick = (bl: SavedBelt) => {
        setAssets(prev => ({ ...prev, belt: bl.url }));
        setAssetsHighRes(prev => ({ ...prev, belt: null }));
    };

    const handleSavedPoseClick = (pose: SavedPose) => {
        setAssets(prev => ({ ...prev, pose: pose.stickmanUrl }));
        setAssetsHighRes(prev => ({ ...prev, pose: null }));
        setPoseStickman(pose.stickmanUrl);

        if (pose.customPrompt) {
            setPoseDescription(pose.customPrompt);
        } else {
            // Pose analysis is disabled. Keep as null.
            setPoseDescription(null);
        }
    };

    const handleAssetRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeAsset(id);
    };

    // Click outside handler for Library Drawer
    // Click outside handler Removed as requested to only close with X or Back
    // const drawerRef = useRef<HTMLDivElement>(null);
    // useEffect(() => {...}, [activeLibraryAsset]);

    // FORCE TAB SELECTION when asset changes
    useEffect(() => {
        // Always default to library for all assets including model/pose
        if (internalAsset) {
            setLibraryTab('library');
        }
    }, [activeLibraryAsset, activeGroup]);

    {/* Updated AssetCard: Split Interaction (Direct Upload vs Library) */ }
    const AssetCard = ({ id, label, icon: Icon, required = false }: { id: string, label: string, icon: any, required?: boolean }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);
        const [isDragOver, setIsDragOver] = useState(false);

        const handleDirectUploadClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            fileInputRef.current?.click();
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                handleAssetUpload(id, e.target.files[0]);
            }
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
        };

        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    handleAssetUpload(id, file);
                } else {
                    toast.error(language === "tr" ? "Sadece görsel dosyaları kabul edilir" : "Only image files are accepted");
                }
            }
        };

        return (
            <div
                className={`asset-card-trigger relative group h-14 rounded-lg border flex items-center gap-0 overflow-hidden transition-all
                ${assets[id] ? 'border-violet-500 bg-violet-50/10' : 'border-border hover:border-violet-400 hover:bg-muted/50'}
                ${required && !assets[id] ? 'ring-1 ring-red-400/50' : ''}
                ${activeLibraryAsset === id ? 'ring-2 ring-violet-500 border-violet-500 bg-violet-50/20' : ''}
                ${isDragOver ? 'ring-2 ring-green-500 border-green-500 bg-green-50/20 scale-105' : ''}
            `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Drag Over Overlay */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-green-600 font-bold text-xs">{language === "tr" ? "Bırak" : "Drop"}</span>
                    </div>
                )}

                {/* LEFT: Direct Upload / Preview Area */}
                <div
                    className="h-full w-14 flex items-center justify-center border-r bg-muted/30 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors relative"
                    onClick={handleDirectUploadClick}
                    title={language === "tr" ? "Direkt Yükle veya Sürükle-Bırak" : "Direct Upload or Drag & Drop"}
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

                        {/* Lighting Asset Toggle */}
                        {id === 'lighting' && assets[id] && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightingSendImage(!lightingSendImage);
                                }}
                                className={`transition-all p-1 rounded ${lightingSendImage ? 'text-violet-500 hover:text-violet-600' : 'text-zinc-400 hover:text-zinc-500'}`}
                                title={lightingSendImage ? (language === "tr" ? "Görsel Referans Aktif" : "Visual Reference Active") : (language === "tr" ? "Sadece Prompt Aktif" : "Prompt Only Active")}
                            >
                                {lightingSendImage ? <Eye size={16} /> : <EyeOff size={16} />}
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
                className={`absolute lg:left-[600px] left-0 top-0 bottom-0 w-80 lg:w-80 bg-background border-r shadow-2xl z-10 flex flex-col transition-all duration-300 ease-in-out
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
                {(activeLibraryAsset === 'product_group' || activeLibraryAsset === 'accessories_group' || activeLibraryAsset === 'accessories') ? (
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
                                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 mt-4">{language === "tr" ? "Ön Detaylar" : "Front Details"}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <AssetCard id="detail_front_1" label={language === "tr" ? "Ön Detay 1" : "Front Detail 1"} icon={ScanLine} />
                                    <AssetCard id="detail_front_2" label={language === "tr" ? "Ön Detay 2" : "Front Detail 2"} icon={ScanLine} />
                                    <AssetCard id="detail_front_3" label={language === "tr" ? "Ön Detay 3" : "Front Detail 3"} icon={ScanLine} />
                                    <AssetCard id="detail_front_4" label={language === "tr" ? "Ön Detay 4" : "Front Detail 4"} icon={ScanLine} />
                                </div>
                                <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 mt-4">{language === "tr" ? "Arka Detaylar" : "Back Details"}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <AssetCard id="detail_back_1" label={language === "tr" ? "Arka Detay 1" : "Back Detail 1"} icon={ScanLine} />
                                    <AssetCard id="detail_back_2" label={language === "tr" ? "Arka Detay 2" : "Back Detail 2"} icon={ScanLine} />
                                    <AssetCard id="detail_back_3" label={language === "tr" ? "Arka Detay 3" : "Back Detail 3"} icon={ScanLine} />
                                    <AssetCard id="detail_back_4" label={language === "tr" ? "Arka Detay 4" : "Back Detail 4"} icon={ScanLine} />
                                </div>

                            </>
                        )}

                        {(activeLibraryAsset === 'accessories_group' || activeLibraryAsset === 'accessories') && (
                            <>
                                <AssetCard id="jacket" label={language === "tr" ? "Dış Giyim" : "Outerwear"} icon={Shirt} />
                                <AssetCard id="bag" label={language === "tr" ? "Çanta" : "Bag"} icon={ShoppingBag} />
                                <AssetCard id="glasses" label={language === "tr" ? "Gözlük" : "Glasses"} icon={Glasses} />
                                <AssetCard id="hat" label={language === "tr" ? "Şapka" : "Hat"} icon={Sparkles} />
                                <AssetCard id="jewelry" label={language === "tr" ? "Takı" : "Jewelry"} icon={Gem} />
                                {hasWaist && <AssetCard id="belt" label={language === "tr" ? "Kemer" : "Belt"} icon={ScanLine} />}
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
                                        onClick={() => { setPoseFocus('full'); setUpperFraming('full'); }}
                                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${poseFocus === 'full' ? 'bg-background shadow text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {language === "tr" ? "Tam Boy" : "Full Body"}
                                    </button>
                                    <button
                                        onClick={() => { setPoseFocus('upper'); setUpperFraming('medium_full'); }}
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
                                    {/* POSE & MODEL Share the same "Library | Upload" structure */}
                                    {['pose', 'model'].includes(internalAsset || "") ? (
                                        <>
                                            <TabsTrigger value="library" className="text-xs col-span-2">{language === "tr" ? "Kütüphane" : "Library"}</TabsTrigger>
                                            <TabsTrigger value="assets" className="text-xs col-span-1">{language === "tr" ? "Yükle" : "Upload"}</TabsTrigger>
                                        </>
                                    ) : (
                                        /* Standard or other custom tabs */
                                        <>
                                            <TabsTrigger value="library" className="text-xs col-span-1">{language === "tr" ? "Kütüphane" : "Library"}</TabsTrigger>
                                            <TabsTrigger value="assets" className="text-xs col-span-2">{language === "tr" ? "Yükle" : "Upload"}</TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                            </div>

                            {/* TAB: LIBRARY */}
                            <TabsContent value="library" className="flex-1 overflow-y-auto p-3 space-y-4">
                                {internalAsset === 'pose' ? (
                                    <div className="space-y-4">
                                        {['female', 'male'].map(g => (
                                            <div key={g} className="space-y-2">
                                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                                    <User size={12} className={g === 'female' ? 'text-pink-500' : 'text-blue-500'} />
                                                    {g === 'female' ? "Female Poses" : "Male Poses"}
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                    {savedPoses.filter(p => {
                                                        const isGenderMatch = p.gender === g;
                                                        if (!isGenderMatch) return false;

                                                        if (poseFocus === 'upper') {
                                                            return p.tags?.includes('ust_beden');
                                                        } else if (poseFocus === 'full') {
                                                            // Show everything that isn't explicitly marked as ONLY 'ust_beden',
                                                            // OR specifically marked as 'tam_boy'
                                                            return p.tags?.includes('tam_boy') || !p.tags?.includes('ust_beden');
                                                        }
                                                        return true;
                                                    }).map(pose => (
                                                        <div key={pose.id} className="group relative aspect-[2/3] rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all shrink-0">
                                                            <img src={pose.thumbUrl || pose.originalThumb} className="w-full h-full object-cover" onClick={() => handleSavedPoseClick(pose)} />
                                                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => { e.stopPropagation(); deleteSavedPose(pose.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleEditItemClick('pose', pose.id); }} className="p-1 bg-violet-500 text-white rounded hover:bg-violet-600"><Edit2 size={10} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : internalAsset === 'model' ? (
                                    <div className="space-y-4">
                                        {['female', 'male'].map(g => (
                                            <div key={g} className="space-y-2">
                                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                                                    <User size={12} className={g === 'female' ? 'text-pink-500' : 'text-blue-500'} />
                                                    {g === 'female' ? "Female Models" : "Male Models"}
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                    {savedModels.filter(m => m.gender === g).map(model => (
                                                        <div key={model.id} className="group relative aspect-[2/3] rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all shrink-0">
                                                            <img src={model.thumbUrl || model.url} className="w-full h-full object-cover" onClick={() => { setAssets(p => ({ ...p, model: model.url })); setAssetsHighRes(p => ({ ...p, model: null })); setGender(model.gender); setActiveLibraryAsset(null); }} />
                                                            <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white truncate">{model.name}</div>
                                                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => { e.stopPropagation(); deleteSavedModel(model.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleEditItemClick('model', model.id); }} className="p-1 bg-violet-500 text-white rounded hover:bg-violet-600"><Edit2 size={10} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (['background', 'fit_pattern', 'shoes', 'lighting', 'jacket', 'bag', 'glasses', 'hat', 'jewelry', 'belt'].includes(internalAsset || '')) ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {(internalAsset === 'background' ? savedBackgrounds :
                                                internalAsset === 'fit_pattern' ? savedFits :
                                                    internalAsset === 'lighting' ? [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))] :
                                                        internalAsset === 'shoes' ? savedShoes :
                                                            internalAsset === 'jacket' ? savedJackets :
                                                                internalAsset === 'bag' ? savedBags :
                                                                    internalAsset === 'glasses' ? savedGlasses :
                                                                        internalAsset === 'hat' ? savedHats :
                                                                            internalAsset === 'jewelry' ? savedJewelry :
                                                                                internalAsset === 'belt' ? savedBelts :
                                                                                    []).map(item => (
                                                                                        <div key={item.id} className="group relative aspect-square rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                                                                                            {(item.thumbUrl || item.url) ? (
                                                                                                <img
                                                                                                    src={item.thumbUrl || item.url}
                                                                                                    className="w-full h-full object-cover"
                                                                                                    onClick={() => {
                                                                                                        if (internalAsset === 'fit_pattern') {
                                                                                                            handleSavedFitClick(item as SavedFit);
                                                                                                        } else if (internalAsset === 'shoes') {
                                                                                                            handleSavedShoeClick(item as SavedShoe);
                                                                                                        } else if (internalAsset === 'jacket') {
                                                                                                            handleSavedJacketClick(item as SavedJacket);
                                                                                                        } else if (internalAsset === 'bag') {
                                                                                                            handleSavedBagClick(item as SavedBag);
                                                                                                        } else if (internalAsset === 'glasses') {
                                                                                                            handleSavedGlassesClick(item as SavedGlasses);
                                                                                                        } else if (internalAsset === 'hat') {
                                                                                                            handleSavedHatClick(item as SavedHat);
                                                                                                        } else if (internalAsset === 'jewelry') {
                                                                                                            handleSavedJewelryClick(item as SavedJewelry);
                                                                                                        } else if (internalAsset === 'belt') {
                                                                                                            handleSavedBeltClick(item as SavedBelt);
                                                                                                        } else if (internalAsset === 'lighting') {
                                                                                                            const l = item as SavedLighting;
                                                                                                            setAssets(p => ({ ...p, lighting: l.url || "LIGHTING_SET" }));
                                                                                                            setAssetsHighRes(p => ({ ...p, lighting: null }));
                                                                                                            setLightingPositive(l.positivePrompt);
                                                                                                            setLightingNegative(l.negativePrompt);
                                                                                                            setLightingSendImage(l.sendImageAsAsset);
                                                                                                        } else {
                                                                                                            setAssets(p => ({ ...p, [internalAsset!]: item.url }));
                                                                                                            setAssetsHighRes(p => ({ ...p, [internalAsset!]: null }));
                                                                                                        }
                                                                                                        setActiveLibraryAsset(null);
                                                                                                    }}
                                                                                                />
                                                                                            ) : (
                                                                                                <div
                                                                                                    className="w-full h-full flex flex-col items-center justify-center bg-violet-100 text-violet-600 font-bold text-[10px] p-2 text-center"
                                                                                                    onClick={() => {
                                                                                                        if (internalAsset === 'lighting') {
                                                                                                            const l = item as SavedLighting;
                                                                                                            setAssets(p => ({ ...p, lighting: "LIGHTING_SET" }));
                                                                                                            setAssetsHighRes(p => ({ ...p, lighting: null }));
                                                                                                            setLightingPositive(l.positivePrompt);
                                                                                                            setLightingNegative(l.negativePrompt);
                                                                                                            setLightingSendImage(l.sendImageAsAsset);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'shoes') {
                                                                                                            handleSavedShoeClick(item as SavedShoe);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'jacket') {
                                                                                                            handleSavedJacketClick(item as SavedJacket);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'bag') {
                                                                                                            handleSavedBagClick(item as SavedBag);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'glasses') {
                                                                                                            handleSavedGlassesClick(item as SavedGlasses);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'hat') {
                                                                                                            handleSavedHatClick(item as SavedHat);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'jewelry') {
                                                                                                            handleSavedJewelryClick(item as SavedJewelry);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        } else if (internalAsset === 'belt') {
                                                                                                            handleSavedBeltClick(item as SavedBelt);
                                                                                                            setActiveLibraryAsset(null);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <Camera size={20} className="mb-1 opacity-50" />
                                                                                                    {item.name}
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white truncate">{item.name}</div>
                                                                                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                {/* Presets (static ones) are NOT deletable, but they ARE editable now */}
                                                                                                {(!LIGHTING_PRESETS.some(lp => lp.id === item.id)) ? (
                                                                                                    <>
                                                                                                        <button onClick={(e) => { e.stopPropagation(); deleteSavedAsset(internalAsset!, item.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>
                                                                                                        <button onClick={(e) => { e.stopPropagation(); handleEditItemClick(internalAsset!, item.id); }} className="p-1 bg-violet-500 text-white rounded hover:bg-violet-600"><Edit2 size={10} /></button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    (internalAsset === 'lighting' || internalAsset === 'shoes') && (
                                                                                                        <button onClick={(e) => { e.stopPropagation(); handleEditItemClick(internalAsset!, item.id); }} className="p-1 bg-violet-500 text-white rounded hover:bg-violet-600"><Edit2 size={10} /></button>
                                                                                                    )
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                            {(internalAsset === 'background' ? savedBackgrounds :
                                                internalAsset === 'fit_pattern' ? savedFits :
                                                    internalAsset === 'lighting' ? [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))] :
                                                        internalAsset === 'shoes' ? savedShoes :
                                                            internalAsset === 'jacket' ? savedJackets :
                                                                internalAsset === 'bag' ? savedBags :
                                                                    internalAsset === 'glasses' ? savedGlasses :
                                                                        internalAsset === 'hat' ? savedHats :
                                                                            internalAsset === 'jewelry' ? savedJewelry :
                                                                                internalAsset === 'belt' ? savedBelts :
                                                                                    []).length === 0 && (
                                                    <div className="col-span-2 text-center text-[10px] text-muted-foreground py-10 bg-muted/20 border border-dashed rounded-lg">No saved items.</div>
                                                )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {sessionLibrary.map((item, idx) => (
                                            <div key={idx} onClick={() => handleLibrarySelect({ src: item })} className="aspect-[3/4] rounded-lg border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                                                <img src={item} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}


                            </TabsContent>

                            <TabsContent value="templates" className="flex-1 overflow-y-auto p-3 space-y-4">
                                {internalAsset === 'model' && (
                                    <div className="grid grid-cols-2 gap-2 text-center py-10 text-xs text-muted-foreground">
                                        {language === "tr" ? "Lütfen Kütüphaneyi kullanın." : "Please use the Library."}
                                    </div>
                                )}
                            </TabsContent>

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

                            <TabsContent value="assets" className="flex-1 overflow-y-auto p-3 space-y-4">
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
                                                            setAssetsHighRes(prev => ({ ...prev, [internalAsset!]: null }));
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
                        </Tabs>
                    </div>
                )}
            </div>

            {/* COLUMN 1: Settings & Uploads (Sidebar) */}
            <div className="w-full lg:w-[600px] lg:h-full lg:border-r border-b lg:border-b-0 bg-background flex flex-col shrink-0 relative z-20 overflow-hidden">
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Page Title */}
                    {/* 0. Page Header */}
                    <div className="mb-4">
                        <h1 className="text-xl font-bold">{t("home.photoshootTitle")}</h1>
                        <p className="text-[10px] text-muted-foreground">{t("home.photoshootDesc")}</p>
                    </div>

                    {/* --- LEVEL 1: BASIC (Always Visible) --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-1 bg-violet-500 rounded-full" />
                            <label className="text-[10px] uppercase font-bold text-foreground">{language === "tr" ? "TEMEL AYARLAR" : "BASIC SETTINGS"}</label>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Product Type Selector */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Ürün Tipi" : "Product Type"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={workflowType}
                                    onChange={(e) => setWorkflowType(e.target.value as any)}
                                >
                                    <option value="upper">{language === "tr" ? "Üst Giyim" : "Upper Body"}</option>
                                    <option value="lower">{language === "tr" ? "Alt Giyim" : "Lower Body"}</option>
                                    <option value="dress">{language === "tr" ? "Elbise / Tulum" : "Dress / Jumpsuit"}</option>
                                    <option value="set">{language === "tr" ? "Takım" : "Set"}</option>
                                </select>
                            </div>

                            {/* Model Gender */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Model Cinsiyeti" : "Model Gender"}</label>
                                <div className="grid grid-cols-2 gap-1 bg-muted/30 p-1 rounded-lg border">
                                    <button
                                        onClick={() => setGender("female")}
                                        className={`text-[10px] py-1 rounded transition-all ${gender === 'female' ? 'bg-background shadow font-bold text-violet-600' : 'text-muted-foreground'}`}
                                    >
                                        {language === "tr" ? "Kadın" : "F"}
                                    </button>
                                    <button
                                        onClick={() => setGender("male")}
                                        className={`text-[10px] py-1 rounded transition-all ${gender === 'male' ? 'bg-background shadow font-bold text-blue-600' : 'text-muted-foreground'}`}
                                    >
                                        {language === "tr" ? "Erkek" : "M"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Aspect Ratio */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "En/Boy Oranı" : "Aspect Ratio"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                >
                                    {ASPECT_RATIOS.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {language === 'tr' ? opt.labelTr : opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Resolution */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Çözünürlük" : "Resolution"}</label>
                                <select
                                    className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border"
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                >
                                    {RESOLUTION_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {language === 'tr' ? opt.labelTr : opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Product Name Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">{language === "tr" ? "Ürün Adı" : "Product Name"}</label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => {
                                    setProductName(e.target.value);
                                    setIsManualProductName(true);
                                }}
                                placeholder={language === "tr" ? "Ürün ismini buraya yazın..." : "Enter product name..."}
                                className="w-full bg-muted/30 border border-border text-sm font-medium rounded-lg p-2 focus:ring-1 focus:ring-violet-500"
                            />
                        </div>

                        {/* Core Assets Row */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <AssetCard id="model" label={language === "tr" ? "Model Seç" : "Select Model"} icon={User} required />
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
                                <div className="flex-1 flex items-center justify-between overflow-hidden">
                                    <span className="text-xs font-medium text-foreground truncate">{language === "tr" ? "Ürün Görselleri" : "Product Hub"}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Mavi EU (Batch) Flags - Moved here for better visibility */}
                    <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">MAVI EU BATCH</label>
                            <Switch checked={batchMode} onCheckedChange={setBatchMode} />
                        </div>
                        {batchMode && (
                            <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                                <input
                                    type="text"
                                    className="w-full text-xs p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                                    placeholder="Product Code (e.g. MAV-01)"
                                />

                                {/* SHOT SELECTION LIST */}
                                <div className="space-y-1.5">
                                    {availableBatchShots.map((shot, idx) => {
                                        const isSelected = batchShotSelection[shot.id] ?? true;
                                        const imageTitle = productCode ? `${productCode}_image_${String(idx + 1).padStart(3, '0')}` : `image_${String(idx + 1).padStart(3, '0')}`;
                                        return (
                                            <div
                                                key={shot.id}
                                                onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
                                                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200 group ${isSelected
                                                    ? 'bg-blue-950/40 border border-blue-700/40'
                                                    : 'bg-zinc-900/30 border border-transparent opacity-50 hover:opacity-70'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="w-3.5 h-3.5 rounded border-blue-400 text-blue-600 focus:ring-blue-500 shrink-0 pointer-events-none"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-medium text-foreground truncate">
                                                        {language === 'tr' ? shot.label : shot.labelEn}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-blue-400' : 'text-muted-foreground'
                                                    }`}>
                                                    {imageTitle}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded ${isSelected
                                                    ? 'text-emerald-400 bg-emerald-500/10'
                                                    : 'text-zinc-500 bg-zinc-500/10'
                                                    }`}>
                                                    {isSelected
                                                        ? (language === 'tr' ? 'Üretilecek' : 'Generate')
                                                        : (language === 'tr' ? 'Atlanacak' : 'Skip')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- LEVEL 2: ADVANCED (Visible by Default) --- */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-1 bg-blue-500 rounded-full" />
                            <label className="text-[10px] uppercase font-bold text-foreground">{language === "tr" ? "GELİŞMİŞ AYARLAR" : "ADVANCED SETTINGS"}</label>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <AssetCard id="pose" label={language === "tr" ? "Poz" : "Pose"} icon={User} />
                            <AssetCard id="lighting" label={language === "tr" ? "Işık" : "Light"} icon={Camera} />
                            <AssetCard id="fit_pattern" label={language === "tr" ? "Kalıp" : "Fit"} icon={Ruler} />
                            <AssetCard id="background" label={language === "tr" ? "Arka Plan" : "BG"} icon={ImageIcon} />
                            <AssetCard id="accessories" label={language === "tr" ? "Aksesuar" : "Accessory"} icon={Glasses} />
                            {hasFeet && <AssetCard id="shoes" label={language === "tr" ? "Ayakkabı" : "Shoes"} icon={ShoppingBag} />}
                        </div>

                        {/* Styling Toggles Group (Controlled by Framing) */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {/* Head/Face Area Controls (Enabled for Closeup & Cowboy/FullBody by default, but face details only for Closeup) */}
                            {canShowCollarHairButtons && (
                                <>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                        onClick={() => setHairBehindShoulders(!hairBehindShoulders)}>
                                        <span className="text-[10px] font-medium">{language === "tr" ? "Saç Arkada" : "Hair Behind"}</span>
                                        <div className={`w-6 h-3.5 rounded-full transition-colors relative ${hairBehindShoulders ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                            <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${hairBehindShoulders ? 'left-3' : 'left-0.5'}`} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                        onClick={() => setLookAtCamera(!lookAtCamera)}>
                                        <span className="text-[10px] font-medium">{language === "tr" ? "Kameraya Bak" : "Look at Cam"}</span>
                                        <div className={`w-6 h-3.5 rounded-full transition-colors relative ${lookAtCamera ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                            <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${lookAtCamera ? 'left-3' : 'left-0.5'}`} />
                                        </div>
                                    </div>

                                    {/* Buttons: Moved Up */}
                                    {(isCloseup || isCowboy || isFullBody) && (
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                            onClick={() => setButtonsOpen(!buttonsOpen)}>
                                            <span className="text-[10px] font-medium">{language === "tr" ? "Düğme/Fermuar Açık" : "Buttons/Zipper Open"}</span>
                                            <div className={`w-6 h-3.5 rounded-full transition-colors relative ${buttonsOpen ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                                <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${buttonsOpen ? 'left-3' : 'left-0.5'}`} />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Waist/Upper Body Specific: Fit/Tuck (Only if waist is visible) */}
                            {canShowWaistRiseFitTuck && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                    onClick={() => setTucked(!tucked)}>
                                    <span className="text-[10px] font-medium">{language === "tr" ? "İçeride" : "Tucked"}</span>
                                    <div className={`w-6 h-3.5 rounded-full transition-colors relative ${tucked ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                        <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${tucked ? 'left-3' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            )}

                            {/* Sleeves Rolled: Only if arms are visible */}
                            {canShowCollarHairButtons && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                    onClick={() => setSleevesRolled(!sleevesRolled)}>
                                    <span className="text-[10px] font-medium">{language === "tr" ? "Kollar Sıvalı" : "Sleeves Rolled"}</span>
                                    <div className={`w-6 h-3.5 rounded-full transition-colors relative ${sleevesRolled ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                        <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${sleevesRolled ? 'left-3' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            )}

                            {/* Common: Wind */}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                onClick={() => setEnableWind(!enableWind)}>
                                <span className="text-[10px] font-medium">{language === "tr" ? "Rüzgar" : "Wind"}</span>
                                <div className={`w-6 h-3.5 rounded-full transition-colors relative ${enableWind ? 'bg-blue-400' : 'bg-zinc-300'}`}>
                                    <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${enableWind ? 'left-3' : 'left-0.5'}`} />
                                </div>
                            </div>

                            {/* Expression & Gaze (Side-by-side) */}
                            {hasHead && (
                                <>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                        onClick={() => setEnableExpression(!enableExpression)}>
                                        <span className="text-[10px] font-medium">{language === "tr" ? "İfade" : "Expression"}</span>
                                        <div className={`w-6 h-3.5 rounded-full transition-colors relative ${enableExpression ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                            <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${enableExpression ? 'left-3' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 cursor-pointer"
                                        onClick={() => setEnableGaze(!enableGaze)}>
                                        <span className="text-[10px] font-medium">{language === "tr" ? "Bakış" : "Gaze"}</span>
                                        <div className={`w-6 h-3.5 rounded-full transition-colors relative ${enableGaze ? 'bg-violet-500' : 'bg-zinc-300'}`}>
                                            <div className={`absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all ${enableGaze ? 'left-3' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* NEW: Product Detail Variations (Conditional by Framing) */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-dashed border-muted-foreground/20">
                            {/* Head/Torso Area Options (Collar, Shoulder) */}
                            {canShowCollarHairButtons && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Yaka" : "Collar"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={collarType} onChange={(e) => setCollarType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                            <option value="v-neck">V-Neck</option>
                                            <option value="polo">Polo</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Omuz" : "Shoulder"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={shoulderType} onChange={(e) => setShoulderType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                            <option value="dropped">{language === "tr" ? "Düşük" : "Dropped"}</option>
                                            <option value="padded">{language === "tr" ? "Vatkalı" : "Padded"}</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Waist/Rise Options */}
                            {canShowWaistRiseFitTuck && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Bel" : "Waist"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={waistType} onChange={(e) => setWaistType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                            <option value="elastic">{language === "tr" ? "Lastikli" : "Elastic"}</option>
                                            <option value="high-waisted">{language === "tr" ? "Yüksek Bel" : "High Waisted"}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Ağ/Yükseklik" : "Rise"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={riseType} onChange={(e) => setRiseType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="low">{language === "tr" ? "Düşük" : "Low"}</option>
                                            <option value="mid">{language === "tr" ? "Orta" : "Mid"}</option>
                                            <option value="high">{language === "tr" ? "Yüksek" : "High"}</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            {canShowLegHem && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Paça/Bacak" : "Leg"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={legType} onChange={(e) => setLegType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="skinny">Skinny</option>
                                            <option value="straight">{language === "tr" ? "Düz" : "Straight"}</option>
                                            <option value="wide">{language === "tr" ? "Geniş" : "Wide"}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Paça Bitişi" : "Hem"}</label>
                                        <select className="w-full text-[10px] p-1.5 rounded border bg-muted/20" value={hemType} onChange={(e) => setHemType(e.target.value as any)}>
                                            <option value="none">-</option>
                                            <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                            <option value="cuffed">{language === "tr" ? "Kıvrık" : "Cuffed"}</option>
                                            <option value="raw">{language === "tr" ? "Kesik" : "Raw"}</option>
                                        </select>
                                    </div>

                                    {/* Socks Selection (Moved under general options, but only if feet visible) */}
                                    {hasFeet && (
                                        <div className="col-span-2 space-y-1 pt-1">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Çorap" : "Socks"}</label>
                                            <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded border">
                                                {['none', 'white', 'black'].map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSocksType(s as any)}
                                                        className={`text-[9px] py-1 rounded transition-all ${socksType === s ? 'bg-background shadow-sm font-bold text-violet-600' : 'text-muted-foreground hover:bg-background/50'}`}
                                                    >
                                                        {s === 'none' ? (language === 'tr' ? 'Yok' : 'None') : s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}


                        </div>
                    </div>

                    {/* --- LEVEL 3: EXPERT (Hidden Toggle) --- */}
                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={() => setShowExpert(!showExpert)}
                            className="flex items-center justify-between w-full px-2 py-1 mb-2 hover:bg-muted/50 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`h-4 w-1 rounded-full transition-colors ${showExpert ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                                <label className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">
                                    {language === "tr" ? "UZMAN AYARLARI" : "EXPERT CONTROLS"}
                                </label>
                            </div>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showExpert ? 'rotate-180' : ''}`} />
                        </button>

                        {showExpert && (
                            <div className="space-y-4 px-1 pb-4 animate-in slide-in-from-top-2">
                                {/* Technical Properties */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Tekrar Tutarlılığı" : "Consistency (Seed)"}</label>
                                    <input
                                        type="number"
                                        className="w-full text-xs p-2 rounded border bg-muted/20"
                                        value={seed === "" ? "" : seed}
                                        onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                                        placeholder="Random"
                                    />
                                </div>

                                {/* Negative Prompt / Stickman Overrides */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase">{language === "tr" ? "Negatif Komut (Override)" : "Negative Override"}</label>
                                    <textarea
                                        className="w-full h-16 text-[10px] p-2 rounded border bg-muted/20 resize-none"
                                        value={lightingNegative}
                                        onChange={(e) => setLightingNegative(e.target.value)}
                                        placeholder="low quality, artifacts..."
                                    />
                                </div>


                            </div>
                        )}
                    </div>
                </div>
                {/* Footer Action - Moved outside scrollable div to be fixed */}
                <div className="p-4 border-t bg-background z-10">
                    <Button
                        size="lg"
                        className={`w-full shadow-lg transition-all duration-300 ${batchMode ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20'}`}
                        onClick={() => batchMode ? handleBatchGenerate() : handleGenerate()}
                        disabled={isProcessing || (batchMode && !productCode)}
                    >
                        {isProcessing ? (
                            <div className="flex items-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>{language === "tr" ? "İşleniyor..." : "Processing..."}</span>
                            </div>
                        ) : (
                            <>
                                {batchMode ? <Layers className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {batchMode
                                    ? (language === "tr" ? "Toplu Üretimi Başlat" : "Start Batch Generation")
                                    : (language === "tr" ? "Fotoğraf Çek" : "Generate Photo")}
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
                        <StudioSteps language={language} isSuccess={isGenerationSuccess} />

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
                        {resultImages.length > 1 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
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

                        {/* Seed Info Display */}
                        {seed && (
                            <div className="flex justify-center -mt-2">
                                <div className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold border border-violet-200 dark:border-violet-800 flex items-center gap-1.5 shadow-sm">
                                    <Sparkles size={10} />
                                    {language === "tr" ? "Tekrar Tutarlılığı" : "Seed"}: {seed}
                                </div>
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

                {/* Micro-feedback Hint Area */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none h-8 flex items-center justify-center">
                    {microFeedback && (
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-violet-200/50 dark:border-violet-800/50 px-4 py-1 rounded-full shadow-sm">
                            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-tighter flex items-center gap-2">
                                <Sparkles size={10} className="animate-pulse" />
                                {microFeedback}
                            </p>
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
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            {item.title || (language === "tr" ? "Oluşturma İstemi" : "Generation Prompt")}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={previewMode === 'text' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="h-7 text-[10px]"
                                                onClick={() => setPreviewMode('text')}
                                            >
                                                Text
                                            </Button>
                                            <Button
                                                variant={previewMode === 'json' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="h-7 text-[10px]"
                                                onClick={() => {
                                                    setPreviewMode('json');
                                                    if (previewData && previewData[0]) {
                                                        setUserAddedPrompt(JSON.stringify(previewData[0].structured, null, 2));
                                                    }
                                                }}
                                            >
                                                JSON
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Button
                                            variant={previewMode === 'text' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-6 text-[9px]"
                                            onClick={() => {
                                                setPreviewMode('text');
                                                if (previewData && previewData[0]) {
                                                    setUserAddedPrompt(previewData[0].prompt);
                                                }
                                            }}
                                        >
                                            {language === "tr" ? "Metne Dön" : "Switch to Text"}
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="space-y-4">
                                            <textarea
                                                className="w-full p-4 text-[12px] border rounded-lg bg-[#0a0a0a] text-green-400 min-h-[350px] font-mono leading-relaxed focus:ring-1 focus:ring-green-500/50 outline-none scrollbar-thin scrollbar-thumb-card"
                                                value={userAddedPrompt}
                                                onChange={(e) => setUserAddedPrompt(e.target.value)}
                                                spellCheck={false}
                                            />
                                            {previewMode === 'json' && (
                                                <p className="text-[10px] text-muted-foreground italic px-1">
                                                    {language === "tr" ? "JSON'u düzenleyerek çekim detaylarını değiştirebilirsiniz." : "You can modify shot details by editing the JSON above."}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                            <span>Resolution: {item.settings.resolution}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                                            <span>Ratio: {item.settings.aspect_ratio}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setShowPreview(false)}>
                                    {language === "tr" ? "İptal" : "Cancel"}
                                </Button>
                                <Button onClick={handleConfirmGeneration} className="bg-violet-600 hover:bg-violet-700">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    {language === "tr" ? "Onayla ve Oluştur" : "Confirm & Generate"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Save Pose Dialog */}
            <Dialog open={showSavePoseDialog} onOpenChange={setShowSavePoseDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{language === "tr" ? "Pozu Kaydet" : "Save Pose"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-center">
                            {tempPoseData && (
                                <div className="relative w-32 h-48 rounded-md overflow-hidden border">
                                    <img src={tempPoseData.original} alt="Original" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">{language === "tr" ? "Stickman oluşturmadan önce pozu kaydetmek ister misiniz?" : "Do you want to save this to library before converting?"}</p>
                        <div className="flex gap-2 justify-center mt-2">
                            <Button variant="outline" onClick={() => handleSavePose('female')} className="gap-2">
                                <User className="w-4 h-4 text-pink-500" />
                                {language === "tr" ? "Kadın Olarak Kaydet" : "Save as Female"}
                            </Button>
                            <Button variant="outline" onClick={() => handleSavePose('male')} className="gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                {language === "tr" ? "Erkek Olarak Kaydet" : "Save as Male"}
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => handleSavePose('skip')} className="w-full mt-2 text-xs text-muted-foreground">
                            {language === "tr" ? "Kaydetme, Sadece Dönüştür" : "Don't Save, Just Convert"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Save Model Dialog */}
            <Dialog open={showSaveModelDialog} onOpenChange={setShowSaveModelDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{language === "tr" ? "Modeli Kaydet" : "Save Model"}</DialogTitle>
                    </DialogHeader>
                    {tempModelData && (
                        <div className="grid gap-4 py-4">
                            {/* Image Preview */}
                            <div className="flex items-center justify-center">
                                <div className="relative w-32 h-48 rounded-md overflow-hidden border bg-muted">
                                    <img src={tempModelData.url} alt="Model" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">{language === "tr" ? "Model Adı" : "Model Name"}</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-2 rounded-lg border bg-background"
                                    placeholder={language === "tr" ? "Model Adı Girin" : "Enter Model Name"}
                                    value={tempModelData.name}
                                    onChange={(e) => setTempModelData({ ...tempModelData, name: e.target.value })}
                                />
                            </div>

                            {/* Gender Selection */}
                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    onClick={() => setTempModelData({ ...tempModelData, gender: 'female' })}
                                    className={`cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all ${tempModelData.gender === 'female' ? 'bg-violet-100 border-violet-500 text-violet-700' : 'bg-muted/30 hover:bg-muted'}`}
                                >
                                    <span className="text-xs font-medium">{language === "tr" ? "Kadın" : "Female"}</span>
                                </div>
                                <div
                                    onClick={() => setTempModelData({ ...tempModelData, gender: 'male' })}
                                    className={`cursor-pointer rounded-lg border p-2 flex items-center justify-center gap-2 transition-all ${tempModelData.gender === 'male' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-muted/30 hover:bg-muted'}`}
                                >
                                    <span className="text-xs font-medium">{language === "tr" ? "Erkek" : "Male"}</span>
                                </div>
                            </div>

                            <Button onClick={handleSaveModel} className="w-full bg-violet-600 hover:bg-violet-700 mt-2">
                                {language === "tr" ? "Kaydet ve Seç" : "Save & Select"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Save Asset Dialog (Generic) */}
            <Dialog open={showSaveAssetDialog} onOpenChange={setShowSaveAssetDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{language === "tr" ? "Kütüphaneye Kaydet" : "Save to Library"}</DialogTitle>
                    </DialogHeader>
                    {tempAssetData && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="w-32 h-32 rounded-lg border overflow-hidden">
                                    <img src={tempAssetData.url} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">{language === "tr" ? "Öğe Adı" : "Item Name"}</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-2 rounded-lg border bg-background"
                                    value={tempAssetData.name}
                                    onChange={(e) => setTempAssetData({ ...tempAssetData, name: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleSaveAsset} className="w-full bg-violet-600 hover:bg-violet-700">
                                {language === "tr" ? "Kaydet" : "Save"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Save Lighting Dialog */}
            <Dialog open={showSaveLightingDialog} onOpenChange={setShowSaveLightingDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{language === "tr" ? "Işıklandırmayı Kaydet" : "Save Lighting Setup"}</DialogTitle>
                    </DialogHeader>
                    {tempLightingData && (
                        <div className="space-y-4 py-4">
                            <div className="aspect-square w-32 mx-auto rounded-lg border overflow-hidden">
                                <img src={tempLightingData.url} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">{language === "tr" ? "Setup Adı" : "Setup Name"}</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-2 rounded-lg border bg-background"
                                    placeholder={language === "tr" ? "Örn: Gün Işığı 5600K" : "e.g. Daylight 5600K"}
                                    value={tempLightingData.name}
                                    onChange={(e) => setTempLightingData({ ...tempLightingData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">{language === "tr" ? "Pozitif Prompt (LIGHTING)" : "Positive Prompt (LIGHTING)"}</label>
                                <textarea
                                    className="w-full text-sm p-2 rounded-lg border bg-background h-20"
                                    value={tempLightingData.positivePrompt}
                                    onChange={(e) => setTempLightingData({ ...tempLightingData, positivePrompt: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">{language === "tr" ? "Negatif Prompt" : "Negative Prompt"}</label>
                                <textarea
                                    className="w-full text-sm p-2 rounded-lg border bg-background h-20"
                                    value={tempLightingData.negativePrompt}
                                    onChange={(e) => setTempLightingData({ ...tempLightingData, negativePrompt: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50/50 border border-violet-200">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-violet-700">
                                        {language === "tr" ? "Görseli Referans Olarak Gönder" : "Send Image as Visual Reference"}
                                    </div>
                                    <div className="text-[10px] text-violet-600/70">
                                        {language === "tr" ? "Kapatılırsa sadece promptlar kullanılır" : "If disabled, only prompts will be used"}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTempLightingData({ ...tempLightingData, sendImageAsAsset: !tempLightingData.sendImageAsAsset })}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${tempLightingData.sendImageAsAsset ? 'bg-violet-500' : 'bg-zinc-300'}`}
                                >
                                    <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${tempLightingData.sendImageAsAsset ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <Button onClick={handleSaveLighting} className="w-full bg-violet-600 hover:bg-violet-700">
                                {language === "tr" ? "Kütüphaneye Kaydet" : "Save to Library"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={!!editingThumbItem} onOpenChange={(open) => {
                if (!open) {
                    setEditingThumbItem(null);
                    setEditingItemPrompt("");
                    setEditingItemTags([]);
                }
            }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{language === "tr" ? "Öğeyi Düzenle" : "Edit Item"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {language === "tr" ? "Kütüphane Görseli" : "Library Thumbnail"}
                            </label>
                            <label className="w-32 h-44 rounded-lg border border-dashed flex flex-col items-center justify-center bg-muted/30 cursor-pointer overflow-hidden relative group hover:bg-muted/50 transition-all">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUpdateThumbnail(e.target.files[0]);
                                    }}
                                />
                                {(() => {
                                    if (!editingThumbItem) return null;
                                    const { type, id } = editingThumbItem;
                                    const list = type === 'pose' ? savedPoses
                                        : type === 'model' ? savedModels
                                            : type === 'background' ? savedBackgrounds
                                                : type === 'fit_pattern' ? savedFits
                                                    : type === 'lighting' ? savedLightings
                                                        : savedShoes;
                                    return (list as any[]).find(i => i.id === id)?.thumbUrl;
                                })() ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={(() => {
                                                const { type, id } = editingThumbItem!;
                                                const list = type === 'pose' ? savedPoses
                                                    : type === 'model' ? savedModels
                                                        : type === 'background' ? savedBackgrounds
                                                            : type === 'fit_pattern' ? savedFits
                                                                : type === 'lighting' ? savedLightings
                                                                    : savedShoes;
                                                return (list as any[]).find(i => i.id === id)?.thumbUrl;
                                            })()}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <RotateCw className="text-white w-6 h-6 animate-spin-slow" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground font-medium">Değiştir</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {(editingThumbItem?.type === 'pose' || editingThumbItem?.type === 'model' || editingThumbItem?.type === 'fit_pattern' || editingThumbItem?.type === 'shoes' || editingThumbItem?.type === 'lighting') && (
                            <div className="space-y-4">
                                {editingThumbItem.type === 'lighting' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={12} />
                                                {language === "tr" ? "Pozitif Prompt" : "Positive Prompt"}
                                            </label>
                                            <textarea
                                                className="w-full h-24 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                                value={editingItemPrompt}
                                                onChange={(e) => setEditingItemPrompt(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={12} />
                                                {language === "tr" ? "Negatif Prompt" : "Negative Prompt"}
                                            </label>
                                            <textarea
                                                className="w-full h-24 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                                value={editingItemNegativePrompt}
                                                onChange={(e) => setEditingItemNegativePrompt(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50/50 border border-violet-200 mt-2">
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-bold text-violet-700">
                                                    {language === "tr" ? "Görseli Referans Olarak Gönder" : "Send Image as Visual Reference"}
                                                </div>
                                                <div className="text-[10px] text-violet-600/70">
                                                    {language === "tr" ? "Kapatılırsa sadece promptlar kullanılır" : "If disabled, only prompts will be used"}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEditingItemSendImage(!editingItemSendImage)}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${editingItemSendImage ? 'bg-violet-500' : 'bg-zinc-300'}`}
                                            >
                                                <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${editingItemSendImage ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={12} />
                                            {editingThumbItem.type === 'pose'
                                                ? (language === "tr" ? "Poz Prompt Açıklaması" : "Pose Prompt Description")
                                                : (language === "tr" ? "Kalıp/Desen Prompt Açıklaması" : "Fit/Pattern Prompt Description")}
                                        </label>
                                        <textarea
                                            className="w-full h-32 text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                            placeholder={editingThumbItem.type === 'pose'
                                                ? (language === "tr" ? "Örn: Yan duran model, kameraya bakmadan 90 derece duruyor" : "e.g. Model standing sideways, looking 90 degrees away from camera")
                                                : (language === "tr" ? "Örn: Bol kesim baggy pantolon, paçaları ayakkabının üstüne yığılıyor" : "e.g. Oversized baggy pants, hem stacking over shoes")
                                            }
                                            value={editingItemPrompt}
                                            onChange={(e) => setEditingItemPrompt(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {editingThumbItem?.type === 'pose' && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={12} />
                                    {language === "tr" ? "Poz Etiketleri (virgülle ayırın)" : "Pose Tags (comma separated)"}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <button
                                        onClick={() => {
                                            const hasTag = editingItemTags.includes('tam_boy');
                                            if (hasTag) setEditingItemTags(editingItemTags.filter(t => t !== 'tam_boy'));
                                            else setEditingItemTags([...editingItemTags.filter(t => t !== 'ust_beden'), 'tam_boy']);
                                        }}
                                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all border ${editingItemTags.includes('tam_boy') ? 'bg-blue-500 text-white border-blue-600' : 'bg-muted text-muted-foreground border-border'}`}
                                    >
                                        Tam Boy
                                    </button>
                                    <button
                                        onClick={() => {
                                            const hasTag = editingItemTags.includes('ust_beden');
                                            if (hasTag) setEditingItemTags(editingItemTags.filter(t => t !== 'ust_beden'));
                                            else setEditingItemTags([...editingItemTags.filter(t => t !== 'tam_boy'), 'ust_beden']);
                                        }}
                                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all border ${editingItemTags.includes('ust_beden') ? 'bg-orange-500 text-white border-orange-600' : 'bg-muted text-muted-foreground border-border'}`}
                                    >
                                        Üst Beden
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="w-full text-sm p-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none"
                                    placeholder={language === "tr" ? "Örn: yan_aci, dinamik, casual" : "e.g. yan_aci, dynamic, casual"}
                                    value={editingItemTags.join(', ')}
                                    onChange={(e) => setEditingItemTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {language === "tr"
                                        ? "💡 Yan açılı pozlar için 'yan_aci' etiketi ekleyin"
                                        : "💡 Add 'yan_aci' tag for angled poses"}
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={() => handleUpdateThumbnail(null)}
                            className="w-full bg-violet-600 hover:bg-violet-700 font-semibold"
                        >
                            {language === "tr" ? "Güncelle ve Kaydet" : "Update & Save"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* BATCH PREVIEW DIALOG */}
            <Dialog open={showBatchPreview} onOpenChange={setShowBatchPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            MAVI EU - {language === "tr" ? "Önizleme" : "Preview"}
                        </DialogTitle>
                        <DialogDescription>
                            {language === "tr"
                                ? `${batchPreviewPrompts.length} görsel için promptlar. İsterseniz düzenleyebilirsiniz.`
                                : `Prompts for ${batchPreviewPrompts.length} images. You can edit them if needed.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 p-4">
                        <div className="flex justify-end px-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allSelected = selectedBatchImages.every(Boolean);
                                    setSelectedBatchImages(selectedBatchImages.map(() => !allSelected));
                                }}
                                className="text-xs h-6"
                            >
                                {selectedBatchImages.every(Boolean)
                                    ? (language === "tr" ? "Hepsini Kaldır" : "Deselect All")
                                    : (language === "tr" ? "Hepsini Seç" : "Select All")}
                            </Button>
                        </div>
                        {batchPreviewPrompts.map((p, idx) => (
                            <div key={idx} className={`space-y-2 p-3 rounded-lg border transition-colors ${selectedBatchImages[idx] ? 'bg-muted/30 border-border' : 'bg-muted/10 border-transparent opacity-60'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedBatchImages[idx]}
                                            onChange={(e) => {
                                                const updated = [...selectedBatchImages];
                                                updated[idx] = e.target.checked;
                                                setSelectedBatchImages(updated);
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label className="text-sm font-semibold text-blue-600 cursor-pointer" onClick={() => {
                                            const updated = [...selectedBatchImages];
                                            updated[idx] = !updated[idx];
                                            setSelectedBatchImages(updated);
                                        }}>{p.title}</label>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono">{selectedBatchImages[idx] ? (language === "tr" ? "Üretilecek" : "Will Generate") : (language === "tr" ? "Atlanacak" : "Skipped")}</span>
                                </div>
                                {selectedBatchImages[idx] && (
                                    <Textarea
                                        value={editedBatchPrompts[idx]}
                                        onChange={(e) => {
                                            const updated = [...editedBatchPrompts];
                                            updated[idx] = e.target.value;
                                            setEditedBatchPrompts(updated);
                                        }}
                                        className="font-mono text-xs h-32 bg-background"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 p-4 border-t">
                        <Button variant="outline" onClick={() => setShowBatchPreview(false)} className="flex-1">
                            {language === "tr" ? "İptal" : "Cancel"}
                        </Button>
                        <Button onClick={handleConfirmBatchGeneration} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {language === "tr" ? "Onayla ve Üret" : "Confirm & Generate"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROCESS LOADER OVERLAY */}
            {/* PROCESS LOADER OVERLAY REMOVED per user request to avoid blocking screen */}

        </div>
    );
}
