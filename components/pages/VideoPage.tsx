"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
    ArrowLeftRight, ArrowUpDown, Wand2, Download, CreditCard, Check,
    Clapperboard, User, Layers, Video as VideoIcon, Sparkles, Loader2, RotateCw, X, Maximize2, Play, Info, Volume2, VolumeX, ShieldAlert, Zap,
    Settings, Globe, CheckCircle2, AlertCircle, Camera, Music, Trash2, Edit2, ChevronRight, ChevronLeft, ChevronDown, Plus, Upload
} from "lucide-react"
import {
    TbVideo,
    TbSettings2,
    TbSparkles,
    TbLoader2,
    TbHistory,
    TbHeart,
    TbSearch,
    TbFilter,
    TbPlayerPlay,
    TbVolume,
    TbVolumeOff,
    TbAdjustmentsHorizontal,
    TbPhoto,
    TbWand,
    TbDownload,
    TbTrash,
    TbRefresh,
    TbChevronLeft,
    TbChevronRight,
    TbPlus,
    TbLayoutGrid,
    TbSmartHome,
    TbMovie,
    TbUserCircle,
    TbShieldCheck,
    TbBolt,
    TbArrowLeftRight,
    TbHdr,
    TbAspectRatio,
    TbGripVertical,
    TbX,
    TbLayoutGrid as TbElements,
} from "react-icons/tb"
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
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--bg-surface)] text-foreground overflow-hidden">
            {/* Header Area */}
            <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                        <TbVideo className="w-6 h-6" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-xl font-black tracking-tight uppercase italic text-[var(--text-primary)]">{t("sidebar.video")}</h1>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest -mt-0.5">
                            {language === 'tr' ? 'Sinematik Moda Videoları' : 'Cinematic Fashion Videos'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <Select value={productionModel} onValueChange={setProductionModel}>
                        <SelectTrigger className="w-40 sm:w-[200px] bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-xl text-xs font-bold h-10 ring-0 focus:ring-0">
                            <SelectValue placeholder="Model Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)]">
                            {PRODUCTION_MODELS.map(m => (
                                <SelectItem key={m.id} value={m.id} className="focus:bg-[var(--accent-soft)] focus:text-[var(--accent-primary)] text-xs">
                                    <span className="flex items-center gap-2 font-bold">
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
                        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black h-10 px-4 sm:px-8 rounded-xl shadow-lg shadow-[var(--accent-primary)]/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
                    >
                        {isProcessing ? (
                            <TbLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <TbSparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">{language === 'tr' ? 'Oluştur' : 'Generate'}</span>
                            </div>
                        )}
                        {!isProcessing && <span className="sm:hidden">{language === 'tr' ? 'Git' : 'Go'}</span>}
                    </Button>
                </div>
            </div>

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
                                    <Card className="md:col-span-2 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] p-4 sm:p-6 backdrop-blur-sm space-y-6 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-black tracking-tight uppercase italic text-[var(--text-primary)] flex items-center gap-2">
                                                <TbMovie className="w-5 h-5 text-[var(--accent-primary)]" />
                                                {language === 'tr' ? 'Hikaye Detayları' : 'Story Details'}
                                            </h2>
                                            <Badge variant="secondary" className="bg-[var(--accent-soft)] text-[var(--accent-primary)] border-[var(--accent-primary)]/10 text-[10px] font-black uppercase tracking-widest">
                                                AI Storyboarding
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                                                {language === 'tr' ? 'AKLINIZDAKİ HİKAYEYİ KISACA YAZIN' : 'BRIEFLY DESCRIBE YOUR STORY'}
                                            </Label>
                                            <Textarea
                                                value={userStory}
                                                onChange={(e) => setUserStory(e.target.value)}
                                                placeholder={language === 'tr' ? 'Örn: Paris sokaklarında zarif bir yürüyüş...' : 'e.g. An elegant walk on the streets of Paris...'}
                                                className="min-h-[120px] bg-[var(--bg-surface)] border-[var(--border-subtle)] text-base sm:text-lg focus:border-[var(--accent-primary)] transition-all rounded-2xl text-[var(--text-primary)]"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                                                {language === 'tr' ? 'HIZLI ŞABLONLAR' : 'QUICK TEMPLATES'}
                                            </Label>
                                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3">
                                                {STORY_TEMPLATES.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setUserStory(language === 'tr' ? t.contentTr : t.contentEn)}
                                                        className="p-3 text-xs text-left bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--accent-primary)] transition-all group"
                                                    >
                                                        <div className="font-black text-[var(--text-primary)] uppercase tracking-tight mb-1">
                                                            {language === 'tr' ? t.labelTr : t.label}
                                                        </div>
                                                        <div className="text-[10px] text-[var(--text-muted)] line-clamp-2">
                                                            {language === 'tr' ? t.contentTr : t.contentEn}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Model/Subject Selection */}
                                    <Card className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] p-6 backdrop-blur-sm space-y-6 rounded-2xl">
                                        <h2 className="text-lg font-black tracking-tight uppercase italic text-[var(--text-primary)] flex items-center gap-2">
                                            <TbUserCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                                            {language === 'tr' ? 'Model & Karakter' : 'Model & Character'}
                                        </h2>

                                        <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
                                            {(['library', 'upload', 'gender'] as const).map(src => (
                                                <button
                                                    key={src}
                                                    onClick={() => setModelSource(src)}
                                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${modelSource === src ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                                >
                                                    {src}
                                                </button>
                                            ))}
                                        </div>

                                        {modelSource === 'gender' && (
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['female', 'male', 'unisex'] as const).map(g => (
                                                    <button
                                                        key={g}
                                                        onClick={() => setSelectedGender(g)}
                                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedGender === g ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-primary)]/30'}`}
                                                    >
                                                        <div className="text-xl">{g === 'female' ? '👩' : g === 'male' ? '👨' : '👤'}</div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{g}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {modelSource === 'upload' && (
                                            <div
                                                onClick={() => firstFrameInputRef.current?.click()}
                                                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all group"
                                            >
                                                {firstFrame ? (
                                                    <img src={firstFrame} alt="Model" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 group-hover:scale-110 transition-all text-[var(--accent-primary)]">
                                                            <TbPhoto className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[10px] text-[var(--text-muted)] text-center font-black uppercase tracking-widest">Model görseli yükle</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                <div className={`w-10 h-6 rounded-full relative transition-all ${isSoundOn ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)]'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSoundOn ? 'left-5' : 'left-1'}`} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-1.5">
                                                    {isSoundOn ? <TbVolume className="w-4 h-4 text-[var(--accent-primary)]" /> : <TbVolumeOff className="w-4 h-4 text-[var(--text-muted)]" />}
                                                    {language === 'tr' ? 'Sesli Üretim' : 'Audio Sync'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {storyboard ? (
                                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <h3 className="text-lg font-black tracking-tight uppercase italic text-[var(--text-primary)] flex items-center gap-2">
                                                <TbMovie className="w-5 h-5 text-[var(--accent-primary)]" />
                                                {language === 'tr' ? 'ÜRETİM PLANI' : 'PRODUCTION PLAN'}
                                            </h3>
                                            <Button variant="ghost" size="sm" onClick={() => setStoryboard(null)} className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl px-4">
                                                {language === 'tr' ? 'SIFIRLA' : 'RESET'}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {storyboard.shots.map((shot: any, idx: number) => (
                                                <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3 relative group overflow-hidden hover:border-[var(--accent-primary)]/30 transition-all">
                                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-[var(--accent-primary)]/20">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="aspect-[3/4] rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                                                        <TbVideo className="w-8 h-8 text-[var(--border-subtle)]" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">{shot.title}</div>
                                                        <div className="text-[11px] font-medium text-[var(--text-primary)] line-clamp-3 leading-relaxed opacity-80">{shot.prompt}</div>
                                                    </div>
                                                    <div className="pt-3 flex items-center justify-between border-t border-[var(--border-subtle)]">
                                                        <span className="text-[10px] font-black italic text-[var(--accent-primary)]">{shot.duration}s</span>
                                                        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tight">{shot.camera}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-[var(--accent-soft)] border border-[var(--accent-primary)]/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="p-3 bg-[var(--accent-primary)] text-white rounded-xl shadow-lg shadow-[var(--accent-primary)]/20">
                                                <TbShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">{language === 'tr' ? 'TUTARLILIK MOTORU AKTİF' : 'CONSISTENCY ENGINE ACTIVE'}</div>
                                                <p className="text-[11px] font-medium text-[var(--text-primary)] mt-0.5 opacity-70 leading-relaxed">{storyboard.visualDictionary}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 border-2 border-dashed border-[var(--border-subtle)] rounded-[32px] bg-[var(--bg-sidebar)]/50 text-center space-y-6 backdrop-blur-sm">
                                        <div className="w-20 h-20 bg-[var(--accent-soft)] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/20">
                                            <TbSparkles className="w-10 h-10 text-[var(--accent-primary)]" />
                                        </div>
                                        <div className="max-w-md mx-auto space-y-3">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)]">OzFabric Storyboard Engine</h3>
                                            <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                                                {language === 'tr'
                                                    ? 'Mavi AI, girdiğiniz hikayeyi analiz ederek 5 ardışık sahne oluşturur. Karakter, mekân ve stil tutarlılığı otomatik olarak denetlenir.'
                                                    : 'Mavi AI analyzes your story to create 5 sequential shots. Character, location, and style consistency are automatically maintained.'}
                                            </p>
                                            <Button
                                                onClick={handleAnalyzeStory}
                                                disabled={isProcessing}
                                                className="mt-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black h-12 px-10 rounded-xl shadow-xl shadow-[var(--accent-primary)]/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                            >
                                                {isProcessing ? <TbLoader2 className="w-4 h-4 animate-spin mr-2" /> : <TbMovie className="w-4 h-4 mr-2" />}
                                                {language === 'tr' ? 'HİKAYEYİ ANALİZ ET' : 'ANALYZE STORY'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Left: Compact Frames */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 relative">
                                            <div
                                                onClick={() => firstFrameInputRef.current?.click()}
                                                className="relative h-[160px] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col items-center justify-center p-3 cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all group overflow-hidden"
                                            >
                                                {firstFrame ? (
                                                    <>
                                                        <img src={firstFrame} alt="Start frame" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                            <TbRefresh className="w-8 h-8 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center mb-2 group-hover:scale-110 transition-all text-[var(--accent-primary)]">
                                                            <TbPhoto className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                            {language === 'tr' ? 'BAŞLANGIÇ' : 'START'}
                                                        </span>
                                                    </>
                                                )}
                                                <Badge className="absolute top-3 left-3 bg-[var(--accent-primary)] text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">
                                                    {language === 'tr' ? 'İLK KARE' : 'START F.'}
                                                </Badge>
                                                {firstFrame && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setFirstFrame(null); }}
                                                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-all text-white"
                                                    >
                                                        <TbTrash className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mid Swap Button */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); swapFrames(); }}
                                                    className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] shadow-xl transition-all"
                                                >
                                                    <TbArrowLeftRight className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div
                                                    onClick={() => endFrameInputRef.current?.click()}
                                                    className="relative h-[160px] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col items-center justify-center p-3 cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all group overflow-hidden"
                                                >
                                                    {endFrame ? (
                                                        <>
                                                            <img src={endFrame} alt="End frame" className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                <TbRefresh className="w-8 h-8 text-white" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-center mb-2 group-hover:scale-110 transition-all text-[var(--text-muted)]">
                                                                <TbPhoto className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                                {language === 'tr' ? 'BİTİŞ' : 'END'}
                                                            </span>
                                                        </>
                                                    )}
                                                    <Badge variant="outline" className="absolute top-3 left-3 border-[var(--border-subtle)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest px-2 h-5 bg-[var(--bg-surface)]">
                                                        {language === 'tr' ? 'SON KARE' : 'END F.'}
                                                    </Badge>
                                                    {endFrame && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEndFrame(null); setGeneratedEndFrameUrl(null); }}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500 transition-all text-white"
                                                        >
                                                            <TbTrash className="w-3 h-3" />
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
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)] hover:text-white bg-[var(--accent-soft)] hover:bg-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-xl transition-all"
                                                >
                                                    <TbWand className="w-3.5 h-3.5" />
                                                    {language === 'tr' ? 'End Frame Üret' : 'Gen End Frame'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Settings Summary */}
                                    <Card className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] p-6 backdrop-blur-sm rounded-2xl h-full flex items-center">
                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 w-full">
                                            {!multiShot ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                            <TbPlayerPlay className="w-4 h-4 text-[var(--accent-primary)]" />
                                                            {language === 'tr' ? 'Süre' : 'Dur'}
                                                        </label>
                                                        <span className="text-xs font-black italic text-[var(--accent-primary)]">{duration}s</span>
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
                                                <div className="flex flex-col justify-center items-center text-center px-4 bg-[var(--accent-soft)] rounded-xl py-4 border border-[var(--accent-primary)]/10">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center mb-2 shadow-lg shadow-[var(--accent-primary)]/20">
                                                        <TbBolt className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase leading-tight tracking-widest">
                                                        {language === 'tr' ? 'ÇOKLU SAHNE AKTİF' : 'MULTI-SHOT ACTIVE'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1 flex items-center gap-1.5">
                                                        <TbAspectRatio className="w-3.5 h-3.5" />
                                                        {language === 'tr' ? 'EN/BOY' : 'RATIO'}
                                                    </Label>
                                                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                                        <SelectTrigger className="bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[10px] font-black uppercase h-10 px-4 rounded-xl ring-0 focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)]">
                                                            <SelectItem value="16:9" className="text-[10px] font-black uppercase">{language === 'tr' ? '16:9 (Yatay)' : '16:9 (Landscape)'}</SelectItem>
                                                            <SelectItem value="9:16" className="text-[10px] font-black uppercase">{language === 'tr' ? '9:16 (Story)' : '9:16 (Story)'}</SelectItem>
                                                            <SelectItem value="1:1" className="text-[10px] font-black uppercase">{language === 'tr' ? '1:1 (Kare)' : '1:1 (Square)'}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1 flex items-center gap-1.5">
                                                        <TbHdr className="w-3.5 h-3.5" />
                                                        {language === 'tr' ? 'KALİTE' : 'QUALITY'}
                                                    </Label>
                                                    <Select value={resolution} onValueChange={setResolution}>
                                                        <SelectTrigger className="bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[10px] font-black uppercase h-10 px-4 rounded-xl ring-0 focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)]">
                                                            <SelectItem value="720p" className="text-[10px] font-black uppercase">720p (HD)</SelectItem>
                                                            <SelectItem value="1080p" className="text-[10px] font-black uppercase">1080p (Full HD)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Prompt & Multi-shot Section */}
                                <Card className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] overflow-hidden rounded-2xl">
                                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] italic">
                                                {multiShot
                                                    ? (language === 'tr' ? 'Çoklu Sahne Yapılandırması' : 'Multi-Shot Configuration')
                                                    : (language === 'tr' ? 'Video Komutu' : 'Video Prompt')}
                                            </span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-4 h-4 text-[var(--text-muted)] cursor-help hover:text-[var(--accent-primary)] transition-colors" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] text-[var(--text-primary)] text-[11px] max-w-[200px]">
                                                        {multiShot
                                                            ? (language === 'tr' ? 'Birden fazla sahne oluşturarak hikayenizi detaylandırın.' : 'Detail your story by creating multiple shots.')
                                                            : (language === 'tr' ? 'Videonuzun içeriğini ve tarzını buradan tarif edin.' : 'Describe the content and style of your video here.')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 px-1">
                                            <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">
                                                {language === 'tr' ? 'ÇOKLU SAHNE' : 'MULTI-SHOT'}
                                            </span>
                                            <Switch checked={multiShot} onCheckedChange={setMultiShot} className="data-[state=checked]:bg-[var(--accent-primary)]" />
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-6 bg-[var(--bg-sidebar)]">
                                        {multiShot ? (
                                            <div className="space-y-6">
                                                {/* MULTI SHOT LIST */}
                                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
                                                    {shots.map((shot, index) => (
                                                        <div key={shot.id} className="relative p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-in slide-in-from-right-2">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                                                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px] shadow-lg shadow-[var(--accent-primary)]/10">{index + 1}</div>
                                                                    {language === 'tr' ? 'SAHNE' : 'SHOT'} {index + 1}
                                                                </h4>
                                                                <div className="flex items-center justify-between sm:justify-end gap-4 overflow-hidden">
                                                                    <div className="flex items-center gap-3 bg-[var(--bg-sidebar)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] group/dur cursor-pointer hover:border-[var(--accent-primary)]/30 transition-all flex-1 sm:flex-none">
                                                                        <TbPlayerPlay className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                                                                        <span className="text-[10px] font-black text-[var(--text-primary)] pr-3 border-r border-[var(--border-subtle)] select-none shrink-0 whitespace-nowrap">
                                                                            {shot.duration}s
                                                                        </span>
                                                                        <Slider
                                                                            value={[shot.duration]}
                                                                            min={1}
                                                                            max={10}
                                                                            step={1}
                                                                            className="w-20 sm:w-24 opacity-40 group-hover/dur:opacity-100 transition-opacity"
                                                                            onValueChange={([val]) => updateShot(shot.id, 'duration', val)}
                                                                        />
                                                                    </div>
                                                                    {shots.length > 1 && (
                                                                        <Button variant="ghost" size="icon" onClick={() => removeShot(shot.id)} className="h-9 w-9 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl shrink-0">
                                                                            <TbTrash className="w-4 h-4" />
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
                                                                    className="min-h-[100px] bg-[var(--bg-sidebar)] border-[var(--border-subtle)] text-sm resize-none focus:border-[var(--accent-primary)]/50 rounded-2xl p-4"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end mt-3">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setShowElementsDialog(true)}
                                                                    className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest bg-[var(--bg-sidebar)] hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] rounded-xl border border-[var(--border-subtle)] px-4"
                                                                >
                                                                    <TbLayoutGrid className="w-4 h-4" />
                                                                    {language === 'tr' ? 'ELEMENTLER' : 'ELEMENTS'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                        <Button
                                                            onClick={addShot}
                                                            disabled={shots.length >= 5 || totalDuration >= 15}
                                                            className="h-12 px-8 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent-primary)]/20 font-black uppercase tracking-widest gap-2 text-xs transition-all active:scale-95"
                                                        >
                                                            <TbPlus className="w-4 h-4" />
                                                            {language === 'tr' ? 'Yeni Sahne' : 'New Shot'}
                                                        </Button>
                                                        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
                                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                                                                {language === 'tr' ? 'TOPLAM:' : 'TOTAL:'}
                                                            </span>
                                                            <span className={`text-xs font-black italic tracking-tighter ${totalDuration > 12 ? 'text-orange-500' : 'text-[var(--accent-primary)]'}`}>{totalDuration}s / 15s</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] self-start sm:self-auto">
                                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                            <div className={`w-10 h-6 rounded-full relative transition-all ${isSoundOn ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-sidebar)] border border-[var(--border-subtle)]'}`}>
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSoundOn ? 'left-5' : 'left-1'}`} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
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
                                            <div className="space-y-6 relative">
                                                <Textarea
                                                    value={prompt}
                                                    onChange={(e) => handleTextareaChange(e.target.value)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e)}
                                                    placeholder={language === 'tr' ? "Neon ışıklı bir şehirde sinematik moda yürüyüşü..." : "A cinematic fashion editorial walk through a neon-lit city..."}
                                                    className="min-h-[160px] bg-[var(--bg-surface)] border-[var(--border-subtle)] text-base sm:text-lg resize-none focus:ring-1 focus:ring-[var(--accent-primary)]/30 rounded-2xl p-6 text-[var(--text-primary)]"
                                                />
                                                {/* Mention Menu placeholder - handled by code logic */}

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[var(--border-subtle)] pt-6 gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowElementsDialog(true)}
                                                            className="h-10 gap-2 text-[10px] font-black uppercase tracking-widest bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] rounded-xl hover:bg-[var(--accent-soft)] px-5"
                                                        >
                                                            <TbLayoutGrid className="w-4 h-4" />
                                                            {language === 'tr' ? 'Elementler' : 'Elements'}
                                                        </Button>
                                                        <Separator orientation="vertical" className="hidden sm:block h-6 bg-[var(--border-subtle)]" />
                                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsSoundOn(!isSoundOn)}>
                                                            <div className={`w-10 h-6 rounded-full relative transition-all ${isSoundOn ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)]'}`}>
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isSoundOn ? 'left-5' : 'left-1'}`} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] whitespace-nowrap">
                                                                {isSoundOn
                                                                    ? (language === 'tr' ? 'Ses Açık' : 'Sound On')
                                                                    : (language === 'tr' ? 'Sessiz' : 'Silent')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase italic tracking-widest text-[var(--text-muted)] sm:max-w-[300px] leading-relaxed">
                                                        {language === 'tr'
                                                            ? 'En iyi sonuçlar için aydınlatma, kamera hareketleri ve kumaş dokularından bahsedin.'
                                                            : 'Mention lighting, camera movement, and fabric textures for better results.'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Video Generation Progress */}
                                {isProcessing && generationProgress && (
                                    <Card className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] overflow-hidden rounded-2xl">
                                        <div className="p-10 flex flex-col items-center justify-center gap-6">
                                            <div className="relative w-20 h-20">
                                                <div className="absolute inset-0 rounded-full border-4 border-[var(--border-subtle)]" />
                                                <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-primary)] border-t-transparent animate-spin" />
                                                <div className="absolute inset-2 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                                                    <TbVideo className="w-8 h-8 text-[var(--accent-primary)]" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-lg font-black uppercase italic tracking-tight text-[var(--text-primary)]">
                                                    {language === 'tr' ? 'Video Üretiliyor' : 'Generating Video'}
                                                </p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] max-w-sm">
                                                    {generationProgress}
                                                </p>
                                            </div>
                                            <div className="w-full max-w-xs h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                                                <div className="h-full bg-[var(--accent-primary)] rounded-full animate-pulse shadow-lg shadow-[var(--accent-primary)]/40" style={{ width: '60%' }} />
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Generated Video Result */}
                                {generatedVideoUrl && !isProcessing && (
                                    <Card className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] overflow-hidden rounded-2xl shadow-2xl">
                                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-[var(--accent-soft)] text-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/10">
                                                    <TbMovie className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] italic">
                                                    {language === 'tr' ? 'Tamamlanan Video' : 'Completed Video'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 px-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleDownloadVideo}
                                                    className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)] hover:bg-[var(--accent-soft)] rounded-xl px-5 border border-[var(--accent-primary)]/20"
                                                >
                                                    <TbDownload className="w-4 h-4" />
                                                    {language === 'tr' ? 'İndir' : 'Download'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setGeneratedVideoUrl(null)}
                                                    className="h-9 w-9 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                >
                                                    <TbTrash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="aspect-video bg-black relative">
                                            <video
                                                src={generatedVideoUrl}
                                                controls
                                                autoPlay
                                                loop
                                                className="w-full h-full object-contain"
                                            />
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
                <DialogContent className="bg-[var(--bg-sidebar)] border-[var(--border-subtle)] text-[var(--text-primary)] max-w-2xl rounded-[32px] p-0 overflow-hidden shadow-2xl">
                    {!isCreatingElement ? (
                        <div className="p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
                                    <TbLayoutGrid className="w-6 h-6 text-[var(--accent-primary)]" />
                                    {language === 'tr' ? 'Görsel Elementler' : 'Visual Elements'}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                    {language === 'tr'
                                        ? 'Videonun genelinde tutarlı kalması gereken varlıkları yönetin.'
                                        : 'Manage assets to keep consistent throughout the video.'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
                                <button
                                    onClick={() => setIsCreatingElement(true)}
                                    className="aspect-square rounded-[24px] border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all group"
                                >
                                    <TbPlus className="w-6 h-6 text-[var(--text-muted)] group-hover:scale-110 group-hover:text-[var(--accent-primary)] transition-all" />
                                    <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] font-black uppercase tracking-widest mt-2">
                                        {language === 'tr' ? 'YENİ ELEMENT' : 'NEW ELEMENT'}
                                    </span>
                                </button>
                                {elements.map((el) => (
                                    <div
                                        key={el.id}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("elementName", el.name)}
                                        className="relative aspect-square rounded-[24px] border border-[var(--border-subtle)] overflow-hidden group cursor-pointer hover:border-[var(--accent-primary)] transition-all"
                                        onClick={() => handleElementInsert(el.name)}
                                    >
                                        <img src={el.images[0]} className="w-full h-full object-cover" alt={el.name} />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                            <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest mb-2 shadow-sm font-mono">@{el.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setElements(elements.filter(item => item.id !== el.id)); }}
                                                className="w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
                                            >
                                                <TbTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 flex -space-x-1.5 opacity-80">
                                            {el.images.map((img, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full border border-black overflow-hidden bg-[var(--bg-surface)] shadow-sm">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setShowElementsDialog(false)} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] h-11 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">
                                    {language === 'tr' ? 'Kapat' : 'Close'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" onClick={() => setIsCreatingElement(false)} className="rounded-xl w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">
                                        <TbChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <h2 className="text-xl font-black uppercase italic tracking-tight text-[var(--text-primary)]">{language === 'tr' ? 'Yeni Element' : 'New Element'}</h2>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    {newElement.images.map((img, i) => (
                                        <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden relative group border border-[var(--border-subtle)]">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setNewElement(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 text-white"
                                            >
                                                <TbX className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {newElement.images.length < 3 && (
                                        <button
                                            onClick={() => elementInputRef.current?.click()}
                                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all group"
                                        >
                                            <TbPlus className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-all" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-center px-1 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]">
                                                {language === 'tr' ? 'Açı Ekle' : 'Add angle'}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{language === 'tr' ? 'ELEMENT ADI (ZORUNLU)' : 'ELEMENT NAME (REQUIRED)'}</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-black text-xs">@</span>
                                            <input
                                                value={newElement.name}
                                                onChange={(e) => setNewElement(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                                                placeholder="a1"
                                                className="w-full h-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl pl-10 pr-4 text-sm font-bold focus:border-[var(--accent-primary)] outline-none transition-all text-[var(--text-primary)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{language === 'tr' ? 'AÇIKLAMA (ZORUNLU)' : 'DESCRIPTION (REQUIRED)'}</label>
                                        <Textarea
                                            value={newElement.description}
                                            onChange={(e) => setNewElement(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder={language === 'tr' ? "Objenin önemli özelliklerini tanımlayın..." : "Describe the subject's key features..."}
                                            className="min-h-[120px] bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl text-sm font-medium focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-[var(--bg-surface)]/50 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                                <Button onClick={() => setIsCreatingElement(false)} variant="ghost" className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                    {language === 'tr' ? 'İptal' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleSaveElement}
                                    className="h-11 px-10 rounded-xl font-black uppercase tracking-widest text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent-primary)]/20 shadow-xl transition-all active:scale-95"
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
                <DialogContent className="max-w-lg bg-[var(--bg-sidebar)] border-[var(--border-subtle)] p-0 overflow-hidden rounded-[32px] shadow-2xl text-[var(--text-primary)]">
                    <div className="p-8 space-y-6">
                        <DialogHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="w-12 h-12 bg-[var(--accent-soft)] text-[var(--accent-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/10 shrink-0">
                                <TbWand className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
                                    {language === 'tr' ? 'Son Kare Üret' : 'Generate End Frame'}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
                                    {language === 'tr' ? 'AI ile son karenizi tasarlayın' : 'Design your end frame with AI'}
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        {/* First frame preview */}
                        {firstFrame && (
                            <div className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] h-[160px] bg-[var(--bg-surface)]">
                                <img src={firstFrame} alt="First frame" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">
                                        {language === 'tr' ? 'Referans: İlk Kare' : 'Reference: First Frame'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Description input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">
                                {language === 'tr' ? 'Son karede ne görmek istiyorsunuz?' : 'What do you want to see in the last frame?'}
                            </label>
                            <Textarea
                                value={endFrameDescription}
                                onChange={(e) => setEndFrameDescription(e.target.value)}
                                placeholder={language === 'tr' ? "Örn: Model kameraya dönüp gülümsüyor..." : "e.g. Model turns to camera and smiles..."}
                                className="min-h-[100px] bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl text-sm font-medium focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                            />
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight leading-relaxed px-1">
                                {language === 'tr'
                                    ? '💡 İpucu: Modelin duruşu, bakışı veya mekândaki değişimi tarif edin.'
                                    : '💡 Tip: Describe the pose, gaze, or change in the environment.'}
                            </p>
                        </div>

                        {/* Credit warning */}
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-primary)]/10">
                            <TbShieldCheck className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                            <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest leading-relaxed">
                                {language === 'tr'
                                    ? 'Bu işlem OzFabric kredisi harcayacaktır.'
                                    : 'This operation will consume OzFabric credits.'}
                            </p>
                        </div>

                        {/* Generated result preview */}
                        {generatedEndFrameUrl && (
                            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5 animate-in zoom-in-95 duration-300">
                                <img src={generatedEndFrameUrl} alt="Generated end frame" className="w-full h-auto max-h-[220px] object-contain" />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <Button
                                        size="icon"
                                        onClick={handleDownloadEndFrame}
                                        className="w-9 h-9 bg-black/60 hover:bg-[var(--accent-primary)] rounded-xl transition-all shadow-xl"
                                    >
                                        <TbDownload className="w-4 h-4 text-white" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <TbShieldCheck className="w-3.5 h-3.5" />
                                        {language === 'tr' ? 'End Frame Başarıyla Üretildi' : 'End Frame Generated Successfully'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-4 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowEndFrameDialog(false)}
                                disabled={isGeneratingEndFrame}
                                className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                            >
                                {language === 'tr' ? 'İptal' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleGenerateEndFrame}
                                disabled={isGeneratingEndFrame || !endFrameDescription.trim()}
                                className="flex-1 h-12 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black shadow-lg shadow-[var(--accent-primary)]/20 transition-all uppercase tracking-widest text-xs active:scale-95"
                            >
                                {isGeneratingEndFrame ? (
                                    <>
                                        <TbLoader2 className="w-4 h-4 animate-spin mr-2" />
                                        {language === 'tr' ? 'Üretiliyor...' : 'Generating...'}
                                    </>
                                ) : (
                                    <>
                                        <TbSparkles className="w-4 h-4 mr-2" />
                                        {language === 'tr' ? 'Görseli Üret' : 'Generate'}
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
    );
}
