"use client";

import React, { useRef, useState } from "react";
import { Upload, Trash2, Eye, EyeOff, Library, Plus, Image as ImageIcon, X } from "lucide-react";
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
    assets: { [key: string]: string | string[] | null };
    handleAssetUpload: (id: string, file: File) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent, index?: number) => void;
    language: string;
    lightingSendImage?: boolean;
    setLightingSendImage?: (val: boolean) => void;
    variant?: 'default' | 'square' | 'portrait';
    description?: string;
    orientation?: 'horizontal' | 'vertical';
    hideLibrary?: boolean;
    className?: string;
    allowMultiple?: boolean;
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
    lightingSendImage,
    setLightingSendImage,
    variant = 'default',
    orientation = 'horizontal',
    description,
    hideLibrary = false,
    className,
    allowMultiple = false
}: AssetCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const isActive = activeLibraryAsset === id;

    const handleDirectUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (allowMultiple) {
                (handleAssetUpload as any)(id, Array.from(e.target.files));
            } else {
                handleAssetUpload(id, e.target.files[0]);
            }
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

        const files = Array.from(e.dataTransfer.files);
        if (files && files.length > 0) {
            const imageFiles = files.filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                if (allowMultiple) {
                    (handleAssetUpload as any)(id, imageFiles);
                } else {
                    handleAssetUpload(id, imageFiles[0]);
                }
            } else {
                toast.error(language === "tr" ? "Sadece görsel dosyaları kabul edilir" : "Only image files are accepted");
            }
        }
    };

    const renderEmptyState = () => (
        <div className="flex flex-col items-center gap-2.5 p-3 text-center">
            <div className="p-3.5 rounded-2xl bg-zinc-800/80 text-white border border-white/5 shadow-inner">
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
        </div>
    );

    const renderMultipleThumbnails = (itemImages: string[]) => (
        <div className="relative w-full h-full bg-[var(--bg-elevated)] flex flex-col min-h-[220px]">
            <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 scrollbar-none p-3 pb-16">
                {itemImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl border border-white/5 overflow-hidden group/thumb bg-zinc-900 shadow-inner">
                        <img src={img} className="w-full h-full object-cover transition-all duration-700 group-hover/thumb:scale-110 group-hover/thumb:rotate-1" />
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e, idx); }}
                                className="w-10 h-10 rounded-full bg-red-500 text-white shadow-2xl flex items-center justify-center scale-50 group-hover/thumb:scale-100 transition-all duration-300 hover:bg-red-600"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {itemImages.length < 10 && (
                    <button
                        onClick={handleDirectUploadClick}
                        className="relative aspect-square rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center hover:bg-white/5 hover:border-[var(--accent-primary)]/40 transition-all group/add hover:scale-[0.98] active:scale-95"
                    >
                        <div className="p-3 rounded-full bg-white/5 group-hover/add:bg-[var(--accent-primary)]/10 transition-colors">
                            <Plus size={24} className="text-zinc-600 group-hover/add:text-[var(--accent-primary)] transition-colors" />
                        </div>
                    </button>
                )}
            </div>

            <div className="absolute bottom-3 inset-x-3 bg-zinc-900/95 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 z-20 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            {itemImages.length}/10 {label}
                        </span>
                    </div>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                        {language === "tr" ? "YÜKLENEN KOMBİNLER" : "UPLOADED OUTFITS"}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e); }}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    if (variant === 'portrait') {
        const isModel = id === 'model';
        const isHorizontal = isModel && orientation === 'horizontal';
        const currentAsset = assets[id];

        return (
            <div className="group/card relative w-full h-full">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" multiple={allowMultiple} onChange={handleFileChange} />

                <div
                    className={cn(
                        "relative h-full rounded-3xl border-2 overflow-hidden transition-all duration-500 shadow-sm",
                        currentAsset
                            ? (isHorizontal ? "bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex flex-row items-stretch" : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]")
                            : "bg-[var(--bg-elevated)] border-dashed border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] flex flex-col items-center justify-center cursor-pointer hover:shadow-md",
                        required && !currentAsset && "border-red-500/40 bg-red-500/[0.02]",
                        isDragOver && "scale-[1.02] ring-4 ring-[var(--accent-primary)]/20 border-[var(--accent-primary)] bg-[var(--accent-soft)]"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={currentAsset ? undefined : handleDirectUploadClick}
                >
                    {currentAsset ? (
                        Array.isArray(currentAsset) ? renderMultipleThumbnails(currentAsset as string[]) :
                            isHorizontal ? (
                                <>
                                    {/* New horizontal layout for Model in Step 1 */}
                                    <div className="w-1/2 shrink-0 flex items-center justify-center p-1">
                                        <div
                                            className="relative w-full h-20 rounded-xl overflow-hidden cursor-pointer bg-[var(--bg-surface)] group/thumb"
                                            onClick={handleDirectUploadClick}
                                        >
                                            <img
                                                src={currentAsset as string}
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
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest opacity-80">
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
                                    <img src={currentAsset as string} className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover/image:scale-105" alt={label} />

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
                                                "absolute top-3 left-3 p-2 rounded-xl border transition-all z-20 hover:scale-110",
                                                isActive
                                                    ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/20"
                                                    : "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-white/20 dark:border-white/10 text-zinc-400 hover:text-white hover:border-white/50 shadow-sm"
                                            )}
                                        >
                                            <Library size={16} />
                                        </button>
                                    )}
                                </div>
                            )
                    ) : (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center">
                            <div className="p-3.5 rounded-2xl bg-zinc-800/80 text-white border border-white/5 shadow-inner">
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
                                        "absolute top-3 right-3 p-2 rounded-xl border transition-all z-20 hover:scale-110",
                                        isActive
                                            ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/20"
                                            : "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-white/20 dark:border-white/10 text-zinc-400 hover:text-white hover:border-white/50 shadow-sm"
                                    )}
                                >
                                    <Library size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }


    if (variant === 'square') {
        const currentAsset = assets[id];
        return (
            <div className={cn("group/card relative mx-auto w-full", className || "max-w-[135px]")}>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" multiple={allowMultiple} onChange={handleFileChange} />

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
                    {currentAsset && currentAsset !== "LIGHTING_SET" ? (
                        <div className="relative w-full h-full group/image bg-[var(--bg-elevated)]">
                            <img src={currentAsset as string} className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover/image:scale-105" alt={label} />

                            {/* Persistent Label Overlay when image is loaded */}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-1 py-0.5 border-t border-white/10 z-20">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-white/90 block text-center truncate">
                                    {label}
                                </span>
                            </div>

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                <button
                                    onClick={handleDirectUploadClick}
                                    className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all shadow-lg"
                                >
                                    <ImageIcon size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAssetRemove(id, e); }}
                                    className="p-1.5 rounded-md bg-red-500/80 hover:bg-red-500 text-white transition-all shadow-lg"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : assets[id] === "LIGHTING_SET" ? (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center transition-all group-hover/card:scale-105">
                            <div className="p-3.5 rounded-2xl bg-zinc-800/80 text-white border border-white/5 shadow-inner">
                                {Icon ? <Icon size={24} /> : <Upload size={24} />}
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-primary)] block leading-tight">
                                    {label}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter opacity-80 block">
                                    {language === "tr" ? "PRESET AKTİF" : "PRESET ACTIVE"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2.5 p-3 text-center transition-all group-hover/card:scale-105">
                            <div className="p-3.5 rounded-2xl bg-zinc-800/80 text-white border border-white/5 shadow-inner">
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
                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-white ring-2 ring-black shadow-sm z-30" />
                    )}
                </div>

                {/* Visual Label outside/below for clarity if needed, but currently keeping it inside for "square" feel */}
            </div>
        );
    }

    const currentAsset = assets[id];

    return (
        <div className="space-y-1.5 flex-1 group">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className={cn("w-4 h-4 transition-colors", currentAsset ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />}
                    <label className="text-[11px] uppercase font-black text-[var(--text-primary)] tracking-wider">
                        {label}
                    </label>
                </div>
            </div>

            <div
                className={cn(
                    "relative h-20 rounded-xl border-2 flex items-center overflow-hidden transition-all duration-300",
                    isActive
                        ? "bg-[var(--accent-soft)] border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/20"
                        : currentAsset
                            ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-white shadow-sm"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-white border-dashed",
                    required && !currentAsset && "border-red-500/40 bg-red-500/[0.02]",
                    isDragOver && "ring-2 ring-white border-white bg-white/5 scale-[1.02]"
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
                    multiple={allowMultiple}
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
                    {currentAsset && currentAsset !== "LIGHTING_SET" ? (
                        <div className="relative w-full h-full overflow-hidden bg-[var(--bg-elevated)]">
                            <img src={currentAsset as string} className="w-full h-full object-contain transition-transform duration-500 group-hover/upload:scale-105" alt={label} />
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
