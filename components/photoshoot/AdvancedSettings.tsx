"use client";

import React from "react";
import { TbUserCircle, TbCamera, TbRuler, TbGlass, TbShoppingBag } from "react-icons/tb";
import { Camera, Ruler, Glasses, Footprints, Shirt } from "lucide-react";
import { AssetCard } from "./AssetCard";

interface AdvancedSettingsProps {
    language: string;
    hasFeet: boolean;
    assets: { [key: string]: string | null };
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (val: any) => void;
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent) => void;
    convertToStickman?: () => void;
    lightingSendImage?: boolean;
    setLightingSendImage?: (val: boolean) => void;
}

export function AdvancedSettings({
    language,
    hasFeet,
    assets,
    activeLibraryAsset,
    setActiveLibraryAsset,
    handleAssetUpload,
    handleAssetRemove,
    convertToStickman,
    lightingSendImage,
    setLightingSendImage,
}: AdvancedSettingsProps) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">
                {language === "tr" ? "ÇEKİM AYARLARI" : "SHOOT SETTINGS"}
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <AssetCard
                    id="pose"
                    label={language === "tr" ? "POZ" : "POSE"}
                    icon={TbUserCircle}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    convertToStickman={convertToStickman}
                    variant="square"
                />
                <AssetCard
                    id="fit_pattern"
                    label={language === "tr" ? "KALIP" : "FIT"}
                    icon={Ruler}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                />
                <AssetCard
                    id="inner_wear"
                    label={language === "tr" ? "İÇ GİYİM" : "INNER WEAR"}
                    icon={Shirt}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                    variant="square"
                />
                {hasFeet && (
                    <AssetCard
                        id="shoes"
                        label={language === "tr" ? "AYAKKABI" : "SHOES"}
                        icon={Footprints}
                        assets={assets}
                        activeLibraryAsset={activeLibraryAsset}
                        setActiveLibraryAsset={setActiveLibraryAsset}
                        handleAssetUpload={handleAssetUpload}
                        handleAssetRemove={handleAssetRemove}
                        language={language}
                        variant="square"
                    />
                )}
            </div>
        </div>
    );
}
