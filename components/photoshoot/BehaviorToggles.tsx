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
    socksType: 'none' | 'white' | 'black' | 'grey' | 'navy' | 'beige' | 'brown' | 'red' | 'green' | 'blue' | 'anthracite';
    setSocksType: (val: 'none' | 'white' | 'black' | 'grey' | 'navy' | 'beige' | 'brown' | 'red' | 'green' | 'blue' | 'anthracite') => void;
    pantLength: string;
    setPantLength: (val: string) => void;
    canShowLegHem: boolean;
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
    pantLength,
    setPantLength,
    canShowLegHem
}: BehaviorTogglesProps) {
    const isSocksDisabled = pantLength === 'covering' || pantLength === 'flare';

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

    const ToggleItem = ({ label, icon: Icon, active, onClick, color = "bg-white", brief, detailed, disabled = false }: { label: string, icon: any, active: boolean, onClick: () => void, color?: string, brief: string, detailed: string, disabled?: boolean }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "flex flex-col items-center justify-between p-2.5 h-[130px] rounded-2xl border-2 transition-all cursor-pointer group select-none",
                            active
                                ? "bg-zinc-800 border-white shadow-xl"
                                : "bg-zinc-900/40 border-white/5 hover:border-white/20"
                        )}
                        onClick={onClick}
                    >
                        <div className="flex flex-col items-center gap-1 pt-1">
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-white" : "text-zinc-500")} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest text-center leading-tight transition-colors",
                                active ? "text-white" : "text-zinc-400 group-hover:text-white"
                            )}>
                                {label}
                            </span>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter text-center leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                {brief}
                            </span>
                        </div>
                        <div className={cn("w-8 h-4 rounded-full transition-colors relative mt-1.5", active ? color : "bg-zinc-800")}>
                            <div className={cn("absolute top-0.5 h-3 w-3 bg-black rounded-full transition-all shadow-md", active ? "left-4.5" : "left-0.5")} />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center p-3 bg-zinc-900 border border-white/10 shadow-2xl rounded-xl">
                    <p className="text-[10px] leading-relaxed text-zinc-300 font-bold uppercase tracking-tight">{detailed}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    const PANT_LENGTHS = [
        { id: 'none', labelTr: 'Varsayılan', labelEn: 'Default' },
        { id: 'cropped', labelTr: 'Kısa Paça', labelEn: 'Cropped' },
        { id: 'standard', labelTr: 'Standart', labelEn: 'Standard' },
        { id: 'classic', labelTr: 'Klasik', labelEn: 'Classic' },
        { id: 'covering', labelTr: 'Uzun Paça', labelEn: 'Covering' },
        { id: 'flare', labelTr: 'İspanyol', labelEn: 'Flare' },
    ];

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



                {/* 7. Model Mood (Box 7) */}
                <div
                    className={cn(
                        "flex flex-col items-center justify-between p-3.5 h-[140px] rounded-2xl border-2 transition-all cursor-pointer group select-none shadow-sm",
                        selectedMoodId
                            ? "bg-zinc-800 border-white shadow-xl"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/20"
                    )}
                    onClick={() => {
                        const moods = ['natural', 'warm', 'powerful', 'relaxed', 'professional', 'subtle'];
                        const currentIndex = moods.indexOf(selectedMoodId || 'natural');
                        const nextIndex = (currentIndex + 1) % moods.length;
                        setSelectedMoodId(moods[nextIndex]);
                    }}
                >
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <TbMoodSmile className={cn("w-10 h-10 transition-all duration-300 group-hover:scale-110", selectedMoodId ? "text-white" : "text-zinc-500")} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] text-center leading-tight transition-colors mt-2",
                            selectedMoodId ? "text-white" : "text-zinc-400 group-hover:text-white"
                        )}>
                            {language === "tr" ? "MODEL TAVRI" : "MODEL MOOD"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 pb-1 w-full text-center">
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest opacity-60",
                            selectedMoodId ? "text-white" : "text-zinc-500"
                        )}>
                            {language === "tr"
                                ? [
                                    { id: 'natural', label: 'Doğal' }, { id: 'warm', label: 'Sıcak' },
                                    { id: 'powerful', label: 'Güçlü' }, { id: 'relaxed', label: 'Rahat' },
                                    { id: 'professional', label: 'Profesyonel' }, { id: 'subtle', label: 'Sakin' }
                                ].find(m => m.id === selectedMoodId)?.label || "VARSAYILAN"
                                : [
                                    { id: 'natural', labelEn: 'Natural' }, { id: 'warm', labelEn: 'Warm' },
                                    { id: 'powerful', labelEn: 'Powerful' }, { id: 'relaxed', labelEn: 'Relaxed' },
                                    { id: 'professional', labelEn: 'Professional' }, { id: 'subtle', labelEn: 'Subtle' }
                                ].find(m => m.id === selectedMoodId)?.labelEn || "DEFAULT"}
                        </span>
                        <div className="flex justify-center gap-1">
                            {['natural', 'warm', 'powerful', 'relaxed', 'professional', 'subtle'].map(m => (
                                <div key={m} className={cn("w-1 h-1 rounded-full transition-all", selectedMoodId === m ? "bg-white scale-125 shadow-[0_0_5px_white]" : "bg-zinc-700")} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 8. Pant Length (Box 8) */}
                <div
                    className={cn(
                        "flex flex-col items-center justify-between p-2.5 h-[130px] rounded-2xl border-2 transition-all cursor-pointer group select-none shadow-sm",
                        !canShowLegHem ? "opacity-30 cursor-not-allowed bg-zinc-900/10 grayscale" :
                            (pantLength !== 'none'
                                ? "bg-zinc-800 border-white shadow-xl"
                                : "bg-zinc-900/40 border-white/5 hover:border-white/20")
                    )}
                    onClick={() => {
                        if (!canShowLegHem) return;
                        const currentIndex = PANT_LENGTHS.findIndex(p => p.id === pantLength);
                        const nextIndex = (currentIndex + 1) % PANT_LENGTHS.length;
                        setPantLength(PANT_LENGTHS[nextIndex].id);
                    }}
                >
                    <div className="flex flex-col items-center gap-1.5 pt-1">
                        <TbArrowBarToDown className={cn("w-5 h-5 transition-transform group-hover:scale-110", pantLength !== 'none' ? "text-white" : "text-zinc-500")} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest text-center leading-tight transition-colors",
                            pantLength !== 'none' ? "text-white" : "text-zinc-400 group-hover:text-white"
                        )}>
                            {language === "tr" ? "PAÇA BOYU" : "PANT LENGTH"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 pt-1 w-full text-center">
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            pantLength !== 'none' ? "text-white" : "text-zinc-500"
                        )}>
                            {language === "tr" ? (PANT_LENGTHS.find(p => p.id === pantLength)?.labelTr || "VARSAYILAN") : (PANT_LENGTHS.find(p => p.id === pantLength)?.labelEn || "DEFAULT")}
                        </span>
                        <div className="flex justify-center gap-1 mt-1">
                            {PANT_LENGTHS.map(p => (
                                <div key={p.id} className={cn("w-1 h-1 rounded-full transition-all", pantLength === p.id ? "bg-white scale-125 shadow-[0_0_5px_white]" : "bg-zinc-700")} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 9. Socks (Box 9) */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-between p-3.5 h-[140px] rounded-2xl border-2 transition-all group select-none shadow-sm",
                                    isSocksDisabled ? "opacity-30 cursor-not-allowed bg-zinc-900/10 border-white/5 grayscale"
                                        : (socksType !== 'none'
                                            ? "cursor-pointer bg-zinc-800 border-white shadow-xl"
                                            : "cursor-pointer bg-zinc-900/40 border-white/5 hover:border-white/20")
                                )}
                                onClick={() => {
                                    if (isSocksDisabled) return;
                                    const colors: ('none' | 'white' | 'black' | 'grey' | 'navy' | 'beige' | 'brown' | 'red' | 'green' | 'blue' | 'anthracite')[] = ['none', 'white', 'black', 'grey', 'navy', 'beige', 'brown', 'red', 'green', 'blue', 'anthracite'];
                                    const currentIndex = colors.indexOf(socksType);
                                    const nextIndex = (currentIndex + 1) % colors.length;
                                    setSocksType(colors[nextIndex]);
                                }}
                            >
                                <div className="flex flex-col items-center gap-3 pt-2">
                                    <PiSock
                                        className={cn(
                                            "w-10 h-10 transition-all duration-300",
                                            !isSocksDisabled && "group-hover:scale-110",
                                            socksType === 'none' ? "text-zinc-500" : (
                                                socksType === 'white' ? "text-white" :
                                                    socksType === 'black' ? "text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.4)]" :
                                                        socksType === 'grey' ? "text-zinc-400" :
                                                            socksType === 'navy' ? "text-blue-900" :
                                                                socksType === 'beige' ? "text-[#D2B48C]" :
                                                                    socksType === 'brown' ? "text-[#8B4513]" :
                                                                        socksType === 'red' ? "text-red-600" :
                                                                            socksType === 'green' ? "text-green-600" :
                                                                                socksType === 'blue' ? "text-blue-600" :
                                                                                    socksType === 'anthracite' ? "text-zinc-600" : "text-white"
                                            )
                                        )}
                                        style={socksType !== 'none' && socksType !== 'white' && socksType !== 'black' ? {
                                            color: ({
                                                grey: '#94a3b8', navy: '#1e3a8a', beige: '#f5f5dc', brown: '#78350f',
                                                red: '#dc2626', green: '#16a34a', blue: '#2563eb', anthracite: '#334155'
                                            } as Record<string, string>)[socksType]
                                        } : {}}
                                    />
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em] text-center leading-tight transition-colors mt-2",
                                        socksType !== 'none' ? "text-white" : cn("text-zinc-400", !isSocksDisabled && "group-hover:text-white")
                                    )}>
                                        {language === "tr" ? "ÇORAP" : "SOCKS"}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-1.5 pb-1 w-full text-center">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest opacity-60",
                                        socksType !== 'none' ? "text-white" : "text-zinc-500"
                                    )}>
                                        {language === "tr"
                                            ? (socksType === 'black' ? "SİYAH" : socksType === 'white' ? "BEYAZ" : socksType === 'grey' ? "GRİ" : socksType === 'navy' ? "LACİVERT" : socksType === 'beige' ? "BEJ" : socksType === 'brown' ? "KAHVERENGİ" : socksType === 'red' ? "KIRMIZI" : socksType === 'green' ? "YEŞİL" : socksType === 'blue' ? "MAVİ" : socksType === 'anthracite' ? "ANTRASİT" : "YOK")
                                            : (socksType === 'black' ? "BLACK" : socksType === 'white' ? "WHITE" : socksType === 'grey' ? "GREY" : socksType === 'navy' ? "NAVY" : socksType === 'beige' ? "BEIGE" : socksType === 'brown' ? "BROWN" : socksType === 'red' ? "RED" : socksType === 'green' ? "GREEN" : socksType === 'blue' ? "BLUE" : socksType === 'anthracite' ? "ANTHRACITE" : "NONE")}
                                    </span>
                                    <div className="flex flex-wrap justify-center gap-1 max-w-[60px]">
                                        {['none', 'white', 'black', 'grey', 'navy', 'beige', 'brown', 'red', 'green', 'blue', 'anthracite'].map(c => (
                                            <div key={c} className={cn("w-1 h-1 rounded-full transition-all", socksType === c ? "bg-white scale-125 shadow-[0_0_5px_white]" : "bg-zinc-700")} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TooltipTrigger>
                        {isSocksDisabled && (
                            <TooltipContent side="top" className="text-[10px] max-w-[200px] text-center bg-zinc-900 text-zinc-300 border border-white/10 font-bold uppercase p-3 rounded-xl tracking-tight">
                                {language === "tr"
                                    ? "Uzun paça kullanıldığında çoraplar görünmez."
                                    : "Socks are not visible when using long length pants."}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>


        </div >
    );
}
