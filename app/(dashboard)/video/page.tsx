"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
    Upload, Plus, Loader2, Trash2, Edit2, ChevronRight, ChevronLeft, ChevronDown,
    Sparkles, User, Image as ImageIcon, Camera, RotateCw, X, Maximize2,
    Video as VideoIcon, Music, Layers, Settings, Globe, CheckCircle2,
    AlertCircle, Play, Info, Volume2, VolumeX, Clapperboard, ShieldAlert, Zap,
    ArrowLeftRight, ArrowUpDown, Wand2, Download, CreditCard, Check
} from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// --- CONSTANTS ---

const PRODUCTION_MODELS = [
    {
        id: "kling-3.0",
        label: "Kling 3.0",
        labelTr: "Kling 3.0",
        icon: "💎",
        description: "Highest quality cinematic video generation",
        descriptionTr: "En yüksek kalitede sinematik video üretimi"
    },
    {
        id: "luma-dream",
        label: "Luma Dream Machine",
        labelTr: "Luma Dream Machine",
        icon: "⚡",
        description: "Fast and realistic action videos",
        descriptionTr: "Hızlı ve gerçekçi aksiyon videoları"
    },
    {
        id: "runway-gen3",
        label: "Runway Gen-3",
        labelTr: "Runway Gen-3",
        icon: "🎭",
        description: "Industry standard creative control",
        descriptionTr: "Endüstri standardı yaratıcı kontrol"
    },
    {
        id: "custom",
        label: "Custom (OzFabric Studio)",
        labelTr: "Özel (OzFabric Studio)",
        icon: "🎨",
        description: "Context-aware fashion storytelling",
        descriptionTr: "Bağlam duyarlı moda hikayeciliği"
    }
];

const STORY_TEMPLATES = [
    {
        id: "city_rain",
        label: "Rainy City Walk",
        labelTr: "Yağmurlu Şehir Yürüyüşü",
        contentTr: "Paris'te yağmurlu bir sabah kahvesi, model hafif bir tebessümle yürüyor.",
        contentEn: "A rainy morning coffee in Paris, model walking with a slight smile."
    },
    {
        id: "desert_sunset",
        label: "Desert Sunset",
        labelTr: "Çöl Gün Batımı",
        contentTr: "Sonsuz çölde gün batımı, rüzgarlı bir atmosferde elbisenin dökümü.",
        contentEn: "Sunset in the infinite desert, the drape of the dress in a windy atmosphere."
    },
    {
        id: "cyberpunk",
        label: "Cyberpunk Glow",
        labelTr: "Cyberpunk Işıltısı",
        contentTr: "Neon ışıklı bir metropolde, fütüristik bir tarzda dinamik çekim.",
        contentEn: "A dynamic shoot in a futuristic style in a neon-lit metropolis."
    },
    {
        id: "minimalist",
        label: "Minimalist Studio",
        labelTr: "Minimalist Stüdyo",
        contentTr: "Tertemiz bir stüdyoda, detay odaklı sofistike bir ürün sunumu.",
        contentEn: "A sophisticated product presentation with a focus on detail in a pristine studio."
    }
];

interface Shot {
    id: string;
    prompt: string;
    duration: number;
}

interface VisualElement {
    id: string;
    name: string;
    description: string;
    images: string[];
}

export default function VideoPage() {
    const { language, t } = useLanguage();
    const router = useRouter();

    // --- STATE ---
    const [productionModel, setProductionModel] = useState("kling-3.0");
    const [firstFrame, setFirstFrame] = useState<string | null>(null);
    const [endFrame, setEndFrame] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [multiShot, setMultiShot] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(false);
    const [elements, setElements] = useState<VisualElement[]>([]);
    const [showElementsDialog, setShowElementsDialog] = useState(false);
    const [isCreatingElement, setIsCreatingElement] = useState(false);
    const [newElement, setNewElement] = useState<{
        name: string,
        description: string,
        images: string[]
    }>({ name: '', description: '', images: [] });

    // Settings
    const [duration, setDuration] = useState(5);
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [resolution, setResolution] = useState("720p");

    // Mention State
    const [mention, setMention] = useState<{
        visible: boolean;
        filter: string;
        cursorPos: number;
        shotId?: string;
    }>({ visible: false, filter: "", cursorPos: 0 });

    // Multi-shot State
    const [shots, setShots] = useState<Shot[]>([
        { id: '1', prompt: '', duration: 3 }
    ]);

    // Custom Model State
    const [modelSource, setModelSource] = useState<'library' | 'upload' | 'gender'>('gender');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'unisex'>('female');
    const [userStory, setUserStory] = useState("");
    const [storyboard, setStoryboard] = useState<any>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Video Result State
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<string>("");

    // End Frame Generator State
    const [showEndFrameDialog, setShowEndFrameDialog] = useState(false);
    const [endFrameDescription, setEndFrameDescription] = useState("");
    const [isGeneratingEndFrame, setIsGeneratingEndFrame] = useState(false);
    const [generatedEndFrameUrl, setGeneratedEndFrameUrl] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- REFS ---
    const firstFrameInputRef = useRef<HTMLInputElement>(null);
    const endFrameInputRef = useRef<HTMLInputElement>(null);
    const elementInputRef = useRef<HTMLInputElement>(null);

    // --- HELPERS ---
    const totalDuration = shots.reduce((acc, shot) => acc + shot.duration, 0);

    const addShot = () => {
        if (shots.length >= 5) {
            toast.error(language === 'tr' ? "Maksimum 5 sahne ekleyebilirsiniz." : "Maximum 5 shots allowed.");
            return;
        }
        if (totalDuration >= 15) {
            toast.error(language === 'tr' ? "Toplam süre 15 saniyeyi geçemez." : "Total duration cannot exceed 15s.");
            return;
        }
        setShots([...shots, { id: Date.now().toString(), prompt: '', duration: 3 }]);
    };

    const removeShot = (id: string) => {
        if (shots.length === 1) return;
        setShots(shots.filter(s => s.id !== id));
    };

    const updateShot = (id: string, field: keyof Shot, value: any) => {
        setShots(shots.map(s => {
            if (s.id === id) {
                if (field === 'duration') {
                    const otherShotsDuration = totalDuration - s.duration;
                    if (otherShotsDuration + value > 15) {
                        toast.warning(language === 'tr' ? "Toplam süre 15s ile sınırlandırıldı." : "Total duration capped at 15s.");
                        return { ...s, duration: 15 - otherShotsDuration };
                    }
                }
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const swapFrames = () => {
        const temp = firstFrame;
        setFirstFrame(endFrame);
        setEndFrame(temp);
        toast.info(language === 'tr' ? "Kareler yer değiştirildi" : "Frames swapped");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'first' | 'end' | 'element') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (type === 'first') setFirstFrame(result);
            else if (type === 'end') setEndFrame(result);
            else if (type === 'element') {
                if (newElement.images.length < 3) {
                    setNewElement(prev => ({
                        ...prev,
                        images: [...prev.images, result]
                    }));
                } else {
                    toast.error(language === 'tr' ? "Maksimum 3 açı eklenebilir." : "Maximum 3 angles allowed.");
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveElement = () => {
        if (!newElement.name || !newElement.description || newElement.images.length < 2) {
            toast.error(language === 'tr' ? "Lütfen tüm zorunlu alanları doldurun ve en az 2 açı yükleyin." : "Please fill mandatory fields and upload at least 2 angles.");
            return;
        }

        const element: VisualElement = {
            id: Date.now().toString(),
            name: newElement.name.replace('@', '').trim(),
            description: newElement.description,
            images: newElement.images
        };

        setElements([...elements, element]);
        setNewElement({ name: '', description: '', images: [] });
        setIsCreatingElement(false);
        toast.success(language === 'tr' ? "Element başarıyla oluşturuldu." : "Element created successfully.");
    };

    const handleElementInsert = (name: string) => {
        const tag = `@${name}`;
        if (multiShot) {
            setShots(shots.map((s, i) => i === shots.length - 1 ? { ...s, prompt: s.prompt + " " + tag } : s));
        } else {
            setPrompt(prev => prev ? `${prev} ${tag}` : tag);
        }
        toast.info(`${tag} prompta eklendi`);
    };

    const handleDrop = (e: React.DragEvent, shotId?: string) => {
        e.preventDefault();
        const name = e.dataTransfer.getData("elementName");
        if (!name) return;

        const tag = `@${name}`;
        if (shotId) {
            const currentPrompt = shots.find(s => s.id === shotId)?.prompt || "";
            updateShot(shotId, 'prompt', currentPrompt + (currentPrompt ? " " : "") + tag);
        } else {
            setPrompt(prev => prev ? `${prev} ${tag}` : tag);
        }
    };

    const handleTextareaChange = (val: string, shotId?: string) => {
        if (shotId) {
            updateShot(shotId, 'prompt', val);
        } else {
            setPrompt(val);
        }

        const cursor = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursor);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMention({
                visible: true,
                filter: mentionMatch[1],
                cursorPos: cursor,
                shotId
            });
        } else {
            setMention({ ...mention, visible: false });
        }
    };

    const handleMentionSelect = (elementName: string) => {
        const currentText = mention.shotId
            ? (shots.find(s => s.id === mention.shotId)?.prompt || "")
            : prompt;

        const textBeforeAt = currentText.slice(0, mention.cursorPos).replace(/@(\w*)$/, "");
        const textAfterCursor = currentText.slice(mention.cursorPos);
        const newText = `${textBeforeAt}@${elementName} ${textAfterCursor}`;

        if (mention.shotId) {
            updateShot(mention.shotId, 'prompt', newText);
        } else {
            setPrompt(newText);
        }
        setMention({ ...mention, visible: false });
    };

    const handleAnalyzeStory = async () => {
        if (!userStory) {
            toast.error(language === 'tr' ? "Lütfen bir hikaye girin." : "Please enter a story.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/video/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    story: userStory,
                    gender: selectedGender,
                    modelSource: modelSource
                })
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();
            setStoryboard(data);
            toast.success(language === 'tr' ? "Hikaye akışı oluşturuldu!" : "Story sequence created!");
        } catch (error) {
            console.error(error);
            toast.error(language === 'tr' ? "Analiz başarısız oldu." : "Analysis failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- END FRAME GENERATOR ---
    const resizeImageToMax = (base64: string, maxEdge: number, format: string = 'image/png', quality: number = 1.0): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const { width, height } = img;
                if (width <= maxEdge && height <= maxEdge && format === 'image/png') {
                    resolve(base64);
                    return;
                }
                const scale = Math.min(1, maxEdge / Math.max(width, height));
                const newW = Math.round(width * scale);
                const newH = Math.round(height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = newW;
                canvas.height = newH;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, newW, newH);
                resolve(canvas.toDataURL(format, quality));
            };
            img.src = base64;
        });
    };

    const getImageAspectRatio = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const { width, height } = img;
                const ratio = width / height;
                if (Math.abs(ratio - 16 / 9) < 0.15) resolve('16:9');
                else if (Math.abs(ratio - 9 / 16) < 0.15) resolve('9:16');
                else if (Math.abs(ratio - 1) < 0.15) resolve('1:1');
                else if (ratio > 1) resolve('16:9');
                else resolve('9:16');
            };
            img.src = base64;
        });
    };

    const handleGenerateEndFrame = async () => {
        if (!firstFrame) {
            toast.error(language === 'tr' ? "Lütfen önce ilk kareyi yükleyin." : "Please upload the first frame first.");
            return;
        }
        if (!endFrameDescription.trim()) {
            toast.error(language === 'tr' ? "Lütfen son kare için bir açıklama yazın." : "Please describe what you want in the last frame.");
            return;
        }

        setIsGeneratingEndFrame(true);
        setGeneratedEndFrameUrl(null);

        try {
            // Get the aspect ratio from the first frame image
            const detectedAspectRatio = await getImageAspectRatio(firstFrame);

            const response = await fetch('/api/video/generate-endframe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstFrameImage: firstFrame,
                    userDescription: endFrameDescription,
                    aspectRatio: detectedAspectRatio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            if (data.imageUrl) {
                // Fetch the generated image and convert to base64 for the end frame
                const imgResponse = await fetch(data.imageUrl);
                const blob = await imgResponse.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Result = reader.result as string;
                    setEndFrame(base64Result);
                    setGeneratedEndFrameUrl(data.imageUrl);
                    toast.success(language === 'tr' ? "Son kare görseli başarıyla oluşturuldu!" : "End frame image generated successfully!");
                };
                reader.readAsDataURL(blob);
            }
        } catch (error: any) {
            console.error('End frame generation error:', error);
            toast.error(language === 'tr' ? `Görsel oluşturulamadı: ${error.message}` : `Failed to generate image: ${error.message}`);
        } finally {
            setIsGeneratingEndFrame(false);
        }
    };

    const handleDownloadEndFrame = async () => {
        const url = generatedEndFrameUrl || endFrame;
        if (!url) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `endframe_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch {
            // Fallback for base64
            const a = document.createElement('a');
            a.href = url;
            a.download = `endframe_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleGenerate = async () => {
        if (productionModel === 'custom' && !storyboard) {
            await handleAnalyzeStory();
            return;
        }

        if (productionModel !== 'custom' && !firstFrame) {
            toast.error(language === 'tr' ? "Lütfen en azından ilk kareyi (Start frame) yükleyin." : "Please upload at least the start frame.");
            return;
        }

        if (!prompt && !multiShot) {
            toast.error(language === 'tr' ? "Lütfen bir video promptu girin." : "Please enter a video prompt.");
            return;
        }

        if (multiShot && shots.every(s => !s.prompt.trim())) {
            toast.error(language === 'tr' ? "Lütfen en az bir sahne promptu girin." : "Please enter at least one shot prompt.");
            return;
        }

        setIsProcessing(true);
        setGeneratedVideoUrl(null);
        setGenerationProgress(language === 'tr' ? 'Görseller hazırlanıyor...' : 'Preparing images...');

        try {
            // Resize images to max 1280px with compression (Kling generates at 720p/1080p max)
            let resizedFirstFrame = firstFrame;
            let resizedEndFrame = endFrame;

            if (firstFrame) {
                resizedFirstFrame = await resizeImageToMax(firstFrame, 1280, 'image/jpeg', 0.85);
            }
            if (endFrame) {
                resizedEndFrame = await resizeImageToMax(endFrame, 1280, 'image/jpeg', 0.85);
            }

            // Step 1: Upload images to fal storage via our upload endpoint
            let startImageUrl: string | undefined;
            let endImageUrl: string | undefined;

            if (resizedFirstFrame) {
                setGenerationProgress(language === 'tr' ? 'İlk kare yükleniyor...' : 'Uploading start frame...');
                const uploadRes = await fetch('/api/video/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: resizedFirstFrame, filename: 'start_frame.png' }),
                });
                if (!uploadRes.ok) {
                    const errData = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
                    throw new Error(errData.error || 'Failed to upload start frame');
                }
                const uploadData = await uploadRes.json();
                startImageUrl = uploadData.url;
            }

            if (resizedEndFrame) {
                setGenerationProgress(language === 'tr' ? 'Son kare yükleniyor...' : 'Uploading end frame...');
                const uploadRes = await fetch('/api/video/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: resizedEndFrame, filename: 'end_frame.png' }),
                });
                if (!uploadRes.ok) {
                    const errData = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
                    throw new Error(errData.error || 'Failed to upload end frame');
                }
                const uploadData = await uploadRes.json();
                endImageUrl = uploadData.url;
            }

            // Step 2: Send only URLs to the video generation endpoint
            setGenerationProgress(language === 'tr'
                ? `Kling 3.0 ${resolution === '1080p' ? 'Pro' : 'Standard'} ile video üretiliyor... Bu işlem birkaç dakika sürebilir.`
                : `Generating video with Kling 3.0 ${resolution === '1080p' ? 'Pro' : 'Standard'}... This may take a few minutes.`);

            toast.info(language === 'tr'
                ? `Video üretimi başlatıldı (${resolution}). Lütfen bekleyin...`
                : `Video generation started (${resolution}). Please wait...`);

            const response = await fetch('/api/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startImageUrl,
                    endImageUrl,
                    prompt: multiShot ? undefined : prompt,
                    duration: duration,
                    generateAudio: isSoundOn,
                    resolution: resolution,
                    multiShot: multiShot,
                    shots: multiShot ? shots.filter(s => s.prompt.trim()).map(s => ({
                        prompt: s.prompt,
                        duration: s.duration,
                    })) : undefined,
                }),
            });

            let data: any;
            try {
                data = await response.json();
            } catch {
                const text = await response.text().catch(() => '');
                throw new Error(text || 'Server returned an invalid response');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Video generation failed');
            }

            if (data.video?.url) {
                setGeneratedVideoUrl(data.video.url);
                setGenerationProgress('');
                toast.success(language === 'tr' ? "Video başarıyla üretildi!" : "Video generated successfully!");
            } else {
                throw new Error('No video URL in response');
            }
        } catch (error: any) {
            console.error('Video generation error:', error);
            setGenerationProgress('');
            toast.error(language === 'tr' ? `Video oluşturulamadı: ${error.message}` : `Video generation failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadVideo = async () => {
        if (!generatedVideoUrl) return;
        try {
            const response = await fetch(generatedVideoUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `ozfabric_video_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch {
            // Fallback: open in new tab
            window.open(generatedVideoUrl, '_blank');
        }
    };

    // --- UI RENDER ---

    if (!isMounted) {
        return <div className="flex-1 bg-background" />;
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b bg-background/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <VideoIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {t("sidebar.video")}
                        </h1>
                        <p className="text-xs text-muted-foreground/60 leading-none mt-1">
                            {language === 'tr' ? 'Sinematik Moda Videoları' : 'Cinematic Fashion Videos'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={productionModel} onValueChange={setProductionModel}>
                        <SelectTrigger className="w-[200px] bg-muted/50 border-input ring-0 focus:ring-0">
                            <SelectValue placeholder="Model Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            {PRODUCTION_MODELS.map(m => (
                                <SelectItem key={m.id} value={m.id} className="focus:bg-accent focus:text-accent-foreground">
                                    <span className="flex items-center gap-2">
                                        <span>{m.icon}</span>
                                        <span>{language === 'tr' ? (m.labelTr || m.label) : m.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={handleGenerate}
                        disabled={isProcessing}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 px-6 rounded-full shadow-lg shadow-violet-600/20 transition-all active:scale-95"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {language === 'tr' ? 'Oluştur' : 'Generate'}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-card scrollbar-track-transparent">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: EDITOR */}
                    <div className="lg:col-span-12">

                        {productionModel === 'custom' ? (
                            /* CUSTOM MODEL FLOW */
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Story Selection */}
                                    <Card className="md:col-span-2 bg-background/40 border-white/5 p-6 backdrop-blur-sm space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                                <Clapperboard className="w-5 h-5 text-violet-400" />
                                                {language === 'tr' ? 'Hikaye Detayları' : 'Story Details'}
                                            </h2>
                                            <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                                                AI Storyboarding
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-sm font-medium text-zinc-400">
                                                {language === 'tr' ? 'Aklınızdaki hikayeyi kısaca yazın' : 'Briefly describe your story'}
                                            </label>
                                            <Textarea
                                                value={userStory}
                                                onChange={(e) => setUserStory(e.target.value)}
                                                placeholder={language === 'tr' ? 'Örn: Paris sokaklarında zarif bir yürüyüş...' : 'e.g. An elegant walk on the streets of Paris...'}
                                                className="min-h-[120px] bg-black/40 border-white/10 text-lg focus:border-violet-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-zinc-400">
                                                {language === 'tr' ? 'Hızlı Şablonlar' : 'Quick Templates'}
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {STORY_TEMPLATES.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setUserStory(language === 'tr' ? t.contentTr : t.contentEn)}
                                                        className="p-3 text-xs text-left bg-card/50 border border-white/5 rounded-xl hover:bg-zinc-700/50 hover:border-violet-500/50 transition-all group"
                                                    >
                                                        <div className="font-semibold text-zinc-200 group-hover:text-white mb-1">
                                                            {language === 'tr' ? t.labelTr : t.label}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 line-clamp-2">
                                                            {language === 'tr' ? t.contentTr : t.contentEn}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Model/Subject Selection */}
                                    <Card className="bg-background/40 border-white/5 p-6 backdrop-blur-sm space-y-6">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <User className="w-5 h-5 text-fuchsia-400" />
                                            {language === 'tr' ? 'Model & Karakter' : 'Model & Character'}
                                        </h2>

                                        <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-lg">
                                            {(['library', 'upload', 'gender'] as const).map(src => (
                                                <button
                                                    key={src}
                                                    onClick={() => setModelSource(src)}
                                                    className={`py-2 text-[10px] font-bold rounded-md transition-all ${modelSource === src ? 'bg-card text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    {src.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>

                                        {modelSource === 'gender' && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['female', 'male', 'unisex'] as const).map(g => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setSelectedGender(g)}
                                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${selectedGender === g ? 'bg-fuchsia-500/10 border-fuchsia-500 text-white' : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                                    >
                                                        <div className="text-xl">{g === 'female' ? '👩' : g === 'male' ? '👨' : '👤'}</div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">{g}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {modelSource === 'upload' && (
                                            <div
                                                onClick={() => firstFrameInputRef.current?.click()}
                                                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center p-6 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
                                            >
                                                {firstFrame ? (
                                                    <img src={firstFrame} alt="Model" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                                                            <Upload className="w-6 h-6 text-zinc-400" />
                                                        </div>
                                                        <span className="text-xs text-zinc-500 text-center font-medium">Model görseli yükle</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                <div className={`w-10 h-6 rounded-full relative transition-all ${isSoundOn ? 'bg-violet-500' : 'bg-card'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSoundOn ? 'left-5' : 'left-1'}`} />
                                                </div>
                                                <span className="text-xs font-semibold flex items-center gap-1.5">
                                                    {isSoundOn ? <Volume2 className="w-4 h-4 text-violet-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                                                    {language === 'tr' ? 'Sesli Üretim' : 'Audio Sync'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {storyboard ? (
                                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Layers className="w-5 h-5 text-violet-400" />
                                                {language === 'tr' ? 'Üretim Planı' : 'Production Plan'}
                                            </h3>
                                            <Button variant="ghost" size="sm" onClick={() => setStoryboard(null)} className="text-zinc-500 hover:text-white">
                                                {language === 'tr' ? 'Sıfırla' : 'Reset'}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            {storyboard.shots.map((shot: any, idx: number) => (
                                                <div key={idx} className="bg-background border border-white/10 rounded-2xl p-4 space-y-3 relative group overflow-hidden">
                                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-card flex items-center justify-center text-[10px] font-bold text-violet-400">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="aspect-[3/4] rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
                                                        <VideoIcon className="w-8 h-8 text-card" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{shot.title}</div>
                                                        <div className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">{shot.prompt}</div>
                                                    </div>
                                                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                                        <span className="text-[10px] font-mono text-violet-400/80">{shot.duration}s</span>
                                                        <span className="text-[9px] font-bold text-zinc-600 uppercase">{shot.camera}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-violet-400/5 border border-violet-400/20 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-violet-400 text-white rounded-lg">
                                                    <ShieldAlert className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white uppercase tracking-wider">{language === 'tr' ? 'Tutarlılık Motoru' : 'Consistency Engine'}</div>
                                                    <p className="text-[11px] text-zinc-400 mt-0.5">{storyboard.visualDictionary}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-background/20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto">
                                            <Sparkles className="w-8 h-8 text-violet-400" />
                                        </div>
                                        <div className="max-w-md mx-auto">
                                            <h3 className="text-xl font-bold">OzFabric Hikaye Motoru</h3>
                                            <p className="text-sm text-zinc-400 mt-2">
                                                Hikayenizi girdiğinizde, Gemini-2.0-Flash modelimiz 5 ardışık sahne oluşturacak.
                                                Her sahnede karakter, kıyafet ve çevre tutarlılığı sağlanarak 5 ayrı video üretilecektir.
                                            </p>
                                            <Button
                                                onClick={handleAnalyzeStory}
                                                disabled={isProcessing}
                                                className="mt-6 bg-violet-500 hover:bg-violet-600 text-white font-bold h-11 px-8 rounded-full shadow-lg shadow-violet-500/25 transition-all"
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clapperboard className="w-4 h-4 mr-2" />}
                                                {language === 'tr' ? 'Hikayeyi Analiz Et' : 'Analyze Story'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Left: Compact Frames */}
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-3 relative">
                                            <div
                                                onClick={() => firstFrameInputRef.current?.click()}
                                                className="relative h-[120px] rounded-2xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center p-3 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group overflow-hidden"
                                            >
                                                {firstFrame ? (
                                                    <>
                                                        <img src={firstFrame} alt="Start frame" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                            <RotateCw className="w-6 h-6 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-8 h-8 rounded-xl bg-background border flex items-center justify-center mb-1 group-hover:scale-110 transition-all">
                                                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                            {language === 'tr' ? 'Başlangıç' : 'Start'}
                                                        </span>
                                                    </>
                                                )}
                                                <Badge className="absolute top-2 left-2 bg-violet-600 text-white text-[9px] px-1.5 h-4">
                                                    {language === 'tr' ? 'İlk K.' : 'First F.'}
                                                </Badge>
                                                {firstFrame && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setFirstFrame(null); }}
                                                        className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-all text-white"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Small Absolute Swap Button */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); swapFrames(); }}
                                                    className="h-8 w-8 rounded-full bg-background border border-border text-muted-foreground hover:text-violet-600 hover:border-violet-500 shadow-xl transition-all"
                                                >
                                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div
                                                    onClick={() => endFrameInputRef.current?.click()}
                                                    className="relative h-[120px] rounded-2xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center p-3 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group overflow-hidden"
                                                >
                                                    {endFrame ? (
                                                        <>
                                                            <img src={endFrame} alt="End frame" className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                <RotateCw className="w-6 h-6 text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-8 h-8 rounded-xl bg-background border flex items-center justify-center mb-1 group-hover:scale-110 transition-all">
                                                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-muted-foreground">
                                                                {language === 'tr' ? 'Bitiş' : 'End'}
                                                            </span>
                                                        </>
                                                    )}
                                                    <Badge variant="outline" className="absolute top-2 left-2 border-border text-muted-foreground text-[9px] px-1.5 h-4">
                                                        {language === 'tr' ? 'Son K.' : 'End F.'}
                                                    </Badge>
                                                    {endFrame && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEndFrame(null); setGeneratedEndFrameUrl(null); }}
                                                            className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-all text-white"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Generate End Frame Button */}
                                                <button
                                                    onClick={() => {
                                                        if (!firstFrame) {
                                                            toast.error(language === 'tr' ? "Lütfen önce ilk kareyi yükleyin." : "Please upload the first frame first.");
                                                            return;
                                                        }
                                                        setShowEndFrameDialog(true);
                                                    }}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-violet-600 hover:text-violet-500 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-all"
                                                >
                                                    <Wand2 className="w-3 h-3" />
                                                    {language === 'tr' ? 'Son kare görseli üret' : 'Generate end frame'}
                                                </button>

                                                {/* Download button for generated end frame */}
                                                {generatedEndFrameUrl && endFrame && (
                                                    <button
                                                        onClick={handleDownloadEndFrame}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border rounded-xl transition-all"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        {language === 'tr' ? 'Son kareyi indir' : 'Download end frame'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Settings Summary */}
                                    <Card className="bg-muted/40 border-border p-4 backdrop-blur-sm h-[120px] flex items-center">
                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            {!multiShot ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                            <Play className="w-3 h-3 text-violet-500" />
                                                            {language === 'tr' ? 'Süre' : 'Dur'}
                                                        </label>
                                                        <span className="text-xs font-mono font-bold">{duration}s</span>
                                                    </div>
                                                    <Slider
                                                        value={[duration]}
                                                        min={3}
                                                        max={15}
                                                        step={1}
                                                        onValueChange={([val]) => setDuration(val)}
                                                        className="cursor-pointer"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col justify-center items-center text-center px-2">
                                                    <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center mb-1">
                                                        <Zap className="w-4 h-4 text-violet-600" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                                                        {language === 'tr' ? 'ÇOKLU SAHNE MODU AKTİF' : 'MULTI-SHOT MODE ACTIVE'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                                    <SelectTrigger className="bg-background/80 border-border text-[10px] font-bold h-8 ring-0 focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border">
                                                        <SelectItem value="16:9">{language === 'tr' ? '16:9 (Yatay)' : '16:9 (Landscape)'}</SelectItem>
                                                        <SelectItem value="9:16">{language === 'tr' ? '9:16 (Story)' : '9:16 (Story)'}</SelectItem>
                                                        <SelectItem value="1:1">{language === 'tr' ? '1:1 (Kare)' : '1:1 (Square)'}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Select value={resolution} onValueChange={setResolution}>
                                                    <SelectTrigger className="bg-background/80 border-border text-[10px] font-bold h-8 ring-0 focus:ring-0">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border text-foreground">
                                                        <SelectItem value="720p">720p (HD)</SelectItem>
                                                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Prompt & Multi-shot Section */}
                                <Card className="bg-card border-border overflow-hidden">
                                    <div className="px-5 py-4 flex items-center justify-between border-b bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                                {multiShot
                                                    ? (language === 'tr' ? 'Çoklu Sahne Konfigürasyonu' : 'Multi-Shot Configuration')
                                                    : (language === 'tr' ? 'Video Promptu' : 'Video Prompt')}
                                            </span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-4 h-4 text-muted-foreground/50 cursor-help hover:text-violet-500 transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-popover border-border text-foreground text-[11px] max-w-[200px]">
                                                        {multiShot
                                                            ? (language === 'tr' ? 'Birden fazla sahne oluşturarak hikayenizi detaylandırın.' : 'Detail your story by creating multiple shots.')
                                                            : (language === 'tr' ? 'Videonuzun içeriğini ve tarzını buradan tarif edin.' : 'Describe the content and style of your video here.')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        <div className="flex items-center gap-3 pr-2">
                                            <span className="text-xs font-bold text-violet-600">
                                                {language === 'tr' ? 'ÇOKLU SAHNE' : 'MULTI-SHOT'}
                                            </span>
                                            <Switch checked={multiShot} onCheckedChange={setMultiShot} />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-background">
                                        {multiShot ? (
                                            <div className="space-y-4">
                                                {/* MULTI SHOT LIST */}
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-card">
                                                    {shots.map((shot, index) => (
                                                        <div key={shot.id} className="relative p-4 rounded-2xl bg-background/60 border border-white/5 animate-in slide-in-from-right-2">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">{index + 1}</div>
                                                                    {language === 'tr' ? 'Sahne' : 'Shot'} {index + 1}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 group/dur cursor-pointer hover:border-violet-500/30 transition-all">
                                                                        <Play className="w-3 h-3 text-violet-400" />
                                                                        <span className="text-[10px] font-bold text-white pr-2 border-r border-white/10 select-none">
                                                                            {shot.duration}s
                                                                        </span>
                                                                        <Slider
                                                                            value={[shot.duration]}
                                                                            min={1}
                                                                            max={10}
                                                                            step={1}
                                                                            className="w-16 opacity-40 group-hover/dur:opacity-100 transition-opacity"
                                                                            onValueChange={([val]) => updateShot(shot.id, 'duration', val)}
                                                                        />
                                                                    </div>
                                                                    {shots.length > 1 && (
                                                                        <Button variant="ghost" size="icon" onClick={() => removeShot(shot.id)} className="h-8 w-8 text-zinc-500 hover:text-red-400">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                                <Textarea
                                                                    value={shot.prompt}
                                                                    onChange={(e) => handleTextareaChange(e.target.value, shot.id)}
                                                                    onDragOver={(e) => e.preventDefault()}
                                                                    onDrop={(e) => handleDrop(e, shot.id)}
                                                                    placeholder={language === 'tr' ? `Sahne ${index + 1} detaylarını yazın...` : `Describe shot ${index + 1}...`}
                                                                    className="min-h-[80px] bg-black/40 border-white/5 text-sm resize-none focus:border-violet-400/50"
                                                                />
                                                                {/* Mention Menu for Multi-shot */}
                                                                {mention.visible && mention.shotId === shot.id && (
                                                                    <Card className="absolute left-0 bottom-full mb-2 w-48 bg-background border-card shadow-2xl z-50 overflow-hidden">
                                                                        <div className="p-2 border-b border-white/5 bg-black/40 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                                            <Layers className="w-3 h-3 text-violet-400" />
                                                                            {language === 'tr' ? 'Element Seçin' : 'Select Element'}
                                                                        </div>
                                                                        <div className="max-h-48 overflow-y-auto p-1">
                                                                            {elements
                                                                                .filter(e => e.name.toLowerCase().includes(mention.filter.toLowerCase()))
                                                                                .map(el => (
                                                                                    <button
                                                                                        key={el.id}
                                                                                        onClick={() => handleMentionSelect(el.name)}
                                                                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-500/10 hover:text-white text-sm text-zinc-400 transition-all flex items-center gap-3 group"
                                                                                    >
                                                                                        <div className="w-6 h-6 rounded-md overflow-hidden bg-card">
                                                                                            <img src={el.images[0]} className="w-full h-full object-cover" />
                                                                                        </div>
                                                                                        <span className="font-medium group-hover:translate-x-1 transition-transform">@{el.name}</span>
                                                                                    </button>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </Card>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-end mt-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setShowElementsDialog(true)}
                                                                    className="h-8 gap-2 text-[10px] font-bold bg-card/50 hover:bg-card text-zinc-400 hover:text-white rounded-lg border border-white/5"
                                                                >
                                                                    <Layers className="w-3.5 h-3.5" />
                                                                    {language === 'tr' ? 'ELEMENTLER' : 'ELEMENTS'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            onClick={addShot}
                                                            disabled={shots.length >= 5 || totalDuration >= 15}
                                                            className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 font-bold gap-2 text-xs transition-all active:scale-95"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            {language === 'tr' ? 'Yeni Sahne' : 'New Shot'}
                                                        </Button>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                                                {language === 'tr' ? 'Toplam Süre:' : 'Total Duration:'}
                                                            </span>
                                                            <span className={`text-sm font-mono font-bold ${totalDuration > 12 ? 'text-orange-400' : 'text-violet-400'}`}>{totalDuration}s / 15s</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                            <div className={`w-10 h-6 rounded-full relative transition-all ${isSoundOn ? 'bg-violet-500' : 'bg-card'}`}>
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSoundOn ? 'left-5' : 'left-1'}`} />
                                                            </div>
                                                            <span className="text-xs font-bold text-zinc-400">
                                                                {isSoundOn
                                                                    ? (language === 'tr' ? 'SES AÇIK' : 'SOUND ON')
                                                                    : (language === 'tr' ? 'SES KAPALI' : 'SOUND OFF')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* SINGLE SHOT UI */
                                            <div className="space-y-4 relative">
                                                <Textarea
                                                    value={prompt}
                                                    onChange={(e) => handleTextareaChange(e.target.value)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e)}
                                                    placeholder={language === 'tr' ? "Neon ışıklı bir şehirde sinematik moda yürüyüşü..." : "A cinematic fashion editorial walk through a neon-lit city..."}
                                                    className="min-h-[140px] bg-black/20 border-white/10 text-lg resize-none focus:ring-1 focus:ring-violet-500/30"
                                                />
                                                {/* Mention Menu */}
                                                {mention.visible && (
                                                    <Card className="absolute left-4 bottom-full mb-2 w-48 bg-background border-card shadow-2xl z-50 overflow-hidden">
                                                        <div className="p-2 border-b border-white/5 bg-black/40 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Layers className="w-3 h-3 text-violet-400" />
                                                            {language === 'tr' ? 'Element Seçin' : 'Select Element'}
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto p-1">
                                                            {elements
                                                                .filter(e => e.name.toLowerCase().includes(mention.filter.toLowerCase()))
                                                                .map(el => (
                                                                    <button
                                                                        key={el.id}
                                                                        onClick={() => handleMentionSelect(el.name)}
                                                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-500/10 hover:text-white text-sm text-zinc-400 transition-all flex items-center gap-3 group"
                                                                    >
                                                                        <div className="w-6 h-6 rounded-md overflow-hidden bg-card">
                                                                            <img src={el.images[0]} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <span className="font-medium group-hover:translate-x-1 transition-transform">@{el.name}</span>
                                                                    </button>
                                                                ))
                                                            }
                                                            {elements.length === 0 && (
                                                                <div className="p-4 text-center text-xs text-zinc-600">
                                                                    {language === 'tr' ? 'Henüz element yok' : 'No elements found'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                )}
                                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowElementsDialog(true)}
                                                            className="h-9 gap-2 text-xs font-bold bg-background border border-white/10 text-zinc-300 hover:text-white rounded-xl hover:bg-violet-900/20"
                                                        >
                                                            <Layers className="w-4 h-4" />
                                                            {language === 'tr' ? 'Elementler' : 'Elements'}
                                                        </Button>
                                                        <Separator orientation="vertical" className="h-4 bg-white/10" />
                                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                            <div className={`w-8 h-5 rounded-full relative transition-all ${isSoundOn ? 'bg-violet-500' : 'bg-card'}`}>
                                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSoundOn ? 'left-4' : 'left-1'}`} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                                {isSoundOn
                                                                    ? (language === 'tr' ? 'Ses Açık' : 'Sound On')
                                                                    : (language === 'tr' ? 'Sessiz' : 'Silent')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-medium text-zinc-500">
                                                        {language === 'tr'
                                                            ? 'İpucu: En iyi sonuçlar için aydınlatma, kamera hareketleri ve kumaş dokularından bahsedin.'
                                                            : 'Tip: Mention lighting, camera movement, and fabric textures for better results.'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Video Generation Progress */}
                                {isProcessing && generationProgress && (
                                    <Card className="bg-card border-border overflow-hidden">
                                        <div className="p-6 flex flex-col items-center justify-center gap-4">
                                            <div className="relative w-16 h-16">
                                                <div className="absolute inset-0 rounded-full border-4 border-border" />
                                                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                                    <VideoIcon className="w-5 h-5 text-violet-400" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-sm font-bold text-foreground">
                                                    {language === 'tr' ? 'Video Üretiliyor...' : 'Generating Video...'}
                                                </p>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    {generationProgress}
                                                </p>
                                            </div>
                                            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Generated Video Result */}
                                {generatedVideoUrl && !isProcessing && (
                                    <Card className="bg-card border-border overflow-hidden">
                                        <div className="px-5 py-3 flex items-center justify-between border-b bg-muted/20">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                                    {language === 'tr' ? 'Üretilen Video' : 'Generated Video'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleDownloadVideo}
                                                    className="h-8 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    {language === 'tr' ? 'İndir' : 'Download'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setGeneratedVideoUrl(null)}
                                                    className="h-8 gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                                <video
                                                    src={generatedVideoUrl}
                                                    controls
                                                    autoPlay
                                                    loop
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* Elements Dialog */}
            <Dialog open={showElementsDialog} onOpenChange={(open) => { setShowElementsDialog(open); if (!open) setIsCreatingElement(false); }}>
                <DialogContent className="bg-[#0f0f0f] border-card text-white max-w-2xl rounded-[32px] p-0 overflow-hidden">
                    {!isCreatingElement ? (
                        <div className="p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-violet-400" />
                                    {language === 'tr' ? 'Görsel Elementler' : 'Visual Elements'}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                    {language === 'tr'
                                        ? 'Videonun genelinde tutarlı kalması gereken varlıkları yönetin.'
                                        : 'Manage assets to keep consistent throughout the video.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-8">
                                <div
                                    onClick={() => setIsCreatingElement(true)}
                                    className="aspect-square rounded-[24px] border-2 border-dashed border-card bg-background/40 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
                                >
                                    <Plus className="w-6 h-6 text-zinc-500 group-hover:scale-110 transition-all" />
                                    <span className="text-[10px] text-zinc-600 font-bold mt-2">
                                        {language === 'tr' ? 'YENİ ELEMENT' : 'NEW ELEMENT'}
                                    </span>
                                </div>
                                {elements.map((el) => (
                                    <div
                                        key={el.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("elementName", el.name)}
                                        className="relative aspect-square rounded-[24px] border border-card overflow-hidden group cursor-pointer"
                                        onClick={() => handleElementInsert(el.name)}
                                    >
                                        <img src={el.images[0]} className="w-full h-full object-cover" alt={el.name} />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <span className="text-[10px] font-bold text-violet-400 mb-2">@{el.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setElements(elements.filter(item => item.id !== el.id)); }}
                                                className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 flex -space-x-1.5">
                                            {el.images.map((img, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full border border-black overflow-hidden bg-card shadow-sm">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setShowElementsDialog(false)} className="bg-card border border-zinc-700 text-white hover:bg-zinc-700 h-11 px-8 rounded-2xl font-bold">
                                    {language === 'tr' ? 'Kapat' : 'Close'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" onClick={() => setIsCreatingElement(false)} className="rounded-full w-8 h-8 text-zinc-400">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <h2 className="text-xl font-bold">{language === 'tr' ? 'Yeni Element' : 'New Element'}</h2>
                                </div>

                                <div className="flex gap-4">
                                    {newElement.images.map((img, i) => (
                                        <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden relative group">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setNewElement(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {newElement.images.length < 3 && (
                                        <div
                                            onClick={() => elementInputRef.current?.click()}
                                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-card bg-background/40 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-zinc-500"
                                        >
                                            <Plus className="w-5 h-5 mb-1" />
                                            <span className="text-[10px] font-bold text-center px-2">
                                                {language === 'tr' ? 'Açı Ekle' : 'Add angle'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{language === 'tr' ? 'ELEMENT ADI (ZORUNLU)' : 'ELEMENT NAME (REQUIRED)'}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                                            <input
                                                value={newElement.name}
                                                onChange={(e) => setNewElement(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="a1"
                                                className="w-full h-12 bg-background border border-card rounded-2xl pl-8 pr-4 text-sm font-bold focus:border-violet-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{language === 'tr' ? 'AÇIKLAMA (ZORUNLU)' : 'DESCRIPTION (REQUIRED)'}</label>
                                        <Textarea
                                            value={newElement.description}
                                            onChange={(e) => setNewElement(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder={language === 'tr' ? "Objenin önemli özelliklerini tanımlayın..." : "Describe the subject's key features..."}
                                            className="min-h-[120px] bg-background border-card rounded-2xl text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-background/40 border-t border-card flex justify-end gap-3">
                                <Button onClick={() => setIsCreatingElement(false)} variant="ghost" className="h-11 px-8 rounded-2xl font-bold text-zinc-400">
                                    {language === 'tr' ? 'İptal' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleSaveElement}
                                    className="h-11 px-8 rounded-2xl font-bold bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                    {language === 'tr' ? 'Oluştur' : 'Generate'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* End Frame Generation Dialog */}
            <Dialog open={showEndFrameDialog} onOpenChange={(open) => {
                setShowEndFrameDialog(open);
                if (!open) {
                    setEndFrameDescription("");
                }
            }}>
                <DialogContent className="max-w-lg bg-background border-border p-0 overflow-hidden">
                    <div className="p-6 space-y-5">
                        <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                                <Wand2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold tracking-tight">
                                    {language === 'tr' ? 'Son Kare Görseli Üret' : 'Generate End Frame'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {language === 'tr' ? 'AI ile son karenizi tasarlayın' : 'Design your end frame with AI'}
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {/* First frame preview */}
                        {firstFrame && (
                            <div className="relative rounded-xl overflow-hidden border border-border h-[140px]">
                                <img src={firstFrame} alt="First frame" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                        {language === 'tr' ? 'İlk Kare (Referans)' : 'First Frame (Reference)'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Description input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">
                                {language === 'tr' ? 'Son karede ne görmek istiyorsunuz?' : 'What do you want to see in the last frame?'}
                            </label>
                            <Textarea
                                value={endFrameDescription}
                                onChange={(e) => setEndFrameDescription(e.target.value)}
                                placeholder={language === 'tr'
                                    ? 'Örn: Modelin yürüyerek kameradan uzaklaştığı bir sahne, arkadan görünüm. Mekan ve kıyafet detayları korunsun...'
                                    : 'e.g. A scene where the model walks away from the camera, back view. Keep location and outfit details...'}
                                className="min-h-[100px] bg-muted/50 border-border text-sm focus:border-violet-500 transition-all resize-none"
                                disabled={isGeneratingEndFrame}
                            />
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {language === 'tr'
                                    ? '💡 İpucu: Korunmasını istediğiniz detayları (model, kıyafet, mekan vb.) belirtin. Değişmesini istediğiniz şeyleri (poz, açı, ifade vb.) açıkça yazın.'
                                    : '💡 Tip: Specify details you want preserved (model, outfit, location). Clearly describe what should change (pose, angle, expression).'}
                            </p>
                        </div>

                        {/* Credit warning */}
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                {language === 'tr'
                                    ? 'Bu işlem ek kredi harcayacaktır. Son kare görseli AI tarafından analiz edilip üretilecektir.'
                                    : 'This operation will consume additional credits. The end frame image will be analyzed and generated by AI.'}
                            </p>
                        </div>

                        {/* Generated result preview */}
                        {generatedEndFrameUrl && (
                            <div className="relative rounded-xl overflow-hidden border border-green-500/30 bg-green-500/5">
                                <img src={generatedEndFrameUrl} alt="Generated end frame" className="w-full h-auto max-h-[200px] object-contain" />
                                <div className="absolute top-2 right-2 flex gap-1.5">
                                    <button
                                        onClick={handleDownloadEndFrame}
                                        className="p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5 text-white" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                                    <span className="text-[10px] font-bold text-green-300 uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {language === 'tr' ? 'Üretildi — Son kareye yüklendi' : 'Generated — Loaded to end frame'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowEndFrameDialog(false)}
                                disabled={isGeneratingEndFrame}
                                className="flex-1 border-border"
                            >
                                {language === 'tr' ? 'İptal' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleGenerateEndFrame}
                                disabled={isGeneratingEndFrame || !endFrameDescription.trim()}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-600/20 transition-all"
                            >
                                {isGeneratingEndFrame ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        {language === 'tr' ? 'Üretiliyor...' : 'Generating...'}
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        {language === 'tr' ? 'Görseli Üret' : 'Generate Image'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden Inputs */}
            <input type="file" ref={firstFrameInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'first')} />
            <input type="file" ref={endFrameInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'end')} />
            <input type="file" ref={elementInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'element')} />

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    )
}
