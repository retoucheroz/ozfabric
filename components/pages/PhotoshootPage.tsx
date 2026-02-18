"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
    Upload, Plus, Loader2, Trash2, Edit2, ChevronRight, ChevronLeft, ChevronDown, Sparkles, User, Image as ImageIcon, Camera, RotateCw, X, Maximize2, FileText, ShoppingBag, Gem, MoveHorizontal, Glasses, Footprints, Shirt, ScanLine, Scissors, Ruler, Download, Package, Zap, ShieldAlert, Globe, CheckCircle2, AlertCircle, Eraser, Layers, Eye, EyeOff
} from "lucide-react"
import {
    TbShirt,
    TbSignature,
    TbGenderFemale,
    TbGenderMale,
    TbAspectRatio,
    TbHdr,
    TbUserCircle,
    TbPackage,
    TbPhoto,
    TbSettings2,
    TbAdjustmentsHorizontal,
    TbJacket
} from "react-icons/tb"
import { PiHandbag, PiBaseballCap, PiDiamond, PiBelt } from "react-icons/pi"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { resizeImageToThumbnail, cn } from "@/lib/utils"
import { dbOperations, STORES } from "@/lib/db"
import { buildBatchSpecs, buildStandardBatchSpecs, extractDominantColor, generateColorPaletteSVG, type BatchSpec } from "@/lib/batch-helpers"

// Modular Components
import { ProductSection } from "@/components/photoshoot/ProductSection";
import { BatchPanel } from "@/components/photoshoot/BatchPanel"
import { ModelSection } from "@/components/photoshoot/ModelSection"
import { BackgroundSection } from "@/components/photoshoot/BackgroundSection"
import { AssetCard } from "@/components/photoshoot/AssetCard"
import { AdvancedSettings } from "@/components/photoshoot/AdvancedSettings"
import { BehaviorToggles } from "@/components/photoshoot/BehaviorToggles"
import { ClothingDetails } from "@/components/photoshoot/ClothingDetails"
import { ExpertSettings } from "@/components/photoshoot/ExpertSettings"
import { PreviewArea } from "@/components/photoshoot/PreviewArea"
import { StudioSteps } from "@/components/photoshoot/StudioSteps"
import { LibrarySidebar } from "@/components/photoshoot/LibrarySidebar"
import { WizardProgress } from "@/components/photoshoot/WizardProgress"

// Dialogs
import { SavePoseDialog } from "@/components/photoshoot/dialogs/SavePoseDialog"
import { SaveAssetDialog } from "@/components/photoshoot/dialogs/SaveAssetDialog"
import { SaveModelDialog } from "@/components/photoshoot/dialogs/SaveModelDialog"
import { SaveLightingDialog } from "@/components/photoshoot/dialogs/SaveLightingDialog"
import { BatchPreviewDialog } from "@/components/photoshoot/dialogs/BatchPreviewDialog"
import { EditItemDialog } from "@/components/photoshoot/dialogs/EditItemDialog"

// Shared Types & Constants
import {
    SavedPose, SavedModel, SavedBackground, SavedFit, SavedLighting, SavedShoe,
    SavedJacket, SavedBag, SavedGlasses, SavedInnerWear, SavedHat, SavedJewelry, SavedBelt, LibraryItem,
    LIGHTING_PRESETS, BACKGROUND_PRESETS, UPPER_SHOTS, LOWER_SHOTS
} from "@/lib/photoshoot-shared"

import {
    STUDIO_STEPS_TR,
    STUDIO_STEPS_EN,
    POSE_PRESETS,
    ANGLE_PRESETS,
    ASPECT_RATIOS,
    RESOLUTION_OPTIONS
} from "@/lib/photoshoot-constants"
import { SERVICE_COSTS } from "@/lib/pricingConstants";
import { uploadToR2 } from "@/lib/uploadToR2";

export default function PhotoshootPage() {
    const { projects, addProject, deductCredits, models } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const [showExpert, setShowExpert] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showGarmentDetails, setShowGarmentDetails] = useState(true);

    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
    const [user, setUser] = useState<any>(null);
    const isRestoringRef = useRef(true);

    useEffect(() => {
        setMounted(true);

        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Session fetch error:", err));
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
    const [isMaviBatch, setIsMaviBatch] = useState(false);
    const [stylingSideOnly, setStylingSideOnly] = useState<Record<string, boolean>>({});
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
        { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front', descriptionTr: 'Ön styling karesi.', descriptionEn: 'Front styling shot.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled', descriptionTr: 'Yan açı styling karesi.', descriptionEn: 'Angled styling shot.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'styling_front_2', label: 'Styling 3. Kare', labelEn: 'Styling Front 2', descriptionTr: 'Alternatif ön styling karesi.', descriptionEn: 'Alternative front styling shot.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'technical_back', label: 'Düz Arka Kare', labelEn: 'Technical Back', descriptionTr: 'Teknik arka çekim.', descriptionEn: 'Technical back shot.', image: '/crops/arka_ust_vucut.jpg' },
        { id: 'closeup_front', label: 'Yakın Çekim Ön', labelEn: 'Close-Up Front', descriptionTr: 'Ön yakın çekim.', descriptionEn: 'Front close-up.', image: '/crops/ust_closeup.jpg' },
    ];
    const LOWER_SHOTS = [
        { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front', descriptionTr: 'Ön styling karesi.', descriptionEn: 'Front styling shot.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled', descriptionTr: 'Yan açı styling karesi.', descriptionEn: 'Angled styling shot.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'technical_front', label: 'Düz Ön 3. Kare', labelEn: 'Technical Front', descriptionTr: 'Düz ön teknik çekim.', descriptionEn: 'Straight front technical shot.', image: '/crops/on_tam_boy.jpg' },
        { id: 'technical_back', label: 'Düz Arka 4. Kare', labelEn: 'Technical Back', descriptionTr: 'Düz arka teknik çekim.', descriptionEn: 'Straight back technical shot.', image: '/crops/arka_tam_boy.jpg' },
        { id: 'detail_front', label: 'Detay Ön Kare', labelEn: 'Detail Front', descriptionTr: 'Ön detay çekimi.', descriptionEn: 'Front detail shot.', image: '/crops/alt_on_detay.jpg' },
        { id: 'detail_back', label: 'Detay Arka Kare', labelEn: 'Detail Back', descriptionTr: 'Arka detay çekimi.', descriptionEn: 'Back detail shot.', image: '/crops/alt_arka_detay.jpg' },
    ];
    const STANDARD_SHOTS = [
        { id: 'std_styling_full', label: 'Tam Boy Styling', labelEn: 'Full Body Styling', descriptionTr: 'Tam boy, artistik pozlama.', descriptionEn: 'Full body, artistic posing.', image: '/crops/styling_tam_boy.jpg' },
        { id: 'std_styling_upper', label: 'Üst Vücut Styling', labelEn: 'Upper Body Styling', descriptionTr: 'Üst vücut, artistik pozlama.', descriptionEn: 'Upper body, artistic posing.', image: '/crops/styling_ust_vucut.jpg' },
        { id: 'std_tech_full_front', label: 'Ön Tam Boy', labelEn: 'Front Full Body', descriptionTr: 'Tam boy ön, kollar yanlarda.', descriptionEn: 'Full body front, arms at sides.', image: '/crops/on_tam_boy.jpg' },
        { id: 'std_tech_full_back', label: 'Arka Tam Boy', labelEn: 'Back Full Body', descriptionTr: 'Tam boy arka, kollar yanlarda.', descriptionEn: 'Full body back, arms at sides.', image: '/crops/arka_tam_boy.jpg' },
        { id: 'std_tech_upper_front', label: 'Ön Üst Vücut', labelEn: 'Front Upper Body', descriptionTr: 'Üst vücut ön, kollar yanlarda.', descriptionEn: 'Upper body front, arms at sides.', image: '/crops/on_ust_vucut.jpg' },
        { id: 'std_tech_upper_back', label: 'Arka Üst Vücut', labelEn: 'Back Upper Body', descriptionTr: 'Üst vücut arka, kollar yanlarda.', descriptionEn: 'Upper body back, arms at sides.', image: '/crops/arka_ust_vucut.jpg' },
        { id: 'std_detail_front', label: 'Alt Ürün Ön Detay', labelEn: 'Lower Front Detail', descriptionTr: 'Belden dize kadar ön detay çekimi.', descriptionEn: 'Lower front detail from waist to knee.', image: '/crops/alt_on_detay.jpg' },
        { id: 'std_detail_back', label: 'Alt Ürün Arka Detay', labelEn: 'Lower Back Detail', descriptionTr: 'Belden dize kadar arka detay çekimi.', descriptionEn: 'Lower back detail from waist to knee.', image: '/crops/alt_arka_detay.jpg' },
        { id: 'std_closeup_front', label: 'Üst Ürün Ön Yakın Çekim', labelEn: 'Upper Front Closeup', descriptionTr: 'Yüzden göğüs altına yakın çekim.', descriptionEn: 'Close-up from face to chest.', image: '/crops/ust_closeup.jpg' },
    ];
    const availableBatchShots = isMaviBatch
        ? (workflowType === 'upper' ? UPPER_SHOTS : LOWER_SHOTS)
        : STANDARD_SHOTS;
    const [batchShotSelection, setBatchShotSelection] = useState<Record<string, boolean>>({});
    const [techAccessories, setTechAccessories] = useState<Record<string, boolean>>({
        jacket: false,
        bag: false,
        glasses: false,
        hat: false,
        jewelry: false,
        belt: false
    });

    // Reset shot selection when workflow or batch mode changes
    useEffect(() => {
        if (batchMode) {
            const defaults: Record<string, boolean> = {};
            availableBatchShots.forEach(s => { defaults[s.id] = false; });
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
        if (isRestoringRef.current) return;
        if (assets.pose) {
            setMicroFeedback(language === "tr" ? "Bu poz bel ve bacak uyumunu vurguluyor." : "This pose highlights waist and leg alignment.");
            const timer = setTimeout(() => setMicroFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [assets.pose, language]);

    useEffect(() => {
        if (isRestoringRef.current) return;
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
    const [isStoppingBatch, setIsStoppingBatch] = useState(false);
    const isStoppingBatchRef = useRef(false);
    const [resultImages, setResultImages] = useState<any[] | null>(null);
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
                    if (k === 'lighting' && !lightingSendImage) return acc;
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

        const costToDeduct = pendingOptions?.isThreeAngles ? singleCost * 3 : singleCost;
        if (!(await deductCredits(costToDeduct))) {
            toast.error(language === 'tr' ? "Yetersiz kredi!" : "Insufficient credits!");
            return;
        }

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

    const buildSpecs = () => {
        // Find pose description from library if selected
        const selectedPose = savedPoses.find(p => p.url === assets.pose);
        const libraryPosePrompt = selectedPose?.customPrompt || poseDescription;

        // Find angled pose from library
        const selectedModel = savedModels.find(m => m.url === assets.model);
        const modelGender = (selectedModel?.gender || gender || "female") as 'male' | 'female';
        const angledPoses = savedPoses.filter(p =>
            p.gender === modelGender &&
            p.tags &&
            p.tags.includes('yan_aci')
        );
        const randomAngledPose = angledPoses.length > 0 ? angledPoses[Math.floor(Math.random() * angledPoses.length)] : null;
        const angledPosePrompt = randomAngledPose?.customPrompt || null;

        if (isMaviBatch) {
            return buildBatchSpecs(workflowType as any, upperFraming, libraryPosePrompt, hairBehindShoulders, modelGender, savedPoses, angledPosePrompt, enableWind);
        } else {
            return buildStandardBatchSpecs(hairBehindShoulders, modelGender, libraryPosePrompt, stylingSideOnly, enableWind, savedPoses);
        }
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
        setResultImages(null);

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

            const allBatchSpecs = (buildSpecs() as BatchSpec[]);
            // Filter by pre-selection checkboxes
            const batchSpecs = allBatchSpecs.filter((spec: BatchSpec) => batchShotSelection[spec.view] === true);
            if (batchSpecs.length === 0) {
                toast.error(language === "tr" ? "En az bir kare seçmelisiniz!" : "Select at least one shot!");
                setIsProcessing(false);
                return;
            }
            const previews = batchSpecs.map((spec: BatchSpec, idx: number) => {
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
                    title: productCode ? `${productCode}${idx + 1}` : `image_${idx + 1}`,
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
                        // EXCEPTION: For technical/non-styling shots, only include accessories IF explicitly selected in techAccessories
                        const isAccessory = ['jacket', 'bag', 'glasses', 'hat', 'belt', 'jewelry'].includes(k);
                        const isStylingShot = preview.spec.isStyling;

                        if (isAccessory && !isStylingShot) {
                            if (!techAccessories[k]) return acc; // Skip this accessory for technical shot
                        }

                        // Mavi EU logic or specific exclusion logic
                        if (preview.spec.excludeAllAccessories && isAccessory) {
                            return acc;
                        }

                        if (k === 'glasses') {
                            acc[k] = preview.spec.includeGlasses || (isStylingShot ? true : techAccessories.glasses) ? (assetsHighRes.glasses || assets.glasses) : undefined;
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
        setResultImages(null); // Clear previous results
        setIsStoppingBatch(false);
        isStoppingBatchRef.current = false;

        // Ensure we use a consistent seed for the whole batch
        const finalSeed = (seed !== null && seed !== "") ? Number(seed) : Math.floor(Math.random() * 1000000000);
        // We update the state so UX shows which seed was actually used
        if (seed === "") setSeed(finalSeed);

        const finalSelectionCount = selectedBatchImages.filter(Boolean).length;
        const totalBatchCost = singleCost * finalSelectionCount;

        if (totalBatchCost > 0) {
            if (!(await deductCredits(totalBatchCost))) {
                toast.error(language === "tr" ? "Yetersiz kredi!" : "Insufficient credits!");
                return;
            }
        }

        try {
            const generatedImages: any[] = [];
            const resultUrls: string[] = [];

            for (let i = 0; i < batchPreviewPrompts.length; i++) {
                // Check if stop requested
                if (isStoppingBatchRef.current) {
                    toast.warning(language === "tr" ? "Toplu üretim durduruldu." : "Batch production stopped.");
                    break;
                }

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
                        const nameSuffix = preview.title.replace(/\s+/g, '_').toLowerCase();
                        const fullFilename = `${productCode || 'shot'}_${nameSuffix}.jpg`;

                        const newImg = { filename: fullFilename, url: imageUrl, downloadName: fullFilename };
                        generatedImages.push(newImg);
                        setResultImages(prev => [...(prev || []), newImg]);

                        addProject({
                            title: `Batch: ${productCode} - ${preview.title}`,
                            type: "Photoshoot",
                            imageUrl: imageUrl,
                            description: `Seed: ${finalSeed} | Prompt: ${editedBatchPrompts[i]}`
                        });
                    }
                }
            }

            if (generatedImages.length > 0) {
                setIsGenerationSuccess(true);
                setGenerationStage('complete');
                await new Promise(r => setTimeout(r, 800));
                setResultImages([...generatedImages]);
                toast.success(language === "tr" ? "İşlem tamamlandı!" : "Batch complete!");
            }
        } catch (e: any) {
            console.error("Batch error:", e);
            toast.error(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
            setIsStoppingBatch(false);
            isStoppingBatchRef.current = false;
            setTimeout(() => setIsGenerationSuccess(false), 2000);
        }
    };

    const handleStopBatch = () => {
        setIsStoppingBatch(true);
        isStoppingBatchRef.current = true;
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
    const [savedInnerWears, setSavedInnerWears] = useState<SavedInnerWear[]>([]);
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

                const innerWears = await dbOperations.getAll<SavedInnerWear>(STORES.INNER_WEAR);
                setSavedInnerWears(innerWears.sort((a, b) => b.createdAt - a.createdAt));

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
        const restoreState = async () => {
            try {
                const savedState = await dbOperations.get<{ data: any }>(STORES.PHOTOSHOOT_STATE, 'current');
                if (savedState && savedState.data) {
                    const parsed = savedState.data;
                    // Restore LOW-RES assets
                    if (parsed.assets) {
                        setAssets(parsed.assets);
                        // Clear high-res when loading state since high-res is not persisted
                        setAssetsHighRes(Object.keys(assetsHighRes).reduce((acc, key) => ({ ...acc, [key]: null }), {}));
                    }
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
                }
            } catch (e) {
                console.error("Failed to restore state from IndexedDB", e);
            } finally {
                // Wait small delay to ensure assets state updates don't trigger feedback immediately
                setTimeout(() => {
                    isRestoringRef.current = false;
                }, 1000);
            }
        };

        restoreState();
    }, []);

    // Save state to IndexedDB whenever key values change
    useEffect(() => {
        const saveState = async () => {
            const stateToSave = {
                id: 'current',
                data: {
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
                }
            };
            try {
                await dbOperations.add(STORES.PHOTOSHOOT_STATE, stateToSave);
            } catch (e) {
                console.error("Failed to save state to IndexedDB", e);
            }
        };

        const timeout = setTimeout(saveState, 500); // Debounce save
        return () => clearTimeout(timeout);
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

                // Models should be high quality (2048px)
                // If the temp data has lowRes, we find the highRes version from assetsHighRes
                const uploadSource = assetsHighRes.model || tempModelData.url;

                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        base64: uploadSource,
                        fileName: "model.png",
                        folder: "models"
                    })
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

                // Use the highest available resolution for the library
                const uploadSource = assetsHighRes[key] || url;

                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        base64: uploadSource,
                        fileName: `${key}.png`,
                        folder: key
                    })
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
        } else if (key === 'inner_wear') {
            const updated = [newItem as SavedInnerWear, ...savedInnerWears];
            setSavedInnerWears(updated);
            await dbOperations.add(STORES.INNER_WEAR, newItem);
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
        } else if (key === 'inner_wear') {
            const updated = savedInnerWears.filter(i => i.id !== id);
            setSavedInnerWears(updated);
            await dbOperations.delete(STORES.INNER_WEAR, id);
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
                const updated = savedBackgrounds.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                let itemToUpdate = updated.find(i => i.id === id);

                if (!itemToUpdate && BACKGROUND_PRESETS.some(bp => bp.id === id)) {
                    const preset = BACKGROUND_PRESETS.find(bp => bp.id === id)!;
                    itemToUpdate = {
                        id: preset.id,
                        url: preset.preview || "",
                        name: preset.label,
                        thumbUrl: resizedThumb || preset.preview || "",
                        customPrompt: editingItemPrompt,
                        createdAt: Date.now()
                    };
                    setSavedBackgrounds([itemToUpdate as SavedBackground, ...savedBackgrounds]);
                } else {
                    setSavedBackgrounds(updated);
                }

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
            } else if (type === 'inner_wear') {
                const updated = savedInnerWears.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedInnerWears(updated);
                if (itemToUpdate) await dbOperations.add(STORES.INNER_WEAR, itemToUpdate);
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

    const handleSavedInnerWearClick = (iw: SavedInnerWear) => {
        setAssets(prev => ({ ...prev, inner_wear: iw.url }));
        setAssetsHighRes(prev => ({ ...prev, inner_wear: null }));
        if (iw.customPrompt) setInnerWearDescription(iw.customPrompt);
        else setInnerWearDescription(null);
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

    const handleAssetRemove = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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


    // COST CALCULATION
    const singleCost = resolution === "4K"
        ? SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_4K
        : SERVICE_COSTS.IMAGE_GENERATION.NANO_BANANA_PRO_1_2K;

    const estimatedCost = batchMode
        ? singleCost * (showBatchPreview
            ? selectedBatchImages.filter(Boolean).length
            : Object.values(batchShotSelection).filter(Boolean).length)
        : singleCost;
    if (!mounted) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
            {/* LEFT COLUMN: Wizard Content */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-sidebar)] custom-scrollbar">
                <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">

                    {/* Header: Progress */}
                    <div>
                        <WizardProgress currentStep={wizardStep} onStepClick={setWizardStep} />
                    </div>

                    {/* Page Title */}
                    <div className="mb-4 text-center">
                        <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">📸 {t("home.photoshootTitle")}</h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">{t("home.photoshootDesc")}</p>
                    </div>

                    {/* WIZARD STEP 1: PRODUCT */}
                    {wizardStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-sm">
                                    <TbSettings2 className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs uppercase font-black text-[var(--text-primary)] tracking-[0.2em]">{language === "tr" ? "ÜRÜN SEÇİMİ" : "PRODUCT SELECTION"}</label>
                                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-60">{language === "tr" ? "ÇEKİLECEK ÜRÜNÜ BELİRLE" : "DEFINE PRODUCT TO SHOOT"}</span>
                                </div>
                            </div>

                            <ProductSection
                                language={language}
                                workflowType={workflowType}
                                setWorkflowType={setWorkflowType}
                                productName={productName}
                                setProductName={setProductName}
                                setIsManualProductName={setIsManualProductName}
                                setActiveLibraryAsset={setActiveLibraryAsset}
                                setActiveGroup={setActiveGroup}
                                setLibraryTab={setLibraryTab}
                            />
                            <div className="flex justify-between mt-12 pt-6 border-t border-[var(--border-subtle)]">
                                <div />
                                {wizardStep < 4 && (
                                    <Button
                                        onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                                        className="px-10 py-6 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase tracking-widest shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {language === "tr" ? "DEVAM ET" : "CONTINUE"} <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WIZARD STEP 2: MODEL & BACKGROUND */}
                    {wizardStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Model & Gender Group */}
                                <ModelSection
                                    language={language}
                                    gender={gender}
                                    setGender={setGender}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                />

                                {/* Background & Lighting Group */}
                                <div className="grid grid-cols-2 gap-4">
                                    <BackgroundSection
                                        language={language}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={setActiveLibraryAsset}
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                    />
                                    <AssetCard
                                        id="lighting"
                                        label={language === "tr" ? "IŞIK" : "LIGHT"}
                                        icon={Camera}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={setActiveLibraryAsset}
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                        language={language}
                                        lightingSendImage={lightingSendImage}
                                        setLightingSendImage={setLightingSendImage}
                                        variant="square"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between mt-12 pt-6 border-t border-[var(--border-subtle)]">
                                <Button
                                    variant="outline"
                                    onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                                    className="px-8 py-6 rounded-2xl border-2 border-[var(--border-subtle)] font-bold uppercase tracking-wider hover:bg-[var(--bg-elevated)] transition-all"
                                >
                                    <ChevronLeft className="mr-2 w-5 h-5" /> {language === "tr" ? "GERİ" : "BACK"}
                                </Button>
                                {wizardStep < 4 && (
                                    <Button
                                        onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                                        className="px-10 py-6 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold uppercase tracking-wider shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {language === "tr" ? "DEVAM ET" : "CONTINUE"} <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WIZARD STEP 3: DETAILS & SETTINGS */}
                    {wizardStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-sm">
                                    <TbSettings2 className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[11px] uppercase font-bold text-[var(--text-primary)] tracking-[0.15em]">{language === "tr" ? "ÇEKİM DETAYLARI" : "SHOOT DETAILS"}</label>
                                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-tight opacity-60">{language === "tr" ? "ÇEKİMİN TÜM AYARLARINI ÖZELLEŞTİR" : "CUSTOMIZE ALL SHOOT SETTINGS"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">
                                        {language === "tr" ? "GÖRSEL ORANI" : "ASPECT RATIO"}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] appearance-none transition-all font-bold"
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                        >
                                            {ASPECT_RATIOS.map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {language === 'tr' ? opt.labelTr : opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">
                                        {language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] appearance-none transition-all font-bold"
                                            value={resolution}
                                            onChange={(e) => setResolution(e.target.value)}
                                        >
                                            {RESOLUTION_OPTIONS.map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {language === 'tr' ? opt.labelTr : opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">
                                        {language === "tr" ? "TEKRAR TUTARLILIĞI (SEED)" : "CONSISTENCY (SEED)"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all font-bold placeholder:text-[var(--text-disabled)]"
                                            value={seed === "" ? "" : seed}
                                            onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="RANDOM"
                                        />
                                        {seed !== "" && (
                                            <button
                                                onClick={() => setSeed("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:scale-110 transition-transform"
                                            >
                                                <X size={14} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                <AdvancedSettings
                                    language={language}
                                    hasFeet={hasFeet}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    convertToStickman={convertToStickman}
                                    lightingSendImage={lightingSendImage}
                                    setLightingSendImage={setLightingSendImage}
                                />

                                <BehaviorToggles
                                    language={language}
                                    canShowCollarHairButtons={canShowCollarHairButtons}
                                    hairBehindShoulders={hairBehindShoulders}
                                    setHairBehindShoulders={setHairBehindShoulders}
                                    lookAtCamera={lookAtCamera}
                                    setLookAtCamera={setLookAtCamera}
                                    buttonsOpen={buttonsOpen}
                                    setButtonsOpen={setButtonsOpen}
                                    isCloseup={isCloseup}
                                    isCowboy={isCowboy}
                                    isFullBody={isFullBody}
                                    canShowWaistRiseFitTuck={canShowWaistRiseFitTuck}
                                    tucked={tucked}
                                    setTucked={setTucked}
                                    sleevesRolled={sleevesRolled}
                                    setSleevesRolled={setSleevesRolled}
                                    enableWind={enableWind}
                                    setEnableWind={setEnableWind}
                                    hasHead={hasHead}
                                    enableExpression={enableExpression}
                                    setEnableExpression={setEnableExpression}
                                    enableGaze={enableGaze}
                                    setEnableGaze={setEnableGaze}
                                    socksType={socksType}
                                    setSocksType={setSocksType}
                                />
                            </div>

                            {/* Move Accessories below to maintain alignment overhead */}
                            <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]/50">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">
                                        {language === "tr" ? "DİĞER AKSESUARLAR" : "OTHER ACCESSORIES"}
                                    </h4>
                                </div>
                                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                                    <AssetCard id="jacket" label={language === "tr" ? "DIŞ GİYİM" : "OUTERWEAR"} icon={TbJacket} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="bag" label={language === "tr" ? "ÇANTA" : "BAG"} icon={PiHandbag} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="glasses" label={language === "tr" ? "GÖZLÜK" : "GLASSES"} icon={Glasses} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="hat" label={language === "tr" ? "ŞAPKA" : "HAT"} icon={PiBaseballCap} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="jewelry" label={language === "tr" ? "TAKILAR" : "JEWELRY"} icon={PiDiamond} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="belt" label={language === "tr" ? "KEMER" : "BELT"} icon={PiBelt} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                </div>
                            </div>

                            <div className="flex justify-between mt-12 pt-6 border-t border-[var(--border-subtle)]">
                                <Button
                                    variant="outline"
                                    onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                                    className="px-8 py-6 rounded-2xl border-2 border-[var(--border-subtle)] font-bold uppercase tracking-wider hover:bg-[var(--bg-elevated)] transition-all"
                                >
                                    <ChevronLeft className="mr-2 w-5 h-5" /> {language === "tr" ? "GERİ" : "BACK"}
                                </Button>
                                {wizardStep < 4 && (
                                    <Button
                                        onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                                        className="px-10 py-6 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold uppercase tracking-wider shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {language === "tr" ? "DEVAM ET" : "CONTINUE"} <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                {wizardStep === 4 && (
                    <Tabs defaultValue="single" onValueChange={(val) => setBatchMode(val === 'batch')} className="w-full animate-in fade-in duration-500">
                        <div className="flex justify-center mb-6">
                            <TabsList className={cn("grid w-full max-w-[400px]", (user?.role === 'admin' || user?.authorizedPages?.includes('photoshoot:batch')) ? "grid-cols-2" : "grid-cols-1")}>
                                <TabsTrigger value="single">{language === "tr" ? "Tekli Üretim" : "Single Production"}</TabsTrigger>
                                {(user?.role === 'admin' || user?.authorizedPages?.includes('photoshoot:batch')) && (
                                    <TabsTrigger value="batch">{language === "tr" ? "Toplu Üretim (Batch)" : "Batch Production"}</TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent value="single">
                            <div className="max-w-5xl mx-auto px-1 md:px-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Sol - Detaylı Özet */}
                                    <div className="col-span-1 space-y-4">
                                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm">

                                            {/* Product Header */}
                                            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{language === "tr" ? "ÜRÜN" : "PRODUCT"}</p>
                                                        <h3 className="font-bold text-lg text-[var(--text-primary)] leading-tight">{productName || (language === "tr" ? "İsimsiz Ürün" : "Untitled Product")}</h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium border border-purple-500/20 uppercase">
                                                                {workflowType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setWizardStep(1)}
                                                        className="p-2 hover:bg-[var(--bg-surface)] rounded-lg text-muted-foreground hover:text-[var(--text-primary)] transition-colors"
                                                        title={language === "tr" ? "Ürün Düzenle" : "Edit Product"}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Configuration Details */}
                                            <div className="p-4 space-y-4">

                                                {/* Model & Background */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{language === "tr" ? "KOMPOZİSYON" : "COMPOSITION"}</p>
                                                        <button onClick={() => setWizardStep(2)} className="text-[10px] text-purple-500 hover:text-purple-400 font-medium hover:underline">{language === "tr" ? "Değiştir" : "Change"}</button>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                                        <div className={cn("p-2 rounded-full shrink-0", assets.model ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground")}>
                                                            <User size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate text-[var(--text-primary)]">
                                                                {assets.model ? (language === "tr" ? "Model Seçili" : "Model Selected") : (language === "tr" ? "Model Yok" : "No Model")}
                                                            </p>
                                                            {assets.model && <p className="text-[10px] text-muted-foreground truncate">{assets.model}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                                        <div className={cn("p-2 rounded-full shrink-0", assets.background ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground")}>
                                                            <ImageIcon size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate text-[var(--text-primary)]">
                                                                {assets.background ? (language === "tr" ? "Arka Plan Seçili" : "Background Selected") : (language === "tr" ? "Arka Plan Yok" : "No Background")}
                                                            </p>
                                                            {assets.background && <p className="text-[10px] text-muted-foreground truncate">{assets.background}</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full h-[1px] bg-[var(--border-subtle)]" />

                                                {/* Technical Settings */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{language === "tr" ? "AYARLAR" : "SETTINGS"}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                                            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                                                <TbAspectRatio size={14} />
                                                                <span className="text-[10px] font-bold uppercase">{language === "tr" ? "ORAN" : "RATIO"}</span>
                                                            </div>
                                                            <p className="font-semibold text-sm text-[var(--text-primary)]">{ASPECT_RATIOS.find(r => r.id === aspectRatio)?.label || aspectRatio}</p>
                                                        </div>
                                                        <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                                            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                                                <TbHdr size={14} />
                                                                <span className="text-[10px] font-bold uppercase">{language === "tr" ? "KALİTE" : "QUALITY"}</span>
                                                            </div>
                                                            <p className="font-semibold text-sm text-[var(--text-primary)]">{RESOLUTION_OPTIONS.find(r => r.id === resolution)?.label || resolution}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>

                                    {/* Sağ - Önizleme */}
                                    <div className="col-span-1 lg:col-span-2">
                                        <PreviewArea
                                            language={language}
                                            isProcessing={isProcessing}
                                            isStoppingBatch={isStoppingBatch}
                                            handleStopBatch={handleStopBatch}
                                            isGenerationSuccess={isGenerationSuccess}
                                            resultImages={resultImages}
                                            router={router}
                                            StudioSteps={StudioSteps}
                                            handleGenerate={handleGenerate}
                                            handleBatchGenerate={handleBatchGenerate}
                                            batchMode={batchMode}
                                            productCode={productCode}
                                            estimatedCost={estimatedCost}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {(user?.role === 'admin' || user?.authorizedPages?.includes('photoshoot:batch')) && (
                            <TabsContent value="batch">
                                <div className="max-w-5xl mx-auto px-1 md:px-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                                        {/* Sol Taraf: Batch Ayarları ve Seçimler */}
                                        <div className="col-span-1 flex flex-col">
                                            <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm flex flex-col p-6">
                                                <BatchPanel
                                                    language={language}
                                                    batchMode={batchMode}
                                                    setBatchMode={setBatchMode}
                                                    productCode={productCode}
                                                    setProductCode={setProductCode}
                                                    availableBatchShots={availableBatchShots}
                                                    batchShotSelection={batchShotSelection}
                                                    setBatchShotSelection={setBatchShotSelection}
                                                    isAdmin={user?.role === 'admin'}
                                                    isMaviBatch={isMaviBatch}
                                                    setIsMaviBatch={setIsMaviBatch}
                                                    stylingSideOnly={stylingSideOnly}
                                                    setStylingSideOnly={setStylingSideOnly}
                                                    techAccessories={techAccessories}
                                                    setTechAccessories={setTechAccessories}
                                                    assets={assets}
                                                />
                                            </div>
                                        </div>

                                        {/* Sağ Taraf: Önizleme / Üretim Alanı */}
                                        <div className="col-span-1 lg:col-span-2 flex flex-col">
                                            <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm flex flex-col">
                                                <PreviewArea
                                                    language={language}
                                                    isProcessing={isProcessing}
                                                    isStoppingBatch={isStoppingBatch}
                                                    handleStopBatch={handleStopBatch}
                                                    isGenerationSuccess={isGenerationSuccess}
                                                    resultImages={resultImages}
                                                    router={router}
                                                    StudioSteps={StudioSteps}
                                                    handleGenerate={handleGenerate}
                                                    handleBatchGenerate={handleBatchGenerate}
                                                    batchMode={true}
                                                    productCode={productCode}
                                                    estimatedCost={estimatedCost}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                )}

                {/* Micro-feedback Hint Area */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none h-8 flex items-center justify-center">
                    {microFeedback && (
                        <div className="bg-white/90 dark:bg-background/90 backdrop-blur-md border border-violet-200/50 dark:border-violet-800/50 px-4 py-1 rounded-full shadow-sm">
                            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-tighter flex items-center gap-2">
                                <Sparkles size={10} className="animate-pulse" />
                                {microFeedback}
                            </p>
                        </div>
                    )}
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
                                        {user?.role === 'admin' && (
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
                                        )}
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

                                        {user?.role === 'admin' ? (
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
                                        ) : (
                                            <div className="py-10 text-center text-xs text-muted-foreground bg-[var(--bg-surface)] rounded-lg border border-dashed border-[var(--border-subtle)]">
                                                {language === "tr" ? "Üretim detayları analiz edildi. Onaylayıp devam edebilirsiniz." : "Generation details analyzed. You can confirm and proceed."}
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                <span>Resolution: {item.settings.resolution}</span>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                                                <span>Ratio: {item.settings.aspect_ratio}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                                        {language === "tr" ? "İptal" : "Cancel"}
                                    </Button>
                                    <Button onClick={handleConfirmGeneration} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {language === "tr" ? "Onayla ve Oluştur" : "Confirm & Generate"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modular Dialogs */}

                <SavePoseDialog
                    isOpen={showSavePoseDialog}
                    onOpenChange={setShowSavePoseDialog}
                    language={language}
                    tempPoseData={tempPoseData}
                    handleSavePose={handleSavePose}
                />

                <SaveModelDialog
                    isOpen={showSaveModelDialog}
                    onOpenChange={setShowSaveModelDialog}
                    language={language}
                    tempModelData={tempModelData}
                    setTempModelData={setTempModelData}
                    onSave={handleSaveModel}
                />

                <SaveAssetDialog
                    isOpen={showSaveAssetDialog}
                    onOpenChange={setShowSaveAssetDialog}
                    language={language}
                    tempAssetData={tempAssetData}
                    setTempAssetData={setTempAssetData}
                    onSave={handleSaveAsset}
                />

                <SaveLightingDialog
                    isOpen={showSaveLightingDialog}
                    onOpenChange={setShowSaveLightingDialog}
                    language={language}
                    tempLightingData={tempLightingData}
                    setTempLightingData={setTempLightingData}
                    onSave={handleSaveLighting}
                />

                <EditItemDialog
                    isOpen={!!editingThumbItem}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingThumbItem(null);
                            setEditingItemPrompt("");
                            setEditingItemTags([]);
                        }
                    }}
                    language={language}
                    editingThumbItem={editingThumbItem}
                    editingItemPrompt={editingItemPrompt}
                    setEditingItemPrompt={setEditingItemPrompt}
                    editingItemNegativePrompt={editingItemNegativePrompt}
                    setEditingItemNegativePrompt={setEditingItemNegativePrompt}
                    editingItemSendImage={editingItemSendImage}
                    setEditingItemSendImage={setEditingItemSendImage}
                    editingItemTags={editingItemTags}
                    setEditingItemTags={setEditingItemTags}
                    handleUpdateThumbnail={handleUpdateThumbnail}
                    savedPoses={savedPoses}
                    savedModels={savedModels}
                    savedBackgrounds={savedBackgrounds}
                    savedFits={savedFits}
                    savedShoes={savedShoes}
                    savedLightings={savedLightings}
                    savedJackets={savedJackets}
                    savedBags={savedBags}
                    savedGlasses={savedGlasses}
                    savedHats={savedHats}
                    savedJewelry={savedJewelry}
                    savedBelts={savedBelts}
                    savedInnerWears={savedInnerWears}
                />

                <BatchPreviewDialog
                    isOpen={showBatchPreview}
                    onOpenChange={setShowBatchPreview}
                    language={language}
                    batchPreviewPrompts={batchPreviewPrompts}
                    selectedBatchImages={selectedBatchImages}
                    setSelectedBatchImages={setSelectedBatchImages}
                    editedBatchPrompts={editedBatchPrompts}
                    setEditedBatchPrompts={setEditedBatchPrompts}
                    onConfirm={handleConfirmBatchGeneration}
                    isAdmin={user?.role === 'admin'}
                />
            </div>

            <LibrarySidebar
                language={language}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                internalAsset={internalAsset}
                libraryTab={libraryTab}
                setLibraryTab={setLibraryTab}
                hasWaist={canShowWaistRiseFitTuck}
                poseFocus={poseFocus}
                setPoseFocus={setPoseFocus}
                setUpperFraming={setUpperFraming}
                savedPoses={savedPoses}
                handleSavedPoseClick={handleSavedPoseClick}
                deleteSavedPose={deleteSavedPose}
                handleSavedFitClick={handleSavedFitClick}
                handleSavedShoeClick={handleSavedShoeClick}
                handleSavedJacketClick={handleSavedJacketClick}
                handleSavedBagClick={handleSavedBagClick}
                handleSavedGlassesClick={handleSavedGlassesClick}
                handleSavedHatClick={handleSavedHatClick}
                handleSavedJewelryClick={handleSavedJewelryClick}
                handleSavedBeltClick={handleSavedBeltClick}
                handleSavedInnerWearClick={handleSavedInnerWearClick}
                setAssets={setAssets}
                setAssetsHighRes={setAssetsHighRes}
                setLightingPositive={setLightingPositive}
                setLightingNegative={setLightingNegative}
                setLightingSendImage={setLightingSendImage}
                deleteSavedAsset={deleteSavedAsset}
                handleEditItemClick={handleEditItemClick}
                gender={gender}
                setGender={setGender}
                assets={assets}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                savedModels={savedModels}
                deleteSavedModel={deleteSavedModel}
                savedBackgrounds={savedBackgrounds}
                savedFits={savedFits}
                savedShoes={savedShoes}
                savedLightings={savedLightings}
                savedJackets={savedJackets}
                savedBags={savedBags}
                savedGlasses={savedGlasses}
                savedHats={savedHats}
                savedJewelry={savedJewelry}
                savedBelts={savedBelts}
                savedInnerWears={savedInnerWears}
                models={models}
                handleLibrarySelect={handleLibrarySelect}
                sessionLibrary={sessionLibrary}
                isAdmin={user?.role === 'admin'}
            />

        </div >
    );
}
