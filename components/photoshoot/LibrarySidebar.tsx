"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, X, Edit2, ChevronLeft, User, Camera, Sparkles, Gem, MoveHorizontal, Glasses, ShoppingBag, FileText, ScanLine, Shirt } from "lucide-react"
import { RotateCw, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TbShirt, TbHanger, TbShirtFilled, TbJacket, TbSparkles, TbDiamonds } from "react-icons/tb"
import { PiPants, PiPantsFill, PiHandbag, PiBaseballCap, PiBelt } from "react-icons/pi"
import { AssetCard as BaseAssetCard } from "@/components/photoshoot/AssetCard"
import { ModelSection } from "@/components/photoshoot/ModelSection"
import { SavedPose, SavedModel, SavedBackground, SavedFit, SavedLighting, SavedShoe, SavedJacket, SavedBag, SavedGlasses, SavedInnerWear, SavedHat, SavedJewelry, SavedBelt, LIGHTING_PRESETS, BACKGROUND_PRESETS } from "@/lib/photoshoot-shared"

import { Dispatch, SetStateAction } from "react"

interface LibrarySidebarProps {
    language: string;
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (asset: string | null) => void;
    activeGroup: 'product' | 'accessories' | null;
    setActiveGroup: (group: 'product' | 'accessories' | null) => void;
    internalAsset: string | null;
    libraryTab: string;
    setLibraryTab: (tab: string) => void;
    hasWaist: boolean;
    // Poses
    poseFocus: 'full' | 'upper' | 'lower' | 'closeup';
    setPoseFocus: (focus: 'full' | 'upper' | 'lower' | 'closeup') => void;
    setUpperFraming: (framing: "full" | "medium_full") => void;
    savedPoses: SavedPose[];
    handleSavedPoseClick: (pose: SavedPose) => void;
    deleteSavedPose: (id: string) => void;
    // Generic Assets
    handleSavedFitClick: (item: SavedFit) => void;
    handleSavedShoeClick: (item: SavedShoe) => void;
    handleSavedJacketClick: (item: SavedJacket) => void;
    handleSavedBagClick: (item: SavedBag) => void;
    handleSavedGlassesClick: (item: SavedGlasses) => void;
    handleSavedHatClick: (item: SavedHat) => void;
    handleSavedJewelryClick: (item: SavedJewelry) => void;
    handleSavedBeltClick: (item: SavedBelt) => void;
    handleSavedInnerWearClick: (item: SavedInnerWear) => void;
    setAssets: Dispatch<SetStateAction<any>>;
    setAssetsHighRes: Dispatch<SetStateAction<any>>;
    setLightingPositive: (prompt: string) => void;
    setLightingNegative: (prompt: string) => void;
    setLightingSendImage: (send: boolean) => void;
    deleteSavedAsset: (key: string, id: string) => void;
    handleEditItemClick: (type: string, id: string) => void;
    // Models
    gender: string;
    setGender: (gender: string) => void;
    assets: any;
    handleAssetUpload: (key: string, file: File) => void;
    handleAssetRemove: (key: string, e?: React.MouseEvent) => void;
    savedModels: SavedModel[];
    deleteSavedModel: (id: string) => void;
    // Lists
    savedBackgrounds: SavedBackground[];
    savedFits: SavedFit[];
    savedShoes: SavedShoe[];
    savedLightings: SavedLighting[];
    savedJackets: SavedJacket[];
    savedBags: SavedBag[];
    savedGlasses: SavedGlasses[];
    savedHats: SavedHat[];
    savedJewelry: SavedJewelry[];
    savedBelts: SavedBelt[];
    savedInnerWears: SavedInnerWear[];
    models: any[]; // Your user trained models
    handleLibrarySelect: (item: { src: string }, isUpload?: boolean) => void;
    sessionLibrary: string[];
}

export function LibrarySidebar({
    language,
    activeLibraryAsset,
    setActiveLibraryAsset,
    activeGroup,
    setActiveGroup,
    internalAsset,
    libraryTab,
    setLibraryTab,
    hasWaist,
    poseFocus,
    setPoseFocus,
    setUpperFraming,
    savedPoses,
    handleSavedPoseClick,
    deleteSavedPose,
    handleSavedFitClick,
    handleSavedShoeClick,
    handleSavedJacketClick,
    handleSavedBagClick,
    handleSavedGlassesClick,
    handleSavedHatClick,
    handleSavedJewelryClick,
    handleSavedBeltClick,
    handleSavedInnerWearClick,
    setAssets,
    setAssetsHighRes,
    setLightingPositive,
    setLightingNegative,
    setLightingSendImage,
    deleteSavedAsset,
    handleEditItemClick,
    gender,
    setGender,
    assets,
    handleAssetUpload,
    handleAssetRemove,
    savedModels,
    deleteSavedModel,
    savedBackgrounds,
    savedFits,
    savedShoes,
    savedLightings,
    savedJackets,
    savedBags,
    savedGlasses,
    savedHats,
    savedJewelry,
    savedBelts,
    savedInnerWears,
    models,
    handleLibrarySelect,
    sessionLibrary
}: LibrarySidebarProps) {

    const AssetCard = ({ id, label, icon, required = false, variant = 'default' }: { id: string, label: string, icon: any, required?: boolean, variant?: 'default' | 'square' }) => (
        <BaseAssetCard
            id={id}
            label={label}
            icon={icon}
            required={required}
            activeLibraryAsset={activeLibraryAsset}
            setActiveLibraryAsset={setActiveLibraryAsset}
            assets={assets}
            handleAssetUpload={handleAssetUpload}
            handleAssetRemove={handleAssetRemove}
            language={language}
            variant={variant}
        />
    );

    return (
        <div
            className={cn(
                "absolute right-0 top-0 bottom-0 w-full sm:w-80 lg:w-[480px] bg-[var(--bg-sidebar)] border-l border-[var(--border-subtle)] shadow-2xl z-[60] flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
                activeLibraryAsset ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-3">
                    {/* Back Button for Nested Navigation */}
                    {(activeLibraryAsset && !['product_group', 'accessories_group'].includes(activeLibraryAsset) && activeGroup) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -ml-1 mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                            onClick={() => setActiveLibraryAsset(activeGroup === 'product' ? 'product_group' : 'accessories_group')}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}

                    <span className="text-base font-black uppercase tracking-tight text-[var(--text-primary)]">
                        {activeLibraryAsset === 'product_group' ? (language === "tr" ? "ÜRÜN YÖNETİMİ" : "PRODUCT MGMT") :
                            activeLibraryAsset === 'accessories_group' ? (language === "tr" ? "AKSESUARLAR" : "ACCESSORIES") :
                                (language === "tr" ? "SEÇİM YAP" : "SELECT ASSET")}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" onClick={() => { setActiveLibraryAsset(null); setActiveGroup(null); }}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* GROUP SELECTION VIEW */}
            {(activeLibraryAsset === 'product_group' || activeLibraryAsset === 'accessories_group' || activeLibraryAsset === 'accessories') ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {activeLibraryAsset === 'product_group' && (
                        <div className="space-y-6">
                            {/* Primary Products */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.2em] px-1">{language === "tr" ? "TEMEL ÜRÜNLER" : "PRIMARY PRODUCTS"}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-3">
                                        <AssetCard id="top_front" label={language === "tr" ? "Üst Ön" : "Top Front"} icon={TbShirtFilled} variant="square" />
                                        <AssetCard id="top_back" label={language === "tr" ? "Üst Arka" : "Top Back"} icon={TbShirt} variant="square" />
                                    </div>
                                    <div className="space-y-3">
                                        <AssetCard id="bottom_front" label={language === "tr" ? "Alt Ön" : "Bottom Front"} icon={PiPantsFill} variant="square" />
                                        <AssetCard id="bottom_back" label={language === "tr" ? "Alt Arka" : "Bottom Back"} icon={PiPants} variant="square" />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Views */}
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                        <ScanLine size={12} />
                                        {language === "tr" ? "ÖN DETAYLAR" : "FRONT DETAILS"}
                                    </h4>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <AssetCard id="detail_front_1" label={language === "tr" ? "Det 1" : "Det 1"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_front_2" label={language === "tr" ? "Det 2" : "Det 2"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_front_3" label={language === "tr" ? "Det 3" : "Det 3"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_front_4" label={language === "tr" ? "Det 4" : "Det 4"} icon={ScanLine} variant="square" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                        <ScanLine size={12} />
                                        {language === "tr" ? "ARKA DETAYLAR" : "BACK DETAILS"}
                                    </h4>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <AssetCard id="detail_back_1" label={language === "tr" ? "Det 1" : "Det 1"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_back_2" label={language === "tr" ? "Det 2" : "Det 2"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_back_3" label={language === "tr" ? "Det 3" : "Det 3"} icon={ScanLine} variant="square" />
                                        <AssetCard id="detail_back_4" label={language === "tr" ? "Det 4" : "Det 4"} icon={ScanLine} variant="square" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeLibraryAsset === 'accessories_group' || activeLibraryAsset === 'accessories') && (
                        <div className="grid grid-cols-2 gap-3">
                            <AssetCard id="jacket" label={language === "tr" ? "DIŞ GİYİM" : "OUTERWEAR"} icon={TbJacket} variant="square" />
                            <AssetCard id="bag" label={language === "tr" ? "ÇANTA" : "BAG"} icon={PiHandbag} variant="square" />
                            <AssetCard id="glasses" label={language === "tr" ? "GÖZLÜK" : "GLASSES"} icon={Glasses} variant="square" />
                            <AssetCard id="hat" label={language === "tr" ? "ŞAPKA" : "HAT"} icon={PiBaseballCap} variant="square" />
                            <AssetCard id="jewelry" label={language === "tr" ? "TAKI" : "JEWELRY"} icon={TbDiamonds} variant="square" />
                            {hasWaist && <AssetCard id="belt" label={language === "tr" ? "KEMER" : "BELT"} icon={PiBelt} variant="square" />}
                        </div>
                    )}
                </div>
            ) : (
                /* NORMAL LIBRARY VIEW */
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* POSE FOCUS TOGGLE (Only for Pose) */}
                    {internalAsset === 'pose' && (
                        <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
                            <span className="text-xs font-medium text-[var(--text-muted)]">{language === "tr" ? "Odak Alanı" : "Focus Area"}</span>
                            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1 rounded-lg">
                                <button
                                    onClick={() => { setPoseFocus('full'); setUpperFraming('full'); }}
                                    className={cn(
                                        "text-[10px] px-2 py-1 rounded-md transition-all",
                                        poseFocus === 'full'
                                            ? "bg-[var(--bg-surface)] shadow text-[var(--text-primary)] font-bold"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
                                >
                                    {language === "tr" ? "Tam Boy" : "Full Body"}
                                </button>
                                <button
                                    onClick={() => { setPoseFocus('upper'); setUpperFraming('medium_full'); }}
                                    className={cn(
                                        "text-[10px] px-2 py-1 rounded-md transition-all",
                                        poseFocus === 'upper'
                                            ? "bg-[var(--bg-surface)] shadow text-[var(--text-primary)] font-bold"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    )}
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
                                        <TabsTrigger value="library" className="text-xs">{language === "tr" ? "Kütüphane" : "Library"}</TabsTrigger>
                                        <TabsTrigger value="templates" className="text-xs">{language === "tr" ? "Şablonlar" : "Templates"}</TabsTrigger>
                                        <TabsTrigger value="assets" className="text-xs">{language === "tr" ? "Yükle" : "Upload"}</TabsTrigger>
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
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditItemClick('pose', pose.id); }} className="p-1 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)]"><Edit2 size={10} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : internalAsset === 'model' ? (
                                <ModelSection
                                    view="library"
                                    language={language}
                                    gender={gender}
                                    setGender={setGender}
                                    assets={assets}
                                    activeLibraryAsset={activeLibraryAsset}
                                    setActiveLibraryAsset={setActiveLibraryAsset}
                                    handleAssetUpload={handleAssetUpload}
                                    handleAssetRemove={handleAssetRemove}
                                    savedModels={savedModels}
                                    deleteSavedModel={deleteSavedModel}
                                    handleEditItemClick={handleEditItemClick}
                                    setAssets={setAssets}
                                    setAssetsHighRes={setAssetsHighRes}
                                />
                            ) : (['background', 'fit_pattern', 'inner_wear', 'shoes', 'lighting', 'jacket', 'bag', 'glasses', 'hat', 'jewelry', 'belt'].includes(internalAsset || '')) ? (
                                <div className="space-y-4 h-[calc(100vh-280px)] flex flex-col">
                                    <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 pb-10">
                                        {(internalAsset === 'background' ? [...savedBackgrounds, ...BACKGROUND_PRESETS.filter(bp => !savedBackgrounds.some(sb => sb.id === bp.id))] :
                                            internalAsset === 'fit_pattern' ? savedFits :
                                                internalAsset === 'lighting' ? [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))] :
                                                    internalAsset === 'shoes' ? savedShoes :
                                                        internalAsset === 'jacket' ? savedJackets :
                                                            internalAsset === 'bag' ? savedBags :
                                                                internalAsset === 'glasses' ? savedGlasses :
                                                                    internalAsset === 'hat' ? savedHats :
                                                                        internalAsset === 'jewelry' ? savedJewelry :
                                                                            internalAsset === 'belt' ? savedBelts :
                                                                                internalAsset === 'inner_wear' ? savedInnerWears :
                                                                                    []).map((item: any) => {
                                                                                        const isPreset = internalAsset === 'lighting' ? LIGHTING_PRESETS.some(lp => lp.id === item.id) :
                                                                                            internalAsset === 'background' ? BACKGROUND_PRESETS.some(bp => bp.id === item.id) : false;
                                                                                        const thumbToShow = internalAsset === 'background' && isPreset ? (item.preview || item.color) : (item.thumbUrl || item.url);

                                                                                        return (
                                                                                            <div key={item.id} className="group relative aspect-square rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all">
                                                                                                {thumbToShow ? (
                                                                                                    (internalAsset === 'background' && isPreset && item.color) ? (
                                                                                                        <div
                                                                                                            className="w-full h-full"
                                                                                                            style={{ background: item.color }}
                                                                                                            onClick={() => {
                                                                                                                setAssets((p: any) => ({ ...p, background: item.color }));
                                                                                                                setActiveLibraryAsset(null);
                                                                                                            }}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <img
                                                                                                            src={thumbToShow}
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
                                                                                                                } else if (internalAsset === 'inner_wear') {
                                                                                                                    handleSavedInnerWearClick(item as SavedInnerWear);
                                                                                                                } else if (internalAsset === 'lighting') {
                                                                                                                    const l = item as SavedLighting;
                                                                                                                    setAssets((p: any) => ({ ...p, lighting: l.url || "LIGHTING_SET" }));
                                                                                                                    setAssetsHighRes((p: any) => ({ ...p, lighting: null }));
                                                                                                                    setLightingPositive(l.positivePrompt);
                                                                                                                    setLightingNegative(l.negativePrompt);
                                                                                                                    setLightingSendImage(l.sendImageAsAsset);
                                                                                                                } else if (internalAsset === 'background' && isPreset) {
                                                                                                                    setAssets((p: any) => ({ ...p, background: item.preview }));
                                                                                                                } else {
                                                                                                                    setAssets((p: any) => ({ ...p, [internalAsset!]: item.url }));
                                                                                                                    setAssetsHighRes((p: any) => ({ ...p, [internalAsset!]: null }));
                                                                                                                }
                                                                                                                setActiveLibraryAsset(null);
                                                                                                            }}
                                                                                                        />
                                                                                                    )
                                                                                                ) : (
                                                                                                    <div
                                                                                                        className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-bold text-[10px] p-2 text-center"
                                                                                                        onClick={() => {
                                                                                                            if (internalAsset === 'lighting') {
                                                                                                                const l = item as SavedLighting;
                                                                                                                setAssets((p: any) => ({ ...p, lighting: "LIGHTING_SET" }));
                                                                                                                setAssetsHighRes((p: any) => ({ ...p, lighting: null }));
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
                                                                                                            } else if (internalAsset === 'inner_wear') {
                                                                                                                handleSavedInnerWearClick(item as SavedInnerWear);
                                                                                                                setActiveLibraryAsset(null);
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        <Camera size={20} className="mb-1 opacity-50" />
                                                                                                        {item.name || item.labelTr || item.label}
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white truncate">{item.name || item.labelTr || item.label}</div>
                                                                                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                    {!isPreset ? (
                                                                                                        <>
                                                                                                            <button onClick={(e) => { e.stopPropagation(); deleteSavedAsset(internalAsset!, item.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>
                                                                                                            <button onClick={(e) => { e.stopPropagation(); handleEditItemClick(internalAsset!, item.id); }} className="p-1 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)]"><Edit2 size={10} /></button>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        (internalAsset === 'lighting' || internalAsset === 'shoes' || internalAsset === 'fit_pattern' || internalAsset === 'jacket' || internalAsset === 'bag' || internalAsset === 'glasses' || internalAsset === 'hat' || internalAsset === 'jewelry' || internalAsset === 'belt' || internalAsset === 'inner_wear') && (
                                                                                                            <button onClick={(e) => { e.stopPropagation(); handleEditItemClick(internalAsset!, item.id); }} className="p-1 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)]"><Edit2 size={10} /></button>
                                                                                                        )
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                        {(internalAsset === 'background' ? [...savedBackgrounds, ...BACKGROUND_PRESETS.filter(bp => !savedBackgrounds.some(sb => sb.id === bp.id))] :
                                            internalAsset === 'fit_pattern' ? savedFits :
                                                internalAsset === 'lighting' ? [...savedLightings, ...LIGHTING_PRESETS.filter(lp => !savedLightings.some(sl => sl.id === lp.id))] :
                                                    internalAsset === 'shoes' ? savedShoes :
                                                        internalAsset === 'jacket' ? savedJackets :
                                                            internalAsset === 'bag' ? savedBags :
                                                                internalAsset === 'glasses' ? savedGlasses :
                                                                    internalAsset === 'hat' ? savedHats :
                                                                        internalAsset === 'jewelry' ? savedJewelry :
                                                                            internalAsset === 'belt' ? savedBelts :
                                                                                internalAsset === 'inner_wear' ? savedInnerWears :
                                                                                    []).length === 0 && (
                                                <div className="col-span-2 text-center text-[10px] text-[var(--text-muted)] py-10 bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] rounded-lg">No saved items.</div>
                                            )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar pr-1">
                                    {sessionLibrary.map((item, idx) => (
                                        <div key={idx} onClick={() => handleLibrarySelect({ src: item })} className="aspect-[3/4] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[var(--accent-primary)] transition-all">
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
                                    className="w-full h-32 p-2 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] resize-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                                    placeholder={language === "tr" ? "Tam olarak ne istediğinizi tarif edin..." : "Describe exactly what you want..."}
                                ></textarea>
                                <Button size="sm" className="w-full text-xs">{language === "tr" ? "İstemi Uygula" : "Apply Prompt"}</Button>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    {language === "tr" ? "Bu varlık için özel prompt kullanın." : "Use a custom prompt for this asset slot."}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="assets" className="flex-1 overflow-y-auto p-3 space-y-4">
                            <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-all relative">
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
                                <div className="p-3 bg-[var(--bg-elevated)] rounded-full">
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
                                                        setAssets((prev: any) => ({ ...prev, [internalAsset!]: model.thumbnailUrl as string }));
                                                        setAssetsHighRes((prev: any) => ({ ...prev, [internalAsset!]: null }));
                                                    }
                                                    setActiveLibraryAsset(null);
                                                }}
                                                className="aspect-square rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-[var(--accent-primary)]"
                                            >
                                                {model.thumbnailUrl ? (
                                                    <img src={model.thumbnailUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--accent-primary)] font-bold text-xs p-2 text-center">
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
                </div >
            )
            }
        </div >
    );
}
