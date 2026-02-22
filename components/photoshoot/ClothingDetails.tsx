"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClothingDetailsProps {
    language: string;
    canShowLegHem: boolean;
    pantLength: string;
    setPantLength: (val: any) => void;
    hasFeet: boolean;
    socksType: string;
    setSocksType: (val: any) => void;
    showGarmentDetails: boolean;
    setShowGarmentDetails: (val: boolean) => void;
}

export function ClothingDetails({
    language,
    canShowLegHem,
    pantLength,
    setPantLength,
    hasFeet,
    socksType,
    setSocksType,
    showGarmentDetails,
    setShowGarmentDetails,
}: ClothingDetailsProps) {
    return (
        <div className="pt-2 mt-4 border-t border-dashed border-[var(--border-subtle)]">
            <button
                onClick={() => setShowGarmentDetails(!showGarmentDetails)}
                className="flex items-center justify-between w-full py-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors group mb-2"
            >
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase group-hover:text-[var(--text-primary)] cursor-pointer">
                    {language === "tr" ? "GİYSİ DETAYLARI" : "GARMENT DETAILS"}
                </label>
                <ChevronDown className={cn("w-3 h-3 text-[var(--text-muted)] transition-transform duration-300", showGarmentDetails && "rotate-180")} />
            </button>

            {showGarmentDetails && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 px-1">
                    {canShowLegHem && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "Paça Uzunluğu" : "Pant Length"}</label>
                            <select className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] font-bold appearance-none cursor-pointer" value={pantLength} onChange={(e) => setPantLength(e.target.value as any)}>
                                <option value="none">-</option>
                                <option value="cropped">{language === "tr" ? "Bileğin Üstünde" : "Cropped"}</option>
                                <option value="ankle">{language === "tr" ? "Bilekte" : "Exact Ankle"}</option>
                                <option value="below_ankle">{language === "tr" ? "Bileğin Hemen Altında" : "Below Ankle"}</option>
                                <option value="full_length">{language === "tr" ? "Topuğa Kadar" : "Full Length"}</option>
                                <option value="deep_break">{language === "tr" ? "Ayakkabının Üstünü Kapatacak" : "Deep Break"}</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
