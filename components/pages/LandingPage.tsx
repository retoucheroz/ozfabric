"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent, useSpring } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Camera, Image as ImageIcon, Zap, Upload, Wand2, Layers, Video, ChevronDown, Plus } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";


const ScrollDownIcon = ({ targetId, className }: { targetId?: string, className?: string }) => {
    const handleClick = () => {
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className={cn(
                "absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer p-4 group",
                className
            )}
            onClick={handleClick}
        >
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
                <ChevronDown className="w-8 h-8 text-white/40 group-hover:text-[#F5F5F5] transition-colors" />
            </motion.div>
        </motion.div>
    );
};

const InteractiveShowcaseCard = ({ item, baseProgress, index, isModeOn }: any) => {
    // Tighter sequential stagger: each card starts 0.025 later and animates for 0.12
    const start = 0.15 + index * 0.025;
    const end = start + 0.12;
    const progress = useTransform(baseProgress, [start, end], [0, 1]);

    const x = useTransform(progress, [0, 1], [item.startPos.x, 0]);
    const y = useTransform(progress, [0, 1], [item.startPos.y, 0]);
    const rotate = useTransform(progress, [0, 1], [item.startPos.r, 0]);
    const scale = useTransform(progress, [0, 1], [0.8, 1]);

    // Sequential blur clearing
    const blurStrength = item.blurStrength || 0;
    const blur = useTransform(progress, [0, 0.7], [`blur(${blurStrength}px)`, "blur(0px)"]);

    return (
        <motion.div
            style={{ x, y, rotate, scale, filter: blur }}
            className={cn(
                "relative aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 ease-in-out",
                "hover:border-white/20 group",
                !isModeOn && item.isOutput && "grayscale opacity-40 scale-[0.98]",
                isModeOn && item.isOutput && "grayscale-0 opacity-100 scale-100",
                !item.isOutput && "border-white/20 ring-1 ring-white/10 shadow-white/5"
            )}
        >
            <Image
                src={item.src}
                alt={item.label}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
            />
            {isModeOn && item.isOutput && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            )}
            <div className={cn(
                "absolute bottom-4 left-4 z-20 px-3 py-1 backdrop-blur-[1.5px] rounded-md font-mono text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                !item.isOutput
                    ? "bg-black/10 text-black/80 border-black/5"
                    : "bg-black/10 text-white/90 border-white/10"
            )}>
                {item.label}
            </div>
        </motion.div>
    );
};

const ShowcaseSection = ({ isModeOn, translate }: { isModeOn: boolean, translate: (tr: string, en: string) => string }) => {
    const scrollSectionRef = useRef<HTMLElement>(null);

    // Scroll handling for the interactive grid
    const { scrollYProgress: sectionScrollProgress } = useScroll({
        target: scrollSectionRef,
        offset: ["start end", "end start"]
    });

    // Add a spring for buttery smooth scroll-linked movement
    const smoothProgress = useSpring(sectionScrollProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Sequential staggered values
    const textOpacity = useTransform(smoothProgress, [0.35, 0.5], [0, 1]);
    const plusOpacity = useTransform(smoothProgress, [0.12, 0.2], [0, 1]);

    return (
        <section
            ref={scrollSectionRef}
            id="interactive-grid"
            className="pt-24 pb-12 px-6 bg-[#0D0D0F] relative min-h-[110vh] flex flex-col items-center justify-start overflow-visible -mt-px z-20"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Image
                    src="/lp/p2/lp2_bg.webp"
                    alt="Background"
                    fill
                    className="object-cover object-top opacity-20 blur-[1px]"
                />
                {/* Seamless Blend Gradient */}
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent" />
                {/* Bottom Blend Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent" />
            </div>

            <div className="sticky top-[15vh] w-full max-w-6xl mx-auto z-10">
                <div className="relative">
                    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-center gap-12 lg:gap-0 relative">
                        <div className="flex flex-col lg:flex-row items-center justify-center w-full lg:w-[76%] relative">
                            {/* LEFT GROUP: INPUT/BASE (Images 1 & 2) */}
                            <div className="grid grid-cols-1 gap-4 md:gap-8 w-full lg:w-[24/76*100%] lg:w-[31.5%] relative z-30">
                                {/* Animated Plus Icon Center-Aligned in the Gap */}
                                <motion.div
                                    style={{ opacity: plusOpacity, scale: plusOpacity }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center pointer-events-none"
                                >
                                    <Plus className="w-8 h-8 text-white/60" strokeWidth={2.5} />
                                </motion.div>

                                {[
                                    { src: "/lp/p2/1.webp", label: translate("MODEL GÖRSELİ", "MODEL VISUAL"), isOutput: false, startPos: { x: 150, y: 100, r: -5 }, blurStrength: 0 },
                                    { src: "/lp/p2/2.webp", label: translate("ÜRÜN GÖRSELİ", "PRODUCT VISUAL"), isOutput: false, startPos: { x: 150, y: -100, r: 5 }, blurStrength: 0 },
                                ].map((item, idx) => (
                                    <InteractiveShowcaseCard
                                        key={idx}
                                        item={item}
                                        index={idx} // 0, 1
                                        baseProgress={smoothProgress}
                                        isModeOn={isModeOn}
                                    />
                                ))}
                            </div>

                            {/* GAP / SEPARATOR (Middle part starts here) */}
                            <div className="w-full lg:w-[8/76*100%] lg:w-[10.5%] flex items-center justify-center py-8 lg:py-0 relative z-20">
                                <div className="hidden lg:block h-[500px] w-[2.5px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                            </div>

                            {/* RIGHT GROUP: OUTPUTS (Images 3, 5, 4, 6) */}
                            <div className="grid grid-cols-2 gap-4 md:gap-8 w-full lg:w-[44/76*100%] lg:w-[58%] relative z-10">
                                {[
                                    { src: "/lp/p2/3.webp", label: translate("EDİTORİAL", "EDITORIAL"), isOutput: true, startPos: { x: -100, y: 120, r: -8 }, blurStrength: 8 },
                                    { src: "/lp/p2/5.webp", label: translate("İMAJ GÖRSELİ", "IMAGE VISUAL"), isOutput: true, startPos: { x: -250, y: 120, r: 12 }, blurStrength: 4 },
                                    { src: "/lp/p2/4.webp", label: translate("EDİTORİAL", "EDITORIAL"), isOutput: true, startPos: { x: -100, y: -120, r: -4 }, blurStrength: 8 },
                                    { src: "/lp/p2/6.webp", label: translate("ECOM GÖRSELİ", "ECOM VISUAL"), isOutput: true, startPos: { x: -250, y: -120, r: 6 }, blurStrength: 4 },
                                ].map((item, idx) => (
                                    <InteractiveShowcaseCard
                                        key={idx}
                                        item={item}
                                        index={idx + 2} // 2, 3, 4, 5
                                        baseProgress={smoothProgress}
                                        isModeOn={isModeOn}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* STEPS RECTIFIED UNDER MIDDLE & RIGHT */}
                <motion.div
                    style={{ opacity: textOpacity }}
                    className="-mt-[26px] w-full flex justify-center relative z-20"
                >
                    <div className="w-full lg:w-[76%] flex">
                        {/* 42% spacer ensures the text starts exactly under the middle (Editorial) images (31.5% left + 10.5% gap) */}
                        <div className="hidden lg:block lg:w-[42%]" />

                        {/* This container covers exactly the Right (Editorial/Output) columns */}
                        <div className="w-full lg:w-[58%] flex flex-wrap justify-between items-center text-[#F5F5F5] font-bold text-[13px] md:text-[15px] tracking-tight">
                            <span className="flex items-center gap-3 opacity-95">
                                <div className="w-4 h-4 rounded-full bg-[#f5f5f5] flex items-center justify-center shadow-sm"></div>
                                {translate("Model fotoğrafı yükle", "Upload model photo")}
                            </span>
                            <span className="flex items-center gap-3 opacity-95">
                                <div className="w-4 h-4 rounded-full bg-[#f5f5f5] flex items-center justify-center shadow-sm"></div>
                                {translate("Kombinini ekle", "Add your outfit")}
                            </span>
                            <span className="flex items-center gap-3 opacity-95">
                                <div className="w-4 h-4 rounded-full bg-[#f5f5f5] flex items-center justify-center shadow-sm"></div>
                                {translate("Sahneyi seç ve oluştur.", "Select scene and generate.")}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
            <ScrollDownIcon targetId="showcase" className="!bottom-37" />
        </section>
    );
};

const BeforeAfterSlider = ({ translate }: { translate: any }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleInteraction = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
        const percent = (x / rect.width) * 100;
        setSliderPos(percent);
    };

    const onMouseDown = () => setIsDragging(true);
    const onTouchStart = () => setIsDragging(true);

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            handleInteraction(clientX);
        };
        const onUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchmove', onMove);
            window.addEventListener('touchend', onUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, [isDragging]);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square md:aspect-auto md:h-[600px] rounded-[2.5rem] bg-[#0D0D0F] border border-white/10 overflow-hidden shadow-2xl group cursor-col-resize select-none"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* UNDERLAY: RESULT (AFTER) - This stays fixed */}
            <div className="absolute inset-0 bg-zinc-900 group">
                <Image
                    src="/lp/p3/after.webp"
                    alt="Editorial Result"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10 z-0" />
                {/* Result Label */}
                <div className="absolute top-8 right-8 z-20 px-4 py-1.5 bg-[#F5F5F5] text-black rounded-full font-bold text-[11px] tracking-widest shadow-xl">
                    {translate("EDİTORYAL SONUÇ", "EDITORIAL RESULT")}
                </div>
            </div>

            {/* OVERLAY: RAW (BEFORE) - This gets clipped */}
            <div
                className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <div className="absolute inset-0 w-full h-full">
                    <Image
                        src="/lp/p3/before.webp"
                        alt="Ghost Mannequin Input"
                        fill
                        className="object-cover"
                    />
                </div>
                {/* Input Label */}
                <div className="absolute top-8 left-8 z-20 px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 text-white rounded-full font-bold text-[11px] tracking-widest shadow-xl">
                    {translate("HAYALET MODEL", "GHOST MODEL")}
                </div>
            </div>

            {/* SLIDER BAR & HANDLE */}
            <div
                className="absolute top-0 bottom-0 z-30 w-[2px] bg-white/30 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] group-active:scale-90 transition-transform">
                    <div className="flex gap-1.5">
                        <div className="w-1 h-4 bg-[#0D0D0F]/40 rounded-full" />
                        <div className="w-1 h-4 bg-[#0D0D0F]/40 rounded-full" />
                    </div>
                </div>
                {/* Visual Line Glow */}
                <div className="absolute inset-0 bg-white/10 blur-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            </div>
        </motion.div>
    );
};

export default function LandingPage() {
    const { language, t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [isModeOn, setIsModeOn] = useState(true);
    // For general scroll progress
    const { scrollY } = useScroll();
    const [showNavCTA, setShowNavCTA] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 600) {
            setShowNavCTA(true);
        } else {
            setShowNavCTA(false);
        }
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const translate = (tr: string, en: string) => language === "tr" ? tr : en;

    if (!mounted) {
        return <div className="bg-[#0D0D0F] min-h-screen" />;
    }

    return (
        <div className="bg-[#0D0D0F] min-h-screen text-white selection:bg-[#F5F5F5]/30 selection:text-black font-sans overflow-x-hidden relative">


            {/* NAVBAR */}
            <nav className="fixed top-0 w-full pt-6 pb-12 flex justify-center z-40 bg-gradient-to-b from-[#0D0D0F]/90 via-[#0D0D0F]/50 to-transparent pointer-events-none">
                <div className="w-full max-w-6xl flex justify-between items-center px-6 md:px-12 pointer-events-auto">
                    <div
                        className="flex items-center gap-2 font-black text-xl tracking-tighter text-white cursor-pointer group"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20 transition-transform group-hover:scale-105">
                            <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
                            <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
                        </div>
                        <span className="group-hover:text-zinc-200 transition-colors">ModeOn<span className="text-[#F5F5F5]">.ai</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="#interactive-grid" onClick={(e) => { e.preventDefault(); document.getElementById('interactive-grid')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            <Button variant="ghost" className="hidden md:inline-flex h-9 text-[10px] px-3 font-medium text-white/60 uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-md transition-colors">
                                {translate("Nasıl Çalışır?", "How it Works?")}
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost" className="hidden md:inline-flex h-9 text-[10px] px-3 font-medium text-white/50 uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-md transition-colors">
                                {translate("Giriş Yap", "Sign In")}
                            </Button>
                        </Link>
                        <AnimatePresence>
                            {showNavCTA && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link href="/login">
                                        <Button className="h-9 px-5 rounded-md bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest transition-all">
                                            {translate("Hemen Başla", "Start Now")}
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section id="hero" className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden">
                {/* Responsive Background Image Layer */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 4, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src="/lp/hero_bg.webp"
                            alt="Hero Background"
                            fill
                            priority
                            className="object-cover object-top opacity-30"
                            sizes="100vw"
                        />
                    </motion.div>
                    {/* Strong Bottom Fade to blend seamlessly into next section */}
                    <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/80 to-transparent pointer-events-none" />
                    {/* General darken for text readability */}
                    <div className="absolute inset-0 bg-[#0D0D0F]/30 md:bg-transparent pointer-events-none" />
                </div>

                <div
                    className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto"
                >

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black tracking-[-0.02em] leading-[0.9] text-[#F5F5F5] mb-6 flex flex-col items-center">
                        <motion.span
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
                            className="-ml-12"
                        >
                            {translate("Moda Prodüksiyonu,", "Fashion Production,")}
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
                            className="italic font-bold block mt-1 ml-24 text-[#F5F5F5]"
                        >
                            {translate("Yeniden Tanımlandı.", "Redefined.")}
                        </motion.span>
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                        className="flex flex-col items-center w-full"
                    >
                        <p className="text-base md:text-lg text-zinc-300 max-w-xl mb-12 font-medium leading-relaxed tracking-wide">
                            {translate("Yükleyin. Üretin. Yayınlayın.", "Upload. Generate. Publish.")}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-12 mb-8">
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto h-12 px-8 rounded-md bg-[#F5F5F5] hover:bg-white text-black text-[11px] font-black uppercase tracking-widest transition-all shadow-none drop-shadow-none">
                                    {translate("ÜRETMEYE BAŞLA", "START CREATING")} <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                <ScrollDownIcon targetId="interactive-grid" />

            </section>

            {/* INTERACTIVE SHOWCASE SECTION (Page 2) */}
            <ShowcaseSection isModeOn={isModeOn} translate={translate} />

            {/* BEFORE / AFTER HIGHLIGHT SECTION (Page 3) */}
            <section id="showcase" className="py-32 px-6 relative overflow-hidden bg-[#0D0D0F]">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-xl md:text-3xl font-playfair tracking-tight mb-6 leading-[1.1] text-[#F5F5F5]">
                                <span className="font-normal">{translate("Gerçeklikten", "From Reality,")}</span>
                                <br />
                                <span className="italic">{translate("Ayırt Edilemez.", "Indistinguishable.")}</span>
                            </h2>
                            <p className="text-base text-zinc-400 mb-8 leading-relaxed font-medium">
                                {translate(
                                    "Basit ürün çekimlerinizi, global marka standartlarında kampanya görsellerine dönüştürün. Kumaş dokusu, doğal ışıklandırma ve anatomik doğrulukla kusursuz sonuçlar elde edin.",
                                    "Transform your simple product shots into campaign visuals at global brand standards. Achieve flawless results with perfect fabric texture, natural lighting, and anatomical accuracy."
                                )}
                            </p>

                            <ul className="space-y-4 mb-10">
                                {[
                                    translate("Fiziksel ışık simülasyonu", "Physical light simulation"),
                                    translate("Kumaş dokusu ve gölge koruması", "Fabric texture and shadow preservation"),
                                    translate("Sınırsız model ve lokasyon", "Unlimited models and locations"),
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#F5F5F5]/20 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-[#F5F5F5] rounded-full" />
                                        </div>
                                        <span className="font-medium text-sm text-zinc-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/login">
                                <Button className="h-12 px-8 rounded-xl bg-[#F5F5F5] text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest transition-all">
                                    {translate("KENDİN DENE", "TRY IT YOURSELF")}
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Interactive Before/After Slider */}
                        <BeforeAfterSlider translate={translate} />
                    </div>
                </div>
                <ScrollDownIcon targetId="features" />
            </section>

            {/* FEATURES GRID (Page 4) */}
            <section id="features" className="py-32 px-6 bg-[#0D0D0F] relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-xl md:text-3xl font-playfair tracking-tight mb-4 text-[#F5F5F5]">
                            <span className="font-normal">{translate("Moda Prodüksiyonu,", "Fashion Production,")}</span>
                            <br />
                            <span className="italic">{translate("Yeniden Tanımlandı.", "Redefined.")}</span>
                        </h2>
                        <p className="text-zinc-500 text-sm md:text-base font-medium max-w-2xl mx-auto uppercase tracking-[0.2em] opacity-80">
                            {translate("GELECEĞİN MODA TEKNOLOJİSİ", "THE FUTURE OF FASHION TECH")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: translate("Stüdyo Çekimi", "Studio Shoot"),
                                icon: Camera,
                                color: "text-blue-400",
                                desc: translate("Teknik detayları ve kumaş dokusunu vurgulayan, yüksek çözünürlüklü dijital stüdyo analizleri.", "High-resolution digital studio analysis highlighting technical details and fabric textures.")
                            },
                            {
                                title: translate("Editoryal Kampanya", "Editorial Campaign"),
                                icon: ImageIcon,
                                color: "text-[#F5F5F5]",
                                desc: translate("İkonik lokasyonlar ve profesyonel ışık kurgularıyla markanızı global moda standartlarına taşıyın.", "Carry your brand to global fashion standards with iconic locations and professional lighting.")
                            },
                            {
                                title: translate("Video Jeneratörü", "Video Generator"),
                                icon: Video,
                                color: "text-rose-400",
                                desc: translate("Statik görselleri dinamik videolara dönüştürün; gerçekçi kumaş hareketiyle kampanya videoları hazırlayın.", "Transform static images into dynamic videos with realistic fabric movement for campaign videos.")
                            },
                            {
                                title: translate("Yüz Değiştirme", "Face Swap"),
                                icon: Wand2,
                                color: "text-amber-400",
                                desc: translate("Marka yüzünüzü kişiselleştirin; yüksek hassasiyetli teknolojiyle her karede mükemmel estetiği yakalayın.", "Personalize your brand face and catch the perfect aesthetic with high-precision face swap technology.")
                            },
                            {
                                title: translate("Toplu İşlem", "Batch Processing"),
                                icon: Layers,
                                color: "text-emerald-400",
                                desc: translate("Binlerce ürünü dakikalar içinde işleyin; e-ticaret kataloglarınızda görsel bütünlük ve hız kazanın.", "Process thousands of products in minutes; gain flawless visual consistency and speed for your catalogs.")
                            },
                            {
                                title: translate("Özel AI Modelleri", "Custom AI Models"),
                                icon: Zap,
                                color: "text-cyan-400",
                                desc: translate("Kendi AI modelinizi yaratın; markanıza özel eğitilmiş zeka ile telif hakları size ait görseller üretin.", "Create your own AI model; produce unique, copyright-owned visuals with specifically trained intelligence.")
                            }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                                <feat.icon className={`w-8 h-8 mb-4 ${feat.color} group-hover:scale-110 transition-transform`} />
                                <h3 className="text-base font-bold mb-2">{feat.title}</h3>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <ScrollDownIcon targetId="cta" />
            </section>

            {/* CALL TO ACTION */}
            <section id="cta" className="py-32 px-6 relative overflow-hidden flex justify-center text-center bg-[#0D0D0F]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F5]/[0.03] to-transparent" />
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 max-w-3xl text-[#F5F5F5]"
                >
                    <h2 className="text-xl md:text-3xl font-playfair tracking-tight mb-8 leading-[0.9] text-[#F5F5F5]">
                        <span className="font-normal">{translate("Geleceğe", "Step Into")}</span>
                        <br />
                        <span className="italic">{translate("Adım At.", "The Future.")}</span>
                    </h2>
                    <p className="text-lg text-zinc-400 mb-8 font-medium">
                        {translate("Moda markanızın görsel kimliğini saniyeler içinde baştan yaratmak için hemen başlayın.", "Start now to recreate your fashion brand's visual identity in seconds.")}
                    </p>
                    <Link href="/login">
                        <Button className="h-14 px-8 rounded-xl bg-[#F5F5F5] text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest transition-all hover:scale-105">
                            {translate("ÜCRETSİZ BAŞLA", "START FOR FREE")} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </motion.div>
            </section>

            {/* FOOTER */}
            < footer className="border-t border-white/5 bg-[#0D0D0F] py-12 text-center text-sm font-medium text-zinc-500 font-mono" >
                <p>&copy; {new Date().getFullYear()} ModeOn.ai. All rights reserved.</p>
            </footer >

            {/* Global Keyframes for Animations */}
            < style jsx global > {`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style >
        </div >
    );
}
