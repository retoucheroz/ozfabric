"use client";

import React, { useState, useRef } from "react";
import { Upload, ImageIcon, RefreshCw, AlertCircle, Info, Download, Copy, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import MannequinRenderer, { MannequinRendererRef, SAM3DMetadata } from "@/components/mannequin-pose/MannequinRenderer";

// Referans manken görselleri (Projedeki varlıklara atıf, placeholder)
const REF_MANNEQUINS = [
    "https://ozfabric.com/assets/ref_mannequin_1.png",
    "https://ozfabric.com/assets/ref_mannequin_2.png"
];

const LIGHT_STYLES = [
    {
        id: "studio", label: "Stüdyo",
        prompt: "black matte mannequin, professional studio photography, soft diffused lighting from above and sides, subtle shadows on body contours, light grey seamless paper backdrop, fashion mannequin display, high-end product photography, no reflections, matte finish surface"
    },
    {
        id: "dramatic", label: "Dramatik",
        prompt: "black matte mannequin, dramatic side lighting, deep shadows, high contrast, dark studio, fashion editorial lighting, matte finish"
    },
    {
        id: "flat", label: "Düz",
        prompt: "black matte mannequin, even flat lighting, minimal shadows, bright studio, clean product photography, matte finish"
    }
];

export default function MannequinPosePage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [stepMsg, setStepMsg] = useState("");

    // Pipeline A states
    const [glbUrl, setGlbUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<SAM3DMetadata | null>(null);
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState(LIGHT_STYLES[0].prompt);

    const rendererRef = useRef<MannequinRendererRef>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setGlbUrl(null);
            setMetadata(null);
            setFinalUrl(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setGlbUrl(null);
            setMetadata(null);
            setFinalUrl(null);
        }
    };

    const uploadFileBase64 = async (f: File) => {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
        });

        // Use our fast edge endpoint
        const res = await fetch('/api/video/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, filename: f.name || 'image.png' })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Görsel yüklenemedi: ${errText}`);
        }
        const { url } = await res.json();
        return url as string;
    };

    // PIPELINE A: SAM3D -> Three.js -> ICLight
    const runPipelineA = async () => {
        if (!file) return toast.error("Fotoğraf yükleyin");
        setProcessing(true);
        try {
            // STEP 1
            setStepMsg("1/4: Fotoğraf buluta yükleniyor...");
            const imageUrl = await uploadFileBase64(file);

            // STEP 2
            setStepMsg("2/4: SAM 3D ile 3D poz çıkarılıyor... (~10sn)");
            const samRes = await fetch('/api/mannequin-pose/sam3d', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl })
            });
            const samData = await samRes.json();
            if (!samRes.ok) throw new Error(samData.error || "SAM3D hatası");

            setGlbUrl(samData.glbUrl);
            setMetadata(samData.metadata);

            // Wait briefly for Three.js canvas to initialize and render the GLB
            setStepMsg("3/4: Base 3D Render alınıyor...");
            await new Promise(r => setTimeout(r, 2000));

            if (!rendererRef.current) throw new Error("Renderer ref bulunamadı");

            const threeRenderDataUrl = rendererRef.current.exportDataUrl();
            if (!threeRenderDataUrl) throw new Error("Base render alınamadı. Kanvas izni yok.");

            // Upload the three.js render to Fal before IC-Light
            setStepMsg("3.5/4: Base Render yükleniyor...");
            const resBlob = await (await fetch(threeRenderDataUrl)).blob();
            const renderFile = new File([resBlob], "render.png", { type: "image/png" });
            const uploadedRenderUrl = await uploadFileBase64(renderFile);

            // STEP 3
            setStepMsg("4/4: ICLight V2 Stüdyo Işıklandırması uygulanıyor... (~15sn)");
            const icRes = await fetch('/api/mannequin-pose/relight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: uploadedRenderUrl,
                    prompt: selectedStyle
                })
            });
            const icData = await icRes.json();
            if (!icRes.ok) throw new Error(icData.error || "ICLight hatası");

            setFinalUrl(icData.images[0].url);
            toast.success("Manken başarıyla oluşturuldu!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Bilinmeyen bir hata oluştu");
        } finally {
            setProcessing(false);
            setStepMsg("");
        }
    };

    // PIPELINE B: FLUX Depth + IP-Adapter
    const runPipelineB = async () => {
        if (!file) return toast.error("Fotoğraf yükleyin");
        setProcessing(true);
        try {
            setStepMsg("1/2: Fotoğraf buluta yükleniyor...");
            const imageUrl = await uploadFileBase64(file);

            setStepMsg("2/2: FLUX ControlNet Depth Pipeline işleniyor... (~15sn)");
            const fluxRes = await fetch('/api/mannequin-pose/flux', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modelPhotoUrl: imageUrl,
                    referenceMannequinUrl: REF_MANNEQUINS[0],
                    prompt: selectedStyle
                })
            });
            const fluxData = await fluxRes.json();
            if (!fluxRes.ok) throw new Error(fluxData.error || "FLUX hatası");

            setFinalUrl(fluxData.images[0].url);
            toast.success("Manken başarıyla oluşturuldu!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Bilinmeyen bir hata oluştu");
        } finally {
            setProcessing(false);
            setStepMsg("");
        }
    };

    return (
        <div className="container mx-auto max-w-7xl py-12 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    🖤 3D Mannequin Pose Renderer (v2)
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Stüdyo veya editorial model fotoğrafını yükleyip Nano Banana Pro için kullanılabilecek siyah mat, form odaklı, mükemmel ışıklı manken pozuna çevirin.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">

                {/* Sol: Upload & Controls */}
                <Card className="flex flex-col border-muted h-full overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-lg">📷 1. Orijinal Poz Yükle</CardTitle>
                        <CardDescription>Modelinizin fotoğrafını yükleyin.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                            {previewUrl ? (
                                <div className="relative w-full aspect-[3/4] flex flex-col items-center justify-center group overflow-hidden rounded-xl border border-dashed p-1">
                                    <img
                                        src={previewUrl}
                                        alt="Original"
                                        className="w-full h-full object-contain rounded"
                                    />
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" className="shadow-lg gap-2" asChild>
                                            <label className="cursor-pointer">
                                                <RefreshCw className="w-4 h-4" /> Değiştir
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="w-full aspect-[3/4] border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('pose-upload-input')?.click()}
                                >
                                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold mb-1">Fotoğraf Yükle/Sürükle</h3>
                                    <input id="pose-upload-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Işık & Stil</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {LIGHT_STYLES.map(style => (
                                        <Button
                                            key={style.id}
                                            variant={selectedStyle === style.prompt ? "default" : "outline"}
                                            size="sm"
                                            className="text-xs px-2"
                                            onClick={() => setSelectedStyle(style.prompt)}
                                        >
                                            {style.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Orta: Pipelines and Intermediate Preview */}
                <Card className="flex flex-col border-muted h-full overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-lg">🔲 2. Ara Çıktı / Base</CardTitle>
                        <CardDescription>
                            Three.js Render (Pipeline A)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col bg-stone-100 dark:bg-stone-900 border-b">
                        <div className="flex-1 w-full h-full relative p-4 flex flex-col items-center justify-center">
                            {glbUrl && metadata ? (
                                <MannequinRenderer ref={rendererRef} glbUrl={glbUrl} metadata={metadata} width={400} height={500} />
                            ) : (
                                <div className="flex flex-col items-center text-muted-foreground opacity-50 space-y-2">
                                    <ImageIcon className="w-10 h-10" />
                                    <span className="text-sm">Base Mesh Bekleniyor</span>
                                </div>
                            )}

                            {processing && stepMsg && (
                                <div className="absolute inset-x-4 bottom-4 bg-background/90 p-3 rounded-lg border shadow flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                                    <p className="text-xs font-medium">{stepMsg}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <div className="p-4 bg-background">
                        <Tabs defaultValue="pipeline-a" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="pipeline-a">A: SAM + ICLight</TabsTrigger>
                                <TabsTrigger value="pipeline-b">B: FLUX Depth</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pipeline-a">
                                <Button className="w-full" disabled={!file || processing} onClick={runPipelineA}>
                                    <Zap className="w-4 h-4 mr-2" /> Pipeline A İle Üret
                                </Button>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">Kesin poz, 3 aşamalı detaylı sistem.</p>
                            </TabsContent>
                            <TabsContent value="pipeline-b">
                                <Button className="w-full" disabled={!file || processing} onClick={runPipelineB}>
                                    <Zap className="w-4 h-4 mr-2" /> Pipeline B İle Üret
                                </Button>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">Tek adım FLUX ip-adapter & depth.</p>
                            </TabsContent>
                        </Tabs>
                    </div>
                </Card>

                {/* Sağ: Final Render */}
                <Card className="flex flex-col border-muted h-full overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">✨ 3. Final Manken</CardTitle>
                            <CardDescription>Stüdyo Işıklı Foto Gerçekçi Sonuç</CardDescription>
                        </div>
                        {finalUrl && (
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => window.open(finalUrl, '_blank')}><Download className="h-4 w-4" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(finalUrl)}><Copy className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="h-full flex-1 p-2 flex flex-col items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]">
                        {finalUrl ? (
                            <img src={finalUrl} alt="Final" className="w-full h-full object-contain rounded drop-shadow-xl" />
                        ) : (
                            <div className="flex flex-col items-center space-y-4 opacity-50 text-muted-foreground">
                                <ImageIcon className="w-12 h-12" />
                                <h3 className="text-lg font-medium">Sonuç Bekleniyor</h3>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

