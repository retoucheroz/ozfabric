import React from "react";

interface WizardProgressProps {
    currentStep: 1 | 2 | 3;
    onStepClick: (step: 1 | 2 | 3) => void;
    language?: string;
}

export function WizardProgress({ currentStep, onStepClick, language }: WizardProgressProps) {
    const steps = [
        { num: 1, labelTr: "ÜRÜN & MODEL", labelEn: "PRODUCT & MODEL" },
        { num: 2, labelTr: "SAHNE", labelEn: "SCENE" },
        { num: 3, labelTr: "SONUÇLAR", labelEn: "RESULTS" },
    ];
    return (
        <div className="w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center min-w-max md:min-w-0 justify-between md:justify-center gap-1.5 mb-4 md:mb-6">
                {steps.map((step, i) => (
                    <div key={step.num} className="flex items-center">
                        <button
                            onClick={() => onStepClick(step.num as 1 | 2 | 3)}
                            disabled={step.num > currentStep && step.num !== currentStep} // Optional: Disable future steps if desired, but user didn't ask. Let's keep existing behavior but fix style.
                            className={`flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg transition-all whitespace-nowrap ${currentStep === step.num
                                ? "bg-white text-black shadow-xl"
                                : currentStep > step.num
                                    ? "bg-white/10 text-zinc-300 border border-white/10 cursor-pointer hover:bg-white/20"
                                    : "bg-zinc-800/20 text-zinc-600 border border-transparent"
                                }`}
                        >
                            <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center text-[9px] md:text-xs font-bold ${currentStep === step.num
                                ? "border-black bg-black/10"
                                : currentStep > step.num
                                    ? "border-zinc-400 bg-zinc-400 text-black border-none"
                                    : "border-zinc-700"
                                }`}>
                                {currentStep > step.num ? "✓" : step.num}
                            </span>
                            <span className={`text-[10px] md:text-xs font-bold tracking-tight ${currentStep === step.num ? "block" : "hidden sm:block"}`}>
                                {language === "tr" ? step.labelTr : step.labelEn}
                            </span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`w-3 md:w-6 h-0.5 mx-0.5 rounded-full transition-colors ${currentStep > step.num
                                ? "bg-zinc-400"
                                : "bg-zinc-800"
                                }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
