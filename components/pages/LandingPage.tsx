"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Camera, Image as ImageIcon, Zap, Upload, Wand2, Layers, Video, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";


const ScrollDownIcon = ({ targetId }: { targetId?: string }) => {
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
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center cursor-pointer p-4 group"
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

export default function LandingPage() {
    const { language, t } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [isModeOn, setIsModeOn] = useState(true);

    // For general scroll progress
    const { scrollYProgress, scrollY } = useScroll();
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

    if (!mounted) return null;

    const translate = (tr: string, en: string) => language === "tr" ? tr : en;

    return (
        <div className="bg-[#0D0D0F] min-h-screen text-white selection:bg-[#F5F5F5]/30 selection:text-black font-sans overflow-x-hidden relative">


            {/* NAVBAR */}
            <nav className="fixed top-0 w-full pt-6 pb-12 flex justify-center z-40 bg-gradient-to-b from-[#0D0D0F]/90 via-[#0D0D0F]/50 to-transparent pointer-events-none">
                <div className="w-full max-w-6xl flex justify-between items-center px-6 md:px-12 pointer-events-auto">
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-white">
                        <div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
                            <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
                            <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
                        </div>
                        <span>ModeOn<span className="text-[#F5F5F5]">.ai</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="#pipeline" onClick={(e) => { e.preventDefault(); document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' }); }}>
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
                            src="/lp/1.jpg"
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

                <ScrollDownIcon targetId="pipeline" />

            </section>

            {/* INTERACTIVE SHOWCASE SECTION (Page 2) */}
            <section id="interactive-grid" className="py-24 px-6 bg-transparent relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#0D0D0F]">
                    <Image
                        src="/lp/1.jpg"
                        alt="Background"
                        fill
                        className="object-cover opacity-10 blur-xl"
                    />
                </div>

                <div className="max-w-6xl w-full mx-auto relative z-10">
                    <div className="relative">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-0 relative">
                            {/* LEFT GROUP: INPUT/BASE (Images 1 & 2) */}
                            <div className="grid grid-cols-1 gap-4 md:gap-8 w-full lg:w-[24%]">
                                {[
                                    { src: "/lp/p2/1.webp", label: translate("model görseli", "model visual"), isOutput: true },
                                    { src: "/lp/p2/2.webp", label: translate("ürün görseli", "product visual"), isOutput: false },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                                        viewport={{ once: true }}
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
                                            "absolute top-4 left-4 z-20 px-3 py-1 backdrop-blur-md rounded-lg font-mono text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                                            !item.isOutput
                                                ? "bg-white/90 text-black border-white"
                                                : "bg-black/60 text-white border-white/10"
                                        )}>
                                            {item.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* GAP / SEPARATOR */}
                            <div className="w-full lg:w-[6%] flex items-center justify-center py-8 lg:py-0 relative">
                                {/* Optional Vertical Line */}
                                <div className="hidden lg:block h-32 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            </div>

                            {/* RIGHT GROUP: OUTPUTS (Images 3, 5, 4, 6) */}
                            <div className="grid grid-cols-2 gap-4 md:gap-8 w-full lg:w-[44%]">
                                {[
                                    { src: "/lp/p2/3.webp", label: translate("editorial", "editorial"), isOutput: true },
                                    { src: "/lp/p2/5.webp", label: translate("imaj görseli", "image visual"), isOutput: true },
                                    { src: "/lp/p2/4.webp", label: translate("editorial", "editorial"), isOutput: true },
                                    { src: "/lp/p2/6.webp", label: translate("ecom görseli", "ecom visual"), isOutput: true },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                                        viewport={{ once: true }}
                                        className={cn(
                                            "relative aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 ease-in-out",
                                            "hover:border-white/20 group",
                                            !isModeOn && item.isOutput && "grayscale opacity-40 scale-[0.98]",
                                            isModeOn && item.isOutput && "grayscale-0 opacity-100 scale-100"
                                        )}
                                    >
                                        <Image
                                            src={item.src}
                                            alt={item.label}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 768px) 50vw, 33vw"
                                        />
                                        {isModeOn && item.isOutput && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                        )}
                                        <div className={cn(
                                            "absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 text-white border border-white/10 backdrop-blur-md rounded-lg font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-500"
                                        )}>
                                            {item.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-2xl md:text-3xl font-black tracking-tight mb-4"
                        >
                            {isModeOn
                                ? translate("AI Gücüyle Gerçekleşen Dönüşüm", "The Power of AI Transformation")
                                : translate("Ürününüzü Hazırlayın", "Ready Your Product")
                            }
                        </motion.h2>
                        <p className="text-zinc-500 text-sm md:text-base max-w-xl mx-auto">
                            {translate(
                                "Modelleri, mekanları ve ışığı saniyeler içinde değiştirin. Hayal ettiğiniz koleksiyonu tek bir ürün görseliyle gerçeğe dönüştürün.",
                                "Change models, locations, and lighting in seconds. Turn your collection into reality with just one product image."
                            )}
                        </p>
                    </div>
                </div>
                <ScrollDownIcon targetId="showcase" />
            </section>

            {/* BEFORE / AFTER HIGHLIGHT SECTION */}
            <section id="showcase" className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#F5F5F5]/5" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
                                {translate("Gerçeklikten", "Indistinguishable")}
                                <br />
                                <span className="text-[#F5F5F5] italic">{translate("Ayırt Edilemez", "From Reality")}</span>
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
                                <Button className="h-12 px-8 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest transition-all">
                                    {translate("KENDİN DENE", "TRY IT YOURSELF")}
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Visual Representation of Before/After */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-square md:aspect-[4/3] rounded-[2rem] bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl group"
                        >
                            {/* RAW Label */}
                            <div className="absolute top-6 left-6 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg font-mono text-[10px] font-bold text-white uppercase tracking-widest">
                                {translate("GİRDİ (RAW)", "INPUT (RAW)")}
                            </div>

                            {/* RESULT Label */}
                            <div className="absolute top-6 right-6 z-20 px-3 py-1 bg-[#F5F5F5]/90 text-black backdrop-blur-md rounded-lg font-mono text-[10px] font-bold text-white uppercase tracking-widest">
                                {translate("SONUÇ", "RESULT")}
                            </div>

                            <div className="absolute inset-0 flex">
                                {/* Left Side (Before Mock) */}
                                <div className="w-1/2 h-full bg-zinc-800 border-r border-dashed border-white/20 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                    <div className="w-3/4 h-3/4 border-2 border-white/10 border-dashed rounded-xl flex items-center justify-center">
                                        <div className="text-center opacity-30">
                                            <Layers className="w-16 h-16 mx-auto mb-4" />
                                            <p className="font-bold text-sm tracking-widest uppercase">{translate("HAYALET MANKEN", "GHOST MANNEQUIN")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side (After Mock) */}
                                <div className="w-1/2 h-full relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F5]/10 to-black" />
                                    {/* Simulated model silhouette */}
                                    <div className="w-3/4 h-[90%] bg-gradient-to-t from-black via-white/10 to-white/5 rounded-t-full relative z-10 flex items-center justify-center">
                                        <div className="text-center text-white/80 drop-shadow-lg">
                                            <Camera className="w-12 h-12 mx-auto mb-2 text-[#F5F5F5]" />
                                            <p className="font-bold text-xs tracking-widest uppercase">{translate("EDİTORYAL KARE", "EDITORIAL SHOT")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Divider UI */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-[#F5F5F5] z-30">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-3 bg-zinc-300 rounded-full" />
                                        <div className="w-1 h-3 bg-zinc-300 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                <ScrollDownIcon targetId="features" />
            </section>

            {/* FEATURES GRID */}
            <section id="features" className="py-32 px-6 bg-[#0D0D0F] relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{translate("Sınırları Ortadan Kaldırın", "Remove The Limits")}</h2>
                        <p className="text-zinc-400 text-base font-medium">{translate("Bir moda stüdyosunun yapabileceği her şey, artık tarayıcınızda.", "Everything a fashion studio can do, now in your browser.")}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: translate("Stüdyo Çekimi", "Studio Shoot"), icon: Camera, color: "text-blue-400" },
                            { title: translate("Editoryal Kampanya", "Editorial Campaign"), icon: ImageIcon, color: "text-[#F5F5F5]" },
                            { title: translate("Video Jeneratörü", "Video Generator"), icon: Video, color: "text-rose-400" },
                            { title: translate("Yüz Değiştirme", "Face Swap"), icon: Wand2, color: "text-amber-400" },
                            { title: translate("Toplu İşlem", "Batch Processing"), icon: Layers, color: "text-emerald-400" },
                            { title: translate("Özel AI Modelleri", "Custom AI Models"), icon: Zap, color: "text-cyan-400" }
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
                                <p className="text-xs text-zinc-500 font-medium">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <ScrollDownIcon targetId="cta" />
            </section>

            {/* CALL TO ACTION */}
            <section id="cta" className="py-32 px-6 relative overflow-hidden flex justify-center text-center">
                <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F5]/5 to-transparent" />
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 max-w-3xl"
                >
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-none">
                        {translate("Geleceğe", "Step Into The")} <br /><span className="text-[#F5F5F5]">{translate("Adım At", "Future")}</span>
                    </h2>
                    <p className="text-lg text-zinc-400 mb-8 font-medium">
                        {translate("Moda markanızın görsel kimliğini saniyeler içinde baştan yaratmak için hemen başlayın.", "Start now to recreate your fashion brand's visual identity in seconds.")}
                    </p>
                    <Link href="/login">
                        <Button className="h-14 px-8 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest transition-all hover:scale-105">
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
