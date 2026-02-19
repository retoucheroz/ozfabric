import React from "react";

interface WizardProgressProps {
    currentStep: 1 | 2 | 3;
    onStepClick: (step: 1 | 2 | 3) => void;
    language?: string;
}

export function WizardProgress({ currentStep, onStepClick, language }: WizardProgressProps) {
    const steps = [
        { num: 1, labelTr: "ÜRÜN & STÜDYO", labelEn: "PRODUCT & STUDIO" },
        { num: 2, labelTr: "AYARLAR", labelEn: "SETTINGS" },
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
                                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                                : currentStep > step.num
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20"
                                    : "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border border-transparent"
                                }`}
                        >
                            <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full border flex items-center justify-center text-[9px] md:text-xs font-bold ${currentStep === step.num
                                ? "border-white bg-white/20"
                                : currentStep > step.num
                                    ? "border-purple-500 bg-purple-500 text-white border-none"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}>
                                {currentStep > step.num ? "✓" : step.num}
                            </span>
                            <span className={`text-[10px] md:text-xs font-bold tracking-tight ${currentStep === step.num ? "block" : "hidden sm:block"}`}>
                                {language === "tr" ? step.labelTr : step.labelEn}
                            </span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`w-3 md:w-6 h-0.5 mx-0.5 rounded-full transition-colors ${currentStep > step.num
                                ? "bg-purple-500"
                                : "bg-gray-200 dark:bg-gray-800"
                                }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
