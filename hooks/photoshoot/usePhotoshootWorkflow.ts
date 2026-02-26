import { useState, useRef, useEffect } from "react";
import { useProjects } from "@/context/projects-context";
import { useLanguage } from "@/context/language-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLibraryState } from "./useLibraryState";
import { useAssetManager } from "./useAssetManager";
import { useGenerationEngine } from "./useGenerationEngine";
import { useDialogState } from "./useDialogState";
import {
    UPPER_SHOTS, LOWER_SHOTS, STANDARD_SHOTS, SavedPose, SavedModel,
    SavedBackground, SavedFit, SavedLighting, SavedShoe, SavedJacket,
    SavedBag, SavedGlasses, SavedInnerWear, SavedHat, SavedJewelry,
    SavedBelt, LibraryItem, BACKGROUND_PRESETS, LIGHTING_PRESETS
} from "@/lib/photoshoot-shared";
import { POSE_PRESETS } from "@/lib/photoshoot-constants";
import { dbOperations, STORES } from "@/lib/db";

export const usePhotoshootWorkflow = () => {
    const { projects, addProject, deductCredits, models } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();

    // States
    const [showExpert, setShowExpert] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showGarmentDetails, setShowGarmentDetails] = useState(true);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [user, setUser] = useState<any>(null);
    const isRestoringRef = useRef(true);

    const [productName, setProductName] = useState("");
    const [isManualProductName, setIsManualProductName] = useState(false);
    const [workflowType, setWorkflowType] = useState<"upper" | "lower" | "dress" | "set">("upper");
    const [resolution, setResolution] = useState("4K");
    const [aspectRatio, setAspectRatio] = useState("2:3");
    const [gender, setGender] = useState<string>("");
    const [seed, setSeed] = useState<number | "">("");
    const [isSeedManual, setIsSeedManual] = useState(false);
    const [enableWebSearch, setEnableWebSearch] = useState(false);
    const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(false);
    const [buttonsOpen, setButtonsOpen] = useState(false);
    const [closureType, setClosureType] = useState<'buttons' | 'zipper' | 'none'>('buttons');
    const [userAddedPrompt, setUserAddedPrompt] = useState("");

    const [poseDescription, setPoseDescription] = useState<string | null>(null);
    const [poseStickman, setPoseStickman] = useState<string | null>(null);
    const [productDescription, setProductDescription] = useState<string | null>(null);
    const [fitDescription, setFitDescription] = useState<string | null>(null);
    const [upperGarmentDescription, setUpperGarmentDescription] = useState<string | null>(null);
    const [lowerGarmentDescription, setLowerGarmentDescription] = useState<string | null>(null);
    const [innerWearDescription, setInnerWearDescription] = useState<string | null>(null);
    const [shoesDescription, setShoesDescription] = useState<string | null>(null);
    const [modelDescription, setModelDescription] = useState<string | null>(null);

    const [tucked, setTucked] = useState(false);
    const [sleevesRolled, setSleevesRolled] = useState(false);
    const [lookAtCamera, setLookAtCamera] = useState(true);
    const [enableWind, setEnableWind] = useState(false);
    const [selectedMoodId, setSelectedMoodId] = useState<string>('natural');
    const [hairBehindShoulders, setHairBehindShoulders] = useState(false);
    const [socksType, setSocksType] = useState<'none' | 'white' | 'black' | 'grey' | 'navy'>('none');

    const [collarType, setCollarType] = useState<'none' | 'standard' | 'v-neck' | 'polo'>('none');
    const [shoulderType, setShoulderType] = useState<'none' | 'standard' | 'dropped' | 'padded'>('none');
    const [waistType, setWaistType] = useState<'none' | 'standard' | 'elastic' | 'high-waisted'>('none');
    const [riseType, setRiseType] = useState<'none' | 'low' | 'mid' | 'high'>('none');
    const [legType, setLegType] = useState<'none' | 'skinny' | 'straight' | 'wide'>('none');
    const [hemType, setHemType] = useState<'none' | 'standard' | 'cuffed' | 'raw'>('none');
    const [pantLength, setPantLength] = useState<'none' | 'cropped' | 'ankle' | 'below_ankle' | 'full_length' | 'deep_break'>('none');

    const [lightingPositive, setLightingPositive] = useState<string>("");
    const [lightingNegative, setLightingNegative] = useState<string>("");
    const [lightingSendImage, setLightingSendImage] = useState(true);

    const [assets, setAssets] = useState<{ [key: string]: string | null }>({
        model: null, background: null, main_product: null, pose: null,
        top_front: null, bottom_front: null, shoes: null, top_back: null,
        bottom_back: null, jacket: null, bag: null, glasses: null,
        hat: null, jewelry: null, belt: null, inner_wear: null, lighting: null
    });

    const [assetsHighRes, setAssetsHighRes] = useState<{ [key: string]: string | null }>({
        model: null, background: null, main_product: null, pose: null,
        top_front: null, bottom_front: null, shoes: null, top_back: null,
        bottom_back: null, jacket: null, bag: null, glasses: null,
        hat: null, jewelry: null, belt: null, inner_wear: null, lighting: null
    });

    const [poseFocus, setPoseFocus] = useState<'upper' | 'full' | 'lower' | 'closeup'>('full');
    const [detailView, setDetailView] = useState<'front' | 'angled' | 'back'>('front');
    const [productCode, setProductCode] = useState("");
    const [batchMode, setBatchMode] = useState(true);
    const [isMaviBatch, setIsMaviBatch] = useState(false);
    const [stylingSideOnly, setStylingSideOnly] = useState<Record<string, boolean>>({});
    const [upperFraming, setUpperFraming] = useState<"full" | "medium_full">("full");
    const [batchShotSelection, setBatchShotSelection] = useState<Record<string, boolean>>({});
    const [techAccessories, setTechAccessories] = useState<Record<string, boolean>>({
        jacket: false, bag: false, glasses: false, hat: false, jewelry: false, belt: false
    });
    const [techAccessoryDescriptions, setTechAccessoryDescriptions] = useState<Record<string, string>>({
        jacket: "", bag: "", glasses: "", hat: "", jewelry: "", belt: ""
    });
    const [activeLibraryAsset, setActiveLibraryAsset] = useState<string | null>(null);
    const [activeGroup, setActiveGroup] = useState<'product' | 'accessories' | null>(null);
    const [internalAsset, setInternalAsset] = useState<string | null>(null);
    const [libraryTab, setLibraryTab] = useState<'library' | 'upload'>('library');
    const [sessionLibrary, setSessionLibrary] = useState<string[]>([]);
    const [filterAge, setFilterAge] = useState("All");
    const [filterGender, setFilterGender] = useState("All");
    const [filterEthnicity, setFilterEthnicity] = useState("All");

    // Update internalAsset when activeLibraryAsset changes
    useEffect(() => {
        if (!activeLibraryAsset) {
            setInternalAsset(null);
            return;
        }

        // Always open library tab first when sidebar opens
        setLibraryTab('library');

        // If it's a group selector, don't set internalAsset (handled in Sidebar)
        if (['product_group', 'accessories_group'].includes(activeLibraryAsset)) {
            setInternalAsset(null);
            return;
        }

        // Map asset types to internal asset categories
        if (activeLibraryAsset.startsWith('pose')) {
            setInternalAsset('pose');
        } else if (['model', 'background', 'lighting', 'shoes', 'jacket', 'bag', 'glasses', 'hat', 'jewelry', 'belt', 'inner_wear', 'fit_pattern'].includes(activeLibraryAsset)) {
            setInternalAsset(activeLibraryAsset);
        } else {
            // For product parts (top_front, etc), we might want to show product library?
            // Currently keeping it null as product parts don't have a library in sidebar yet
            // or they use 'upload' tab mostly.
            setInternalAsset(null);
        }
    }, [activeLibraryAsset]);

    // Effects
    useEffect(() => {
        setMounted(true);

        // Clear any old session state on mount to ensure fresh start
        dbOperations.delete(STORES.PHOTOSHOOT_STATE, 'current-session').catch(() => { });

        fetch('/api/auth/session')
            .then(res => res.json())
            .then((data: any) => {
                if (data?.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error("Session fetch error:", err));
    }, []);


    // Hooks
    const {
        savedPoses, setSavedPoses, savedModels, setSavedModels,
        savedBackgrounds, setSavedBackgrounds, savedFits, setSavedFits,
        savedShoes, setSavedShoes, savedJackets, setSavedJackets,
        savedBags, setSavedBags, savedGlasses, setSavedGlasses,
        savedHats, setSavedHats, savedJewelry, setSavedJewelry,
        savedBelts, setSavedBelts, savedInnerWears, setSavedInnerWears,
        savedLightings, setSavedLightings, deleteSavedPose,
        deleteSavedModel, deleteSavedAsset, handleSavedModelClick,
        handleSavedPoseClick, handleSavedFitClick, handleSavedShoeClick,
        handleSavedJacketClick, handleSavedBagClick, handleSavedGlassesClick,
        handleSavedHatClick, handleSavedJewelryClick, handleSavedBeltClick,
        handleSavedInnerWearClick, handleSavedLightingClick,
        addToGlobalLibrary
    } = useLibraryState(
        setAssets, setAssetsHighRes, setPoseStickman, setPoseDescription,
        setModelDescription, setFitDescription, setShoesDescription,
        setInnerWearDescription, setGender, setLightingPositive,
        setLightingNegative, setLightingSendImage
    );

    const {
        showSavePoseDialog, setShowSavePoseDialog, showSaveModelDialog, setShowSaveModelDialog,
        showSaveAssetDialog, setShowSaveAssetDialog, showSaveLightingDialog, setShowSaveLightingDialog,
        tempPoseData, setTempPoseData, tempModelData, setTempModelData,
        tempAssetData, setTempAssetData, tempLightingData, setTempLightingData,
        editingThumbItem, setEditingThumbItem, editingItemPrompt, setEditingItemPrompt,
        editingItemNegativePrompt, setEditingItemNegativePrompt,
        editingItemSendImage, setEditingItemSendImage, editingItemTags, setEditingItemTags,
        handleSavePose, handleSaveModel, handleSaveAsset, handleSaveLighting,
        handleEditItemClick, handleUpdateThumbnail
    } = useDialogState(
        language, setPoseDescription, setPoseStickman, setAssets, setAssetsHighRes,
        setSavedPoses, setSavedModels, setSavedBackgrounds, setSavedFits,
        setSavedShoes, setSavedJackets, setSavedBags, setSavedGlasses,
        setSavedHats, setSavedJewelry, setSavedBelts, setSavedInnerWears,
        setSavedLightings, setGender, setLightingPositive, setLightingNegative,
        setLightingSendImage, setModelDescription, setFitDescription,
        setShoesDescription, setInnerWearDescription, assets, assetsHighRes,
        savedPoses, savedModels, savedBackgrounds, savedFits, savedShoes,
        savedLightings, savedJackets, savedBags, savedGlasses, savedHats,
        savedJewelry, savedBelts, savedInnerWears, lightingPositive, lightingNegative, poseFocus
    );

    const {
        handleAssetUpload, removeAsset, resizeImage, resizeImageDual
    } = useAssetManager(
        assets, setAssets, assetsHighRes, setAssetsHighRes, setPoseDescription,
        setPoseStickman, setTempPoseData, setShowSavePoseDialog, setTempModelData,
        setShowSaveModelDialog, setTempLightingData, setShowSaveLightingDialog,
        setTempAssetData, setShowSaveAssetDialog, setProductDescription,
        setUpperGarmentDescription, setInnerWearDescription, setUserAddedPrompt,
        setFitDescription, setLightingPositive, setLightingNegative
    );

    const availableBatchShots = isMaviBatch
        ? (workflowType === 'upper' ? UPPER_SHOTS : LOWER_SHOTS)
        : STANDARD_SHOTS;

    const singleCost = resolution === "4K" ? 100 : 50;

    const {
        isProcessing, setIsProcessing, resultImages, setResultImages,
        generationStage, setGenerationStage, isGenerationSuccess,
        setIsGenerationSuccess, showPreview, setShowPreview,
        previewData, setPreviewData, pendingOptions, setPendingOptions,
        previewMode, setPreviewMode, handleGenerate, handleBatchGenerate,
        handleConfirmGeneration, handleConfirmBatchGeneration,
        batchPreviewPrompts, editedBatchPrompts, setEditedBatchPrompts,
        showBatchPreview, setShowBatchPreview, selectedBatchImages,
        setSelectedBatchImages, isStoppingBatch, handleStopBatch
    } = useGenerationEngine(
        // Arguments Must match useGenerationEngine exactly (66 total)
        language, assets, assetsHighRes, savedPoses, savedModels, savedFits, savedShoes,
        productName, workflowType, resolution, aspectRatio, gender, seed,
        enableWebSearch, buttonsOpen, closureType, userAddedPrompt,
        tucked, sleevesRolled, lookAtCamera, enableWind, selectedMoodId,
        hairBehindShoulders, socksType, collarType, shoulderType,
        waistType, riseType, legType, hemType, pantLength, lightingPositive, lightingNegative,
        lightingSendImage, poseDescription, poseStickman, productDescription,
        fitDescription, upperGarmentDescription, lowerGarmentDescription,
        innerWearDescription, shoesDescription, modelDescription, isMaviBatch,
        productCode, upperFraming, batchShotSelection, stylingSideOnly,
        techAccessories, techAccessoryDescriptions, singleCost, poseFocus, detailView,
        user?.role || null,
        // Setters
        setSeed, setProductDescription, setFitDescription, setProductName,
        setUpperGarmentDescription, setLowerGarmentDescription, setInnerWearDescription,
        setShoesDescription, setClosureType, setPoseDescription, setUserAddedPrompt,
        setActiveLibraryAsset,
        // External Actions
        addProject, deductCredits
    );

    const estimatedCost = batchMode
        ? Object.values(batchShotSelection).filter(Boolean).length * singleCost
        : singleCost;

    const effectiveFraming = (() => {
        if (poseFocus === 'closeup') return 'chest_and_face';
        if (poseFocus === 'upper') return 'cowboy_shot';
        if (poseFocus === 'lower') return 'head_to_toe';
        if (poseFocus === 'full') return 'head_to_toe';
        return 'head_to_toe';
    })();

    const isFullBody = effectiveFraming === 'head_to_toe';
    const isCowboy = effectiveFraming === 'cowboy_shot';
    const isCloseup = effectiveFraming === 'chest_and_face';
    const hasHead = isCloseup || isCowboy || isFullBody;
    const canShowWaistRiseFitTuck = isCowboy || isFullBody;
    const canShowCollarHairButtons = isCloseup || isCowboy || isFullBody;
    const canShowLegHem = isFullBody;

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

    const getLibraryItems = (assetKey: string) => {
        if (assetKey === 'model') return savedModels.map(m => ({ id: m.id, src: m.url, label: m.name }));
        if (assetKey === 'background') return BACKGROUND_PRESETS.map(b => ({ id: b.id, src: b.preview!, label: language === "tr" ? b.labelTr : b.label }));
        if (assetKey === 'pose') return POSE_PRESETS.map(p => ({ id: p.id, src: p.preview, icon: p.icon, label: language === "tr" ? p.labelTr : p.label }));
        if (assetKey === 'lighting') return [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))];
        return [];
    };



    const handleLibrarySelect = (item: any, isUpload: boolean = false) => {
        if (!activeLibraryAsset) return;

        if (isUpload && item.src) {
            if (!sessionLibrary.includes(item.src)) {
                setSessionLibrary(prev => [item.src, ...prev]);
            }
        }

        if (item.src) {
            setAssets((prev: Record<string, string | null>) => ({ ...prev, [activeLibraryAsset]: item.src }));
            setAssetsHighRes((prev: Record<string, string | null>) => ({ ...prev, [activeLibraryAsset]: null }));
        } else if (item.icon) {
            setAssets((prev: Record<string, string | null>) => ({ ...prev, [activeLibraryAsset]: item.id }));
            setAssetsHighRes((prev: Record<string, string | null>) => ({ ...prev, [activeLibraryAsset]: null }));
        }

        if (activeLibraryAsset === 'pose') {
            const pose = savedPoses.find(p => p.url === item.src);
            if (pose) {
                handleSavedPoseClick(pose);
                return;
            }
            setPoseDescription(null);
        }
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
    };

    const handleAssetRemove = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        removeAsset(id);
    };

    const canMoveToStep = (targetStep: number) => {
        if (targetStep <= wizardStep) return true;
        if (targetStep >= 2) {
            if (!productName.trim()) {
                toast.error(language === 'tr' ? "Lütfen ürün adını girin." : "Please enter product name.");
                return false;
            }
            if (!assets.model) {
                toast.error(language === 'tr' ? "Lütfen bir model seçin." : "Please select a model.");
                return false;
            }
            const hasProduct = assets.main_product || assets.top_front || assets.bottom_front ||
                assets.top_back || assets.bottom_back || assets.jacket ||
                assets.bag || assets.shoes || assets.inner_wear ||
                assets.hat || assets.jewelry || assets.belt;
            if (!hasProduct) {
                toast.error(language === 'tr' ? "Lütfen Ürün Yönetimi'nden en az bir ürün görseli ekleyin." : "Please add at least one product image from Product Management.");
                return false;
            }
        }
        if (targetStep >= 3) {
            if (!assets.background) {
                toast.error(language === 'tr' ? "Lütfen bir arkaplan seçin." : "Please select a background.");
                return false;
            }

            if (!assets.lighting) {
                toast.error(language === 'tr' ? "Lütfen bir ışık ayarı seçin." : "Please select a lighting setup.");
                return false;
            }
        }
        return true;
    };


    return {
        projects, addProject, deductCredits, models, t, language, router,
        showExpert, setShowExpert, mounted, setMounted, showAdvanced, setShowAdvanced,
        showGarmentDetails, setShowGarmentDetails, wizardStep, setWizardStep, user, setUser,
        isRestoringRef, productName, setProductName, isManualProductName, setIsManualProductName,
        workflowType, setWorkflowType, resolution, setResolution, aspectRatio, setAspectRatio,
        gender, setGender, seed, setSeed, isSeedManual, setIsSeedManual, enableWebSearch, setEnableWebSearch,
        isAccessoriesOpen, setIsAccessoriesOpen, buttonsOpen, setButtonsOpen, closureType, setClosureType,
        userAddedPrompt, setUserAddedPrompt, poseDescription, setPoseDescription, poseStickman, setPoseStickman,
        productDescription, setProductDescription, fitDescription, setFitDescription,
        upperGarmentDescription, setUpperGarmentDescription, lowerGarmentDescription, setLowerGarmentDescription,
        innerWearDescription, setInnerWearDescription, shoesDescription, setShoesDescription,
        modelDescription, setModelDescription, tucked, setTucked, sleevesRolled, setSleevesRolled,
        lookAtCamera, setLookAtCamera, enableWind, setEnableWind, selectedMoodId, setSelectedMoodId,
        hairBehindShoulders, setHairBehindShoulders, socksType, setSocksType,
        collarType, setCollarType, shoulderType, setShoulderType, waistType, setWaistType, riseType, setRiseType,
        legType, setLegType, hemType, setHemType, pantLength, setPantLength, lightingPositive, setLightingPositive,
        lightingNegative, setLightingNegative, lightingSendImage, setLightingSendImage,
        assets, setAssets, assetsHighRes, setAssetsHighRes, savedPoses, setSavedPoses,
        savedModels, setSavedModels, savedBackgrounds, setSavedBackgrounds, savedFits, setSavedFits,
        savedShoes, setSavedShoes, savedJackets, setSavedJackets, savedBags, setSavedBags,
        savedGlasses, setSavedGlasses, savedHats, setSavedHats, savedJewelry, setSavedJewelry,
        savedBelts, setSavedBelts, savedInnerWears, setSavedInnerWears, savedLightings, setSavedLightings,
        deleteSavedPose, deleteSavedModel, deleteSavedAsset, handleSavedModelClick, handleSavedPoseClick,
        handleSavedFitClick, handleSavedShoeClick, handleSavedJacketClick, handleSavedBagClick,
        handleSavedGlassesClick, handleSavedHatClick, handleSavedJewelryClick, handleSavedBeltClick,
        handleSavedInnerWearClick, handleSavedLightingClick, showSavePoseDialog, setShowSavePoseDialog,
        showSaveModelDialog, setShowSaveModelDialog, showSaveAssetDialog, setShowSaveAssetDialog,
        showSaveLightingDialog, setShowSaveLightingDialog, tempPoseData, setTempPoseData,
        tempModelData, setTempModelData, tempAssetData, setTempAssetData, tempLightingData, setTempLightingData,
        editingThumbItem, setEditingThumbItem, editingItemPrompt, setEditingItemPrompt,
        editingItemNegativePrompt, setEditingItemNegativePrompt, editingItemSendImage, setEditingItemSendImage,
        editingItemTags, setEditingItemTags, handleSavePose, handleSaveModel, handleSaveAsset,
        handleSaveLighting, handleEditItemClick, handleUpdateThumbnail, handleAssetUpload,
        removeAsset, resizeImage, resizeImageDual, poseFocus, setPoseFocus, detailView, setDetailView,
        effectiveFraming, isFullBody, isCowboy, isCloseup, hasHead, canShowWaistRiseFitTuck,
        canShowCollarHairButtons, canShowLegHem, microFeedback, setMicroFeedback, productCode, setProductCode,
        batchMode, setBatchMode, isMaviBatch, setIsMaviBatch, stylingSideOnly, setStylingSideOnly,
        upperFraming, setUpperFraming, batchShotSelection, setBatchShotSelection, techAccessories,
        setTechAccessories,
        techAccessoryDescriptions,
        setTechAccessoryDescriptions,
        availableBatchShots, singleCost,
        activeLibraryAsset, setActiveLibraryAsset, activeGroup, setActiveGroup, internalAsset,
        setInternalAsset, libraryTab, setLibraryTab, sessionLibrary, setSessionLibrary, isProcessing,
        setIsProcessing, resultImages, setResultImages, generationStage, setGenerationStage,
        isGenerationSuccess, setIsGenerationSuccess, showPreview, setShowPreview, previewData,
        setPreviewData, pendingOptions, setPendingOptions, previewMode, setPreviewMode, handleGenerate,
        handleBatchGenerate, handleConfirmGeneration, handleConfirmBatchGeneration, batchPreviewPrompts,
        editedBatchPrompts, setEditedBatchPrompts, showBatchPreview, setShowBatchPreview,
        selectedBatchImages, setSelectedBatchImages, isStoppingBatch, handleStopBatch, estimatedCost,
        handleAssetRemove, canMoveToStep, handleLibrarySelect, getLibraryItems,
        addToGlobalLibrary
    };
};
