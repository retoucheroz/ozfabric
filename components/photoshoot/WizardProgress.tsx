import React from "react";

interface WizardProgressProps {
    currentStep: 1 | 2 | 3 | 4;
    onStepClick: (step: 1 | 2 | 3 | 4) => void;
}

const steps = [
    { num: 1, label: "Ürün Seç" },
    { num: 2, label: "Model & Ortam" },
    { num: 3, label: "Çekim Ayarları" },
    { num: 4, label: "Oluştur" },
];

export function WizardProgress({ currentStep, onStepClick }: WizardProgressProps) {
    return (
        <div className="w-full overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-center min-w-max md:min-w-0 justify-between md:justify-center gap-2 mb-6 md:mb-8">
                {steps.map((step, i) => (
                    <div key={step.num} className="flex items-center">
                        <button
                            onClick={() => onStepClick(step.num as 1 | 2 | 3 | 4)}
                            disabled={step.num > currentStep && step.num !== currentStep} // Optional: Disable future steps if desired, but user didn't ask. Let's keep existing behavior but fix style.
                            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all whitespace-nowrap ${currentStep === step.num
                                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                                : currentStep > step.num
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20"
                                    : "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 border border-transparent"
                                }`}
                        >
                            <span className={`w-5 h-5 md:w-6 md:h-6 rounded-full border flex items-center justify-center text-[10px] md:text-sm font-bold ${currentStep === step.num
                                ? "border-white bg-white/20"
                                : currentStep > step.num
                                    ? "border-purple-500 bg-purple-500 text-white border-none"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}>
                                {currentStep > step.num ? "✓" : step.num}
                            </span>
                            <span className={`text-xs md:text-sm font-medium ${currentStep === step.num ? "block" : "hidden sm:block"}`}>
                                {step.label}
                            </span>
                        </button>
                        {i < steps.length - 1 && (
                            <div className={`w-4 md:w-8 h-0.5 mx-1 rounded-full transition-colors ${currentStep > step.num
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
