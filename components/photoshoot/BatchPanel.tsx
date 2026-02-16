"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BatchShot {
    id: string;
    label: string;
    labelEn: string;
    descriptionTr?: string;
    descriptionEn?: string;
    image?: string;
}

interface BatchPanelProps {
    language: string;
    batchMode: boolean;
    setBatchMode: (val: boolean) => void;
    productCode: string;
    setProductCode: (val: string) => void;
    availableBatchShots: BatchShot[];
    batchShotSelection: Record<string, boolean>;
    setBatchShotSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isAdmin?: boolean;
    isMaviBatch?: boolean;
    setIsMaviBatch?: (val: boolean) => void;
    stylingSideOnly: Record<string, boolean>;
    setStylingSideOnly: (val: Record<string, boolean>) => void;
}

export function BatchPanel({
    language,
    productCode,
    setProductCode,
    availableBatchShots,
    batchShotSelection,
    setBatchShotSelection,
    isAdmin,
    isMaviBatch,
    setIsMaviBatch,
    stylingSideOnly,
    setStylingSideOnly,
}: BatchPanelProps) {
    const isMaviActive = isAdmin && isMaviBatch;

    return (
        <div className={cn(
            "p-4 rounded-2xl border transition-all duration-300 space-y-4",
            isMaviActive
                ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900"
                : "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
        )}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
                        {language === 'tr' ? 'Toplu Üretim Ayarları' : 'Batch Production Settings'}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                        {language === 'tr' ? 'Görsel isimlendirme ve açı seçimleri' : 'Image naming and angle selections'}
                    </p>
                </div>
                {isAdmin && setIsMaviBatch && (
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">MAVI EU BATCH</label>
                        <Switch checked={isMaviBatch} onCheckedChange={setIsMaviBatch} />
                    </div>
                )}
            </div>

            <div className="space-y-3 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">
                        {language === 'tr' ? 'İsimlendirme Şablonu (Prefix)' : 'Naming Template (Prefix)'}
                    </label>
                    <input
                        type="text"
                        className={cn(
                            "w-full text-sm p-3 rounded-xl border transition-all duration-200 outline-none",
                            isMaviActive
                                ? "border-blue-200 dark:border-blue-800 bg-white dark:bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/10"
                        )}
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        placeholder={language === 'tr' ? "Örn: 23132_6546_image_" : "e.g. 23132_6546_image_"}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase ml-1">
                        {language === 'tr' ? 'Açı ve Kare Seçimleri' : 'Angle and Shot Selection'}
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                        {availableBatchShots.map((shot, idx) => {
                            const isSelected = batchShotSelection[shot.id] ?? false;
                            const imageTitle = productCode ? `${productCode}${idx + 1}` : `image_${idx + 1}`;
                            const hasSideOption = shot.id.includes('styling');

                            return (
                                <div
                                    key={shot.id}
                                    className={cn(
                                        "relative aspect-square rounded-lg border transition-all duration-300 overflow-hidden group cursor-pointer",
                                        isSelected
                                            ? (isMaviActive ? "border-blue-500 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10" : "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/5")
                                            : "border-transparent opacity-40 grayscale hover:opacity-80 hover:grayscale-0 bg-[var(--bg-elevated)]"
                                    )}
                                    onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
                                >
                                    {/* Square Image Container */}
                                    <div className="w-full h-full relative">
                                        {shot.image ? (
                                            <img
                                                src={shot.image}
                                                alt={shot.label}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-4 h-4 rounded-full border border-[var(--text-muted)] opacity-20" />
                                            </div>
                                        )}

                                        {/* Label Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                                            <p className="text-[7.5px] font-black text-white truncate leading-tight uppercase tracking-tighter">
                                                {language === 'tr' ? shot.label : shot.labelEn}
                                            </p>
                                        </div>

                                        {/* Selection Checkbox Overlay */}
                                        <div className="absolute top-1 left-1 pointer-events-none">
                                            <div className={cn(
                                                "w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-all",
                                                isSelected
                                                    ? (isMaviActive ? "bg-blue-600 border-blue-400 text-white" : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white")
                                                    : "bg-white/20 border-white/40 text-transparent"
                                            )}>
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
                                        </div>

                                        {/* Side Option Overlay */}
                                        {hasSideOption && isSelected && (
                                            <div
                                                className="absolute top-1 right-1 flex items-center gap-0.5 px-0.5 py-0.5 rounded-sm bg-black/40 backdrop-blur-md border border-white/10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-[5px] font-black text-white leading-none">SIDE</span>
                                                <Switch
                                                    className="scale-[0.4] origin-right"
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
            </div>
        </div>
    );
}
