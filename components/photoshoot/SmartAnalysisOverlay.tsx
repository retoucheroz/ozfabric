import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X, AlertTriangle, Sparkles } from "lucide-react";
import { AnalysisStatus } from "@/lib/photoshoot/smart-upload-utils";
import { Button } from "@/components/ui/button";

interface SmartAnalysisOverlayProps {
    language: string;
    statuses: AnalysisStatus[];
    onClose: () => void;
    isAllDone: boolean;
}

export function SmartAnalysisOverlay({
    language,
    statuses,
    onClose,
    isAllDone
}: SmartAnalysisOverlayProps) {
    const processingCount = statuses.filter(s => s.status === "processing").length;
    const totalCount = statuses.length;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                                <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">
                                    {language === "tr" ? "AKILLI ANALİZ" : "SMART ANALYSIS"}
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                                    {processingCount > 0
                                        ? (language === "tr" ? `İŞLENİYOR (${totalCount - processingCount}/${totalCount})` : `PROCESSING (${totalCount - processingCount}/${totalCount})`)
                                        : (language === "tr" ? "ANALİZ TAMAMLANDI" : "ANALYSIS COMPLETE")}
                                </p>
                            </div>
                        </div>
                        {isAllDone && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {statuses.map((status, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                                        {status.status === "processing" && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                                        {status.status === "success" && <Check className="w-4 h-4 text-emerald-500" />}
                                        {status.status === "low_confidence" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                        {status.status === "error" && <X className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-zinc-300 truncate">{status.fileName}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                            {status.status === "processing" && (language === "tr" ? "Analiz ediliyor..." : "Analyzing...")}
                                            {status.status === "success" && status.result?.productType}
                                            {status.status === "low_confidence" && (language === "tr" ? "Düşük Güven" : "Low Confidence")}
                                            {status.status === "error" && (language === "tr" ? "Hata" : "Error")}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    {status.result?.slotKey && (
                                        <span className="text-[10px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded text-zinc-400 uppercase">
                                            {status.result.slotKey.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/[0.02] border-t border-white/5">
                        {isAllDone ? (
                            <Button
                                onClick={onClose}
                                className="w-full h-12 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200"
                            >
                                {language === "tr" ? "TAMAM" : "DISMISS"}
                            </Button>
                        ) : (
                            <div className="flex items-center justify-center gap-3 h-12">
                                <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                    {language === "tr" ? "YAPAY ZEKA ÇALIŞIYOR..." : "AI IS WORKING..."}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
