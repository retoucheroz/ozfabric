"use client";

import React from "react";
import { TbShirt, TbSignature, TbPackage, TbBox, TbStack2 } from "react-icons/tb";
import { PiDressLight, PiPantsLight } from "react-icons/pi";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSectionProps {
    language: string;
    workflowType: string;
    setWorkflowType: (val: "upper" | "lower" | "dress" | "set") => void;
    productName: string;
    setProductName: (val: string) => void;
    setIsManualProductName: (val: boolean) => void;
    setActiveLibraryAsset: (val: any) => void;
    setActiveGroup: (val: 'product' | 'accessories' | null) => void;
    setLibraryTab: (val: string) => void;
    children?: React.ReactNode;
}

export function ProductSection({
    language,
    workflowType,
    setWorkflowType,
    productName,
    setProductName,
    setIsManualProductName,
    setActiveLibraryAsset,
    setActiveGroup,
    setLibraryTab,
    children
}: ProductSectionProps) {
    const TypeIcon =
        workflowType === 'upper' ? TbShirt :
            workflowType === 'lower' ? PiPantsLight :
                workflowType === 'dress' ? PiDressLight :
                    TbStack2;

    return (
        <div className="flex flex-col gap-4 py-1">
            {/* Product Type Selector */}
            <div className="space-y-2">
                <label className="text-[11px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] px-1">
                    {language === "tr" ? "Ürün Tipi" : "Product Type"}
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <TypeIcon className="w-5 h-5 text-[var(--accent-primary)] group-focus-within:scale-110 transition-transform" />
                    </div>
                    <select
                        className="w-full text-sm pl-12 pr-4 py-4 rounded-2xl bg-zinc-900/50 border-2 border-white/5 text-zinc-100 focus:ring-2 focus:ring-white/10 focus:border-white/20 appearance-none transition-all shadow-sm hover:shadow-md font-black uppercase tracking-tight"
                        value={workflowType}
                        onChange={(e) => setWorkflowType(e.target.value as any)}
                    >
                        <option value="upper" className="bg-zinc-900">{language === "tr" ? "Üst Giyim" : "Upper Body"}</option>
                        <option value="lower" className="bg-zinc-900">{language === "tr" ? "Alt Giyim" : "Lower Body"}</option>
                        <option value="dress" className="bg-zinc-900">{language === "tr" ? "Elbise / Tulum" : "Dress / Jumpsuit"}</option>
                        <option value="set" className="bg-zinc-900">{language === "tr" ? "Takım" : "Set"}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
            </div>

            {/* Product Name Input */}
            <div className="space-y-2">
                <label className="text-[11px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] px-1">
                    {language === "tr" ? "Ürün Adı" : "Product Name"}
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <TbSignature className="w-5 h-5 text-[var(--accent-primary)] group-focus-within:scale-110 transition-transform" />
                    </div>
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                            const val = e.target.value;
                            setProductName(val);
                            setIsManualProductName(true);

                            // Auto-detect Product Type
                            const n = val.toLowerCase();
                            const upperKeywords = ["gömlek", "shirt", "t-shirt", "tişört", "kazak", "sweater", "hırka", "cardigan", "ceket", "jacket", "mont", "kaban", "coat", "bluz", "blouse", "atlet", "tank", "vest", "yelek"];
                            const lowerKeywords = ["pantolon", "pants", "jean", "kot", "şort", "shorts", "etek", "skirt", "tayt", "leggings", "jogger", "chino"];
                            const dressKeywords = ["elbise", "dress", "tulum", "jumpsuit", "salopet"];
                            const setKeywords = ["takım", "suit", "pijama", "set", "eşofman takımı"];

                            if (dressKeywords.some(k => n.includes(k))) setWorkflowType("dress");
                            else if (setKeywords.some(k => n.includes(k))) setWorkflowType("set");
                            else if (lowerKeywords.some(k => n.includes(k))) setWorkflowType("lower");
                            else if (upperKeywords.some(k => n.includes(k))) setWorkflowType("upper");
                        }}
                        onBlur={async () => {
                            if (productName && productName.trim().length > 2) {
                                try {
                                    const res = await fetch("/api/translate", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ text: productName, targetLanguage: 'en' })
                                    });
                                    const data = await res.json();
                                    if (data.translation && data.translation.toLowerCase() !== productName.toLowerCase()) {
                                        setProductName(data.translation);
                                    }
                                } catch (e) {
                                    console.error("Auto-translate failed", e);
                                }
                            }
                        }}
                        placeholder={language === "tr" ? "Gömlek, Pantolon..." : "Enter name..."}
                        className="w-full bg-zinc-900/50 border-2 border-white/5 text-zinc-100 text-sm font-black placeholder:text-zinc-500 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-white/10 focus:border-white/20 outline-none transition-all shadow-sm hover:shadow-md"
                    />
                </div>
            </div>

            {/* Model Section (children) */}
            <div className="w-full">
                {children}
            </div>

        </div>
    );
}
