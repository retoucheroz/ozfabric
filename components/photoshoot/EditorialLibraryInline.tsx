"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Sparkles, Loader2, Link, Trash2, Edit2, Info, ChevronLeft, Plus } from "lucide-react";
import { dbOperations, STORES } from "@/lib/db";
import { toast } from "sonner";
import { resizeImageToThumbnail, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface EditorialLibraryInlineProps {
    onClose: () => void;
    activeType: 'background' | 'pose' | null;
    onSelect: (item: any) => void;
    language: string;
}

export function EditorialLibraryInline({ onClose, activeType, onSelect, language }: EditorialLibraryInlineProps) {
    const [items, setItems] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [isAddMode, setIsAddMode] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data?.user) {
                    setUser(data.user);
                    setIsAdmin(data.user?.role === 'admin');
                }
            })
            .catch(err => console.error("Session missing", err));
    }, []);

    const loadItems = async () => {
        if (!activeType) return;
        try {
            const store = activeType === 'background' ? STORES.BACKGROUNDS : STORES.POSES;
            const res = await dbOperations.getAll<any>(store);
            setItems(res.sort((a, b) => b.createdAt - a.createdAt));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadItems();
        setIsAddMode(false);
        setPreview(null);
        setName("");
        setPrompt("");
    }, [activeType]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGeminiAnalyze = async () => {
        if (!preview) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: preview, language, type: 'background' })
            });

            const data = await res.json();
            if (res.ok && data.prompt) {
                setPrompt(data.prompt);
                toast.success(language === "tr" ? "Prompt başarıyla oluşturuldu!" : "Prompt generated successfully!");
            } else {
                toast.error(data.error || "Analysis failed");
            }
        } catch (error) {
            toast.error("Network Error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async () => {
        if (!preview || !name) {
            toast.error(language === "tr" ? "Görsel ve isim zorunludur" : "Image and name are required");
            return;
        }

        const optimized = await resizeImageToThumbnail(preview, 1024);

        const newItem: any = {
            id: `ed-${activeType}-${Date.now()}`,
            url: optimized,
            name,
            customPrompt: prompt,
            createdAt: Date.now(),
            creatorRole: isAdmin ? 'admin' : 'user',
            creatorId: user?.email || 'local',
            type: activeType
        };

        try {
            const store = activeType === 'background' ? STORES.BACKGROUNDS : STORES.POSES;
            await dbOperations.add(store, newItem);
            toast.success(language === "tr" ? "Başarıyla eklendi" : "Added successfully");
            setPreview(null);
            setName("");
            setPrompt("");
            setIsAddMode(false);
            loadItems();
        } catch (e) {
            toast.error("Failed to save");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const store = activeType === 'background' ? STORES.BACKGROUNDS : STORES.POSES;
            await dbOperations.delete(store, id);
            loadItems();
        } catch (e) { }
    };

    const userUploadedCount = items.filter(i => i.creatorRole !== 'admin' && i.creatorId === (user?.email || 'local')).length;
    const canUpload = isAdmin || userUploadedCount < 1;

    return (
        <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white hover:text-black transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">
                            {language === "tr" ? (activeType === 'background' ? 'Arkaplan Kütüphanesi' : 'Poz Kütüphanesi') : (activeType === 'background' ? 'Background Library' : 'Pose Library')}
                        </h3>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
                            {isAddMode ? (language === "tr" ? "YENİ ÖGE EKLE" : "ADD NEW ITEM") : (language === "tr" ? "BİR ÖGE SEÇİN" : "SELECT AN ITEM")}
                        </span>
                    </div>
                </div>
                {!isAddMode && canUpload && (
                    <Button
                        size="sm"
                        onClick={() => setIsAddMode(true)}
                        className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-wider text-[10px]"
                    >
                        <Plus className="w-3 h-3 mr-2" />
                        {language === "tr" ? "YÜKLE" : "UPLOAD"}
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <AnimatePresence mode="wait">
                    {isAddMode ? (
                        <motion.div
                            key="add-mode"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                                        {language === "tr" ? "GÖRSEL SEÇİN" : "SELECT IMAGE"}
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-40 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] transition-all bg-black/20 relative overflow-hidden"
                                    >
                                        {preview ? (
                                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{language === "tr" ? "TIKLA" : "CLICK"}</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">{language === "tr" ? "İSİM" : "NAME"}</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={language === "tr" ? "Örn: Tokyo" : "e.g. Tokyo"}
                                            className="h-10 bg-white/5 border-white/5 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">{language === "tr" ? "PROMPT" : "PROMPT"}</label>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-[8px] font-black uppercase tracking-wider text-violet-400 bg-violet-400/5 hover:bg-violet-400/10"
                                                onClick={handleGeminiAnalyze}
                                                disabled={!preview || isAnalyzing}
                                            >
                                                {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                                {language === "tr" ? "AI İLE YAZDIR" : "AI ANALYZE"}
                                            </Button>
                                        </div>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="w-full h-20 text-[10px] p-3 rounded-xl border border-white/5 bg-white/5 focus:ring-1 focus:ring-white/20 outline-none resize-none font-medium text-zinc-300"
                                            placeholder="..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="ghost" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest border border-white/5" onClick={() => setIsAddMode(false)}>
                                        {language === "tr" ? "İPTAL" : "CANCEL"}
                                    </Button>
                                    <Button className="flex-[2] h-10 bg-white text-black hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest" onClick={handleSave}>
                                        {language === "tr" ? "KAYDET" : "SAVE"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list-mode"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                        >
                            {items.length === 0 && (
                                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-zinc-600">
                                    <Camera className="w-10 h-10 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{language === "tr" ? "Kütüphane boş" : "Library is empty"}</p>
                                </div>
                            )}

                            {items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 cursor-pointer hover:border-white/20 transition-all aspect-[4/5]"
                                >
                                    <img src={item.url} className="w-full h-full object-cover" alt={item.name} />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/20 to-transparent p-3 pt-8">
                                        <p className="text-[9px] font-black text-white uppercase truncate tracking-tight">{item.name}</p>
                                        <span className={cn(
                                            "text-[7px] font-black uppercase tracking-widest mt-0.5 block",
                                            item.creatorRole === 'admin' ? "text-violet-500/80" : "text-orange-500/80"
                                        )}>
                                            {item.creatorRole === 'admin' ? 'PLATFORM' : 'PERSONAL'}
                                        </span>
                                    </div>

                                    {(isAdmin || (item.creatorRole !== 'admin' && item.creatorId === user?.email)) && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="destructive" className="h-6 w-6 rounded-lg bg-red-500/80 hover:bg-red-500 shadow-lg" onClick={(e) => handleDelete(item.id, e)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
