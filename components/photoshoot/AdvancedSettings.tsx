"use client";

import React from "react";
import { TbUserCircle, TbCamera, TbRuler, TbGlass, TbShoppingBag } from "react-icons/tb";
import { Camera, Ruler, Glasses, ShoppingBag } from "lucide-react";
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
        <div className="grid grid-cols-2 gap-2">
            <AssetCard
                id="pose"
                label={language === "tr" ? "Poz" : "Pose"}
                icon={TbUserCircle}
                assets={assets}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                language={language}
                convertToStickman={convertToStickman}
            />
            <AssetCard
                id="lighting"
                label={language === "tr" ? "Işık" : "Light"}
                icon={Camera}
                assets={assets}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                language={language}
                lightingSendImage={lightingSendImage}
                setLightingSendImage={setLightingSendImage}
            />
            <AssetCard
                id="fit_pattern"
                label={language === "tr" ? "Kalıp" : "Fit"}
                icon={Ruler}
                assets={assets}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                language={language}
            />
            <AssetCard
                id="accessories"
                label={language === "tr" ? "Aksesuar" : "Accessory"}
                icon={Glasses}
                assets={assets}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                language={language}
            />
            {hasFeet && (
                <AssetCard
                    id="shoes"
                    label={language === "tr" ? "Ayakkabı" : "Shoes"}
                    icon={ShoppingBag}
                    assets={assets}
                    activeLibraryAsset={activeLibraryAsset}
                    setActiveLibraryAsset={setActiveLibraryAsset}
                    handleAssetUpload={handleAssetUpload}
                    handleAssetRemove={handleAssetRemove}
                    language={language}
                />
            )}
        </div>
    );
}
