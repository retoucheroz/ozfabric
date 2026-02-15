"use client"
import { useState, useEffect } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { STUDIO_STEPS_TR, STUDIO_STEPS_EN } from "@/lib/photoshoot-constants"

interface StudioStepsProps {
    language: string;
    isSuccess?: boolean;
}

export function StudioSteps({ language, isSuccess }: StudioStepsProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const steps = language === "tr" ? STUDIO_STEPS_TR : STUDIO_STEPS_EN;

    const FINAL_STEP = {
        icon: "🖼️",
        text: language === "tr" ? "Görseller ekrana yansıtılıyor..." : "Projecting images to screen...",
        detail: language === "tr" ? "Sonuçlar hazırlanıyor" : "Preparing results"
    };

    const stepDuration = 3700;
    const estimatedTotal = 70;

    useEffect(() => {
        if (isSuccess) return;

        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= steps.length - 1) return prev;
                return prev + 1;
            });
        }, stepDuration);

        const timeInterval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => {
            clearInterval(stepInterval);
            clearInterval(timeInterval);
        };
    }, [steps.length, isSuccess]);

    const activeStep = isSuccess ? FINAL_STEP : steps[currentStep];
    const progress = isSuccess ? 100 : Math.min((currentStep / (steps.length - 1)) * 100, 100);
    const estimatedRemaining = isSuccess ? 0 : Math.max(estimatedTotal - elapsedTime, 0);

    return (
        <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Current Step Display */}
            <div className="text-center space-y-3">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative text-6xl mb-4 transform hover:scale-110 transition-transform duration-500 cursor-default" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
                        {activeStep.icon}
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-[var(--text-primary)]">
                        {activeStep.text}
                    </h3>
                    <p className="text-[10px] text-[var(--accent-primary)] font-black uppercase tracking-widest opacity-80 animate-pulse">
                        {activeStep.detail}
                    </p>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-3 px-4">
                <div className="relative h-3 w-full bg-[var(--bg-elevated)] overflow-hidden rounded-full border border-[var(--border-subtle)] shadow-inner">
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--accent-primary)] via-[#ff0080] to-[var(--accent-primary)] rounded-full transition-all ease-out shadow-[0_0_15px_rgba(139,92,246,0.5)]",
                            isSuccess ? 'duration-1000' : 'duration-500'
                        )}
                        style={{
                            width: `${progress}%`,
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s linear infinite'
                        }}
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-[var(--accent-primary)] tabular-nums">{Math.round(progress)}%</span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">
                        {isSuccess ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {language === "tr" ? "TAMAMLANDI" : "COMPLETE"}
                            </span>
                        ) : (
                            language === "tr"
                                ? `YAKLAŞIK ${estimatedRemaining} SANİYE KALDI`
                                : `EST. ${estimatedRemaining}S REMAINING`
                        )}
                    </span>
                </div>
            </div>

            {/* Step Indicators - Grid based for better symmetry */}
            <div className="flex justify-center gap-2 flex-wrap max-w-[320px] mx-auto">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-500",
                            isSuccess
                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : idx === currentStep
                                    ? "bg-[var(--accent-primary)] scale-[1.3] shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                                    : idx < currentStep
                                        ? "bg-emerald-500/60"
                                        : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                        )}
                    />
                ))}
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                    isSuccess ? "bg-[var(--accent-primary)] scale-[1.3] shadow-[0_0_10px_rgba(139,92,246,0.6)]" : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                )} />
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-center gap-4 py-2 border-t border-[var(--border-subtle)]/30 mx-8">
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{language === "tr" ? "GEÇEN SÜRE" : "ELAPSED"}</span>
                    <span className="text-xs font-black text-[var(--text-primary)] tabular-nums">{elapsedTime}s</span>
                </div>
                <div className="w-px h-6 bg-[var(--border-subtle)]/30" />
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{language === "tr" ? "MEVCUT ADIM" : "CURRENT STEP"}</span>
                    <span className="text-xs font-black text-[var(--text-primary)] tabular-nums">
                        {isSuccess ? 20 : currentStep + 1}<span className="text-[var(--text-muted)] opacity-50 ml-0.5">/ {steps.length + 1}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
