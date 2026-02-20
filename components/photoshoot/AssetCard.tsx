"use client";

import React, { useRef, useState } from "react";
import { Upload, Trash2, Eye, EyeOff, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    variant?: 'default' | 'square' | 'portrait';
    description?: string;
    orientation?: 'horizontal' | 'vertical';
    hideLibrary?: boolean;
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
    variant = 'default',
    orientation = 'horizontal',
    description,
    hideLibrary = false
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

    if (variant === 'portrait') {
        const isModel = id === 'model';
        const isHorizontal = isModel && orientation === 'horizontal';

        return (
            <div className="group/card relative w-full h-full">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                <div
                    className={cn(
                        "relative h-full rounded-3xl border-2 overflow-hidden transition-all duration-500 shadow-sm",
                        assets[id]
                            ? (isHorizontal ? "bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex flex-row items-stretch" : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]")
                            : "bg-[var(--bg-elevated)] border-dashed border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] flex flex-col items-center justify-center cursor-pointer hover:shadow-md",
                        required && !assets[id] && "border-red-500/40 bg-red-500/[0.02]",
                        isDragOver && "scale-[1.02] ring-4 ring-[var(--accent-primary)]/20 border-[var(--accent-primary)] bg-[var(--accent-soft)]"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={assets[id] ? undefined : handleDirectUploadClick}
                >
                    {assets[id] ? (
                        isHorizontal ? (
                            <>
                                {/* New horizontal layout for Model in Step 1 */}
                                <div className="w-1/2 shrink-0 flex items-center justify-center p-1">
                                    <div
                                        className="relative w-full h-20 rounded-xl overflow-hidden cursor-pointer bg-[var(--bg-surface)] group/thumb"
                                        onClick={handleDirectUploadClick}
                                    >
                                        <img
                                            src={assets[id]!}
                                            className="absolute inset-0 w-full h-full object-contain scale-[1.5] transition-transform duration-500 group-hover/thumb:scale-[1.6]"
                                            alt={label}
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                            <Upload size={14} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-row items-center justify-between px-2 py-2 min-w-0">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)] truncate">
                                            {label}
                                        </span>
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest opacity-80">
                                            {language === "tr" ? "SEÇİLDİ" : "SELECTED"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        {!hideLibrary && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveLibraryAsset(isActive ? null : id as any); }}
                                                className={cn(
                                                    "p-2 rounded-lg border shadow-sm transition-all hover:scale-110",
                                                    isActive
                                                        ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                                        : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-primary)]"
                                                )}
                                            >
                                                <Library size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e); }}
                                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:scale-110"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ORIGINAL vertical layout for Step 2 and others */
                            <div className="relative w-full h-full group/image bg-[var(--bg-elevated)] min-h-[140px]">
                                <img src={assets[id]!} className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover/image:scale-105" alt={label} />

                                <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg border border-white/20 backdrop-blur-md" onClick={handleDirectUploadClick}>
                                        <Upload size={12} />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg shadow-lg" onClick={(e) => handleAssetRemove(id, e)}>
                                        <Trash2 size={12} />
                                    </Button>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-2 py-1.5 border-t border-white/10 z-20">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 block text-center truncate">
                                        {label}
                                    </span>
                                </div>

                                {/* Library Toggle for original layout */}
                                {!hideLibrary && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveLibraryAsset(isActive ? null : id as any);
                                        }}
                                        className={cn(
                                            "absolute top-3 left-3 p-1.5 rounded-lg border shadow-lg transition-all z-20 hover:scale-110",
                                            isActive
                                                ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                                : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] shadow-sm"
                                        )}
                                    >
                                        <Library size={14} />
                                    </button>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center">
                            <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)]/50 text-[var(--accent-primary)] shadow-inner">
                                {Icon ? <Icon size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[11px] font-black uppercase tracking-wide text-black dark:text-white block leading-tight">
                                    {label}
                                </span>
                                <span className="text-[9px] font-black text-[var(--accent-primary)] uppercase tracking-tighter block opacity-80 group-hover/card:opacity-100 transition-opacity">
                                    {description || (language === "tr" ? "YÜKLE VEYA SÜRÜKLE" : "UPLOAD OR DRAG")}
                                </span>
                            </div>

                            {/* Library Trigger Button for empty state */}
                            {!hideLibrary && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveLibraryAsset(isActive ? null : id as any);
                                    }}
                                    className={cn(
                                        "absolute top-3 right-3 p-1.5 rounded-lg border shadow-lg transition-all z-20 hover:scale-110",
                                        isActive
                                            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-primary)]"
                                    )}
                                >
                                    <Library size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }


    if (variant === 'square') {
        return (
            <div className="group/card relative max-w-[135px] mx-auto w-full">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                {/* Main Card Area: Click to Upload / Drag & Drop */}
                <div
                    className={cn(
                        "relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 cursor-pointer shadow-sm hover:shadow-md",
                        assets[id] ? "bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
                            : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] border-dashed hover:border-[var(--accent-primary)]",
                        required && !assets[id] && "border-red-500/40 bg-red-500/[0.02]",
                        isDragOver && "scale-[1.02] ring-4 ring-[var(--accent-primary)]/20 border-[var(--accent-primary)] bg-[var(--accent-soft)]"
                    )}
                    onClick={handleDirectUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {assets[id] && assets[id] !== "LIGHTING_SET" ? (
                        <div className="relative w-full h-full group/image bg-[var(--bg-elevated)]">
                            <img src={assets[id]!} className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover/image:scale-105" alt={label} />

                            {/* Persistent Label Overlay when image is loaded */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-2 py-1.5 border-t border-white/10 z-20">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 block text-center truncate">
                                    {label}
                                </span>
                            </div>

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10 pb-6">
                                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg shadow-lg hover:scale-110 transition-transform" onClick={handleDirectUploadClick}>
                                    <Upload size={12} />
                                </Button>
                                <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg shadow-lg hover:scale-110 transition-transform" onClick={(e) => handleAssetRemove(id, e)}>
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        </div>
                    ) : assets[id] === "LIGHTING_SET" ? (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center transition-all group-hover/card:scale-105">
                            <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)]/50 text-[var(--accent-primary)] shadow-inner">
                                {Icon ? <Icon size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-primary)] block leading-tight">
                                    {label}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter opacity-80 block">
                                    {language === "tr" ? "PRESET AKTİF" : "PRESET ACTIVE"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center transition-all group-hover/card:scale-105">
                            <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)]/50 text-[var(--accent-primary)] shadow-inner">
                                {Icon ? <Icon size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-primary)] block leading-tight">
                                    {label}
                                </span>
                                <span className="text-[9px] font-bold text-[var(--accent-primary)] uppercase tracking-tighter opacity-80 block group-hover/card:text-[var(--accent-primary)] transition-colors">
                                    {language === "tr" ? "YÜKLE VEYA SÜRÜKLE" : "UPLOAD OR DROP"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Library Trigger Button: Floating in the corner or bottom */}
                    {!hideLibrary && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveLibraryAsset(isActive ? null : id as any);
                            }}
                            className={cn(
                                "absolute top-2 right-2 p-1.5 rounded-lg border shadow-lg transition-all z-20 hover:scale-110 active:scale-95",
                                isActive
                                    ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white ring-2 ring-[var(--accent-primary)]/30"
                                    : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                            )}
                            title={language === "tr" ? "Kütüphaneden Seç" : "Select from Library"}
                        >
                            <Library size={14} />
                        </button>
                    )}

                    {/* Status indicator for selected library asset */}
                    {assets[id] && !isActive && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm z-30" />
                    )}
                </div>

                {/* Visual Label outside/below for clarity if needed, but currently keeping it inside for "square" feel */}
            </div>
        );
    }

    return (
        <div className="space-y-1.5 flex-1 group">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className={cn("w-4 h-4 transition-colors", assets[id] ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />}
                    <label className="text-[11px] uppercase font-black text-[var(--text-primary)] tracking-wider">
                        {label}
                    </label>
                </div>
            </div>

            <div
                className={cn(
                    "relative h-20 rounded-xl border-2 flex items-center overflow-hidden transition-all duration-300",
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
                        "h-full w-16 flex items-center justify-center border-r-2 border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer hover:bg-[var(--accent-soft)] transition-colors relative group/upload",
                        assets[id] ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    )}
                    onClick={handleDirectUploadClick}
                >
                    {assets[id] && assets[id] !== "LIGHTING_SET" ? (
                        <div className="relative w-full h-full overflow-hidden bg-[var(--bg-elevated)]">
                            <img src={assets[id]!} className="w-full h-full object-contain transition-transform duration-500 group-hover/upload:scale-105" alt={label} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                <Upload className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    ) : assets[id] === "LIGHTING_SET" ? (
                        <div className="flex items-center justify-center w-full h-full bg-[var(--accent-soft)]/30">
                            {Icon ? <Icon className="w-6 h-6 text-[var(--accent-primary)]" /> : <Upload className="w-6 h-6 text-[var(--accent-primary)]" />}
                        </div>
                    ) : (
                        <Upload className="w-6 h-6 transition-transform duration-300 group-hover/upload:scale-110" />
                    )}
                </div>

                {/* Middle/Right side: Library / Status */}
                <div
                    className="flex-1 h-full px-4 flex items-center justify-between cursor-pointer group/content"
                    onClick={!hideLibrary ? (() => setActiveLibraryAsset(isActive ? null : id as any)) : undefined}
                >
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn(
                            "text-xs font-black uppercase tracking-tight truncate transition-colors",
                            assets[id] ? "text-[var(--text-primary)]" : (!hideLibrary ? "text-[var(--text-muted)] group-hover/content:text-[var(--accent-primary)]" : "text-[var(--text-muted)]")
                        )}>
                            {assets[id] ? (language === "tr" ? "GÖRSEL SEÇİLDİ" : "IMAGE SELECTED") : (language === "tr" ? "YÜKLE" : "UPLOAD")}
                        </span>
                        {!hideLibrary && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-[var(--accent-primary)] font-black uppercase tracking-widest opacity-70">
                                    {assets[id] ? (language === "tr" ? "DEĞİŞTİR" : "CHANGE") : (language === "tr" ? "SEÇİM YAP" : "SELECT")}
                                </span>
                                {id === 'pose' && !assets[id]?.includes('fal.media') && convertToStickman && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); convertToStickman(); }}
                                        className="p-1 rounded bg-[var(--accent-primary)] text-white hover:scale-110 transition-transform shadow-sm"
                                        title="Stickman"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {id === 'lighting' && assets[id] && setLightingSendImage && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightingSendImage(!lightingSendImage); }}
                                className={cn("p-1.5 rounded transition-all shadow-sm", lightingSendImage ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-disabled)]")}
                            >
                                {lightingSendImage ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                        )}
                        {assets[id] && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e); }}
                                className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
