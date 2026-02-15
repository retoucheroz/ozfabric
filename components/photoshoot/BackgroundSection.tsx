"use client";

import React from "react";
import { TbPhoto } from "react-icons/tb";
import { AssetCard } from "./AssetCard";

interface BackgroundSectionProps {
    language: string;
    assets: { [key: string]: string | null };
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (id: any) => void;
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent) => void;
}

export function BackgroundSection({
    language,
    assets,
    activeLibraryAsset,
    setActiveLibraryAsset,
    handleAssetUpload,
    handleAssetRemove
}: BackgroundSectionProps) {
    return (
        <AssetCard
            id="background"
            label={language === "tr" ? "Arka Plan" : "Background"}
            icon={TbPhoto}
            assets={assets}
            activeLibraryAsset={activeLibraryAsset}
            setActiveLibraryAsset={setActiveLibraryAsset}
            handleAssetUpload={handleAssetUpload}
            handleAssetRemove={handleAssetRemove}
            language={language}
        />
    );
}
