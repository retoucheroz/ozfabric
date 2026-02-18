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
}: ProductSectionProps) {
    const TypeIcon =
        workflowType === 'upper' ? TbShirt :
            workflowType === 'lower' ? PiPantsLight :
                workflowType === 'dress' ? PiDressLight :
                    TbStack2;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
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
                            className="w-full text-sm pl-12 pr-4 py-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] appearance-none transition-all shadow-sm hover:shadow-md font-black uppercase tracking-tight"
                            value={workflowType}
                            onChange={(e) => setWorkflowType(e.target.value as any)}
                        >
                            <option value="upper">{language === "tr" ? "Üst Giyim" : "Upper Body"}</option>
                            <option value="lower">{language === "tr" ? "Alt Giyim" : "Lower Body"}</option>
                            <option value="dress">{language === "tr" ? "Elbise / Tulum" : "Dress / Jumpsuit"}</option>
                            <option value="set">{language === "tr" ? "Takım" : "Set"}</option>
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
                                setProductName(e.target.value);
                                setIsManualProductName(true);
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
                            className="w-full bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-black placeholder:text-[var(--text-muted)]/50 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] outline-none transition-all shadow-sm hover:shadow-md"
                        />
                    </div>
                </div>
            </div>

            {/* Manage Products Button */}
            <div
                onClick={() => {
                    setActiveLibraryAsset('product_group' as any);
                    setActiveGroup('product');
                    setLibraryTab('assets');
                }}
                className="group relative h-24 rounded-2xl border-2 border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-soft)]/20 hover:bg-[var(--accent-soft)]/40 hover:border-[var(--accent-primary)] cursor-pointer flex items-center px-6 gap-5 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.01]"
            >
                <div className="p-4 rounded-xl bg-[var(--accent-primary)] text-white shadow-xl shadow-[var(--accent-primary)]/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <TbPackage className="w-8 h-8" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                    <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">{language === "tr" ? "Ürün Yönetimi" : "Product Management"}</span>
                    <span className="text-[10px] text-[var(--accent-primary)] font-bold uppercase tracking-[0.1em] opacity-80">
                        {language === "tr" ? "FOTOĞRAF ÇEKİLECEK TÜM PARÇALARI EKLE & DÜZENLE" : "ADD & EDIT ALL PIECES TO BE PHOTOGRAPHED"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">{language === "tr" ? "YÖNET" : "MANAGE"}</span>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
