"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TbCamera, TbUserCircle, TbShirt, TbArrowBarToDown, TbHandStop, TbWind, TbMoodSmile, TbEye, TbCheck, TbCircleX } from "react-icons/tb";
import { PiSock } from "react-icons/pi";

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
    socksType: 'none' | 'white' | 'black';
    setSocksType: (val: 'none' | 'white' | 'black') => void;
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
    socksType,
    setSocksType,
}: BehaviorTogglesProps) {
    const ToggleItem = ({ label, icon: Icon, active, onClick, color = "bg-[var(--accent-primary)]" }: { label: string, icon: any, active: boolean, onClick: () => void, color?: string }) => (
        <div
            className={cn(
                "flex flex-col items-center justify-between p-2.5 min-h-[90px] rounded-xl border-2 transition-all cursor-pointer group select-none",
                active
                    ? "bg-[var(--accent-soft)] border-[var(--accent-primary)] shadow-sm"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50"
            )}
            onClick={onClick}
        >
            <div className="flex flex-col items-center gap-1.5 pt-1">
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />
                <span className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.05em] text-center leading-tight transition-colors",
                    active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                )}>
                    {label}
                </span>
            </div>
            <div className={cn("w-8 h-4 rounded-full transition-colors relative mt-1.5", active ? color : "bg-[var(--bg-muted)]")}>
                <div className={cn("absolute top-0.5 h-3 w-3 bg-white rounded-full transition-all shadow-md", active ? "left-4.5" : "left-0.5")} />
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">
                {language === "tr" ? "DETAY AYARLARI" : "DETAIL SETTINGS"}
            </h4>
            <div className="grid grid-cols-3 gap-2">
                {/* 1. Hair */}
                <ToggleItem
                    label={language === "tr" ? "SAÇ ARKADA" : "HAIR BACK"}
                    icon={TbUserCircle}
                    active={hairBehindShoulders}
                    onClick={() => setHairBehindShoulders(!hairBehindShoulders)}
                />

                {/* 2. Look at Camera */}
                <ToggleItem
                    label={language === "tr" ? "KAMERAYA BAK" : "LOOK AT CAM"}
                    icon={TbCamera}
                    active={lookAtCamera}
                    onClick={() => setLookAtCamera(!lookAtCamera)}
                />

                {/* 3. Buttons/Zipper */}
                <ToggleItem
                    label={language === "tr" ? "ÖNÜ AÇIK" : "OPEN FRONT"}
                    icon={TbShirt}
                    active={buttonsOpen}
                    onClick={() => setButtonsOpen(!buttonsOpen)}
                />

                {/* 4. Tucked */}
                <ToggleItem
                    label={language === "tr" ? "İÇERİDE" : "TUCKED"}
                    icon={TbArrowBarToDown}
                    active={tucked}
                    onClick={() => setTucked(!tucked)}
                />

                {/* 5. Sleeves Rolled */}
                <ToggleItem
                    label={language === "tr" ? "KOLLAR SIVALI" : "ROLLED SLEEVE"}
                    icon={TbHandStop}
                    active={sleevesRolled}
                    onClick={() => setSleevesRolled(!sleevesRolled)}
                />

                {/* 6. Wind */}
                <ToggleItem
                    label={language === "tr" ? "RÜZGAR" : "WIND"}
                    icon={TbWind}
                    active={enableWind}
                    onClick={() => setEnableWind(!enableWind)}
                />

                {/* 7. Expression */}
                <ToggleItem
                    label={language === "tr" ? "İFADE" : "EXPRESSION"}
                    icon={TbMoodSmile}
                    active={enableExpression}
                    onClick={() => setEnableExpression(!enableExpression)}
                />

                {/* 8. Gaze */}
                <ToggleItem
                    label={language === "tr" ? "BAKIŞ" : "GAZE"}
                    icon={TbEye}
                    active={enableGaze}
                    onClick={() => setEnableGaze(!enableGaze)}
                />

                {/* 9. Socks Toggle (Cyclic) */}
                <div
                    className={cn(
                        "flex flex-col items-center justify-between p-2.5 min-h-[90px] rounded-xl border-2 transition-all cursor-pointer group select-none shadow-sm",
                        socksType !== 'none'
                            ? "bg-[var(--accent-soft)] border-[var(--accent-primary)]"
                            : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50"
                    )}
                    onClick={() => {
                        if (socksType === 'none') setSocksType('white');
                        else if (socksType === 'white') setSocksType('black');
                        else setSocksType('none');
                    }}
                >
                    <div className="flex flex-col items-center gap-1.5 pt-1">
                        <PiSock className={cn("w-5 h-5 transition-transform group-hover:scale-110", socksType !== 'none' ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-[0.05em] text-center leading-tight transition-colors",
                            socksType !== 'none' ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                        )}>
                            {language === "tr" ? "ÇORAP" : "SOCKS"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 pt-1 w-full">
                        <span className={cn(
                            "text-[8px] font-bold uppercase tracking-tight",
                            socksType !== 'none' ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                        )}>
                            {language === "tr" ? (socksType === 'black' ? "SİYAH" : socksType === 'white' ? "BEYAZ" : "YOK") : (socksType === 'black' ? "BLACK" : socksType === 'white' ? "WHITE" : "NONE")}
                        </span>
                        <div className="flex gap-1 mt-0.5">
                            <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'none' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                            <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'white' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                            <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'black' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
