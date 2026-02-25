"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TbCamera, TbUserCircle, TbShirt, TbArrowBarToDown, TbHandStop, TbWind, TbMoodSmile, TbEye, TbCheck, TbCircleX } from "react-icons/tb";
import { PiSock } from "react-icons/pi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    selectedMoodId: string;
    setSelectedMoodId: (val: string) => void;
    batchMode?: boolean;
    batchShotSelection?: Record<string, boolean>;
    availableBatchShots?: any[];
    poseFocus?: string;
    socksType: 'none' | 'white' | 'black' | 'grey' | 'navy';
    setSocksType: (val: 'none' | 'white' | 'black' | 'grey' | 'navy') => void;
    pantLength?: string;
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
    selectedMoodId,
    setSelectedMoodId,
    batchMode,
    batchShotSelection,
    availableBatchShots,
    poseFocus,
    socksType,
    setSocksType,
    pantLength
}: BehaviorTogglesProps) {
    const isSocksDisabled = pantLength === 'full_length' || pantLength === 'deep_break';

    // If socks are disabled by pant length but they have a value, reset to none on render
    React.useEffect(() => {
        if (isSocksDisabled && socksType !== 'none') {
            setSocksType('none');
        }
    }, [isSocksDisabled, socksType, setSocksType]);

    // Mood Selector Logic
    let hasStylingAngle = false;
    let hasTechnicalAngle = false;
    let hasFaceVisibleAngle = false;

    if (batchMode && availableBatchShots && batchShotSelection) {
        const selectedIds = Object.keys(batchShotSelection).filter(id => batchShotSelection[id]);
        selectedIds.forEach(id => {
            const shot = availableBatchShots.find(s => s.id === id);
            if (shot && shot.faceProminence !== 'none') {
                hasFaceVisibleAngle = true;
                if (shot.shotType === 'styling') hasStylingAngle = true;
                if (shot.shotType === 'technical') hasTechnicalAngle = true;
            }
        });
    } else {
        // Single mode
        hasFaceVisibleAngle = hasHead; // generally true unless pose focus is lower or detail
        // In single mode, if it's not closeup detail, and the focus is full/upper, it's styling (unless they use Technical shots, but assuming single styling shot mode here mostly)
        // Wait, single mode shotRole is defined as: `(isThreeAngles || poseFocus === 'closeup') ? 'technical' : 'styling'`
        if (hasFaceVisibleAngle) {
            if (poseFocus === 'closeup') {
                hasTechnicalAngle = true;
            } else {
                hasStylingAngle = true;
            }
        }
    }

    const showMoodSelector = hasFaceVisibleAngle;
    const hasOnlyTechnicalAngles = hasTechnicalAngle && !hasStylingAngle;

    const STYLING_MOODS = [
        { id: 'natural', label: 'Doğal', labelEn: 'Natural', description: 'Doğal ve candid', descriptionEn: 'Natural and candid', icon: '✦' },
        { id: 'warm', label: 'Sıcak', labelEn: 'Warm', description: 'Samimi ve yakın', descriptionEn: 'Friendly and warm', icon: '☀' },
        { id: 'powerful', label: 'Güçlü', labelEn: 'Powerful', description: 'Editorial güç', descriptionEn: 'Editorial power', icon: '◆' },
        { id: 'relaxed', label: 'Rahat', labelEn: 'Relaxed', description: 'Cool ve rahat', descriptionEn: 'Cool and relaxed', icon: '~' },
    ];

    const ToggleItem = ({ label, icon: Icon, active, onClick, color = "bg-[var(--accent-primary)]", brief, detailed, disabled = false }: { label: string, icon: any, active: boolean, onClick: () => void, color?: string, brief: string, detailed: string, disabled?: boolean }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex flex-col items-center justify-between p-2.5 h-full rounded-xl border-2 transition-all cursor-pointer group select-none",
                            active
                                ? "bg-[var(--accent-soft)] border-[var(--accent-primary)] shadow-sm"
                                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50"
                        )}
                        onClick={onClick}
                    >
                        <div className="flex flex-col items-center gap-1 pt-1">
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-[0.05em] text-center leading-tight transition-colors",
                                active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                            )}>
                                {label}
                            </span>
                            <span className="text-[7.5px] text-[var(--text-muted)] text-center leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                {brief}
                            </span>
                        </div>
                        <div className={cn("w-8 h-4 rounded-full transition-colors relative mt-1.5", active ? color : "bg-[var(--bg-muted)]")}>
                            <div className={cn("absolute top-0.5 h-3 w-3 bg-white rounded-full transition-all shadow-md", active ? "left-4.5" : "left-0.5")} />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xl">
                    <p className="text-[11px] leading-relaxed text-[var(--text-primary)]">{detailed}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <div className="flex flex-col space-y-4">
            <h4 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] px-1">
                {language === "tr" ? "DETAY AYARLARI" : "DETAIL SETTINGS"}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {/* 1. Hair */}
                <ToggleItem
                    label={language === "tr" ? "SAÇ ARKADA" : "HAIR BACK"}
                    brief={language === "tr" ? "Saçı arkaya atar" : "Tucks hair back"}
                    detailed={language === "tr" ? "Modelin saçının omuz arkasına atılıp atılmayacağının seçimi." : "Choice of whether the model's hair is thrown behind the shoulders."}
                    icon={TbUserCircle}
                    active={hairBehindShoulders}
                    onClick={() => setHairBehindShoulders(!hairBehindShoulders)}
                />

                {/* 2. Look at Camera */}
                <ToggleItem
                    label={language === "tr" ? "KAMERAYA BAK" : "LOOK AT CAM"}
                    brief={language === "tr" ? "Göz teması kurar" : "Makes eye contact"}
                    detailed={language === "tr" ? "Modelin doğrudan kameraya bakarak göz teması kurup kurmayacağını belirler." : "Determines whether the model looks directly at the camera to make eye contact."}
                    icon={TbCamera}
                    active={lookAtCamera}
                    onClick={() => setLookAtCamera(!lookAtCamera)}
                />

                {/* 3. Buttons/Zipper */}
                <ToggleItem
                    label={language === "tr" ? "ÖNÜ AÇIK" : "OPEN FRONT"}
                    brief={language === "tr" ? "Önünü açık bırakır" : "Keep front open"}
                    detailed={language === "tr" ? "Düğmeli ya da fermuarlı bir üst ürün ise onun önünün açık kapalı seçeneği." : "Option for buttoned or zippered tops to be open or closed."}
                    icon={TbShirt}
                    active={buttonsOpen}
                    onClick={() => setButtonsOpen(!buttonsOpen)}
                />

                {/* 4. Tucked */}
                <ToggleItem
                    label={language === "tr" ? "SOKMA" : "TUCK IN"}
                    brief={language === "tr" ? "Üstü alta sokar" : "Top into bottom"}
                    detailed={language === "tr" ? "Üst ürünün alt ürünün (pantolon, etek vb.) içine tamamen sokulup sokulmamasını belirler. Kapalıyken üst, alta tamamen dışarıda kalır. Açıkken tamamen içeri sokulur." : "Determines whether the top garment is fully tucked into the bottom garment. Off = hem hangs freely over the waistband. On = fully tucked in."}
                    icon={TbArrowBarToDown}
                    active={tucked}
                    onClick={() => setTucked(!tucked)}
                />

                {/* 5. Sleeves Rolled */}
                <ToggleItem
                    label={language === "tr" ? "KOLLAR SIVALI" : "ROLLED SLEEVE"}
                    brief={language === "tr" ? "Kollari yukarı çeker" : "Pull up sleeves"}
                    detailed={language === "tr" ? "Uzun kollu ürünlerin kollarının dirseğe kadar sıvanması seçeneği." : "Rolling up the sleeves of long-sleeved products to the elbows."}
                    icon={TbHandStop}
                    active={sleevesRolled}
                    onClick={() => setSleevesRolled(!sleevesRolled)}
                />

                {/* 6. Wind */}
                <ToggleItem
                    label={language === "tr" ? "RÜZGAR" : "WIND"}
                    brief={language === "tr" ? "Hafif esinti verir" : "Soft hair breeze"}
                    detailed={language === "tr" ? "Modelin saçına hafif bir rüzgar esintisi efekti verilmesini sağlar." : "Gives a light wind breeze effect to the model's hair."}
                    icon={TbWind}
                    active={enableWind}
                    onClick={() => setEnableWind(!enableWind)}
                />



                {/* 9. Socks Toggle (Cyclic) */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-between p-2.5 h-full rounded-xl border-2 transition-all group select-none shadow-sm",
                                    isSocksDisabled ? "opacity-50 cursor-not-allowed bg-[var(--bg-muted)] border-[var(--border-subtle)]"
                                        : (socksType !== 'none'
                                            ? "cursor-pointer bg-[var(--accent-soft)] border-[var(--accent-primary)]"
                                            : "cursor-pointer bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50")
                                )}
                                onClick={() => {
                                    if (isSocksDisabled) return;
                                    if (socksType === 'none') setSocksType('white');
                                    else if (socksType === 'white') setSocksType('black');
                                    else if (socksType === 'black') setSocksType('grey');
                                    else if (socksType === 'grey') setSocksType('navy');
                                    else setSocksType('none');
                                }}
                            >
                                <div className="flex flex-col items-center gap-1.5 pt-1">
                                    <PiSock className={cn("w-5 h-5 transition-transform", !isSocksDisabled && "group-hover:scale-110", socksType !== 'none' ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-[0.05em] text-center leading-tight transition-colors",
                                        socksType !== 'none' ? "text-[var(--accent-primary)]" : cn("text-[var(--text-muted)]", !isSocksDisabled && "group-hover:text-[var(--text-primary)]")
                                    )}>
                                        {language === "tr" ? "ÇORAP" : "SOCKS"}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-1 pt-1 w-full">
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase tracking-tight",
                                        socksType !== 'none' ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                                    )}>
                                        {language === "tr"
                                            ? (socksType === 'black' ? "SİYAH" : socksType === 'white' ? "BEYAZ" : socksType === 'grey' ? "GRİ" : socksType === 'navy' ? "LACİVERT" : "YOK")
                                            : (socksType === 'black' ? "BLACK" : socksType === 'white' ? "WHITE" : socksType === 'grey' ? "GREY" : socksType === 'navy' ? "NAVY" : "NONE")}
                                    </span>
                                    <div className="flex gap-1 mt-0.5">
                                        <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'none' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                                        <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'white' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                                        <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'black' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                                        <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'grey' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                                        <div className={cn("w-1 h-1 rounded-full transition-all", socksType === 'navy' ? "bg-[var(--accent-primary)] scale-125" : "bg-[var(--bg-muted)]")} />
                                    </div>
                                </div>
                            </div>
                        </TooltipTrigger>
                        {isSocksDisabled && (
                            <TooltipContent side="top" className="text-xs max-w-[200px] text-center bg-violet-600 text-white font-bold p-3">
                                {language === "tr"
                                    ? "Uzun paça kullanıldığında çoraplar görünmez."
                                    : "Socks are not visible when using full length pants."}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>


        </div>
    );
}
