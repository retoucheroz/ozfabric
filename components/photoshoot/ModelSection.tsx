"use client";

import React from "react";
import { TbUserCircle, TbGenderFemale, TbGenderMale } from "react-icons/tb";
import { User, X, Edit2, Sparkles } from "lucide-react";
import { AssetCard } from "./AssetCard";
import { cn } from "@/lib/utils";
import { MODEL_PRESETS } from "@/lib/photoshoot-shared";

interface ModelSectionProps {
    language: string;
    gender: string;
    setGender: (val: "male" | "female") => void;
    assets: { [key: string]: string | null };
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (val: any) => void;
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent) => void;
    // For grid view (optional) - these are used in the Library view
    view?: "sidebar" | "library";
    savedModels?: any[];
    deleteSavedModel?: (id: string) => void;
    handleEditItemClick?: (type: string, id: string) => void;
    setAssets?: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
    setAssetsHighRes?: React.Dispatch<React.SetStateAction<{ [key: string]: string | null }>>;
    isAdmin?: boolean;
    addToGlobalLibrary?: (category: string, data: any) => void;
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
    isAdmin,
    addToGlobalLibrary
}: ModelSectionProps) {
    if (view === "library") {
        return (
            <div className="space-y-4">
                {['female', 'male'].map(g => (
                    <div key={g} className="space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                            <User size={12} className={g === 'female' ? 'text-pink-500' : 'text-blue-500'} />
                            {g === 'female' ? (language === "tr" ? "Kadın Stüdyolar" : "Female Studios") : (language === "tr" ? "Erkek Stüdyolar" : "Male Studios")}
                        </h4>
                        <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {[...MODEL_PRESETS, ...savedModels].filter(m => m.gender === g).map(model => {
                                const isPreset = MODEL_PRESETS.some(p => p.id === model.id);
                                return (
                                    <div key={model.id} className="group relative aspect-[2/3] rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all shrink-0">
                                        <img
                                            src={model.thumbUrl || model.url}
                                            className="w-full h-full object-cover"
                                            onClick={() => {
                                                if (setAssets) setAssets(p => ({ ...p, model: model.thumbUrl || model.url }));
                                                if (setAssetsHighRes) setAssetsHighRes(p => ({ ...p, model: model.url }));
                                                setGender(model.gender as any);
                                                setActiveLibraryAsset(null);
                                            }}
                                        />
                                        <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white truncate flex items-center gap-1">
                                            {model.isGlobal && <Sparkles size={8} className="text-amber-400" />}
                                            {model.name}
                                        </div>
                                        <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(!isPreset || (model.isGlobal && isAdmin)) && deleteSavedModel && <button onClick={(e) => { e.stopPropagation(); deleteSavedModel(model.id); }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>}
                                            {!isPreset && handleEditItemClick && <button onClick={(e) => { e.stopPropagation(); handleEditItemClick('model', model.id); }} className="p-1 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-hover)]"><Edit2 size={10} /></button>}
                                            {!model.isGlobal && isAdmin && addToGlobalLibrary && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToGlobalLibrary('model', { ...model, id: undefined, createdAt: Date.now() });
                                                    }}
                                                    className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                                                >
                                                    <Sparkles size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative rounded-3xl border-2 overflow-hidden transition-all duration-500 bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-sm h-[150px] flex flex-col">

                {/* Gender Toggle Tabs */}
                <div className="flex border-b border-[var(--border-subtle)]">
                    <button
                        onClick={() => setGender("female")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                            gender === 'female'
                                ? "bg-pink-500 text-white"
                                : "bg-transparent text-[var(--text-muted)] hover:bg-pink-500/5 hover:text-pink-500"
                        )}
                    >
                        <TbGenderFemale size={16} />
                        {language === "tr" ? "KADIN" : "FEMALE"}
                    </button>
                    <div className="w-[1px] bg-[var(--border-subtle)]" />
                    <button
                        onClick={() => setGender("male")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                            gender === 'male'
                                ? "bg-blue-500 text-white"
                                : "bg-transparent text-[var(--text-muted)] hover:bg-blue-500/5 hover:text-blue-500"
                        )}
                    >
                        <TbGenderMale size={16} />
                        {language === "tr" ? "ERKEK" : "MALE"}
                    </button>
                </div>

                {/* Model Upload Area */}
                <div className="flex-1 [&_.group\/card]:h-full [&_.group\/card>div]:rounded-none [&_.group\/card>div]:border-0 [&_.group\/card>div]:shadow-none [&_.group\/card>div]:h-full">
                    <AssetCard
                        id="model"
                        label={language === "tr" ? "MODEL" : "MODEL"}
                        icon={TbUserCircle}
                        required
                        assets={assets}
                        activeLibraryAsset={activeLibraryAsset}
                        setActiveLibraryAsset={setActiveLibraryAsset}
                        handleAssetUpload={handleAssetUpload}
                        handleAssetRemove={handleAssetRemove}
                        language={language}
                        variant="portrait"
                        description={language === "tr" ? "YÜKLE VEYA SÜRÜKLE" : "UPLOAD OR DRAG"}
                        hideLibrary={false}
                    />
                </div>
            </div>
        </div>
    );
}
