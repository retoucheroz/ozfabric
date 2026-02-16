"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpertSettingsProps {
    language: string;
    showExpert: boolean;
    setShowExpert: (val: boolean) => void;
    seed: string | number;
    setSeed: (val: string | number) => void;
    lightingNegative: string;
    setLightingNegative: (val: string) => void;
}

export function ExpertSettings({
    language,
    showExpert,
    setShowExpert,
    seed,
    setSeed,
    lightingNegative,
    setLightingNegative,
}: ExpertSettingsProps) {
    return (
        <div className="pt-4 border-t border-[var(--border-subtle)]">
            <button
                onClick={() => setShowExpert(!showExpert)}
                className="flex items-center justify-between w-full px-2 py-1 mb-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <div className={cn("h-4 w-1 rounded-full transition-colors", showExpert ? "bg-amber-500" : "bg-[var(--text-disabled)]")} />
                    <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                        {language === "tr" ? "UZMAN AYARLARI" : "EXPERT CONTROLS"}
                    </label>
                </div>
                <ChevronDown className={cn("w-3 h-3 text-[var(--text-muted)] transition-transform duration-300", showExpert && "rotate-180")} />
            </button>

            {showExpert && (
                <div className="space-y-4 px-1 pb-4 animate-in slide-in-from-top-2">
                    {/* Technical Properties */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{language === "tr" ? "Tekrar Tutarlılığı" : "Consistency (Seed)"}</label>
                        <input
                            type="number"
                            className="w-full text-xs p-2 rounded border bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-[var(--accent-primary)]"
                            value={seed === "" ? "" : seed}
                            onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Random"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
