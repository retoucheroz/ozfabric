"use client";

import React, { useRef, useState } from "react";
import { Upload, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AssetCardProps {
    id: string;
    label: string;
    icon: any;
    required?: boolean;
    activeLibraryAsset: string | null;
    setActiveLibraryAsset: (id: any) => void;
    assets: { [key: string]: string | null };
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent) => void;
    language: string;
    convertToStickman?: () => void;
    lightingSendImage?: boolean;
    setLightingSendImage?: (val: boolean) => void;
}

export function AssetCard({
    id,
    label,
    icon: Icon,
    required = false,
    activeLibraryAsset,
    setActiveLibraryAsset,
    assets,
    handleAssetUpload,
    handleAssetRemove,
    language,
    convertToStickman,
    lightingSendImage,
    setLightingSendImage,
}: AssetCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const isActive = activeLibraryAsset === id;

    const handleDirectUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleAssetUpload(id, e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleAssetUpload(id, file);
            } else {
                toast.error(language === "tr" ? "Sadece görsel dosyaları kabul edilir" : "Only image files are accepted");
            }
        }
    };

    return (
        <div className="space-y-1.5 flex-1 group">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className={cn("w-3 h-3 transition-colors", assets[id] ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />}
                    <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider">
                        {label}
                    </label>
                </div>
            </div>

            <div
                className={cn(
                    "relative h-16 rounded-xl border flex items-center overflow-hidden transition-all duration-300",
                    isActive
                        ? "bg-[var(--accent-soft)] border-[var(--accent-primary)] shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-[var(--accent-primary)]/20"
                        : assets[id]
                            ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)] shadow-sm"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)] border-dashed",
                    required && !assets[id] && "border-red-500/40 bg-red-500/[0.02]",
                    isDragOver && "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20 scale-[1.02]"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Hidden File Input */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Left side: Upload/Preview Toggle */}
                <div
                    className={cn(
                        "h-full w-14 flex items-center justify-center border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:bg-[var(--accent-soft)] transition-colors relative group/upload",
                        assets[id] ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    )}
                    onClick={handleDirectUploadClick}
                >
                    {assets[id] ? (
                        <div className="relative w-full h-full overflow-hidden">
                            <img src={assets[id]!} className="w-full h-full object-cover transition-transform duration-500 group-hover/upload:scale-110" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <Upload className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                    ) : (
                        <Upload className="w-5 h-5 transition-transform duration-300 group-hover/upload:scale-110" />
                    )}
                </div>

                {/* Middle/Right side: Library / Status */}
                <div
                    className="flex-1 h-full px-3 flex items-center justify-between cursor-pointer group/content"
                    onClick={() => setActiveLibraryAsset(isActive ? null : id as any)}
                >
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn(
                            "text-[11px] font-bold truncate transition-colors",
                            assets[id] ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover/content:text-[var(--accent-primary)]"
                        )}>
                            {assets[id] ? (language === "tr" ? "Seçildi" : "Selected") : (language === "tr" ? "Kütüphane" : "Library")}
                        </span>
                        {assets[id] && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-[var(--accent-primary)] font-black uppercase tracking-widest opacity-70">
                                    {language === "tr" ? "DEĞİŞTİR" : "CHANGE"}
                                </span>
                                {id === 'pose' && !assets[id]?.includes('fal.media') && convertToStickman && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); convertToStickman(); }}
                                        className="p-0.5 rounded hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                        title="Stickman"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {id === 'lighting' && assets[id] && setLightingSendImage && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightingSendImage(!lightingSendImage); }}
                                className={cn("p-1 rounded transition-all", lightingSendImage ? "text-[var(--accent-primary)]" : "text-[var(--text-disabled)]")}
                            >
                                {lightingSendImage ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                        )}
                        {assets[id] && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e); }}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
