"use client";

import React from "react";
import { TbShirt, TbSignature, TbPackage } from "react-icons/tb";
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
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Product Type Selector */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider px-1">
                        {language === "tr" ? "Ürün Tipi" : "Product Type"}
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <TbShirt className="w-3.5 h-3.5 text-[var(--accent-primary)] group-focus-within:scale-110 transition-transform" />
                        </div>
                        <select
                            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] appearance-none transition-all shadow-sm hover:shadow-md font-bold"
                            value={workflowType}
                            onChange={(e) => setWorkflowType(e.target.value as any)}
                        >
                            <option value="upper">{language === "tr" ? "Üst Giyim" : "Upper Body"}</option>
                            <option value="lower">{language === "tr" ? "Alt Giyim" : "Lower Body"}</option>
                            <option value="dress">{language === "tr" ? "Elbise / Tulum" : "Dress / Jumpsuit"}</option>
                            <option value="set">{language === "tr" ? "Takım" : "Set"}</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* Product Name Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider px-1">
                        {language === "tr" ? "Ürün Adı" : "Product Name"}
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <TbSignature className="w-3.5 h-3.5 text-[var(--accent-primary)] group-focus-within:scale-110 transition-transform" />
                        </div>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => {
                                setProductName(e.target.value);
                                setIsManualProductName(true);
                            }}
                            placeholder={language === "tr" ? "Gömlek, Pantolon..." : "Enter name..."}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold placeholder:text-[var(--text-muted)]/50 rounded-xl pl-8 pr-3 py-2.5 focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition-all shadow-sm hover:shadow-md"
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
                className="group relative h-16 rounded-xl border border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-soft)]/30 hover:bg-[var(--accent-soft)] hover:border-[var(--accent-primary)] cursor-pointer flex items-center px-4 gap-3 transition-all duration-300"
            >
                <div className="p-2 rounded-lg bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20 group-hover:scale-110 transition-transform">
                    <TbPackage className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wider">{language === "tr" ? "Ürünleri Yönet" : "Manage Products"}</span>
                    <span className="text-[9px] text-[var(--accent-primary)] font-bold uppercase tracking-tighter opacity-70">
                        {language === "tr" ? "FOTOĞRAF ÇEKİLECEK ÜRÜNLERİ EKLE" : "ADD PRODUCTS TO BE PHOTOGRAPHED"}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[var(--accent-primary)]">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{language === "tr" ? "AÇ" : "OPEN"}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
