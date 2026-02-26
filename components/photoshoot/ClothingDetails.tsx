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
                                <option value="cropped">{language === "tr" ? "Kısa Paça" : "Cropped"}</option>
                                <option value="standard">{language === "tr" ? "Standart Paça" : "Standard"}</option>
                                <option value="classic">{language === "tr" ? "Klasik Paça" : "Classic"}</option>
                                <option value="covering">{language === "tr" ? "Uzun Paça" : "Covering"}</option>
                                <option value="flare">{language === "tr" ? "İspanyol Paça" : "Flare"}</option>
                            </select>
                        </div>
                    )}

                    {hasFeet && (
                        <div className={cn("space-y-1.5 transition-opacity duration-300", (pantLength === 'covering' || pantLength === 'flare') && "opacity-40 cursor-not-allowed pointer-events-none")}>
                            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                {language === "tr" ? "Çorap Seçeneği" : "Sock Style"}
                                {(pantLength === 'covering' || pantLength === 'flare') && <span className="ml-2 lowercase font-normal italic">({language === "tr" ? "paçalar kapatıyor" : "covered by hem"})</span>}
                            </label>
                            <select
                                className="w-full text-xs p-2.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] font-bold appearance-none cursor-pointer"
                                value={(pantLength === 'covering' || pantLength === 'flare') ? 'none' : socksType}
                                onChange={(e) => setSocksType(e.target.value as any)}
                                disabled={pantLength === 'covering' || pantLength === 'flare'}
                            >
                                <option value="none">{language === "tr" ? "Görünmesin / Yok" : "No Socks / Invisible"}</option>
                                <option value="white">{language === "tr" ? "Beyaz" : "White"}</option>
                                <option value="black">{language === "tr" ? "Siyah" : "Black"}</option>
                                <option value="grey">{language === "tr" ? "Gri" : "Grey"}</option>
                                <option value="navy">{language === "tr" ? "Lacivert" : "Navy"}</option>
                                <option value="beige">{language === "tr" ? "Bej" : "Beige"}</option>
                                <option value="brown">{language === "tr" ? "Kahverengi" : "Brown"}</option>
                                <option value="red">{language === "tr" ? "Kırmızı" : "Red"}</option>
                                <option value="green">{language === "tr" ? "Yeşil" : "Green"}</option>
                                <option value="blue">{language === "tr" ? "Mavi" : "Blue"}</option>
                                <option value="anthracite">{language === "tr" ? "Antrasit" : "Anthracite"}</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
