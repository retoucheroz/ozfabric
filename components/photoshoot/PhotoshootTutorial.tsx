"use client";

import React from "react";

interface PhotoshootTutorialProps {
    language: string;
}

export function PhotoshootTutorial({ language }: PhotoshootTutorialProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center pt-10 pb-[51px] px-6 text-center relative overflow-hidden bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1] pointer-events-none">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,currentColor_20px,currentColor_21px)]" />
            </div>

            <div className="z-10 w-full max-w-4xl space-y-4">
                {/* Tutorial Visual Area */}
                <div className="relative aspect-[16/7] flex items-center justify-center">
                    <img
                        src="/photoshoot_tutorial.webp"
                        className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                        alt="Photoshoot Tutorial"
                        onError={(e) => {
                            // Fallback if image doesn't exist yet
                            (e.target as any).style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'flex flex-col items-center gap-4 text-muted-foreground opacity-40 border border-dashed border-border rounded-[40px] p-20 w-full aspect-[16/7]';
                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg><span class="text-xs font-bold uppercase tracking-widest">PRODUCT STUDIO</span>';
                            (e.target as any).parentElement.appendChild(fallback);
                        }}
                    />
                </div>

                {/* Steps Description */}
                <div className="grid grid-cols-3 gap-6 text-left border-t border-[var(--border-subtle)]/50 pt-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-black italic shadow-xl border border-black/5">1</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">
                                {language === "tr" ? "MODEL & ÜRÜN" : "MODEL & PRODUCT"}
                            </span>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight opacity-70">
                            {language === "tr" ? "Model seçimi ve ürün seçimlerinizi yapın." : "Select your model and products."}
                        </p>
                    </div>

                    <div className="space-y-2 border-x border-[var(--border-subtle)]/30 px-6">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-black italic shadow-xl border border-black/5">2</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">
                                {language === "tr" ? "AYARLAR" : "SETTINGS"}
                            </span>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight opacity-70">
                            {language === "tr" ? "Stüdyo, poz, ışık ve gelişmiş diğer ayarlarınızı seçin." : "Choose studio, pose, lighting and advanced settings."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-black italic shadow-xl border border-black/5">3</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">
                                {language === "tr" ? "ÜRETİM" : "PRODUCTION"}
                            </span>
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight opacity-70">
                            {language === "tr" ? "Tek görsel veya çoklu üretim seçeneklerinden birini seçin." : "Choose between single or batch production options."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--accent-primary)]/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
}
