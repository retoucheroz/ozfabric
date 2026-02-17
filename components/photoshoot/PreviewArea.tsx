"use client";

import React from "react";
import { Camera, Loader2, Maximize2, Download, Eraser, Plus, FileText, Share2, Sparkles, Layers, Info, Zap } from "lucide-react";
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
    handleStopBatch
}: PreviewAreaProps) {
    const generateButton = (
        <div className="w-full max-w-md mb-6 space-y-2">
            <Button
                size="lg"
                className={cn(
                    "w-full shadow-lg transition-all duration-300",
                    "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] shadow-[var(--accent-primary)]/20 text-white"
                )}
                onClick={() => batchMode ? handleBatchGenerate() : handleGenerate()}
                disabled={isProcessing || (batchMode && !productCode)}
            >
                {isProcessing ? (
                    <div className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>{language === "tr" ? "İşleniyor..." : "Processing..."}</span>
                    </div>
                ) : (
                    <>
                        {batchMode ? <Layers className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {batchMode
                            ? (language === "tr" ? "Toplu Üretimi Başlat" : "Start Batch Generation")
                            : (language === "tr" ? "Fotoğraf Çek" : "Generate Photo")}
                        <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-normal">
                            {estimatedCost} {language === "tr" ? "Kr" : "Cr"}
                        </span>
                    </>
                )}
            </Button>

        </div>
    );

    const stopButton = isProcessing && batchMode && handleStopBatch && (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleStopBatch}
            disabled={isStoppingBatch}
            className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-red-500/20"
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

    if (isProcessing) {
        return (
            <div className="flex-1 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center justify-center">
                <div className="h-full flex flex-col items-center justify-center space-y-8 my-auto w-full max-w-md">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] rounded-2xl shadow-2xl flex items-center justify-center border border-[var(--border-subtle)]">
                            <Camera className="w-10 h-10 text-[var(--accent-primary)]" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        </div>
                    </div>

                    <StudioSteps language={language} isSuccess={isGenerationSuccess} />

                    <div className="w-full max-w-xs">
                        <div className="h-1 w-full bg-[var(--bg-elevated)] overflow-hidden rounded-full">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full"
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

    if (resultImages && resultImages.length > 0) {
        return (
            <div className="flex-1 bg-[var(--bg-base)] overflow-y-auto p-4 md:p-8 relative min-h-[400px] flex flex-col items-center">
                <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
                    {resultImages.length > 1 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                            {resultImages.map((img: any, i: number) => {
                                const url = typeof img === 'string' ? img : img.url;
                                const filename = typeof img === 'string' ? `angle_${i}_${Date.now()}.png` : img.filename;
                                const downloadName = typeof img === 'string' ? `angle_${i}_${Date.now()}.png` : (img.downloadName || img.filename);

                                return (
                                    <div key={i} className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md shadow-sm"
                                                onClick={() => router.push(`/resize?image=${encodeURIComponent(url)}`)}
                                                title="Upscale"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-sm transition-all"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    const response = await fetch(url);
                                                    const blob = await response.blob();
                                                    const downloadUrl = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = downloadUrl;
                                                    link.download = downloadName;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                title={language === "tr" ? "İndir" : "Download"}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {(typeof img === 'object' && img.filename) && (
                                            <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 text-[10px] text-white truncate font-medium backdrop-blur-sm">
                                                {img.filename.replace('.jpg', '').replace('.png', '')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (() => {
                        const img = resultImages[0];
                        const url = typeof img === 'string' ? img : img.url;
                        const filename = typeof img === 'string' ? `photo_${Date.now()}.png` : img.filename;
                        const downloadName = typeof img === 'string' ? `photo_${Date.now()}.png` : (img.downloadName || img.filename);

                        return (
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white group mx-auto w-full">
                                <img src={url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                    <Button
                                        variant="secondary"
                                        className="rounded-full bg-white/90 hover:bg-white text-black"
                                        onClick={() => router.push(`/resize?image=${encodeURIComponent(url)}`)}
                                    >
                                        <Maximize2 className="w-4 h-4 mr-2" />
                                        Upscale
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="rounded-full bg-black/70 hover:bg-black text-white"
                                        onClick={async () => {
                                            const response = await fetch(url);
                                            const blob = await response.blob();
                                            const downloadUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = downloadUrl;
                                            link.download = downloadName;
                                            link.click();
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {language === "tr" ? "İndir" : "Download"}
                                    </Button>
                                </div>
                                {(typeof img === 'object' && img.filename) && (
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-black/60 text-xs text-white truncate font-bold text-center backdrop-blur-md">
                                        {img.filename.replace('.jpg', '').replace('.png', '')}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
                {generateButton}
            </div>
        );
    }

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
