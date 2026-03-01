"use client"
import React, { useRef, useState, useEffect } from "react"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    ChevronRight, ChevronLeft, ChevronDown, Sparkles, User,
    Image as ImageIcon, Camera, X, FileText, Edit2, Glasses, Check, Shirt, ScanLine
} from "lucide-react"
import { TbSettings2, TbShirtFilled, TbJacket, TbShirt, TbHanger } from "react-icons/tb"
import { PiHandbag, PiBaseballCap, PiDiamond, PiBelt, PiPantsLight, PiPants, PiPantsFill } from "react-icons/pi"

import { toast } from "sonner"

// Modular Components
import { ProductSection } from "@/components/photoshoot/ProductSection";
import { BatchPanel } from "@/components/photoshoot/BatchPanel"
import { ModelSection } from "@/components/photoshoot/ModelSection"
import { AssetCard } from "@/components/photoshoot/AssetCard"
import { PreviewArea } from "@/components/photoshoot/PreviewArea"
import { StudioSteps } from "@/components/photoshoot/StudioSteps"
import { LibrarySidebar } from "@/components/photoshoot/LibrarySidebar"
import { WizardProgress } from "@/components/photoshoot/WizardProgress"
import { PhotoshootTutorial } from "@/components/photoshoot/PhotoshootTutorial"
import { BehaviorToggles } from "@/components/photoshoot/BehaviorToggles"

// Dialogs
import { SavePoseDialog } from "@/components/photoshoot/dialogs/SavePoseDialog"
import { SaveAssetDialog } from "@/components/photoshoot/dialogs/SaveAssetDialog"
import { SaveModelDialog } from "@/components/photoshoot/dialogs/SaveModelDialog"
import { SaveLightingDialog } from "@/components/photoshoot/dialogs/SaveLightingDialog"
import { BatchPreviewDialog } from "@/components/photoshoot/dialogs/BatchPreviewDialog"
import { EditItemDialog } from "@/components/photoshoot/dialogs/EditItemDialog"

// Shared Types & Constants
import { ASPECT_RATIOS, RESOLUTION_OPTIONS } from "@/lib/photoshoot-constants"
import { usePhotoshootWorkflow } from "@/hooks/photoshoot/usePhotoshootWorkflow"

export default function PhotoshootPage() {
    const { t } = useLanguage();
    const {
        language, router, mounted, wizardStep, setWizardStep, user,
        productName, setProductName, workflowType, setWorkflowType, resolution, setResolution,
        aspectRatio, setAspectRatio, gender, setGender, seed, setSeed,
        buttonsOpen, setButtonsOpen, userAddedPrompt, setUserAddedPrompt,
        tucked, setTucked, sleevesRolled, setSleevesRolled, lookAtCamera, setLookAtCamera,
        enableWind, setEnableWind, selectedMoodId, setSelectedMoodId,
        hairBehindShoulders, setHairBehindShoulders,
        socksType, setSocksType, lightingSendImage, setLightingSendImage,
        collarType, setCollarType, shoulderType, setShoulderType, waistType, setWaistType, riseType, setRiseType,
        legType, setLegType, hemType, setHemType, pantLength, setPantLength,
        showGarmentDetails, setShowGarmentDetails,
        assets, setAssets, assetsHighRes, setAssetsHighRes,
        savedPoses, savedModels, savedBackgrounds, savedFits, savedShoes,
        savedJackets, savedBags, savedGlasses, savedHats, savedJewelry,
        savedBelts, savedInnerWears, savedLightings, deleteSavedPose,
        deleteSavedModel, deleteSavedAsset, handleSavedModelClick, handleSavedPoseClick,
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
        poseFocus, setPoseFocus, isFullBody, isCowboy, isCloseup, hasHead, canShowWaistRiseFitTuck,
        canShowCollarHairButtons, canShowLegHem, microFeedback, productCode, setProductCode,
        batchMode, setBatchMode, isMaviBatch, setIsMaviBatch, stylingSideOnly, setStylingSideOnly,
        upperFraming, setUpperFraming, batchShotSelection, setBatchShotSelection, techAccessories,
        setTechAccessories, techAccessoryDescriptions, setTechAccessoryDescriptions,
        availableBatchShots, activeLibraryAsset, setActiveLibraryAsset,
        activeGroup, setActiveGroup, internalAsset, libraryTab, setLibraryTab, sessionLibrary,
        isProcessing, resultImages, isGenerationSuccess, showPreview, setShowPreview,
        previewData, pendingOptions, previewMode, setPreviewMode, handleGenerate,
        handleBatchGenerate, handleConfirmGeneration, handleConfirmBatchGeneration, batchPreviewPrompts,
        editedBatchPrompts, setEditedBatchPrompts, showBatchPreview, setShowBatchPreview,
        selectedBatchImages, setSelectedBatchImages, isStoppingBatch, handleStopBatch, estimatedCost,
        handleAssetRemove, canMoveToStep, handleLibrarySelect, models, setLightingPositive, setLightingNegative,
        productDescription, setProductDescription, addToGlobalLibrary
    } = usePhotoshootWorkflow();

    const [targetPoseShot, setTargetPoseShot] = useState<string | null>(null);
    const [showProductManager, setShowProductManager] = useState(false);

    // Block navigation when generation is in progress
    useEffect(() => {
        if (!isProcessing) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const msg = language === 'tr' ? 'Üretim devam ediyor. Çıkmak istediğinize emin misiniz?' : 'Generation is in progress. Are you sure you want to leave?';
            e.preventDefault();
            e.returnValue = msg;
            return msg;
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && !anchor.hasAttribute('target')) {
                // If it's a link to the current page (e.g. hash link), ignore
                if (anchor.href === window.location.href || anchor.href.startsWith(window.location.href + '#')) {
                    return;
                }
                const msg = language === 'tr'
                    ? 'Üretim devam ediyor. Sayfadan ayrılırsanız üretim iptal olabilir. Çıkmak istediğinize emin misiniz?'
                    : 'Generation is in progress. Leaving will cancel the generation. Are you sure you want to leave?';
                if (!window.confirm(msg)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // Use capture phase to intercept click before NextJS router
        document.addEventListener('click', handleClick, { capture: true });

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleClick, { capture: true });
        };
    }, [isProcessing, language]);

    if (!mounted) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
            {/* LEFT COLUMN: Wizard Content */}
            <div className={cn(
                "flex-1 overflow-y-auto bg-[var(--bg-sidebar)] custom-scrollbar flex flex-col transition-all duration-500",
                activeLibraryAsset ? "lg:pr-[480px]" : "pr-0"
            )}>
                <div className={cn(
                    "p-4 md:p-8 mx-auto space-y-8 transition-all duration-500 flex-1 w-full",
                    wizardStep === 1 ? "max-w-[1240px]" : (wizardStep === 3 ? "max-w-[1400px]" : "max-w-5xl")
                )}>

                    {/* Header: Progress */}
                    <div>
                        <WizardProgress currentStep={wizardStep} onStepClick={(s) => canMoveToStep(s) && setWizardStep(s as any)} language={language} />
                    </div>



                    {/* WIZARD STEP 1: PRODUCT */}
                    {wizardStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                                {/* Left: Product Selection */}
                                <div className="lg:col-span-3 flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-xl bg-zinc-800 text-white border border-white/10 shadow-lg">
                                            <TbSettings2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs uppercase font-black text-white tracking-[0.2em]">{language === "tr" ? "ÜRÜN SEÇİMİ" : "PRODUCT SELECTION"}</label>
                                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter opacity-100 mt-0.5">{language === "tr" ? "ÇEKİLECEK ÜRÜNÜ BELİRLE" : "DEFINE PRODUCT TO SHOOT"}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <ProductSection
                                            language={language}
                                            workflowType={workflowType}
                                            setWorkflowType={setWorkflowType}
                                            productName={productName}
                                            setProductName={setProductName}
                                            setIsManualProductName={() => { }}
                                            setActiveLibraryAsset={setActiveLibraryAsset}
                                            setActiveGroup={setActiveGroup}
                                            setLibraryTab={v => setLibraryTab(v as any)}
                                        >
                                            <div className="space-y-4">
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

                                                <div className="grid grid-cols-1 gap-3">
                                                    {/* Manage Products Button */}
                                                    <div
                                                        onClick={() => {
                                                            setShowProductManager(!showProductManager);
                                                            if (activeLibraryAsset) setActiveLibraryAsset(null);
                                                        }}
                                                        className={cn(
                                                            "group relative h-[100px] rounded-2xl border-2 border-dashed transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.01] overflow-hidden cursor-pointer flex items-center justify-center px-4 gap-4",
                                                            showProductManager
                                                                ? "bg-white/10 border-white/40 ring-2 ring-white/20"
                                                                : "bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <div className="p-2.5 rounded-xl bg-zinc-800 text-white border border-white/5 shadow-md group-hover:scale-110 transition-transform">
                                                                <TbShirt className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white uppercase tracking-widest leading-none">{language === "tr" ? "Ürün Yönetimi" : "Products"}</span>
                                                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1.5 opacity-60">
                                                                {language === "tr" ? (showProductManager ? "Gizle" : "Yönet ve Düzenle") : (showProductManager ? "Hide" : "Manage & Edit")}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className={cn("w-4 h-4 transition-transform ml-auto", showProductManager ? "rotate-90 text-white" : "text-zinc-600 group-hover:translate-x-1")} />
                                                    </div>
                                                </div>
                                            </div>
                                        </ProductSection>
                                    </div>
                                </div>

                                {/* Right: Tutorial Area / Product Manager */}
                                <div className="lg:col-span-8 hidden lg:block sticky top-6">
                                    <div className="grid w-full" style={{ gridTemplateAreas: '"stack"' }}>
                                        {/* Product Manager */}
                                        <div
                                            className={cn(
                                                "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                                showProductManager
                                                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto z-10"
                                                    : "opacity-0 translate-y-12 scale-[0.97] pointer-events-none -unset z-0"
                                            )}
                                            style={{ gridArea: 'stack' }}
                                        >
                                            <div className="bg-[#111113] border border-white/5 rounded-[32px] p-8 pb-4 shadow-2xl h-fit max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-6 right-6 h-10 w-10 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-all"
                                                    onClick={() => setShowProductManager(false)}
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>

                                                <div className="grid grid-cols-2 gap-x-12 gap-y-10 mt-4">
                                                    {/* Primary Products Column */}
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 text-white shadow-sm">
                                                                <TbShirt className="w-4 h-4" />
                                                            </div>
                                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                                                {language === "tr" ? "TEMEL ÜRÜNLER" : "PRIMARY PRODUCTS"}
                                                            </h4>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <AssetCard id="top_front" label={language === "tr" ? "Üst Ön" : "Top Front"} icon={TbShirtFilled} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                            <AssetCard id="top_back" label={language === "tr" ? "Üst Arka" : "Top Back"} icon={TbShirt} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                            <AssetCard id="bottom_front" label={language === "tr" ? "Alt Ön" : "Bottom Front"} icon={PiPantsFill} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                            <AssetCard id="bottom_back" label={language === "tr" ? "Alt Arka" : "Bottom Back"} icon={PiPants} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                            <div className="col-span-2 mt-2">
                                                                <AssetCard
                                                                    id="inner_wear"
                                                                    label={language === "tr" ? "İÇ GİYİM MODELİ" : "INNERWEAR MODEL"}
                                                                    icon={TbShirt}
                                                                    variant="square"
                                                                    assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Detailed Views Column */}
                                                    <div className="space-y-8">
                                                        {/* Upper details */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-3 pb-3 border-b border-blue-500/20">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                                                                    <ScanLine className="w-4 h-4" />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em]">
                                                                    {language === "tr" ? "ÜST DETAYLAR" : "UPPER DETAILS"}
                                                                </h4>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-6">
                                                                <div className="space-y-3 text-center">
                                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">{language === "tr" ? "Ön Detay" : "Front Detail"}</span>
                                                                    <AssetCard id="detail_front_1" label={language === "tr" ? "Detay" : "Detail"} icon={ScanLine} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                                </div>
                                                                <div className="space-y-3 text-center">
                                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">{language === "tr" ? "Arka Detay" : "Back Detail"}</span>
                                                                    <AssetCard id="detail_back_1" label={language === "tr" ? "Detay" : "Detail"} icon={ScanLine} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Lower details */}
                                                        <div className="space-y-6">
                                                            <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                                                                    <ScanLine className="w-4 h-4" />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em]">
                                                                    {language === "tr" ? "ALT DETAYLAR" : "LOWER DETAILS"}
                                                                </h4>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-6">
                                                                <div className="space-y-3 text-center">
                                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">{language === "tr" ? "Ön Detay" : "Front Detail"}</span>
                                                                    <AssetCard id="detail_front_3" label={language === "tr" ? "Detay" : "Detail"} icon={ScanLine} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                                </div>
                                                                <div className="space-y-3 text-center">
                                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">{language === "tr" ? "Arka Detay" : "Back Detail"}</span>
                                                                    <AssetCard id="detail_back_3" label={language === "tr" ? "Detay" : "Detail"} icon={ScanLine} variant="square" hideLibrary={true} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tutorial Area */}
                                        <div
                                            className={cn(
                                                "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                                !showProductManager
                                                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto z-10 delay-100"
                                                    : "opacity-0 -translate-y-12 scale-[0.97] pointer-events-none z-0"
                                            )}
                                            style={{ gridArea: 'stack' }}
                                        >
                                            <PhotoshootTutorial language={language} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]/50">
                                <div />
                                <Button
                                    onClick={() => canMoveToStep(2) && setWizardStep(2)}
                                    className="px-10 py-6 rounded-2xl bg-zinc-100 text-black hover:bg-white font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {language === "tr" ? "İLERLE" : "NEXT"} <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* WIZARD STEP 2: CONFIGURATION */}
                    {wizardStep === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                                {/* Left Column: Studio Assets (The 2x2 Grid) */}
                                <div className="lg:col-span-7 flex flex-col space-y-8">
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] px-1 opacity-70">
                                        {language === "tr" ? "ÇEKİM AYARLARI" : "SHOOT SETTINGS"}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        <AssetCard id="background" label={language === "tr" ? "ARKAPLAN" : "BACKGROUND"} icon={ImageIcon} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                        <AssetCard id="lighting" label={language === "tr" ? "IŞIK" : "LIGHT"} icon={Camera} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} lightingSendImage={lightingSendImage} setLightingSendImage={setLightingSendImage} variant="portrait" />
                                        <AssetCard id="fit_pattern" label={language === "tr" ? "KALIP" : "FIT"} icon={TbShirtFilled} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                        <AssetCard id="shoes" label={language === "tr" ? "AYAKKABI" : "SHOES"} icon={TbHanger} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                    </div>
                                </div>

                                {/* Right Column: Behavior Toggles */}
                                <div className="lg:col-span-5 flex flex-col space-y-6">
                                    <div className="flex-1">
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
                                            selectedMoodId={selectedMoodId}
                                            setSelectedMoodId={setSelectedMoodId}
                                            batchMode={batchMode}
                                            batchShotSelection={batchShotSelection}
                                            availableBatchShots={availableBatchShots}
                                            poseFocus={poseFocus as string}
                                            socksType={socksType}
                                            setSocksType={setSocksType}
                                            pantLength={pantLength}
                                            setPantLength={(val: any) => setPantLength(val)}
                                            canShowLegHem={canShowLegHem}
                                        />


                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Accessories */}
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] px-1 opacity-70">{language === "tr" ? "DİĞER AKSESUARLAR" : "OTHER ACCESSORIES"}</h4>
                                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                                    <AssetCard id="jacket" label={language === "tr" ? "DIŞ GİYİM" : "OUTERWEAR"} icon={TbJacket} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="bag" label={language === "tr" ? "ÇANTA" : "BAG"} icon={PiHandbag} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="glasses" label={language === "tr" ? "GÖZLÜK" : "GLASSES"} icon={Glasses} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="hat" label={language === "tr" ? "ŞAPKA" : "HAT"} icon={PiBaseballCap} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="jewelry" label={language === "tr" ? "TAKILAR" : "JEWELRY"} icon={PiDiamond} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                    <AssetCard id="belt" label={language === "tr" ? "KEMER" : "BELT"} icon={PiBelt} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="square" />
                                </div>
                            </div>



                            <div className="flex justify-between mt-16 pt-8 border-t border-white/5">
                                <Button
                                    variant="outline"
                                    onClick={() => setWizardStep(1)}
                                    className="px-10 py-6 rounded-2xl border border-white/10 bg-white/5 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.98]"
                                >
                                    <ChevronLeft className="mr-3 w-5 h-5 opacity-50" /> {language === "tr" ? "GERİ" : "BACK"}
                                </Button>
                                <Button
                                    onClick={() => canMoveToStep(3) && setWizardStep(3)}
                                    className="px-12 py-6 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98]"
                                >
                                    {language === "tr" ? "İLERLE" : "NEXT"} <ChevronRight className="ml-3 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* WIZARD STEP 3: PRODUCTION */}
                    {wizardStep === 3 && (

                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">


                            <div className="w-full">
                                <div className="max-w-5xl mx-auto px-1 md:px-0 space-y-6">

                                    {/* TOP: Horizontal Technical Settings Bar */}
                                    <div className="py-3 px-6 rounded-[24px] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
                                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                                            <div className="md:border-r border-white/10 pr-6 flex-none hidden lg:block">
                                                <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] m-0">{language === "tr" ? "AYARLAR" : "SETTINGS"}</p>
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="flex items-center gap-3">
                                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">{language === "tr" ? "ORAN" : "RATIO"}</label>
                                                    <div className="relative flex-1 min-w-[100px]">
                                                        <select className="w-full text-[11px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all font-black appearance-none focus:border-white/20 outline-none" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                                                            {ASPECT_RATIOS.map(opt => (
                                                                <option key={opt.id} value={opt.id} className="bg-zinc-900 border-none">{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">{language === "tr" ? "KALİTE" : "QUALITY"}</label>
                                                    <div className="relative flex-1 min-w-[100px]">
                                                        <select className="w-full text-[11px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all font-black appearance-none focus:border-white/20 outline-none" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                                            {RESOLUTION_OPTIONS.map(opt => (
                                                                <option key={opt.id} value={opt.id} className="bg-zinc-900 border-none">{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">{language === "tr" ? "SEED" : "SEED"}</label>
                                                    <div className="relative flex-1">
                                                        <input type="number" className="w-full text-[11px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all font-black placeholder:text-white/20 focus:border-white/20 outline-none" value={seed === "" ? "" : seed} onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="RANDOM" />
                                                        {seed !== "" && <button onClick={() => setSeed("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"><X size={14} /></button>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Estimated Cost</span>
                                                        <span className="text-[11px] font-black text-white tracking-widest">~{estimatedCost} CREDITS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toplu Üretim: Açı ve Kare Seçimleri */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 shadow-2xl flex flex-col space-y-8">
                                        <label className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-40">
                                            {language === 'tr' ? 'AÇI VE KARE SEÇİMLERİ' : 'ANGLE & SHOT SELECTION'}
                                        </label>

                                        <div className="flex flex-col xl:flex-row gap-8">
                                            {/* Sol: Styling Angles (Büyük ve yan yana) */}
                                            <div className="flex-none lg:w-1/3 w-full">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {availableBatchShots.filter(s => s.id.includes('styling')).map((shot) => {
                                                        const isSelected = batchShotSelection[shot.id] ?? false;
                                                        const isMaviActive = user?.role === 'admin' && isMaviBatch;

                                                        return (
                                                            <div key={shot.id} className="flex flex-col gap-3">
                                                                <div
                                                                    className={cn(
                                                                        "relative aspect-[3/4] rounded-xl border transition-all duration-300 overflow-hidden group cursor-pointer w-full",
                                                                        isSelected
                                                                            ? (isMaviActive ? "border-zinc-400 ring-2 ring-zinc-400/20 shadow-lg" : "border-white ring-2 ring-white/20 shadow-lg")
                                                                            : "border-[var(--border-subtle)] opacity-40 grayscale bg-[var(--bg-elevated)] hover:opacity-80 transition-opacity"
                                                                    )}
                                                                    onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
                                                                >
                                                                    <div className="w-full h-full relative">
                                                                        {shot.image ? (
                                                                            <img src={shot.image} alt={shot.label} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                                                                <Shirt className="w-8 h-8 opacity-20" />
                                                                            </div>
                                                                        )}

                                                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center justify-end">
                                                                            <p className="text-[10px] font-black text-white text-center leading-snug uppercase">
                                                                                {language === 'tr' ? shot.label : shot.labelEn}
                                                                            </p>
                                                                            {/* Sadece burada Poz Seç yazısını minik gösterdik ama tıklama butonunu alta ayırdık */}
                                                                        </div>

                                                                        <div className="absolute top-2 left-2">
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                                                                                isSelected
                                                                                    ? (isMaviActive ? "bg-zinc-100 border-zinc-100 text-black" : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white")
                                                                                    : "bg-white/20 border-white/40 text-transparent"
                                                                            )}>
                                                                                <Check className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        </div>

                                                                        {isSelected && (
                                                                            <div
                                                                                className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <span className="text-[10px] font-bold text-white tracking-widest leading-none">YNC</span>
                                                                                <Switch
                                                                                    className="scale-[0.6] origin-right !m-0 data-[state=checked]:bg-zinc-100"
                                                                                    checked={stylingSideOnly[shot.id] || false}
                                                                                    onCheckedChange={(val) => setStylingSideOnly({ ...stylingSideOnly, [shot.id]: val })}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Poz Seç - right below */}
                                                                {isSelected && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveGroup('product');
                                                                            setTargetPoseShot(shot.id);
                                                                            setActiveLibraryAsset('pose');
                                                                            const isUpperFocus = shot.id.includes('upper') || shot.id.includes('closeup') || shot.image?.includes('ust_vucut') || shot.image?.includes('closeup');
                                                                            setPoseFocus(isUpperFocus ? 'upper' : 'full');
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border shadow-sm transition-colors cursor-pointer group/pose-btn",
                                                                            assets[`pose_${shot.id}`]
                                                                                ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500 hover:text-white"
                                                                                : "border-white/30 bg-white/5 text-white hover:bg-white hover:text-black"
                                                                        )}
                                                                    >
                                                                        {assets[`pose_${shot.id}`] ? (
                                                                            <>
                                                                                <Check className="w-3.5 h-3.5 group-hover/pose-btn:text-white" />
                                                                                <span className="text-[9px] font-bold uppercase tracking-wider">{language === 'tr' ? 'Özel Poz Seçili' : 'Custom Pose Selected'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse group-hover/pose-btn:bg-white" />
                                                                                <span className="text-[9px] font-bold uppercase tracking-wider">{language === 'tr' ? 'Poz Seç (İsteğe Bağlı)' : 'Select Pose (Optional)'}</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Sağ: Diğer Teknik Kareler (4 sütunlu grid) */}
                                            <div className="flex-1">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {availableBatchShots.filter(s => !s.id.includes('styling')).map((shot) => {
                                                        const isSelected = batchShotSelection[shot.id] ?? false;
                                                        const isMaviActive = user?.role === 'admin' && isMaviBatch;
                                                        const isLowerDetailShot = shot.id === 'std_detail_front' || shot.id === 'std_detail_back';
                                                        const isDisabled = workflowType === 'upper' && isLowerDetailShot;

                                                        return (
                                                            <div key={shot.id} className="flex flex-col gap-2">
                                                                <div
                                                                    className={cn(
                                                                        "relative aspect-[3/4] rounded-xl border transition-all duration-300 overflow-hidden group w-full",
                                                                        isDisabled ? "cursor-not-allowed opacity-20 grayscale" : "cursor-pointer",
                                                                        isSelected
                                                                            ? (isMaviActive ? "border-zinc-400 ring-2 ring-zinc-400/20 shadow-lg" : "border-white ring-2 ring-white/20 shadow-lg")
                                                                            : (!isDisabled && "border-[var(--border-subtle)] opacity-40 grayscale bg-[var(--bg-elevated)] hover:opacity-80 transition-opacity")
                                                                    )}
                                                                    onClick={() => {
                                                                        if (isDisabled) {
                                                                            toast.error(language === 'tr'
                                                                                ? "Bu açı bir üst ürün için seçilemez. Lütfen 'Detaylı Ürün' adımında 'Alt Ürün' veya 'Set' seçtiğinizden emin olun."
                                                                                : "This angle cannot be selected for an upper garment. Please ensure you selected 'Lower' or 'Set' in the 'Product Details' step.");
                                                                            return;
                                                                        }
                                                                        setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }));
                                                                    }}
                                                                >
                                                                    <div className="w-full h-full relative">
                                                                        {shot.image ? (
                                                                            <img src={shot.image} alt={shot.label} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                                                                <Shirt className="w-6 h-6 opacity-20" />
                                                                            </div>
                                                                        )}

                                                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                                                            <p className="text-[9px] font-black text-white text-center leading-snug uppercase">
                                                                                {language === 'tr' ? shot.label : shot.labelEn}
                                                                            </p>
                                                                        </div>

                                                                        <div className="absolute top-2 left-2">
                                                                            <div className={cn(
                                                                                "w-4 h-4 rounded-md flex items-center justify-center border transition-all",
                                                                                isSelected
                                                                                    ? (isMaviActive ? "bg-blue-600 border-blue-400 text-white" : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white")
                                                                                    : "bg-white/20 border-white/40 text-transparent"
                                                                            )}>
                                                                                <Check className="w-3 h-3" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTTOM: Batch Panel + Preview */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
                                        {/* Sol Taraf: Batch Ayarları ve Seçimler */}
                                        <div className="col-span-1 lg:col-span-5 flex flex-col">
                                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col p-8">
                                                <BatchPanel
                                                    productName={productName}
                                                    selectedMoodId={selectedMoodId}
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
                                                    techAccessoryDescriptions={techAccessoryDescriptions}
                                                    setTechAccessoryDescriptions={setTechAccessoryDescriptions}
                                                    assets={assets}
                                                    productDescription={productDescription}
                                                    setProductDescription={setProductDescription}
                                                    setWizardStep={setWizardStep}
                                                    setActiveGroup={setActiveGroup}
                                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                                />
                                            </div>
                                        </div>

                                        {/* Sağ Taraf: Önizleme / Üretim Alanı */}
                                        <div className="col-span-1 lg:col-span-7 flex flex-col">
                                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
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
                                                    isAdmin={user?.role === 'admin'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>



                {/* Preview Dialog */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-2xl rounded-2xl overflow-hidden">
                        {/* Functional Header */}
                        <div className="flex-none px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <FileText className="w-5 h-5 text-zinc-400" />
                                </div>
                                <DialogTitle className="text-xl font-bold text-[var(--text-primary)]">
                                    {language === "tr" ? "Çekim Önizleme" : "Shoot Preview"}
                                </DialogTitle>
                            </div>

                            {user?.role === 'admin' && (
                                <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
                                    <button
                                        onClick={() => {
                                            setPreviewMode('text');
                                            if (previewData && previewData[0]) setUserAddedPrompt(previewData[0].prompt);
                                        }}
                                        className={cn(
                                            "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                            previewMode === 'text' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        PROMPT
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPreviewMode('json');
                                            if (previewData && previewData[0]) setUserAddedPrompt(JSON.stringify(previewData[0].structured, null, 2));
                                        }}
                                        className={cn(
                                            "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                            previewMode === 'json' ? "bg-white text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        JSON
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {previewData && previewData.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-4">
                                    {/* Shot Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                            <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === "tr" ? "ÇEKİM" : "SHOT"}</span>
                                            <span className="text-sm font-bold">{item.title || (language === "tr" ? "Ana Çekim" : "Main Shot")}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                            <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === "tr" ? "MODEL" : "MODEL"}</span>
                                            <span className="text-sm font-bold uppercase">{gender || "DEFAULT"}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                            <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RES"}</span>
                                            <span className="text-sm font-bold">{item.settings?.resolution}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                            <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === "tr" ? "ORAN" : "RATIO"}</span>
                                            <span className="text-sm font-bold">{item.settings?.aspect_ratio}</span>
                                        </div>
                                    </div>

                                    {/* Editor Area */}
                                    <div className="flex flex-col h-full min-h-[400px]">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                                            <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">
                                                {previewMode === 'json' ? "SYSTEM CONTROL" : (language === "tr" ? "ANALİZ SONUCU VE PROMPT" : "ANALYSIS & PROMPT")}
                                            </span>
                                        </div>

                                        {user?.role === 'admin' ? (
                                            <textarea
                                                className={cn(
                                                    "w-full h-full min-h-[400px] p-5 text-[14px] leading-relaxed bg-[var(--bg-elevated)] text-[var(--text-primary)] border-2 border-[var(--border-subtle)] rounded-xl outline-none focus:border-white/20 transition-all custom-scrollbar",
                                                    previewMode === 'json' ? "font-mono text-zinc-400" : "font-sans font-medium"
                                                )}
                                                value={userAddedPrompt}
                                                onChange={(e) => setUserAddedPrompt(e.target.value)}
                                                spellCheck={false}
                                            />
                                        ) : (
                                            <div className="p-10 text-center bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                                                <p className="text-sm font-medium text-[var(--text-muted)]">
                                                    {language === "tr" ? "Çekim parametreleri optimize edildi. Onaylayıp devam edebilirsiniz." : "Shoot parameters optimized. You can confirm and proceed."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Bar */}
                        <div className="flex-none p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowPreview(false)}
                                className="h-12 px-8 rounded-xl font-bold text-xs uppercase"
                            >
                                {language === "tr" ? "DÜZENLE" : "EDIT"}
                            </Button>
                            <Button
                                onClick={handleConfirmGeneration}
                                className="h-12 px-10 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-xs uppercase shadow-xl transition-all flex items-center gap-2"
                            >
                                {language === "tr" ? "ONAYLA VE BAŞLAT" : "CONFIRM & START"}
                                <Sparkles className="w-4 h-4" />
                            </Button>
                        </div>
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

                {/* Library Backdrop (Click outside to close) */}
                {activeLibraryAsset && (
                    <div
                        className="fixed inset-0 bg-black/5 z-[55] animate-in fade-in duration-300"
                        onClick={() => {
                            setActiveLibraryAsset(null);
                            setActiveGroup(null);
                        }}
                    />
                )}
            </div>

            <LibrarySidebar
                language={language}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                activeGroup={activeGroup}
                setActiveGroup={setActiveGroup}
                internalAsset={internalAsset}
                libraryTab={libraryTab}
                setLibraryTab={v => setLibraryTab(v as any)}
                hasWaist={canShowWaistRiseFitTuck}
                poseFocus={poseFocus}
                setPoseFocus={setPoseFocus}
                setUpperFraming={setUpperFraming}
                savedPoses={savedPoses}
                handleSavedPoseClick={(pose) => {
                    if (targetPoseShot) {
                        setAssets((prev: any) => ({
                            ...prev,
                            [`pose_${targetPoseShot}`]: pose.url,
                            [`pose_${targetPoseShot}_stickman`]: pose.stickmanUrl,
                            [`pose_${targetPoseShot}_prompt`]: pose.customPrompt || null,
                        }));
                        setTargetPoseShot(null);
                        setActiveLibraryAsset(null);
                    } else {
                        handleSavedPoseClick(pose);
                        setActiveLibraryAsset(null);
                    }
                }}
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
                addToGlobalLibrary={addToGlobalLibrary}
                selectedPoseUrl={targetPoseShot ? (assets[`pose_${targetPoseShot}`] || null) : (assets.pose || null)}
            />
        </div >
    );
}
