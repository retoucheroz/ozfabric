"use client";

import React from "react";
import { TbUserCircle, TbGenderFemale, TbGenderMale } from "react-icons/tb";
import { User, X, Edit2 } from "lucide-react";
import { AssetCard } from "./AssetCard";
import { cn } from "@/lib/utils";

interface ModelSectionProps {
    language: string;
    gender: string;
    setGender: (val: "male" | "female") => void;
    assets: { [key: string]: string | null };
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (val: any) => void;
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent) => void;
    // For grid view (optional)
    view?: "sidebar" | "library";
    savedModels?: any[];
    deleteSavedModel?: (id: string) => void;
    handleEditItemClick?: (type: string, id: string) => void;
    setAssets?: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
    setAssetsHighRes?: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
}

export function ModelSection({
    language,
    gender,
    setGender,
    assets,
    activeLibraryAsset,
    setActiveLibraryAsset,
    handleAssetUpload,
    handleAssetRemove,
    view = "sidebar",
    savedModels = [],
    deleteSavedModel,
    handleEditItemClick,
    setAssets,
    setAssetsHighRes,
}: ModelSectionProps) {
    if (view === "library") {
        return (
            <div className="space-y-4">
                {['female', 'male'].map(g => (
                    <div key={g} className="space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                            <User size={12} className={g === 'female' ? 'text-pink-500' : 'text-blue-500'} />
                            {g === 'female' ? (language === "tr" ? "Kadın Modeller" : "Female Models") : (language === "tr" ? "Erkek Modeller" : "Male Models")}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {savedModels.filter(m => m.gender === g).map(model => (
                                <div key={model.id} className="group relative aspect-[2/3] rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all shrink-0">
                                    <img
                                        src={model.thumbUrl || model.url}
                                        className="w-full h-full object-cover"
                                        onClick={() => {
                                            if (setAssets) setAssets(p => ({ ...p, model: model.url }));
                                            if (setAssetsHighRes) setAssetsHighRes(p => ({ ...p, model: null }));
                                            setGender(model.gender);
                                            setActiveLibraryAsset(null);
                                        }}
                                    />
                                    <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white truncate">{model.name}</div>
                                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {deleteSavedModel && <button onClick={(e) => { e.stopPropagation(); deleteSavedModel(model.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>}
                                        {handleEditItemClick && <button onClick={(e) => { e.stopPropagation(); handleEditItemClick('model', model.id); }} className="p-1 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)]"><Edit2 size={10} /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3.5">
            {/* Gender Selection Card */}
            <div className="group/card relative max-w-[135px] mx-auto w-full">
                <div className="relative aspect-square rounded-xl border-2 flex overflow-hidden transition-all duration-500 bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-sm">
                    <button
                        onClick={() => setGender("female")}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-2 transition-all group/fem",
                            gender === 'female'
                                ? "bg-pink-500 text-white shadow-inner"
                                : "bg-transparent text-[var(--text-muted)] hover:bg-pink-500/5 hover:text-pink-500"
                        )}
                    >
                        <TbGenderFemale size={32} className={cn("transition-all duration-500", gender === 'female' ? "scale-110 drop-shadow-md" : "group-hover/fem:scale-110")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{language === "tr" ? "KADIN" : "FEMALE"}</span>
                    </button>

                    <div className="w-[1px] h-full bg-[var(--border-subtle)]" />

                    <button
                        onClick={() => setGender("male")}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-2 transition-all group/male",
                            gender === 'male'
                                ? "bg-blue-500 text-white shadow-inner"
                                : "bg-transparent text-[var(--text-muted)] hover:bg-blue-500/5 hover:text-blue-500"
                        )}
                    >
                        <TbGenderMale size={32} className={cn("transition-all duration-500", gender === 'male' ? "scale-110 drop-shadow-md" : "group-hover/male:scale-110")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{language === "tr" ? "ERKEK" : "MALE"}</span>
                    </button>
                </div>
            </div>

            {/* Model Asset Card */}
            <AssetCard
                id="model"
                label={language === "tr" ? "MANKEN" : "MODEL"}
                icon={TbUserCircle}
                required
                assets={assets}
                activeLibraryAsset={activeLibraryAsset}
                setActiveLibraryAsset={setActiveLibraryAsset}
                handleAssetUpload={handleAssetUpload}
                handleAssetRemove={handleAssetRemove}
                language={language}
                variant="square"
            />
        </div>
    );
}
