"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Upload, Loader2, Wand2, Download, Trash2, RefreshCw } from "lucide-react"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SketchPage() {
    const { addProject, deductCredits } = useProjects();
    const { t, language } = useLanguage();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Inputs
    const [sketchImage, setSketchImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [strength, setStrength] = useState([0.75]); // 0.0 - 1.0

    // Output
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSketchImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!sketchImage) {
            toast.error(language === "tr" ? "Lütfen bir eskiz yükleyin" : "Please upload a sketch");
            return;
        }
        if (!prompt) {
            toast.error(language === "tr" ? "Lütfen bir açıklama girin" : "Please enter a prompt");
            return;
        }

        if (!deductCredits(2)) {
            toast.error(t("common.insufficientCredits"));
            return;
        }

        setIsProcessing(true);
        setResultImage(null);

        try {
            const response = await fetch("/api/sketch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: sketchImage,
                    prompt: prompt,
                    strength: strength[0] // Pass the single value
                })
            });

            const data = await response.json();

            const imageUrl = data.images?.[0]?.url || data.image?.url;

            if (imageUrl) {
                setResultImage(imageUrl);
                addProject({
                    title: language === "tr" ? "Eskiz Dönüşümü" : "Sketch Transformation",
                    type: "Sketch",
                    imageUrl: imageUrl,
                    description: prompt
                });
                toast.success(language === "tr" ? "Tasarım oluşturuldu!" : "Design generated!");
            } else if (data.error) {
                toast.error(`Error: ${data.error}`);
            } else {
                console.warn("Unexpected API response:", data);
                toast.error("Oluşturuldu fakat görsel bulunamadı. (API Yanıtı geçersiz)");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Generation failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
            {/* Control Panel */}
            <div className="w-full lg:w-[400px] border-r bg-background flex flex-col h-full">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Wand2 className="w-6 h-6 text-violet-500" />
                        {language === "tr" ? "Eskizden Tasarıma" : "Sketch to Design"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {language === "tr" ? "Çizimlerinizi gerçekçi ürünlere dönüştürün." : "Turn your sketches into realistic products."}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 1. Upload Sketch */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">{language === "tr" ? "1. Eskiz Yükle" : "1. Upload Sketch"}</label>
                        <div className="border-2 border-dashed rounded-xl h-48 bg-muted/20 relative group hover:border-violet-500 transition-colors overflow-hidden">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={handleFileUpload}
                            />
                            {sketchImage ? (
                                <div className="relative h-full w-full">
                                    <img src={sketchImage} className="w-full h-full object-contain p-2" />
                                    <div className="absolute top-2 right-2 flex gap-1 z-20">
                                        <Button size="icon" variant="destructive" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); setSketchImage(null); }}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 pointer-events-none">
                                    <Upload className="w-8 h-8 opacity-50" />
                                    <span className="text-xs">{language === "tr" ? "Görsel sürükleyin veya tıklayın" : "Drop sketch or click to select"}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Prompt */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">{language === "tr" ? "2. Ürün Açıklaması" : "2. Product Description"}</label>
                        <Textarea
                            placeholder={language === "tr" ? "Örn: Kırmızı deri ceket, gümüş fermuarlı, stüdyo ışığı..." : "Ex: Red leather jacket, silver zipper, studio lighting..."}
                            className="h-24 resize-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    {/* 3. Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{language === "tr" ? "Eskize Sadakat" : "Sketch Fidelity"}</label>
                            <span className="text-xs text-muted-foreground">{Math.round(strength[0] * 100)}%</span>
                        </div>
                        <Slider
                            value={strength}
                            onValueChange={setStrength}
                            min={0.3}
                            max={1.0}
                            step={0.05}
                            className="py-2"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {language === "tr"
                                ? "Yüksek değerler çizgilerinizi korur, düşük değerler yapay zekaya daha fazla özgürlük tanır."
                                : "Higher values preserve your lines, lower values give AI more freedom."}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t bg-muted/10">
                    <Button
                        size="lg"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg"
                        onClick={handleGenerate}
                        disabled={isProcessing || !sketchImage || !prompt}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                        {isProcessing ? (language === "tr" ? "Oluşturuluyor..." : "Generating...") : (language === "tr" ? "Tasarımı Oluştur" : "Generate Design")}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        {language === "tr" ? "Maliyet: 2 Kredi" : "Cost: 2 Credits"}
                    </p>
                </div>
            </div>

            {/* Result Panel */}
            <div className="flex-1 bg-stone-100 dark:bg-stone-950 flex items-center justify-center p-8 relative">
                {resultImage ? (
                    <div className="relative group max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden">
                        <img src={resultImage} className="max-h-[calc(100vh-100px)] object-contain rounded-lg" />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" onClick={() => window.open(resultImage, '_blank')}>
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground max-w-sm">
                        <div className="w-24 h-24 bg-white dark:bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Wand2 className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="font-semibold text-lg">{language === "tr" ? "Henüz görsel yok" : "No image yet"}</h3>
                        <p className="text-sm mt-2">
                            {language === "tr"
                                ? "Soldaki panelden eskiz yükleyin ve özellikleri girerek ilk tasarımınızı oluşturun."
                                : "Upload a sketch and enter details in the left panel to generate your first design."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
