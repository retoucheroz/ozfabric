"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BehaviorTogglesProps {
    language: string;
    canShowCollarHairButtons: boolean;
    hairBehindShoulders: boolean;
    setHairBehindShoulders: (val: boolean) => void;
    lookAtCamera: boolean;
    setLookAtCamera: (val: boolean) => void;
    buttonsOpen: boolean;
    setButtonsOpen: (val: boolean) => void;
    isCloseup: boolean;
    isCowboy: boolean;
    isFullBody: boolean;
    canShowWaistRiseFitTuck: boolean;
    tucked: boolean;
    setTucked: (val: boolean) => void;
    sleevesRolled: boolean;
    setSleevesRolled: (val: boolean) => void;
    enableWind: boolean;
    setEnableWind: (val: boolean) => void;
    hasHead: boolean;
    enableExpression: boolean;
    setEnableExpression: (val: boolean) => void;
    enableGaze: boolean;
    setEnableGaze: (val: boolean) => void;
}

export function BehaviorToggles({
    language,
    canShowCollarHairButtons,
    hairBehindShoulders,
    setHairBehindShoulders,
    lookAtCamera,
    setLookAtCamera,
    buttonsOpen,
    setButtonsOpen,
    isCloseup,
    isCowboy,
    isFullBody,
    canShowWaistRiseFitTuck,
    tucked,
    setTucked,
    sleevesRolled,
    setSleevesRolled,
    enableWind,
    setEnableWind,
    hasHead,
    enableExpression,
    setEnableExpression,
    enableGaze,
    setEnableGaze,
}: BehaviorTogglesProps) {
    return (
        <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Head/Face Area Controls */}
            {canShowCollarHairButtons && (
                <>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                        onClick={() => setHairBehindShoulders(!hairBehindShoulders)}>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Saç Arkada" : "Hair Behind"}</span>
                        <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", hairBehindShoulders ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                            <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", hairBehindShoulders ? "left-3" : "left-0.5")} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                        onClick={() => setLookAtCamera(!lookAtCamera)}>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Kameraya Bak" : "Look at Cam"}</span>
                        <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", lookAtCamera ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                            <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", lookAtCamera ? "left-3" : "left-0.5")} />
                        </div>
                    </div>

                    {/* Buttons: Moved Up */}
                    {(isCloseup || isCowboy || isFullBody) && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                            onClick={() => setButtonsOpen(!buttonsOpen)}>
                            <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Düğme/Fermuar Açık" : "Buttons/Zipper Open"}</span>
                            <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", buttonsOpen ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                                <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", buttonsOpen ? "left-3" : "left-0.5")} />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Waist/Upper Body Specific: Fit/Tuck */}
            {canShowWaistRiseFitTuck && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                    onClick={() => setTucked(!tucked)}>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "İçeride" : "Tucked"}</span>
                    <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", tucked ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                        <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", tucked ? "left-3" : "left-0.5")} />
                    </div>
                </div>
            )}

            {/* Sleeves Rolled */}
            {canShowCollarHairButtons && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                    onClick={() => setSleevesRolled(!sleevesRolled)}>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Kollar Sıvalı" : "Sleeves Rolled"}</span>
                    <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", sleevesRolled ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                        <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", sleevesRolled ? "left-3" : "left-0.5")} />
                    </div>
                </div>
            )}

            {/* Common: Wind */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                onClick={() => setEnableWind(!enableWind)}>
                <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Rüzgar" : "Wind"}</span>
                <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", enableWind ? "bg-blue-400" : "bg-[var(--bg-elevated)]")}>
                    <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", enableWind ? "left-3" : "left-0.5")} />
                </div>
            </div>

            {/* Expression & Gaze */}
            {hasHead && (
                <>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                        onClick={() => setEnableExpression(!enableExpression)}>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "İfade" : "Expression"}</span>
                        <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", enableExpression ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                            <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", enableExpression ? "left-3" : "left-0.5")} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] transition-colors group"
                        onClick={() => setEnableGaze(!enableGaze)}>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{language === "tr" ? "Bakış" : "Gaze"}</span>
                        <div className={cn("w-6 h-3.5 rounded-full transition-colors relative", enableGaze ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-elevated)]")}>
                            <div className={cn("absolute top-0.5 h-2.5 w-2.5 bg-white rounded-full transition-all shadow-sm", enableGaze ? "left-3" : "left-0.5")} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
