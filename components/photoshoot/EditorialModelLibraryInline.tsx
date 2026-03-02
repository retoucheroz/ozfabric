"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, Sparkles, UserCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelSection } from "@/components/photoshoot/ModelSection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditorialModelLibraryInlineProps {
    onClose: () => void;
    language: string;
    gender: string;
    setGender: (val: string) => void;
    modelImage: string | null;
    modelImageHighRes: string | null;
    setModelImage: (val: string | null) => void;
    setModelImageHighRes: (val: string | null) => void;
    handleAssetUpload: (id: string, file: File | File[]) => void;
    handleAssetRemove: (id: string, e: React.MouseEvent, index?: number) => void;
    savedModels: any[];
    modelDescription: string;
    setModelDescription: (val: string) => void;
    gridCols?: number;
}

export function EditorialModelLibraryInline({
    onClose,
    language,
    gender,
    setGender,
    modelImage,
    modelImageHighRes,
    setModelImage,
    setModelImageHighRes,
    handleAssetUpload,
    handleAssetRemove,
    savedModels,
    modelDescription,
    setModelDescription,
    gridCols = 5
}: EditorialModelLibraryInlineProps) {
    const [tab, setTab] = useState("library");

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-2 shrink-0 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white hover:text-black transition-all shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <TabsList className="flex-1 grid grid-cols-2 bg-white/5 border border-white/5 p-1 h-11 rounded-md">
                        <TabsTrigger value="library" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black rounded-md">
                            {language === "tr" ? "KÜTÜPHANE" : "LIBRARY"}
                        </TabsTrigger>
                        <TabsTrigger value="prompt" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black rounded-md">
                            {language === "tr" ? "PROMPT" : "PROMPT"}
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                    <TabsContent value="library" className="m-0 h-full outline-none max-w-5xl mx-auto w-full">
                        <ModelSection
                            view="library"
                            gridCols={gridCols}
                            language={language}
                            gender={gender}
                            setGender={setGender}
                            assets={{ model: modelImage }}
                            activeLibraryAsset="model"
                            setActiveLibraryAsset={() => onClose()}
                            handleAssetUpload={handleAssetUpload}
                            handleAssetRemove={handleAssetRemove}
                            savedModels={savedModels}
                            setAssets={(updater: any) => {
                                const newVal = typeof updater === 'function' ? updater({ model: modelImage }).model : updater.model;
                                setModelImage(newVal);
                            }}
                            setAssetsHighRes={(updater: any) => {
                                const newVal = typeof updater === 'function' ? updater({ model: modelImageHighRes }).model : updater.model;
                                setModelImageHighRes(newVal);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="prompt" className="m-0 h-full outline-none">
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-1">
                                    {language === "tr" ? "ÖZEL MODEL TANIMI" : "CUSTOM MODEL DESCRIPTION"}
                                </label>
                                <textarea
                                    value={modelDescription}
                                    onChange={(e) => setModelDescription(e.target.value)}
                                    className="w-full h-56 p-4 text-xs font-bold leading-relaxed rounded-2xl border border-white/5 bg-black/20 text-white resize-none focus:ring-2 focus:ring-white/20 outline-none shadow-inner custom-scrollbar"
                                    placeholder={language === "tr" ? "Modelin görünümünü, yaşını, etnik kökenini ve stilini tarif edin..." : "Describe the model's appearance, age, ethnicity, and style..."}
                                ></textarea>
                            </div>
                            <Button
                                onClick={() => {
                                    onClose();
                                    toast.success(language === "tr" ? "Model tanımı güncellendi" : "Model description updated");
                                }}
                                className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all"
                            >
                                {language === "tr" ? "TANIMI UYGULA" : "APPLY DESCRIPTION"}
                            </Button>
                            <div className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <UserCircle className="w-5 h-5 text-zinc-400 shrink-0" />
                                <p className="text-[9px] text-zinc-500 font-bold leading-relaxed uppercase tracking-tight">
                                    {language === "tr" ? "Not: Görsel yüklemek yerine sadece metin ile model tarif edebilirsiniz. Bu durumda kütüphanedeki görseller yoksayılır." : "Note: You can describe the model with text instead of uploading an image. In this case, library images will be ignored."}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
