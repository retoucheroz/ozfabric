"use client";
import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/context/language-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  User,
  Image as ImageIcon,
  Camera,
  X,
  FileText,
  Edit2,
  Glasses,
  Check,
  Shirt,
  ScanLine,
  Loader2,
} from "lucide-react";
import {
  TbSettings2,
  TbShirtFilled,
  TbJacket,
  TbShirt,
  TbHanger,
  TbCoins,
  TbBolt,
  TbCrown,
  TbChevronRight,
} from "react-icons/tb";
import {
  PiHandbag,
  PiBaseballCap,
  PiDiamond,
  PiBelt,
  PiPantsLight,
  PiPants,
  PiPantsFill,
  PiSock,
  PiSneakerLight,
} from "react-icons/pi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toast } from "sonner";

// Modular Components
import { ProductSection } from "@/components/photoshoot/ProductSection";
import { BatchPanel } from "@/components/photoshoot/BatchPanel";
import { ModelSection } from "@/components/photoshoot/ModelSection";
import { AssetCard } from "@/components/photoshoot/AssetCard";
import { PreviewArea } from "@/components/photoshoot/PreviewArea";
import { StudioSteps } from "@/components/photoshoot/StudioSteps";
import { LibrarySidebar } from "@/components/photoshoot/LibrarySidebar";
import { WizardProgress } from "@/components/photoshoot/WizardProgress";
import { PhotoshootTutorial } from "@/components/photoshoot/PhotoshootTutorial";
import { EditorialModelLibraryInline } from "@/components/photoshoot/EditorialModelLibraryInline";
import { BehaviorToggles } from "@/components/photoshoot/BehaviorToggles";

// Dialogs
import { SavePoseDialog } from "@/components/photoshoot/dialogs/SavePoseDialog";
import { SaveAssetDialog } from "@/components/photoshoot/dialogs/SaveAssetDialog";
import { SaveModelDialog } from "@/components/photoshoot/dialogs/SaveModelDialog";
import { SaveLightingDialog } from "@/components/photoshoot/dialogs/SaveLightingDialog";
import { BatchPreviewDialog } from "@/components/photoshoot/dialogs/BatchPreviewDialog";
import { EditItemDialog } from "@/components/photoshoot/dialogs/EditItemDialog";

// Shared Types & Constants
import { ASPECT_RATIOS, RESOLUTION_OPTIONS } from "@/lib/photoshoot-constants";
import { usePhotoshootWorkflow } from "@/hooks/photoshoot/usePhotoshootWorkflow";

export default function PhotoshootPage() {
  const { t } = useLanguage();
  const {
    language,
    router,
    mounted,
    generationMode,
    setGenerationMode,
    wizardStep,
    setWizardStep,
    user,
    productName,
    setProductName,
    workflowType,
    setWorkflowType,
    resolution,
    setResolution,
    aspectRatio,
    setAspectRatio,
    gender,
    setGender,
    seed,
    setSeed,
    buttonsOpen,
    setButtonsOpen,
    userAddedPrompt,
    setUserAddedPrompt,
    tucked,
    setTucked,
    sleevesRolled,
    setSleevesRolled,
    lookAtCamera,
    setLookAtCamera,
    enableWind,
    setEnableWind,
    selectedMoodId,
    setSelectedMoodId,
    hairBehindShoulders,
    setHairBehindShoulders,
    socksType,
    setSocksType,
    lightingSendImage,
    setLightingSendImage,
    collarType,
    setCollarType,
    shoulderType,
    setShoulderType,
    waistType,
    setWaistType,
    riseType,
    setRiseType,
    legType,
    setLegType,
    hemType,
    setHemType,
    pantLength,
    setPantLength,
    showGarmentDetails,
    setShowGarmentDetails,
    assets,
    setAssets,
    assetsHighRes,
    setAssetsHighRes,
    savedPoses,
    savedModels,
    savedBackgrounds,
    savedFits,
    savedShoes,
    savedJackets,
    savedBags,
    savedGlasses,
    savedHats,
    savedJewelry,
    savedBelts,
    savedInnerWears,
    savedLightings,
    deleteSavedPose,
    deleteSavedModel,
    deleteSavedAsset,
    handleSavedModelClick,
    handleSavedPoseClick,
    handleSavedFitClick,
    handleSavedShoeClick,
    handleSavedJacketClick,
    handleSavedBagClick,
    handleSavedGlassesClick,
    handleSavedHatClick,
    handleSavedJewelryClick,
    handleSavedBeltClick,
    handleSavedInnerWearClick,
    handleSavedLightingClick,
    showSavePoseDialog,
    setShowSavePoseDialog,
    showSaveModelDialog,
    setShowSaveModelDialog,
    showSaveAssetDialog,
    setShowSaveAssetDialog,
    showSaveLightingDialog,
    setShowSaveLightingDialog,
    tempPoseData,
    setTempPoseData,
    tempModelData,
    setTempModelData,
    tempAssetData,
    setTempAssetData,
    tempLightingData,
    setTempLightingData,
    editingThumbItem,
    setEditingThumbItem,
    editingItemPrompt,
    setEditingItemPrompt,
    editingItemNegativePrompt,
    setEditingItemNegativePrompt,
    editingItemSendImage,
    setEditingItemSendImage,
    editingItemTags,
    setEditingItemTags,
    handleSavePose,
    handleSaveModel,
    handleSaveAsset,
    handleSaveLighting,
    handleEditItemClick,
    handleUpdateThumbnail,
    handleAssetUpload,
    poseFocus,
    setPoseFocus,
    isFullBody,
    isCowboy,
    isCloseup,
    hasHead,
    canShowWaistRiseFitTuck,
    canShowCollarHairButtons,
    canShowLegHem,
    microFeedback,
    productCode,
    setProductCode,
    batchMode,
    setBatchMode,
    isMaviBatch,
    setIsMaviBatch,
    stylingSideOnly,
    setStylingSideOnly,
    upperFraming,
    setUpperFraming,
    batchShotSelection,
    setBatchShotSelection,
    techAccessories,
    setTechAccessories,
    techAccessoryDescriptions,
    setTechAccessoryDescriptions,
    availableBatchShots,
    activeLibraryAsset,
    setActiveLibraryAsset,
    activeGroup,
    setActiveGroup,
    internalAsset,
    libraryTab,
    setLibraryTab,
    sessionLibrary,
    isProcessing,
    resultImages,
    isGenerationSuccess,
    showPreview,
    setShowPreview,
    previewData,
    pendingOptions,
    previewMode,
    setPreviewMode,
    handleGenerate,
    handleBatchGenerate,
    handleConfirmGeneration,
    handleConfirmBatchGeneration,
    batchPreviewPrompts,
    editedBatchPrompts,
    setEditedBatchPrompts,
    showBatchPreview,
    setShowBatchPreview,
    selectedBatchImages,
    setSelectedBatchImages,
    isStoppingBatch,
    handleStopBatch,
    estimatedCost,
    handleAssetRemove,
    canMoveToStep,
    handleLibrarySelect,
    models,
    setLightingPositive,
    setLightingNegative,
    productDescription,
    setProductDescription,
    modelDescription,
    setModelDescription,
    addToGlobalLibrary,
  } = usePhotoshootWorkflow();

  const [targetPoseShot, setTargetPoseShot] = useState<string | null>(null);
  const [showProductManager, setShowProductManager] = useState(false);
  const [isDraggingSocks, setIsDraggingSocks] = useState(false);
  // Once generation starts, LOCK the layout so cards never shift
  const [generationHasStarted, setGenerationHasStarted] = useState(false);

  // Block navigation when generation is in progress
  useEffect(() => {
    if (isProcessing && !generationHasStarted) setGenerationHasStarted(true);
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg =
        language === "tr"
          ? "Üretim devam ediyor. Çıkmak istediğinize emin misiniz?"
          : "Generation is in progress. Are you sure you want to leave?";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href && !anchor.hasAttribute("target")) {
        // If it's a link to the current page (e.g. hash link), ignore
        if (
          anchor.href === window.location.href ||
          anchor.href.startsWith(window.location.href + "#")
        ) {
          return;
        }
        const msg =
          language === "tr"
            ? "Üretim devam ediyor. Sayfadan ayrılırsanız üretim iptal olabilir. Çıkmak istediğinize emin misiniz?"
            : "Generation is in progress. Leaving will cancel the generation. Are you sure you want to leave?";
        if (!window.confirm(msg)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    // Use capture phase to intercept click before NextJS router
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [isProcessing, language]);

  if (!mounted) return null;

  if (!generationMode) {
    const options = [
      {
        id: "quick",
        title: "QUICK",
        subtitle: language === "tr" ? "Hızlı Üretim" : "Quick Generation",
        description: language === "tr" ? "Saniyeler içinde basit ve etkileyici sonuçlar." : "Simple and impressive results in seconds.",
        icon: TbBolt,
        color: "text-[#FF5A5F]",
        bg: "bg-[#FF5A5F]/10",
        border: "hover:border-[#FF5A5F]/50",
      },
      {
        id: "pro",
        title: "PRO",
        subtitle: language === "tr" ? "Profesyonel Stüdyo" : "Professional Studio",
        description: language === "tr" ? "Tam kontrol ve en yüksek kalitede çekim deneyimi." : "Full control and highest quality photoshoot experience.",
        icon: TbCrown,
        color: "text-[#FF5A5F]",
        bg: "bg-[#FF5A5F]/10",
        border: "hover:border-[#FF5A5F]/50",
      }
    ];

    return (
      <div className="flex flex-col h-full bg-[#0D0D0F] items-center justify-start pt-24 md:pt-32 p-4 md:p-8 overflow-y-auto custom-scrollbar w-full">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
              STUDIO
            </h1>
            <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.2em] grayscale opacity-70">
              {language === "tr" ? "ÜRETİM MODU SEÇİN" : "SELECT GENERATION MODE"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
            {options.map((option) => (
              <Card
                key={option.id}
                onClick={() => setGenerationMode(option.id as any)}
                className={cn(
                  "group relative overflow-hidden bg-[#121214] border-white/5 p-8 cursor-pointer transition-all duration-500",
                  "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50",
                  option.border
                )}
              >
                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[#FF5A5F]" />

                <div className="relative flex flex-col h-full space-y-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                    option.bg
                  )}>
                    <option.icon className={cn("w-8 h-8", option.color)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                        {option.title}
                      </h2>
                      <TbChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {option.subtitle}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                    {option.description}
                  </p>

                  <div className="pt-4 mt-auto">
                    <div className={cn(
                      "h-1 w-0 group-hover:w-full transition-all duration-700 rounded-full",
                      "bg-[#FF5A5F]"
                    )} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (generationMode === 'quick') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0D0D0F] text-white p-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">QUICK MODE</h1>
        <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-zinc-500 mt-6 max-w-md leading-relaxed">
          {language === "tr" ? "Saniyeler içinde üretim yapabileceğiniz hızlı mod çok yakında sizlerle olacak." : "The fast mode, where you can generate in seconds, will be with you very soon."}
        </p>
        <Button
          variant="outline"
          onClick={() => setGenerationMode(null)}
          className="mt-12 h-12 px-8 rounded-md font-black text-[10px] uppercase tracking-widest border border-white/10 bg-white/5 text-white hover:bg-white hover:text-black transition-all"
        >
          {language === 'tr' ? 'GERİ DÖN' : 'GO BACK'}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex h-full overflow-hidden relative">
      {/* LEFT COLUMN: Wizard Content */}
      <div
        className={cn(
          "flex-1 overflow-y-auto bg-[var(--bg-sidebar)] custom-scrollbar flex flex-col transition-all duration-500",
          activeLibraryAsset &&
            !(activeLibraryAsset === "model" && wizardStep === 1)
            ? "lg:pr-[480px]"
            : "pr-0",
        )}
      >
        <div
          className={cn(
            "px-4 py-4 md:px-8 md:py-4 mx-auto space-y-4 transition-all duration-500 flex-1 w-full",
            wizardStep === 1
              ? "max-w-[1240px]"
              : wizardStep === 3
                ? "max-w-[1400px]"
                : "max-w-5xl",
          )}
        >
          {/* Header: Progress */}
          <div>
            <WizardProgress
              currentStep={wizardStep}
              onStepClick={(s) => canMoveToStep(s) && setWizardStep(s as any)}
              language={language}
            />
          </div>

          {/* WIZARD STEP 1: PRODUCT */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                <div className="lg:col-span-3">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-md bg-zinc-800 text-white border border-white/10 shadow-lg">
                        <TbSettings2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs uppercase font-black text-white tracking-[0.2em]">
                          {language === "tr"
                            ? "ÜRÜN SEÇİMİ"
                            : "PRODUCT SELECTION"}
                        </label>
                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter opacity-100 mt-0.5">
                          {language === "tr"
                            ? "ÇEKİLECEK ÜRÜNÜ BELİRLE"
                            : "DEFINE PRODUCT TO SHOOT"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <ProductSection
                        language={language}
                        workflowType={workflowType}
                        setWorkflowType={setWorkflowType}
                        productName={productName}
                        setProductName={setProductName}
                        setIsManualProductName={() => { }}
                        setActiveLibraryAsset={setActiveLibraryAsset}
                        setActiveGroup={setActiveGroup}
                        setLibraryTab={(v) => setLibraryTab(v as any)}
                      >
                        <div className="space-y-3 h-full flex flex-col">
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
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
                          </div>

                          <div className="grid grid-cols-1 gap-6 pt-1">
                            <div className="space-y-2">
                              <label className="text-[11px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] px-1">
                                {language === "tr" ? "ÜRÜN SEÇİMİ" : "PRODUCT SELECTION"}
                              </label>

                              {/* Manage Products Button */}
                              <div
                                onClick={() => {
                                  setShowProductManager(!showProductManager);
                                  if (activeLibraryAsset)
                                    setActiveLibraryAsset(null);
                                }}
                                className={cn(
                                  "group relative h-[100px] rounded-md border-2 border-dashed transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.01] overflow-hidden cursor-pointer flex items-center justify-center px-4 gap-4",
                                  showProductManager
                                    ? "bg-white/10 border-white/40 ring-2 ring-white/20"
                                    : "bg-[#18181b] border-white/5 hover:bg-zinc-800/60 hover:border-white/20",
                                )}
                              >
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="p-2.5 rounded-md bg-zinc-800 text-white border border-white/5 shadow-md group-hover:scale-110 transition-transform">
                                    <TbShirt className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-white uppercase tracking-widest leading-none">
                                    {language === "tr"
                                      ? "Ürün Yönetimi"
                                      : "Products"}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1.5 opacity-60">
                                    {language === "tr"
                                      ? showProductManager
                                        ? "Gizle"
                                        : "Yönet ve Düzenle"
                                      : showProductManager
                                        ? "Hide"
                                        : "Manage & Edit"}
                                  </span>
                                </div>
                                <ChevronRight
                                  className={cn(
                                    "w-4 h-4 transition-transform ml-auto",
                                    showProductManager
                                      ? "rotate-90 text-white"
                                      : "text-zinc-600 group-hover:translate-x-1",
                                  )}
                                />
                              </div>
                            </div>

                            <Button
                              onClick={() =>
                                canMoveToStep(2) && setWizardStep(2)
                              }
                              className="w-full h-12 rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] group flex justify-center items-center gap-2"
                            >
                              {language === "tr" ? "İLERLE" : "NEXT"}{" "}
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </ProductSection>
                    </div>
                  </div>
                </div>

                {/* Right: Tutorial Area / Product Manager / Model Library */}
                <div className="lg:col-span-8 hidden lg:block relative min-h-0">
                  <div className="absolute inset-0 grid grid-cols-1 grid-rows-1 overflow-hidden h-full bg-white/40 dark:bg-[#18181b] backdrop-blur-md rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl">
                    <AnimatePresence>
                      {activeLibraryAsset === "model" ? (
                        <motion.div
                          key="studio-model-library"
                          initial={{ opacity: 0, y: 48, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -48, scale: 0.97 }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{ gridArea: "1 / 1 / 2 / 2" }}
                        >
                          <EditorialModelLibraryInline
                            language={language}
                            gender={gender}
                            setGender={setGender}
                            modelImage={assets.model as string | null}
                            modelImageHighRes={
                              assetsHighRes.model as string | null
                            }
                            setModelImage={(val) =>
                              setAssets((prev) => ({ ...prev, model: val }))
                            }
                            setModelImageHighRes={(val) =>
                              setAssetsHighRes((prev) => ({
                                ...prev,
                                model: val,
                              }))
                            }
                            handleAssetUpload={handleAssetUpload}
                            handleAssetRemove={handleAssetRemove}
                            savedModels={savedModels}
                            modelDescription={modelDescription ?? ""}
                            setModelDescription={setModelDescription}
                            onClose={() => setActiveLibraryAsset(null)}
                            gridCols={6}
                          />
                        </motion.div>
                      ) : showProductManager ? (
                        <motion.div
                          key="studio-product-manager"
                          initial={{ opacity: 0, y: 48, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -48, scale: 0.97 }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{ gridArea: "1 / 1 / 2 / 2" }}
                        >
                          <div className="p-6 pb-2 h-full overflow-y-auto scrollbar-none relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-6 right-6 h-10 w-10 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-all z-30"
                              onClick={() => setShowProductManager(false)}
                            >
                              <X className="w-5 h-5" />
                            </Button>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-2">
                              {/* Primary Products Column */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                  <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center border border-white/5 text-white shadow-sm">
                                    <TbShirt className="w-4 h-4" />
                                  </div>
                                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                    {language === "tr"
                                      ? "TEMEL ÜRÜNLER"
                                      : "PRIMARY PRODUCTS"}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <AssetCard
                                    id="top_front"
                                    label={
                                      language === "tr" ? "Üst Ön" : "Top Front"
                                    }
                                    icon={TbShirtFilled}
                                    variant="square"
                                    hideLibrary={true}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    language={language}
                                  />
                                  <AssetCard
                                    id="top_back"
                                    label={
                                      language === "tr" ? "Üst Arka" : "Top Back"
                                    }
                                    icon={TbShirt}
                                    variant="square"
                                    hideLibrary={true}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    language={language}
                                  />
                                  <AssetCard
                                    id="bottom_front"
                                    label={
                                      language === "tr"
                                        ? "Alt Ön"
                                        : "Bottom Front"
                                    }
                                    icon={PiPantsFill}
                                    variant="square"
                                    hideLibrary={true}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    language={language}
                                  />
                                  <AssetCard
                                    id="bottom_back"
                                    label={
                                      language === "tr"
                                        ? "Alt Arka"
                                        : "Bottom Back"
                                    }
                                    icon={PiPants}
                                    variant="square"
                                    hideLibrary={true}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    language={language}
                                  />
                                  <div className="col-span-2 mt-2">
                                    <AssetCard
                                      id="inner_wear"
                                      label={
                                        language === "tr"
                                          ? "İÇ GİYİM MODELİ"
                                          : "INNERWEAR MODEL"
                                      }
                                      icon={TbShirt}
                                      variant="square"
                                      assets={assets}
                                      activeLibraryAsset={activeLibraryAsset}
                                      setActiveLibraryAsset={
                                        setActiveLibraryAsset
                                      }
                                      handleAssetUpload={handleAssetUpload}
                                      handleAssetRemove={handleAssetRemove}
                                      language={language}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Views Column */}
                              <div className="space-y-4">
                                {/* Upper details */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3 pb-2 border-b border-blue-500/20">
                                    <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                                      <ScanLine className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                                      {language === "tr"
                                        ? "ÜST DETAYLAR"
                                        : "UPPER DETAILS"}
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3 text-center">
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">
                                        {language === "tr"
                                          ? "Ön Detay"
                                          : "Front Detail"}
                                      </span>
                                      <AssetCard
                                        id="detail_front_1"
                                        label={
                                          language === "tr" ? "Detay" : "Detail"
                                        }
                                        icon={ScanLine}
                                        variant="square"
                                        hideLibrary={true}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={
                                          setActiveLibraryAsset
                                        }
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                        language={language}
                                      />
                                    </div>
                                    <div className="space-y-3 text-center">
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">
                                        {language === "tr"
                                          ? "Arka Detay"
                                          : "Back Detail"}
                                      </span>
                                      <AssetCard
                                        id="detail_front_2"
                                        label={
                                          language === "tr" ? "Detay" : "Detail"
                                        }
                                        icon={ScanLine}
                                        variant="square"
                                        hideLibrary={true}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={
                                          setActiveLibraryAsset
                                        }
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                        language={language}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Lower details */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3 pb-2 border-b border-amber-500/20">
                                    <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                                      <ScanLine className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                                      {language === "tr"
                                        ? "ALT DETAYLAR"
                                        : "LOWER DETAILS"}
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3 text-center">
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">
                                        {language === "tr"
                                          ? "Ön Detay"
                                          : "Front Detail"}
                                      </span>
                                      <AssetCard
                                        id="detail_front_3"
                                        label={
                                          language === "tr" ? "Detay" : "Detail"
                                        }
                                        icon={ScanLine}
                                        variant="square"
                                        hideLibrary={true}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={
                                          setActiveLibraryAsset
                                        }
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                        language={language}
                                      />
                                    </div>
                                    <div className="space-y-3 text-center">
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-1">
                                        {language === "tr"
                                          ? "Arka Detay"
                                          : "Back Detail"}
                                      </span>
                                      <AssetCard
                                        id="detail_back_3"
                                        label={
                                          language === "tr" ? "Detay" : "Detail"
                                        }
                                        icon={ScanLine}
                                        variant="square"
                                        hideLibrary={true}
                                        assets={assets}
                                        activeLibraryAsset={activeLibraryAsset}
                                        setActiveLibraryAsset={
                                          setActiveLibraryAsset
                                        }
                                        handleAssetUpload={handleAssetUpload}
                                        handleAssetRemove={handleAssetRemove}
                                        language={language}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="studio-tutorial"
                          initial={{ opacity: 0, y: -48, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 48, scale: 0.97 }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{ gridArea: "1 / 1 / 2 / 2" }}
                        >
                          <PhotoshootTutorial language={language} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
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

                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <AssetCard
                      id="background"
                      label={language === "tr" ? "ARKAPLAN" : "BACKGROUND"}
                      icon={ImageIcon}
                      assets={assets}
                      activeLibraryAsset={activeLibraryAsset}
                      setActiveLibraryAsset={setActiveLibraryAsset}
                      handleAssetUpload={handleAssetUpload}
                      handleAssetRemove={handleAssetRemove}
                      language={language}
                      variant="portrait"
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
                      variant="portrait"
                    />
                    <AssetCard
                      id="fit_pattern"
                      label={language === "tr" ? "KALIP" : "FIT"}
                      icon={TbShirtFilled}
                      assets={assets}
                      activeLibraryAsset={activeLibraryAsset}
                      setActiveLibraryAsset={setActiveLibraryAsset}
                      handleAssetUpload={handleAssetUpload}
                      handleAssetRemove={handleAssetRemove}
                      language={language}
                      variant="portrait"
                    />
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
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] px-1 opacity-70">
                  {language === "tr"
                    ? "DİĞER AKSESUARLAR"
                    : "OTHER ACCESSORIES"}
                </h4>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                  <AssetCard
                    id="jacket"
                    label={language === "tr" ? "DIŞ GİYİM" : "OUTERWEAR"}
                    icon={TbJacket}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <AssetCard
                    id="bag"
                    label={language === "tr" ? "ÇANTA" : "BAG"}
                    icon={PiHandbag}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <AssetCard
                    id="shoes"
                    label={language === "tr" ? "AYAKKABI" : "SHOES"}
                    icon={PiSneakerLight}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex flex-col items-center justify-between p-3 h-auto aspect-square rounded-md border-2 transition-all group select-none shadow-sm relative overflow-hidden",
                            pantLength === "covering" || pantLength === "flare"
                              ? "opacity-30 cursor-not-allowed bg-zinc-900/10 border-white/5 grayscale"
                              : socksType !== "none" || assets.socks
                                ? "cursor-pointer bg-zinc-800 border-white shadow-xl"
                                : "cursor-pointer bg-zinc-900/40 border-white/5 hover:border-white/20",
                            isDraggingSocks &&
                            "ring-2 ring-white border-white bg-white/5 scale-[1.02]",
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              !(
                                pantLength === "covering" ||
                                pantLength === "flare"
                              )
                            ) {
                              setIsDraggingSocks(true);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingSocks(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingSocks(false);
                            if (
                              pantLength === "covering" ||
                              pantLength === "flare"
                            )
                              return;

                            const files = Array.from(e.dataTransfer.files);
                            if (files && files.length > 0) {
                              const imageFiles = files.filter((f) =>
                                f.type.startsWith("image/"),
                              );
                              if (imageFiles.length > 0) {
                                handleAssetUpload("socks", imageFiles[0]);
                              } else {
                                toast.error(
                                  language === "tr"
                                    ? "Sadece görsel dosyaları kabul edilir"
                                    : "Only image files are accepted",
                                );
                              }
                            }
                          }}
                          onClick={() => {
                            if (
                              pantLength === "covering" ||
                              pantLength === "flare"
                            )
                              return;
                            if (assets.socks) return; // Don't cycle colors if image is uploaded
                            const colors: (
                              | "none"
                              | "white"
                              | "black"
                              | "grey"
                              | "navy"
                              | "beige"
                              | "brown"
                              | "red"
                              | "green"
                              | "blue"
                              | "anthracite"
                            )[] = [
                                "none",
                                "white",
                                "black",
                                "grey",
                                "navy",
                                "beige",
                                "brown",
                                "red",
                                "green",
                                "blue",
                                "anthracite",
                              ];
                            const currentIndex = colors.indexOf(socksType);
                            const nextIndex =
                              (currentIndex + 1) % colors.length;
                            setSocksType(colors[nextIndex]);
                          }}
                        >
                          <input
                            type="file"
                            id="socks-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleAssetUpload("socks", e.target.files[0]);
                              }
                            }}
                          />

                          {assets.socks ? (
                            <div className="absolute inset-0 w-full h-full bg-zinc-900 p-1.5">
                              <img
                                src={assets.socks as string}
                                className="w-full h-full object-contain"
                                alt="socks"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    document
                                      .getElementById("socks-upload")
                                      ?.click();
                                  }}
                                  className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all shadow-lg"
                                >
                                  <ImageIcon size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssetRemove("socks", e);
                                  }}
                                  className="p-1.5 rounded-md bg-red-500/80 hover:bg-red-500 text-white transition-all shadow-lg"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-1 py-0.5 border-t border-white/10">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-white/90 block text-center truncate">
                                  {language === "tr" ? "ÇORAP" : "SOCKS"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col items-center gap-1 pt-1">
                                <PiSock
                                  className={cn(
                                    "w-5 h-5 transition-all duration-300",
                                    !(
                                      pantLength === "covering" ||
                                      pantLength === "flare"
                                    ) && "group-hover:scale-110",
                                    socksType === "none"
                                      ? "text-zinc-500"
                                      : socksType === "white"
                                        ? "text-white"
                                        : socksType === "black"
                                          ? "text-zinc-400"
                                          : "text-white",
                                  )}
                                  style={
                                    socksType !== "none" &&
                                      socksType !== "white" &&
                                      socksType !== "black"
                                      ? {
                                        color: (
                                          {
                                            grey: "#94a3b8",
                                            navy: "#1e3a8a",
                                            beige: "#f5f5dc",
                                            brown: "#78350f",
                                            red: "#dc2626",
                                            green: "#16a34a",
                                            blue: "#2563eb",
                                            anthracite: "#334155",
                                          } as Record<string, string>
                                        )[socksType],
                                      }
                                      : {}
                                  }
                                />
                                <span
                                  className={cn(
                                    "text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-colors",
                                    socksType !== "none"
                                      ? "text-white"
                                      : cn(
                                        "text-zinc-500",
                                        !(
                                          pantLength === "covering" ||
                                          pantLength === "flare"
                                        ) && "group-hover:text-white",
                                      ),
                                  )}
                                >
                                  {language === "tr" ? "ÇORAP" : "SOCKS"}
                                </span>
                              </div>

                              <div className="flex flex-col items-center gap-0.5 pb-1 w-full text-center">
                                <span
                                  className={cn(
                                    "text-[7px] font-black uppercase tracking-tighter opacity-60",
                                    socksType !== "none"
                                      ? "text-white"
                                      : "text-zinc-500",
                                  )}
                                >
                                  {language === "tr"
                                    ? socksType === "black"
                                      ? "SİYAH"
                                      : socksType === "white"
                                        ? "BEYAZ"
                                        : socksType === "grey"
                                          ? "GRİ"
                                          : socksType === "navy"
                                            ? "LACİVERT"
                                            : socksType === "beige"
                                              ? "BEJ"
                                              : socksType === "brown"
                                                ? "KAHVERENGİ"
                                                : socksType === "red"
                                                  ? "KIRMIZI"
                                                  : socksType === "green"
                                                    ? "YEŞİL"
                                                    : socksType === "blue"
                                                      ? "MAVİ"
                                                      : socksType ===
                                                        "anthracite"
                                                        ? "ANTRASİT"
                                                        : "YOK"
                                    : socksType === "black"
                                      ? "BLACK"
                                      : socksType === "white"
                                        ? "WHITE"
                                        : socksType === "grey"
                                          ? "GREY"
                                          : socksType === "navy"
                                            ? "NAVY"
                                            : socksType === "beige"
                                              ? "BEIGE"
                                              : socksType === "brown"
                                                ? "BROWN"
                                                : socksType === "red"
                                                  ? "RED"
                                                  : socksType === "green"
                                                    ? "GREEN"
                                                    : socksType === "blue"
                                                      ? "BLUE"
                                                      : socksType ===
                                                        "anthracite"
                                                        ? "ANTHRACITE"
                                                        : "NONE"}
                                </span>
                                <div className="flex flex-wrap justify-center gap-0.5 max-w-[40px]">
                                  {[
                                    "none",
                                    "white",
                                    "black",
                                    "grey",
                                    "navy",
                                    "beige",
                                    "brown",
                                    "red",
                                    "green",
                                    "blue",
                                    "anthracite",
                                  ].map((c) => (
                                    <div
                                      key={c}
                                      className={cn(
                                        "w-1 h-1 rounded-full transition-all",
                                        socksType === c
                                          ? "bg-white scale-110 shadow-[0_0_2px_white]"
                                          : "bg-zinc-700",
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document
                                    .getElementById("socks-upload")
                                    ?.click();
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-sm bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                              >
                                <ImageIcon size={10} />
                              </button>
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      {(pantLength === "covering" ||
                        pantLength === "flare") && (
                          <TooltipContent
                            side="top"
                            className="text-[9px] max-w-[150px] text-center bg-zinc-900 text-zinc-300 border border-white/10 font-bold uppercase p-2 rounded-md tracking-tight"
                          >
                            {language === "tr"
                              ? "Uzun paça kullanıldığında çoraplar görünmez."
                              : "Socks are not visible when using long length pants."}
                          </TooltipContent>
                        )}
                    </Tooltip>
                  </TooltipProvider>

                  <AssetCard
                    id="glasses"
                    label={language === "tr" ? "GÖZLÜK" : "GLASSES"}
                    icon={Glasses}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <AssetCard
                    id="hat"
                    label={language === "tr" ? "ŞAPKA" : "HAT"}
                    icon={PiBaseballCap}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <AssetCard
                    id="jewelry"
                    label={language === "tr" ? "TAKILAR" : "JEWELRY"}
                    icon={PiDiamond}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                  <AssetCard
                    id="belt"
                    label={language === "tr" ? "KEMER" : "BELT"}
                    icon={PiBelt}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-16 pt-8 border-t border-white/5">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 h-auto rounded-md border border-white/10 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-[0.98] group"
                >
                  <ChevronLeft className="mr-2 w-3.5 h-3.5 opacity-50" />{" "}
                  {language === "tr" ? "GERİ" : "BACK"}
                </Button>
                <Button
                  onClick={() => canMoveToStep(3) && setWizardStep(3)}
                  className="px-8 h-12 rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center gap-2"
                >
                  {language === "tr" ? "İLERLE" : "NEXT"}{" "}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  <div className="py-3 px-6 rounded-md bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      <div className="md:border-r border-white/10 pr-6 flex-none hidden lg:block">
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] m-0">
                          {language === "tr" ? "AYARLAR" : "SETTINGS"}
                        </p>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                            {language === "tr" ? "ORAN" : "RATIO"}
                          </label>
                          <div className="relative flex-1 min-w-[100px]">
                            <select
                              className="w-full text-[11px] px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white transition-all font-black appearance-none focus:border-white/20 outline-none"
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                            >
                              {ASPECT_RATIOS.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  className="bg-zinc-900 border-none"
                                >
                                  {language === "tr" ? opt.labelTr : opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                            {language === "tr" ? "KALİTE" : "QUALITY"}
                          </label>
                          <div className="relative flex-1 min-w-[100px]">
                            <select
                              className="w-full text-[11px] px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white transition-all font-black appearance-none focus:border-white/20 outline-none"
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                            >
                              {RESOLUTION_OPTIONS.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  className="bg-zinc-900 border-none"
                                >
                                  {language === "tr" ? opt.labelTr : opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                            {language === "tr" ? "SEED" : "SEED"}
                          </label>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              className="w-full text-[11px] px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white transition-all font-black placeholder:text-white/20 focus:border-white/20 outline-none"
                              value={seed === "" ? "" : seed}
                              onChange={(e) =>
                                setSeed(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="RANDOM"
                            />
                            {seed !== "" && (
                              <button
                                onClick={() => setSeed("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center pl-3 border-l border-white/10 -ml-3">
                          <Button
                            variant="hot-coral"
                            size="lg"
                            className="h-12 w-full overflow-hidden translate-x-[5px]"
                            onClick={() =>
                              batchMode
                                ? handleBatchGenerate()
                                : handleGenerate()
                            }
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                  {language === "tr"
                                    ? "OLUŞTURULUYOR..."
                                    : "GENERATING..."}
                                </span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 flex-none" />
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span>
                                    {language === "tr"
                                      ? "OLUŞTUR"
                                      : "GENERATE"}
                                  </span>
                                  <div className="h-4 w-px bg-white/20 mx-1 shrink-0" />
                                  <div className="flex items-center gap-1 opacity-90">
                                    <TbCoins className="w-4 h-4" />
                                    <span className="text-[10px] font-black">
                                      {estimatedCost}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TOP 2: Production Features Bar */}
                  <div className="py-2.5 px-6 rounded-md bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center gap-8">
                    <div className="md:border-r border-white/10 pr-6 flex-none hidden lg:block">
                      <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em] m-0">
                        {language === "tr" ? "ÜRETİM" : "PRODUCTION"}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-wrap items-center gap-x-10 gap-y-4">
                      {/* Mavi Toggle */}
                      {user?.role === "admin" && setIsMaviBatch && (
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest whitespace-nowrap">
                            MAVI
                          </span>
                          <Switch
                            checked={isMaviBatch}
                            onCheckedChange={setIsMaviBatch}
                            className="scale-75"
                          />
                        </div>
                      )}

                      {/* Product Code */}
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                          {language === "tr" ? "ÜRÜN KODU" : "PRODUCT CODE"}
                        </label>
                        <input
                          type="text"
                          className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-[11px] font-black text-white outline-none focus:border-white/20 transition-all w-32 placeholder:text-white/10"
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          placeholder="23132..."
                        />
                      </div>

                      {/* Missing Configs - Inline version */}
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                          {language === "tr" ? "AYARLAR" : "CONFIG"}:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const itemsToCheck = [
                              {
                                key: "model",
                                labelTr: "Manken",
                                labelEn: "Model",
                                group: "product",
                              },
                              {
                                key: "background",
                                labelTr: "Arkaplan",
                                labelEn: "BG",
                                group: "product",
                              },
                              {
                                key: "jacket",
                                labelTr: "Dış",
                                labelEn: "Outer",
                                group: "accessories",
                              },
                              {
                                key: "bag",
                                labelTr: "Çanta",
                                labelEn: "Bag",
                                group: "accessories",
                              },
                              {
                                key: "shoes",
                                labelTr: "Ayakkabı",
                                labelEn: "Shoes",
                                group: "accessories",
                              },
                              {
                                key: "socks",
                                labelTr: "Çorap",
                                labelEn: "Socks",
                                group: "accessories",
                              },
                            ];
                            const unselected = itemsToCheck.filter(
                              (i) => !assets[i.key],
                            );

                            if (unselected.length === 0)
                              return (
                                <span className="text-[9px] font-bold text-green-500 uppercase px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                                  {language === "tr" ? "TAMAM" : "OK"}
                                </span>
                              );

                            return (
                              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[300px] no-scrollbar">
                                {unselected.map((item) => (
                                  <button
                                    key={item.key}
                                    onClick={() => {
                                      setWizardStep(2);
                                      setActiveGroup(item.group as any);
                                      setActiveLibraryAsset(item.key);
                                    }}
                                    className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
                                  >
                                    {language === "tr"
                                      ? item.labelTr
                                      : item.labelEn}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Technical Accessories - Summary toggle */}
                      {(() => {
                        const accessories = [
                          { id: "jacket", label: "Ceket", labelEn: "Jacket" },
                          { id: "bag", label: "Çanta", labelEn: "Bag" },
                          {
                            id: "glasses",
                            label: "Gözlük",
                            labelEn: "Glasses",
                          },
                          { id: "hat", label: "Şapka", labelEn: "Hat" },
                          { id: "jewelry", label: "Takı", labelEn: "Jewelry" },
                          { id: "belt", label: "Kemer", labelEn: "Belt" },
                        ];
                        const activeOnes = accessories.filter(
                          (acc) => !!assets[acc.id],
                        );
                        if (activeOnes.length === 0) return null;

                        return (
                          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <label className="text-[10px] uppercase font-black text-white/40 tracking-widest whitespace-nowrap">
                              {language === "tr" ? "TEKNİK" : "TECH"}:
                            </label>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                              {activeOnes.map((acc) => (
                                <button
                                  key={acc.id}
                                  onClick={() =>
                                    setTechAccessories({
                                      ...techAccessories,
                                      [acc.id]: !techAccessories[acc.id],
                                    })
                                  }
                                  className={cn(
                                    "px-2 py-1 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap border",
                                    techAccessories[acc.id]
                                      ? "bg-blue-600 border-blue-400 text-white"
                                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20",
                                  )}
                                >
                                  {language === "tr" ? acc.label : acc.labelEn}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* MAIN STUDIO AREA */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 shadow-2xl flex flex-col gap-8 overflow-hidden relative">
                    {/* SHOT SELECTION - ALWAYS FULL WIDTH, NEVER CHANGES */}
                    <div className="w-full">
                      <div className="w-full">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-40 block mb-6">
                          {language === "tr" ? "AÇI VE KARE SEÇİMLERİ" : "ANGLE & SHOT SELECTION"}
                        </label>

                        {/* SINGLE FLAT ROW — all shots, no grouping */}
                        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
                          {availableBatchShots.map((shot) => {
                            const isSelected = batchShotSelection[shot.id] ?? false;
                            const isMaviActive = user?.role === "admin" && isMaviBatch;
                            const isStylingShot = shot.id.includes("styling");
                            const isLowerDetailShot = shot.id === "std_detail_front" || shot.id === "std_detail_back";
                            const isDisabled = workflowType === "upper" && isLowerDetailShot;

                            return (
                              <div key={shot.id} className="flex flex-col gap-2 flex-shrink-0" style={{ width: "min(150px, 10vw)", minWidth: "90px" }}>
                                {/* Card — 2:3 ratio */}
                                <div
                                  className={cn(
                                    "relative w-full overflow-hidden border transition-all duration-200",
                                    isDisabled ? "cursor-not-allowed opacity-20 grayscale" : "cursor-pointer",
                                    isSelected
                                      ? isMaviActive
                                        ? "border-zinc-300 ring-2 ring-zinc-300/20"
                                        : "border-white ring-2 ring-white/20"
                                      : !isDisabled
                                        ? "border-white/10 opacity-50 grayscale hover:opacity-80 hover:border-white/30"
                                        : "border-white/5"
                                  )}
                                  style={{ aspectRatio: "2/3" }}
                                  onClick={() => {
                                    if (isDisabled) {
                                      toast.error(
                                        language === "tr"
                                          ? "Bu açı bir üst ürün için seçilemez."
                                          : "Cannot select this angle for an upper garment."
                                      );
                                      return;
                                    }
                                    setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }));
                                  }}
                                >
                                  {/* Image */}
                                  {shot.image ? (
                                    <img src={shot.image} alt={shot.label} className="absolute inset-0 w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                                      <Shirt className="w-6 h-6 opacity-20" />
                                    </div>
                                  )}

                                  {/* Label */}
                                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                    <p className="text-[9px] font-black text-white text-center uppercase tracking-wide leading-tight">
                                      {language === "tr" ? shot.label : shot.labelEn}
                                    </p>
                                  </div>

                                  {/* Checkbox */}
                                  <div className="absolute top-2 left-2">
                                    <div className={cn(
                                      "w-4 h-4 rounded flex items-center justify-center border transition-all",
                                      isSelected
                                        ? isMaviActive
                                          ? "bg-zinc-100 border-zinc-100 text-black"
                                          : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                        : "bg-black/40 border-white/30 text-transparent"
                                    )}>
                                      <Check className="w-2.5 h-2.5" />
                                    </div>
                                  </div>

                                  {/* YNC toggle — styling shots only */}
                                  {isStylingShot && isSelected && (
                                    <div
                                      className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <span className="text-[8px] font-bold text-white tracking-widest">YNC</span>
                                      <Switch
                                        className="scale-[0.55] origin-right !m-0 data-[state=checked]:bg-zinc-100"
                                        checked={stylingSideOnly[shot.id] || false}
                                        onCheckedChange={val => setStylingSideOnly({ ...stylingSideOnly, [shot.id]: val })}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Poz Seç button — styling shots only */}
                                {isStylingShot && isSelected && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setActiveGroup("product");
                                      setTargetPoseShot(shot.id);
                                      setActiveLibraryAsset("pose");
                                      const isUpperFocus = shot.id.includes("upper") || shot.id.includes("closeup") || shot.image?.includes("ust_vucut") || shot.image?.includes("closeup");
                                      setPoseFocus(isUpperFocus ? "upper" : "full");
                                    }}
                                    className={cn(
                                      "flex items-center justify-center gap-1 w-full py-1.5 rounded border text-[8px] font-bold uppercase tracking-wider transition-colors cursor-pointer",
                                      assets[`pose_${shot.id}`]
                                        ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-300 hover:bg-zinc-500 hover:text-white"
                                        : "border-white/20 bg-white/5 text-white/60 hover:bg-white hover:text-black"
                                    )}
                                  >
                                    {assets[`pose_${shot.id}`] ? (
                                      <><Check className="w-2.5 h-2.5" />{language === "tr" ? "Poz Seçili" : "Pose Set"}</>
                                    ) : (
                                      <><div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />{language === "tr" ? "Poz Seç" : "Set Pose"}</>
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>{/* end single row */}
                      </div>{/* end inner w-full */}
                    </div>{/* end shot selection */}

                    {/* RESULTS — appears BELOW selection, never resizes cards */}
                    {generationHasStarted && (
                      <div className="w-full border-t border-white/5 pt-8">
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
                          isAdmin={user?.role === "admin"}
                        />
                      </div>
                    )}

                  </div>{/* end main studio area */}
                </div>
              </div>
            </div>
          )}
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

                {user?.role === "admin" && (
                  <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
                    <button
                      onClick={() => {
                        setPreviewMode("text");
                        if (previewData && previewData[0])
                          setUserAddedPrompt(previewData[0].prompt);
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        previewMode === "text"
                          ? "bg-white text-black shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      PROMPT
                    </button>
                    <button
                      onClick={() => {
                        setPreviewMode("json");
                        if (previewData && previewData[0])
                          setUserAddedPrompt(
                            JSON.stringify(previewData[0].structured, null, 2),
                          );
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        previewMode === "json"
                          ? "bg-white text-black shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      JSON
                    </button>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {previewData &&
                  previewData.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-4">
                      {/* Shot Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                          <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                            {language === "tr" ? "ÇEKİM" : "SHOT"}
                          </span>
                          <span className="text-sm font-bold">
                            {item.title ||
                              (language === "tr" ? "Ana Çekim" : "Main Shot")}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                          <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                            {language === "tr" ? "MODEL" : "MODEL"}
                          </span>
                          <span className="text-sm font-bold uppercase">
                            {gender || "DEFAULT"}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                          <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                            {language === "tr" ? "ÇÖZÜNÜRLÜK" : "RES"}
                          </span>
                          <span className="text-sm font-bold">
                            {item.settings?.resolution}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                          <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
                            {language === "tr" ? "ORAN" : "RATIO"}
                          </span>
                          <span className="text-sm font-bold">
                            {item.settings?.aspect_ratio}
                          </span>
                        </div>
                      </div>

                      {/* Editor Area */}
                      <div className="flex flex-col h-full min-h-[400px]">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">
                            {previewMode === "json"
                              ? "SYSTEM CONTROL"
                              : language === "tr"
                                ? "ANALİZ SONUCU VE PROMPT"
                                : "ANALYSIS & PROMPT"}
                          </span>
                        </div>

                        {user?.role === "admin" ? (
                          <textarea
                            className={cn(
                              "w-full h-full min-h-[400px] p-5 text-[14px] leading-relaxed bg-[var(--bg-elevated)] text-[var(--text-primary)] border-2 border-[var(--border-subtle)] rounded-xl outline-none focus:border-white/20 transition-all custom-scrollbar",
                              previewMode === "json"
                                ? "font-mono text-zinc-400"
                                : "font-sans font-medium",
                            )}
                            value={userAddedPrompt}
                            onChange={(e) => setUserAddedPrompt(e.target.value)}
                            spellCheck={false}
                          />
                        ) : (
                          <div className="p-10 text-center bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                            <p className="text-sm font-medium text-[var(--text-muted)]">
                              {language === "tr"
                                ? "Çekim parametreleri optimize edildi. Onaylayıp devam edebilirsiniz."
                                : "Shoot parameters optimized. You can confirm and proceed."}
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
                  className="h-10 px-6 rounded-md font-black text-[10px] uppercase tracking-widest border border-white/10 bg-white/5 text-white hover:bg-white hover:text-black transition-all"
                >
                  {language === "tr" ? "DÜZENLE" : "EDIT"}
                </Button>
                <Button
                  onClick={handleConfirmGeneration}
                  className="h-10 px-8 rounded-md bg-[#F5F5F5] hover:bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  {language === "tr" ? "ONAYLA VE BAŞLAT" : "CONFIRM & START"}
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
            isAdmin={user?.role === "admin"}
          />

          {/* Library Backdrop (Click outside to close) */}
          {
            activeLibraryAsset &&
            !(activeLibraryAsset === "model" && wizardStep === 1) && (
              <div
                className="fixed inset-0 bg-black/5 z-[55] animate-in fade-in duration-300"
                onClick={() => {
                  setActiveLibraryAsset(null);
                  setActiveGroup(null);
                }}
              />
            )
          }
        </div >

        <LibrarySidebar
          language={language}
          activeLibraryAsset={
            activeLibraryAsset === "model" && wizardStep === 1
              ? null
              : activeLibraryAsset
          }
          setActiveLibraryAsset={setActiveLibraryAsset}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          internalAsset={internalAsset}
          libraryTab={libraryTab}
          setLibraryTab={(v) => setLibraryTab(v as any)}
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
          isAdmin={user?.role === "admin"}
          addToGlobalLibrary={addToGlobalLibrary}
          selectedPoseUrl={
            targetPoseShot
              ? assets[`pose_${targetPoseShot}`] || null
              : assets.pose || null
          }
        />
      </div >
    </div >
  );
}
