"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClothingDetailsProps {
    language: string;
    canShowCollarHairButtons: boolean;
    collarType: string;
    setCollarType: (val: any) => void;
    shoulderType: string;
    setShoulderType: (val: any) => void;
    canShowWaistRiseFitTuck: boolean;
    waistType: string;
    setWaistType: (val: any) => void;
    riseType: string;
    setRiseType: (val: any) => void;
    canShowLegHem: boolean;
    legType: string;
    setLegType: (val: any) => void;
    hemType: string;
    setHemType: (val: any) => void;
    hasFeet: boolean;
    socksType: string;
    setSocksType: (val: any) => void;
    showGarmentDetails: boolean;
    setShowGarmentDetails: (val: boolean) => void;
}

export function ClothingDetails({
    language,
    canShowCollarHairButtons,
    collarType,
    setCollarType,
    shoulderType,
    setShoulderType,
    canShowWaistRiseFitTuck,
    waistType,
    setWaistType,
    riseType,
    setRiseType,
    canShowLegHem,
    legType,
    setLegType,
    hemType,
    setHemType,
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
                <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1">
                    {/* Head/Torso Area Options (Collar, Shoulder) */}
                    {canShowCollarHairButtons && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Yaka" : "Collar"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={collarType} onChange={(e) => setCollarType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                    <option value="v-neck">V-Neck</option>
                                    <option value="polo">Polo</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Omuz" : "Shoulder"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={shoulderType} onChange={(e) => setShoulderType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                    <option value="dropped">{language === "tr" ? "Düşük" : "Dropped"}</option>
                                    <option value="padded">{language === "tr" ? "Vatkalı" : "Padded"}</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Waist/Rise Options */}
                    {canShowWaistRiseFitTuck && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Bel" : "Waist"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={waistType} onChange={(e) => setWaistType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                    <option value="elastic">{language === "tr" ? "Lastikli" : "Elastic"}</option>
                                    <option value="high-waisted">{language === "tr" ? "Yüksek Bel" : "High Waisted"}</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Ağ/Yükseklik" : "Rise"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={riseType} onChange={(e) => setRiseType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="low">{language === "tr" ? "Düşük" : "Low"}</option>
                                    <option value="mid">{language === "tr" ? "Orta" : "Mid"}</option>
                                    <option value="high">{language === "tr" ? "Yüksek" : "High"}</option>
                                </select>
                            </div>
                        </>
                    )}

                    {canShowLegHem && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Paça/Bacak" : "Leg"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={legType} onChange={(e) => setLegType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="skinny">Skinny</option>
                                    <option value="straight">{language === "tr" ? "Düz" : "Straight"}</option>
                                    <option value="wide">{language === "tr" ? "Geniş" : "Wide"}</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Paça Bitişi" : "Hem"}</label>
                                <select className="w-full text-[10px] p-1.5 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]" value={hemType} onChange={(e) => setHemType(e.target.value as any)}>
                                    <option value="none">-</option>
                                    <option value="standard">{language === "tr" ? "Standart" : "Standard"}</option>
                                    <option value="cuffed">{language === "tr" ? "Kıvrık" : "Cuffed"}</option>
                                    <option value="raw">{language === "tr" ? "Kesik" : "Raw"}</option>
                                </select>
                            </div>

                            {/* Socks Selection */}
                            {hasFeet && (
                                <div className="col-span-2 space-y-1 pt-1">
                                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Çorap" : "Socks"}</label>
                                    <div className="grid grid-cols-3 gap-1 bg-[var(--bg-surface)] p-1 rounded border border-[var(--border-subtle)]">
                                        {['none', 'white', 'black'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSocksType(s as any)}
                                                className={cn(
                                                    "text-[9px] py-1 rounded transition-all",
                                                    socksType === s
                                                        ? "bg-[var(--bg-elevated)] shadow-sm font-bold text-[var(--accent-primary)]"
                                                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                                                )}
                                            >
                                                {s === 'none' ? (language === 'tr' ? 'Yok' : 'None') : s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
