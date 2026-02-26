"use client";

import React from "react";
import { Camera, Loader2, Maximize2, Download, Eraser, Plus, FileText, Share2, Sparkles, Layers, Info, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreviewAreaProps {
    language: string;
    isProcessing: boolean;
    isGenerationSuccess: boolean;
    resultImages: any[] | null;
    router: any;
    StudioSteps: React.ComponentType<{ language: string; isSuccess: boolean }>;
    handleGenerate: () => void;
    handleBatchGenerate: () => void;
    batchMode: boolean;
    productCode: string;
    estimatedCost: number;
    isStoppingBatch?: boolean;
    handleStopBatch?: () => void;
    handleRegenerateShot?: (index: number) => void;
    isAdmin?: boolean;
}

export function PreviewArea({
    language,
    isProcessing,
    isGenerationSuccess,
    resultImages,
    router,
    StudioSteps,
    handleGenerate,
    handleBatchGenerate,
    batchMode,
    productCode,
    estimatedCost,
    isStoppingBatch,
    handleStopBatch,
    handleRegenerateShot,
    isAdmin
}: PreviewAreaProps) {
    const [debugImage, setDebugImage] = React.useState<any>(null);

    const generateButton = (
        <div className="w-full max-w-md mb-6 space-y-2">
            <Button
                size="lg"
                className={cn(
                    "w-full shadow-lg transition-all duration-300",
                    "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] shadow-[var(--accent-primary)]/20 text-white"
                )}
                onClick={() => batchMode ? handleBatchGenerate() : handleGenerate()}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === "tr" ? "ÜRETİLİYOR..." : "GENERATING..."}
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        {language === "tr" ? "ÜRETİMİ BAŞLAT" : "START PRODUCTION"}
                    </span>
                )}
            </Button>
            {!isProcessing && (
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest py-1">
                    <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {language === 'tr' ? `Tahmini Maliyet: ${estimatedCost} Kredi` : `ESTIMATED COST: ${estimatedCost} CREDITS`}
                    </span>
                </div>
            )}
        </div>
    );

    const stopButton = isProcessing && handleStopBatch && (
        <Button
            variant="outline"
            size="sm"
            onClick={handleStopBatch}
            disabled={isStoppingBatch}
            className="mb-6 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold uppercase tracking-widest text-[10px]"
        >
            {isStoppingBatch ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {language === "tr" ? "Durduruluyor..." : "Stopping..."}
                </span>
            ) : (
                <span className="flex items-center gap-2">
                    <Eraser className="w-4 h-4" />
                    {language === "tr" ? "Üretimi Durdur" : "Stop Production"}
                </span>
            )}
        </Button>
    );

    // 1. If currently processing AND no images yet -> Show full screen loader
    if (isProcessing && (!resultImages || resultImages.length === 0)) {
        return (
            <div className="flex-1 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center justify-center">
                <div className="h-full flex flex-col items-center justify-center space-y-8 my-auto w-full max-w-md animate-in fade-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] rounded-2xl shadow-2xl flex items-center justify-center border border-[var(--border-subtle)]">
                            <Camera className="w-10 h-10 text-[var(--accent-primary)]" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        </div>
                    </div>

                    <StudioSteps language={language} isSuccess={isGenerationSuccess} />

                    <div className="w-full max-w-xs">
                        <div className="h-1.5 w-full bg-[var(--bg-elevated)] overflow-hidden rounded-full shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-pink-500 to-[var(--accent-primary)] rounded-full"
                                style={{
                                    width: '100%',
                                    animation: 'shimmer 2s linear infinite',
                                    backgroundSize: '200% 100%'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
                {stopButton}
                {!stopButton && generateButton}
            </div>
        );
    }

    // 2. If we have images (Final OR Incremental)
    if (resultImages && resultImages.length > 0) {
        return (
            <div className="flex-1 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center">
                {/* Header for Batch Progress */}
                {isProcessing && (
                    <div className="w-full max-w-2xl mb-8 p-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-primary)]/20 flex items-center justify-between animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--accent-primary)] text-white shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                    {language === "tr" ? "Üretim Devam Ediyor" : "Production in Progress"}
                                </h3>
                                <p className="text-[10px] font-bold text-[var(--accent-primary)] opacity-80 uppercase tracking-tighter">
                                    {language === "tr" ? `${resultImages.length} görsel üretildi, devamı geliyor...` : `${resultImages.length} images generated, more coming...`}
                                </p>
                            </div>
                        </div>
                        {stopButton}
                    </div>
                )}

                <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                        {resultImages.map((img: any, i: number) => {
                            const url = typeof img === 'string' ? img : img.url;
                            const filename = typeof img === 'string' ? `angle_${i}_${Date.now()}.png` : img.filename;
                            const downloadName = typeof img === 'string' ? `angle_${i}_${Date.now()}.png` : (img.downloadName || img.filename);

                            return (
                                <div key={i} className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] group animate-in zoom-in-95 duration-500">
                                    <img src={url} className="w-full h-full object-cover" />

                                    {/* View Title Overlay */}
                                    {img.viewName && (
                                        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">
                                                {img.viewName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const response = await fetch(url);
                                                    const blob = await response.blob();
                                                    const blobUrl = URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = blobUrl;
                                                    link.download = downloadName;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    URL.revokeObjectURL(blobUrl);
                                                } catch (err) {
                                                    // Fallback to new tab if fetch fails (e.g. CORS)
                                                    window.open(url, '_blank');
                                                }
                                            }}
                                            title="Download"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </Button>

                                        {isAdmin && (
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDebugImage(img);
                                                }}
                                                title="Debug Info"
                                            >
                                                <Info className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                    {
                                        (typeof img === 'object' && img.filename) && (
                                            <div className="absolute bottom-0 inset-x-0 p-2 bg-black/40 backdrop-blur-sm text-[8px] text-white font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                                                <span>{img.filename.replace('.jpg', '').replace('.png', '')}</span>
                                            </div>
                                        )
                                    }
                                    {
                                        img.requestPayload && handleRegenerateShot && !isProcessing && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                                <Button
                                                    onClick={() => handleRegenerateShot(i)}
                                                    className="bg-white/90 hover:bg-white text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-xl transform hover:scale-105 transition-all"
                                                >
                                                    <Zap className="w-4 h-4 mr-2" />
                                                    {language === 'tr' ? 'Tekrar Üret' : 'Regenerate'}
                                                </Button>
                                            </div>
                                        )
                                    }
                                </div>
                            );
                        })}

                        {/* Placeholder for next image if still processing */}
                        {isProcessing && (
                            <div className="relative aspect-[2/3] rounded-xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 flex flex-col items-center justify-center gap-3 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] flex items-center justify-center shadow-inner">
                                    <Camera className="w-5 h-5 text-[var(--accent-primary)] animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center px-4">
                                    {language === "tr" ? "Sıradaki Kare Hazırlanıyor..." : "Readying Next Shot..."}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {
                    !isProcessing && (
                        <div className="w-full max-w-2xl pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">{language === "tr" ? "TOPLAM GÖRSEL" : "TOTAL IMAGES"}</span>
                                    <span className="text-sm font-black text-[var(--text-primary)]">{resultImages.length}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {generateButton}
                            </div>
                        </div>
                    )
                }
                {/* Debug Info Dialog */}
                {isAdmin && debugImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-[var(--bg-surface)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-blue-500" />
                                    <h3 className="font-black text-sm uppercase tracking-widest">{debugImage.viewName || "DEBUG INFO"}</h3>
                                </div>
                                <button onClick={() => setDebugImage(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-2">Final Prompt</label>
                                    <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] text-xs font-medium leading-relaxed font-mono whitespace-pre-wrap">
                                        {debugImage.prompt || "No prompt stored"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-[0.2em] block mb-2">Input Assets</label>
                                    <div className="flex flex-wrap gap-2">
                                        {debugImage.inputAssets?.length > 0 ? debugImage.inputAssets.map((asset: string) => (
                                            <span key={asset} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full text-[10px] font-bold uppercase tracking-tighter">
                                                {asset}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-[var(--text-muted)] italic">No specific asset list stored</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex justify-end">
                                <Button size="sm" onClick={() => setDebugImage(null)} className="font-bold uppercase tracking-widest text-[10px]">Close</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        );
    }

    // Default: Nothing produced yet
    return (
        <div className="flex-1 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="max-w-md space-y-4 mb-8">
                <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--accent-primary)] ring-8 ring-[var(--accent-soft)]">
                    <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                    {language === "tr" ? "Stüdyo Hazır" : "Studio Ready"}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                    {language === "tr"
                        ? "Sol taraftaki ayarları kullanarak fotoğraf çekimi parametrelerini belirleyin."
                        : "Use the settings on the left to define photoshoot parameters."}
                </p>
            </div>
            {generateButton}
        </div>
    );
}
