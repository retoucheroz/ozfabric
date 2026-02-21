"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Camera, Sparkles, Loader2, Link, Trash2, Edit2, Info } from "lucide-react";
import { dbOperations, STORES } from "@/lib/db";
import { SavedBackground, SavedPose } from "@/lib/photoshoot-shared";
import { toast } from "sonner";
import { resizeImageToThumbnail } from "@/lib/utils";

interface EditorialLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeType: 'background' | 'pose' | null;
    onSelect: (item: any) => void;
    language: string;
}

export function EditorialLibraryModal({ isOpen, onClose, activeType, onSelect, language }: EditorialLibraryModalProps) {
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
                if (data.authenticated) {
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
        if (isOpen) {
            loadItems();
            setIsAddMode(false);
            setPreview(null);
            setName("");
            setPrompt("");
        }
    }, [isOpen, activeType]);

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
            // Re-use logic for background analyzing that we added
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
            creatorRole: isAdmin ? 'admin' : 'user', // Used to tell if the user added it
            creatorId: user?.username || 'local',
            type: activeType
        };

        if (activeType === 'pose') {
            newItem.stickmanUrl = optimized; // For simplicity in editorial, we'll store it directly
            newItem.gender = 'female';
        }

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

    // Limits
    const userUploadedCount = items.filter(i => i.creatorRole !== 'admin' && i.creatorId === (user?.username || 'local')).length;
    const canUpload = isAdmin || userUploadedCount < 1;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[var(--bg-default)] border-[var(--border-subtle)] overflow-hidden h-[85vh] p-0 flex flex-col">
                <DialogHeader className="p-6 pb-2 border-b border-[var(--border-subtle)] shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-black uppercase italic text-[var(--text-primary)]">
                        {language === "tr" ? (activeType === 'background' ? 'Arkaplan Kütüphanesi' : 'Poz Kütüphanesi') : (activeType === 'background' ? 'Background Library' : 'Pose Library')}
                    </DialogTitle>
                    {!isAddMode && canUpload && (
                        <Button size="sm" onClick={() => setIsAddMode(true)} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold h-9">
                            <Upload className="w-4 h-4 mr-2" />
                            {language === "tr" ? "Yükle" : "Upload"}
                        </Button>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {isAddMode ? (
                        <div className="space-y-6 max-w-xl mx-auto">
                            <Button variant="ghost" onClick={() => setIsAddMode(false)} className="mb-4">
                                <X className="w-4 h-4 mr-2" /> {language === "tr" ? "İptal" : "Cancel"}
                            </Button>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
                                        {language === "tr" ? "Seçilen Görsel" : "Selected Image"}
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-48 rounded-2xl border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--bg-elevated)] transition-all bg-[var(--bg-surface)] relative overflow-hidden"
                                    >
                                        {preview ? (
                                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                                                <span className="text-xs font-bold text-[var(--text-secondary)]">{language === "tr" ? "Buraya Tıklayın" : "Click Here"}</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
                                        {language === "tr" ? "İsim" : "Name"}
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={language === "tr" ? "Örn: Paris Sokak" : "e.g. Paris Street"}
                                        className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                                            {language === "tr" ? "Prompt (İsteğe Bağlı)" : "Prompt (Optional)"}
                                        </label>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-[10px] font-bold shadow-sm"
                                            onClick={handleGeminiAnalyze}
                                            disabled={!preview || isAnalyzing}
                                        >
                                            {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1 text-violet-500" />}
                                            {language === "tr" ? "Gemini İle Yazdır" : "Generate with Gemini"}
                                        </Button>
                                    </div>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full h-32 text-sm p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] focus:ring-2 focus:ring-[var(--accent-primary)] outline-none resize-none"
                                        placeholder={language === "tr" ? "Tanımlayıcı bir prompt yazın..." : "Write a descriptive prompt..."}
                                    />
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {isAdmin ?
                                            (language === "tr" ? "Kütüphanede bu arkaplan seçildiğinde kullanıcılara görsel değil SADECE bu prompt gönderilecek." : "When selected, ONLY this prompt will be sent to the API, without the image.")
                                            : (language === "tr" ? "Eğer kendiniz bir görsel eklerseniz görsel üretim için kullanılır. Prompt üretimi etkiler." : "Since you uploaded it, both the image and prompt can be used.")
                                        }
                                    </p>
                                </div>

                                <Button size="lg" className="w-full h-12 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] font-bold text-sm tracking-widest uppercase shadow-lg shadow-[var(--accent-primary)]/20" onClick={handleSave}>
                                    {language === "tr" ? "KAYDET" : "SAVE"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.length === 0 && (
                                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-[var(--text-muted)]">
                                    <Camera className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-semibold">{language === "tr" ? "Kütüphane boş." : "Library is empty."}</p>
                                </div>
                            )}

                            {items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                    className="group relative rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-primary)] hover:shadow-lg transition-all aspect-[3/4]"
                                >
                                    <img src={item.url} className="w-full h-full object-cover" alt={item.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-xs font-bold text-white uppercase truncate">{item.name}</p>
                                        {item.creatorRole === 'admin' ? (
                                            <span className="text-[9px] font-black text-violet-400 mt-1 uppercase">Platform</span>
                                        ) : (
                                            <span className="text-[9px] font-black text-orange-400 mt-1 uppercase">Kişisel / Custom</span>
                                        )}
                                    </div>

                                    {(isAdmin || (item.creatorRole !== 'admin' && item.creatorId === user?.username)) && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="destructive" className="h-7 w-7 rounded-sm" onClick={(e) => handleDelete(item.id, e)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
