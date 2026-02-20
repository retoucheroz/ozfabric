"use client";

import React, { useState } from "react";
import { Upload, ImageIcon, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { fal } from "@fal-ai/client";
import MannequinCanvas from "@/components/mannequin-pose/MannequinCanvas";

export default function MannequinPosePage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [glbUrl, setGlbUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setGlbUrl(null);
            setMetadata(null);
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
        }
    };

    const handleProcess = async () => {
        if (!file) {
            toast.error("Lütfen önce bir fotoğraf yükleyin.");
            return;
        }

        setProcessing(true);
        toast.info("Görsel yükleniyor...");

        try {
            // 1. Read file as Base64
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // 2. Upload to fal.ai storage via backend proxy
            const uploadRes = await fetch('/api/video/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data, filename: 'model.png' })
            });

            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error("Görsel yüklenemedi: " + errText);
            }
            const { url: imageUrl } = await uploadRes.json();

            // 2. Call SAM 3D Body API proxy
            toast.info("SAM 3D Body işleniyor...");
            const req = await fetch('/api/sam3d-body', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image_url: imageUrl })
            });

            const res = await req.json();

            if (!req.ok || !res.success) {
                throw new Error(res.error || "İşlem sırasında bir hata oluştu.");
            }

            // Check if meshes and metadata exist
            const data = res.data;
            if (!data.model_glb) {
                throw new Error("GLB modeli döndürülmedi.");
            }

            setGlbUrl(data.model_glb);
            setMetadata(data.metadata);

            toast.success("Render hazır!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "3D Manken oluşturulamadı.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto max-w-7xl py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">3D Mannequin Pose Renderer</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Fotoğraftaki modeli analiz edip aynı pozda detayları temizlenmiş, siyah mat bir 3D manken görseli (Nano Banana Pro referansı) üretir.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Side: Upload & Preview */}
                <Card className="flex flex-col border-muted h-full overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-lg">Model Fotoğrafı</CardTitle>
                        <CardDescription>Pozunu kopyalamak istediğiniz kişinin fotoğrafı</CardDescription>
                    </CardHeader>
                    <CardContent className="h-full flex-1 p-6 flex flex-col items-center justify-center min-h-[500px]">
                        {previewUrl ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center group overflow-hidden rounded-xl border border-dashed border-muted p-2">
                                <img
                                    src={previewUrl}
                                    alt="Original"
                                    className="max-h-[600px] w-auto h-auto object-contain rounded drop-shadow-sm transition-transform duration-300 group-hover:scale-95"
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
                                className="w-full h-full border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors flex flex-col items-center justify-center p-12 text-center cursor-pointer group"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('pose-upload-input')?.click()}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Fotoğraf Yükle veya Sürükle</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">Stüdyo veya tam vücut çekimi fotoğraflar en iyi sonucu verir.</p>
                                <input id="pose-upload-input" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        )}
                    </CardContent>
                    <div className="p-6 border-t bg-muted/10 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-4 h-4" /> Tüm arka planlar desteklenir
                        </div>
                        <Button onClick={handleProcess} disabled={!file || processing} className="min-w-[150px] font-semibold tracking-wide">
                            {processing ? (
                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> İşleniyor...</>
                            ) : (
                                "Render Et"
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Right Side: 3D Render Output */}
                <Card className="flex flex-col border-muted h-full overflow-hidden relative">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <CardTitle className="text-lg">3D Manken Render</CardTitle>
                        <CardDescription>
                            {glbUrl ? "3D tarayıcıda işlendi, döndürmek için mouse kullanın." : "İşlem sonucu burada görünecek."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-full flex-1 p-6 flex flex-col items-center justify-center min-h-[500px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]">
                        {glbUrl ? (
                            <div className="w-full flex justify-center shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
                                <MannequinCanvas
                                    glbUrl={glbUrl}
                                    metadata={metadata}
                                    width={768}
                                    height={1024}
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-4 animate-in zoom-in duration-500 text-muted-foreground">
                                {processing ? (
                                    <div className="flex flex-col items-center space-y-4">
                                        <RefreshCw className="w-12 h-12 text-primary/50 animate-spin" />
                                        <h3 className="text-lg font-medium">SAM 3D Ağları Oluşturuluyor</h3>
                                        <p className="text-sm max-w-[250px]">Fotoğraftaki derinlik algılanıyor ve iskelet yapısına uygun 3D model çözümleniyor.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-4 opacity-50">
                                        <ImageIcon className="w-12 h-12" />
                                        <h3 className="text-lg font-medium">Render Bekleniyor</h3>
                                        <p className="text-sm">Yeni bir fotoğraf yükleyip "Render Et" butonuna basarak süreci başlatın.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-6 border-t bg-muted/10 flex items-start gap-4 text-xs text-muted-foreground">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p>GLB dosyası ve Canvas işlemleri bilgisayarınızın GPU'su üzerinde client-side çalıştırılmaktadır. Üretilen görüntüyü farenizin sağ tuşu ile doğrudan kopyalayabilirsiniz.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
