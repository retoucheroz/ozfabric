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
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1 block px-1">
                    {language === "tr" ? "Ürün Tipi" : "Product Type"}
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <TypeIcon className="w-5 h-5 text-[var(--accent-primary)] group-focus-within:scale-110 transition-transform" />
                    </div>
                    <select
                        className="w-full bg-[#121214] rounded-md border border-white/10 text-white text-[13px] font-medium pl-12 pr-4 py-3 focus:border-white/25 focus:outline-none transition-colors duration-150 appearance-none shadow-sm"
                        value={workflowType}
                        onChange={(e) => setWorkflowType(e.target.value as any)}
                    >
                        <option value="upper" className="bg-[#121214]">{language === "tr" ? "Üst Giyim" : "Upper Body"}</option>
                        <option value="lower" className="bg-[#121214]">{language === "tr" ? "Alt Giyim" : "Lower Body"}</option>
                        <option value="dress" className="bg-[#121214]">{language === "tr" ? "Elbise / Tulum" : "Dress / Jumpsuit"}</option>
                        <option value="set" className="bg-[#121214]">{language === "tr" ? "Takım" : "Set"}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
            </div>

            {/* Product Name Input */}
            <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1 block px-1">
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
                        className="w-full bg-[#121214] rounded-md border border-white/10 text-white text-[13px] font-medium placeholder:text-zinc-600 pl-12 pr-4 py-3 focus:border-white/25 focus:outline-none transition-colors duration-150 shadow-sm"
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
