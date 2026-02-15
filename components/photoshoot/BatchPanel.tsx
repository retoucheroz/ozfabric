"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";

interface BatchShot {
    id: string;
    label: string;
    labelEn: string;
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
}

export function BatchPanel({
    language,
    batchMode,
    setBatchMode,
    productCode,
    setProductCode,
    availableBatchShots,
    batchShotSelection,
    setBatchShotSelection,
}: BatchPanelProps) {
    return (
        <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-blue-600 uppercase">MAVI EU BATCH</label>
                <Switch checked={batchMode} onCheckedChange={setBatchMode} />
            </div>
            {batchMode && (
                <div className="space-y-3 animate-in slide-in-from-top-1 duration-200">
                    <input
                        type="text"
                        className="w-full text-xs p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-background placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                        placeholder="Product Code (e.g. MAV-01)"
                    />

                    {/* SHOT SELECTION LIST */}
                    <div className="space-y-1.5">
                        {availableBatchShots.map((shot, idx) => {
                            const isSelected = batchShotSelection[shot.id] ?? true;
                            const imageTitle = productCode ? `${productCode}_image_${String(idx + 1).padStart(3, '0')}` : `image_${String(idx + 1).padStart(3, '0')}`;
                            return (
                                <div
                                    key={shot.id}
                                    onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
                                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200 group ${isSelected
                                        ? 'bg-blue-950/40 border border-blue-700/40'
                                        : 'bg-background/30 border border-transparent opacity-50 hover:opacity-70'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="w-3.5 h-3.5 rounded border-blue-400 text-blue-600 focus:ring-blue-500 shrink-0 pointer-events-none"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-medium text-foreground truncate">
                                            {language === 'tr' ? shot.label : shot.labelEn}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-blue-400' : 'text-muted-foreground'
                                        }`}>
                                        {imageTitle}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded ${isSelected
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-zinc-500 bg-zinc-500/10'
                                        }`}>
                                        {isSelected
                                            ? (language === 'tr' ? 'Üretilecek' : 'Generate')
                                            : (language === 'tr' ? 'Atlanacak' : 'Skip')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
