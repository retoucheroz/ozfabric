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
    variant?: "default" | "square";
}

export function BackgroundSection({
    language,
    assets,
    activeLibraryAsset,
    setActiveLibraryAsset,
    handleAssetUpload,
    handleAssetRemove,
    variant = "square"
}: BackgroundSectionProps) {
    return (
        <AssetCard
            id="background"
            label={language === "tr" ? "ARKA PLAN" : "BACKGROUND"}
            icon={TbPhoto}
            assets={assets}
            activeLibraryAsset={activeLibraryAsset}
            setActiveLibraryAsset={setActiveLibraryAsset}
            handleAssetUpload={handleAssetUpload}
            handleAssetRemove={handleAssetRemove}
            language={language}
            variant={variant}
        />
    );
}
