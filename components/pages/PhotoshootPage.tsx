"use client"
import { useLanguage } from "@/context/language-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
    ChevronRight, ChevronLeft, ChevronDown, Sparkles, User,
    Image as ImageIcon, Camera, X, FileText, Edit2, Glasses, Check, Shirt
} from "lucide-react"
import { TbSettings2, TbShirtFilled, TbJacket, TbShirt, TbHanger } from "react-icons/tb"
import { PiHandbag, PiBaseballCap, PiDiamond, PiBelt } from "react-icons/pi"

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
import { ClothingDetails } from "@/components/photoshoot/ClothingDetails"

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
        enableWind, setEnableWind, enableExpression, setEnableExpression,
        enableGaze, setEnableGaze, hairBehindShoulders, setHairBehindShoulders,
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
        handleAssetRemove, canMoveToStep, handleLibrarySelect, convertToStickman, models, setLightingPositive, setLightingNegative,
        productDescription, setProductDescription, resetWorkflow, addToGlobalLibrary
    } = usePhotoshootWorkflow();

    if (!mounted) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden relative">
            {/* LEFT COLUMN: Wizard Content */}
            <div className={cn(
                "flex-1 overflow-y-auto bg-[var(--bg-sidebar)] custom-scrollbar flex flex-col transition-all duration-500",
                activeLibraryAsset ? "lg:pr-[480px]" : "pr-0"
            )}>
                <div className={cn(
                    "p-4 md:p-6 mx-auto space-y-4 transition-all duration-500 flex-1 w-full",
                    wizardStep === 1 ? "max-w-[1200px]" : (wizardStep === 3 ? "max-w-6xl" : "max-w-4xl")
                )}>

                    {/* Header: Progress */}
                    <div>
                        <WizardProgress currentStep={wizardStep} onStepClick={(s) => canMoveToStep(s) && setWizardStep(s as any)} language={language} />
                    </div>

                    {/* Page Title & Reset Button */}
                    <div className="text-center -mt-2 mb-2 relative flex flex-col items-center justify-center">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 gap-1.5 font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 border-rose-200"
                                onClick={resetWorkflow}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                {language === "tr" ? "YENİ ÜRÜN" : "NEW PRODUCT"}
                            </Button>
                        </div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">📸 {t("home.photoshootTitle")}</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-0.5">{t("home.photoshootDesc")}</p>
                    </div>

                    {/* WIZARD STEP 1: PRODUCT */}
                    {wizardStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                                {/* Left: Product Selection */}
                                <div className="lg:col-span-3 flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-sm">
                                            <TbSettings2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs uppercase font-black text-[var(--text-primary)] tracking-[0.2em]">{language === "tr" ? "ÜRÜN SEÇİMİ" : "PRODUCT SELECTION"}</label>
                                            <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-60">{language === "tr" ? "ÇEKİLECEK ÜRÜNÜ BELİRLE" : "DEFINE PRODUCT TO SHOOT"}</span>
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
                                        </ProductSection>
                                    </div>
                                </div>

                                {/* Right: Tutorial Area */}
                                <div className="lg:col-span-8 hidden lg:block sticky top-6">
                                    <PhotoshootTutorial language={language} />
                                </div>
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]/50">
                                <div />
                                <Button
                                    onClick={() => canMoveToStep(2) && setWizardStep(2)}
                                    className="px-10 py-6 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase tracking-widest shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                                {/* Left Column: Studio Assets (The 3x2 Grid) */}
                                <div className="lg:col-span-7 flex flex-col space-y-6">
                                    <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">
                                        {language === "tr" ? "ÇEKİM AYARLARI" : "SHOOT SETTINGS"}
                                    </h4>

                                    <div className="grid grid-cols-3 gap-4 flex-1">
                                        <AssetCard id="background" label={language === "tr" ? "ARKAPLAN" : "BACKGROUND"} icon={ImageIcon} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                        <AssetCard id="lighting" label={language === "tr" ? "IŞIK" : "LIGHT"} icon={Camera} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} lightingSendImage={lightingSendImage} setLightingSendImage={setLightingSendImage} variant="portrait" />
                                        <AssetCard id="pose" label={language === "tr" ? "POZ" : "POSE"} icon={User} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} convertToStickman={convertToStickman} variant="portrait" />
                                        <AssetCard id="fit_pattern" label={language === "tr" ? "KALIP" : "FIT"} icon={TbShirtFilled} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                        <AssetCard id="shoes" label={language === "tr" ? "AYAKKABI" : "SHOES"} icon={TbHanger} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
                                        <AssetCard id="inner_wear" label={language === "tr" ? "İÇ GİYİM" : "INNER WEAR"} icon={TbShirt} assets={assets} activeLibraryAsset={activeLibraryAsset} setActiveLibraryAsset={setActiveLibraryAsset} handleAssetUpload={handleAssetUpload} handleAssetRemove={handleAssetRemove} language={language} variant="portrait" />
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
                                            enableExpression={enableExpression}
                                            setEnableExpression={setEnableExpression}
                                            enableGaze={enableGaze}
                                            setEnableGaze={setEnableGaze}
                                            socksType={socksType}
                                            setSocksType={setSocksType}
                                        />

                                        <ClothingDetails
                                            language={language}
                                            canShowLegHem={canShowLegHem}
                                            pantLength={pantLength}
                                            setPantLength={setPantLength}
                                            hasFeet={isFullBody}
                                            socksType={socksType}
                                            setSocksType={setSocksType}
                                            showGarmentDetails={showGarmentDetails}
                                            setShowGarmentDetails={setShowGarmentDetails}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Accessories */}
                            <div className="space-y-4 pt-6 border-t border-[var(--border-subtle)]/50">
                                <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">{language === "tr" ? "DİĞER AKSESUARLAR" : "OTHER ACCESSORIES"}</h4>
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
                                    onClick={() => setWizardStep(1)}
                                    className="px-8 py-6 rounded-2xl border-2 border-[var(--border-subtle)] font-bold uppercase tracking-wider hover:bg-[var(--bg-elevated)] transition-all"
                                >
                                    <ChevronLeft className="mr-2 w-5 h-5" /> {language === "tr" ? "GERİ" : "BACK"}
                                </Button>
                                <Button
                                    onClick={() => canMoveToStep(3) && setWizardStep(3)}
                                    className="px-10 py-6 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold uppercase tracking-wider shadow-lg shadow-[var(--accent-primary)]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {language === "tr" ? "İLERLE" : "NEXT"} <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* WIZARD STEP 3: PRODUCTION */}
                    {wizardStep === 3 && (

                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">


                            <Tabs defaultValue="single" onValueChange={(val) => setBatchMode(val === 'batch')} className="w-full">
                                <div className="flex justify-center mb-6">
                                    <TabsList className={cn("grid w-full max-w-[400px]", (user?.role === 'admin' || user?.authorizedPages?.includes('photoshoot:batch')) ? "grid-cols-2" : "grid-cols-1")}>
                                        <TabsTrigger value="single">{language === "tr" ? "Tekli Üretim" : "Single Production"}</TabsTrigger>
                                        {(user?.role === 'admin' || user?.authorizedPages?.includes('photoshoot:batch')) && (
                                            <TabsTrigger value="batch">{language === "tr" ? "Toplu Üretim (Batch)" : "Batch Production"}</TabsTrigger>
                                        )}
                                    </TabsList>
                                </div>

                                <TabsContent value="single">
                                    <div className="max-w-5xl mx-auto px-1 md:px-0 space-y-6">

                                        {/* TOP: Horizontal Technical Settings Bar */}
                                        <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-3">{language === "tr" ? "TEKNİK AYARLAR" : "TECHNICAL SETTINGS"}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Aspect Ratio */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "GÖRSEL ORANI" : "ASPECT RATIO"}</label>
                                                    <div className="relative">
                                                        <select className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold appearance-none" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                                                            {ASPECT_RATIOS.map(opt => (
                                                                <option key={opt.id} value={opt.id}>{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    </div>
                                                </div>
                                                {/* Resolution */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}</label>
                                                    <div className="relative">
                                                        <select className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold appearance-none" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                                            {RESOLUTION_OPTIONS.map(opt => (
                                                                <option key={opt.id} value={opt.id}>{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    </div>
                                                </div>
                                                {/* Seed */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "TEKRAR TUTARLILIĞI" : "CONSISTENCY"}</label>
                                                    <div className="relative">
                                                        <input type="number" className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold placeholder:text-[var(--text-disabled)]" value={seed === "" ? "" : seed} onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="RANDOM" />
                                                        {seed !== "" && <button onClick={() => setSeed("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><X size={14} /></button>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BOTTOM: Summary + Preview */}
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
                                                                        {assets.model ? (language === "tr" ? "Stüdyo Seçili" : "Studio Selected") : (language === "tr" ? "Stüdyo Yok" : "No Studio")}
                                                                    </p>
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
                                        <div className="max-w-5xl mx-auto px-1 md:px-0 space-y-6">

                                            {/* TOP: Horizontal Technical Settings Bar */}
                                            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-3">{language === "tr" ? "TEKNİK AYARLAR" : "TECHNICAL SETTINGS"}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "GÖRSEL ORANI" : "ASPECT RATIO"}</label>
                                                        <div className="relative">
                                                            <select className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold appearance-none" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                                                                {ASPECT_RATIOS.map(opt => (
                                                                    <option key={opt.id} value={opt.id}>{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "ÇÖZÜNÜRLÜK" : "RESOLUTION"}</label>
                                                        <div className="relative">
                                                            <select className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold appearance-none" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                                                                {RESOLUTION_OPTIONS.map(opt => (
                                                                    <option key={opt.id} value={opt.id}>{language === 'tr' ? opt.labelTr : opt.label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wide px-1">{language === "tr" ? "TEKRAR TUTARLILIĞI" : "CONSISTENCY"}</label>
                                                        <div className="relative">
                                                            <input type="number" className="w-full text-xs px-3 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all font-bold placeholder:text-[var(--text-disabled)]" value={seed === "" ? "" : seed} onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="RANDOM" />
                                                            {seed !== "" && <button onClick={() => setSeed("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><X size={14} /></button>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Toplu Üretim: Açı ve Kare Seçimleri (9 boxes side by side, 50% larger representation) */}
                                            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-sm flex flex-col space-y-4">
                                                <label className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
                                                    {language === 'tr' ? 'Açı ve Kare Seçimleri' : 'Angle & Shot Selection'}
                                                </label>
                                                <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-9 gap-4">
                                                    {availableBatchShots.map((shot) => {
                                                        const isSelected = batchShotSelection[shot.id] ?? false;
                                                        const isMaviActive = user?.role === 'admin' && isMaviBatch;
                                                        const hasSideOption = shot.id.includes('styling');

                                                        return (
                                                            <div
                                                                key={shot.id}
                                                                className={cn(
                                                                    "relative aspect-[3/4] rounded-xl border transition-all duration-300 overflow-hidden group cursor-pointer",
                                                                    isSelected
                                                                        ? (isMaviActive ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg" : "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-lg")
                                                                        : "border-[var(--border-subtle)] opacity-40 grayscale bg-[var(--bg-elevated)] hover:opacity-80 transition-opacity"
                                                                )}
                                                                onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
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
                                                                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                                                                            isSelected
                                                                                ? (isMaviActive ? "bg-blue-600 border-blue-400 text-white" : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white")
                                                                                : "bg-white/20 border-white/40 text-transparent"
                                                                        )}>
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    </div>

                                                                    {hasSideOption && isSelected && (
                                                                        <div
                                                                            className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <span className="text-[8px] font-bold text-white tracking-widest leading-none">YNC</span>
                                                                            <Switch
                                                                                className="scale-[0.5] origin-right !m-0"
                                                                                checked={stylingSideOnly[shot.id] || false}
                                                                                onCheckedChange={(val) => setStylingSideOnly({ ...stylingSideOnly, [shot.id]: val })}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* BOTTOM: Batch Panel + Preview */}
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                                {/* Sol Taraf: Batch Ayarları ve Seçimler */}
                                                <div className="col-span-1 lg:col-span-5 flex flex-col">
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
                                                            techAccessoryDescriptions={techAccessoryDescriptions}
                                                            setTechAccessoryDescriptions={setTechAccessoryDescriptions}
                                                            assets={assets}
                                                            productDescription={productDescription}
                                                            setProductDescription={setProductDescription}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Sağ Taraf: Önizleme / Üretim Alanı */}
                                                <div className="col-span-1 lg:col-span-7 flex flex-col">
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
                addToGlobalLibrary={addToGlobalLibrary}
            />
        </div >
    );
}
