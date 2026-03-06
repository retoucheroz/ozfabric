"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Upload,
    Sparkles,
    User,
    Palette,
    Shirt,
    Camera,
    Plus,
    Play,
    Trash2,
    CheckCircle2,
    Clock,
    Zap,
    Image as ImageIcon,
    X
} from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { useProjects, TrainingType, TrainedModel } from "@/context/projects-context"
import { useRouter } from "next/navigation"
import { TbSparkles, TbChevronRight } from "react-icons/tb"

const TRAINING_TYPES: { id: TrainingType; icon: any; titleKey: string; descKey: string; color: string }[] = [
    {
        id: "model",
        icon: User,
        titleKey: "train.modelTitle",
        descKey: "train.modelDesc",
        color: "bg-zinc-900 border-white/5"
    },
    {
        id: "brand",
        icon: Palette,
        titleKey: "train.brandTitle",
        descKey: "train.brandDesc",
        color: "bg-zinc-900 border-white/5"
    },
    {
        id: "garment",
        icon: Shirt,
        titleKey: "train.garmentTitle",
        descKey: "train.garmentDesc",
        color: "bg-zinc-900 border-white/5"
    },
    {
        id: "pose",
        icon: Camera,
        titleKey: "train.poseTitle",
        descKey: "train.poseDesc",
        color: "bg-zinc-900 border-white/5"
    },
];

export default function TrainPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { models, addModel, deleteModel } = useProjects();
    const [activeTab, setActiveTab] = useState<"create" | "models">("create");
    const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
    const [modelName, setModelName] = useState("");
    const [modelDescription, setModelDescription] = useState("");
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isTraining, setIsTraining] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUploadedImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleStartTraining = () => {
        toast.info("Yakında!");
    };

    const handleDeleteModel = (id: string) => {
        deleteModel(id);
        toast.success(t("train.modelDeleted"));
    };

    const handleUseModel = (model: TrainedModel) => {
        toast.info("Yakında!");
    };

    const getTypeLabel = (type: TrainingType) => {
        const labels: Record<TrainingType, string> = {
            model: t("train.typeModel"),
            brand: t("train.typeBrand"),
            garment: t("train.typeGarment"),
            pose: t("train.typePose")
        };
        return labels[type];
    };

    return (
        <div className="flex flex-col h-full bg-[#0D0D0F]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-screen pb-24">
                <div className="max-w-[1180px] mx-auto w-full space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-[#18181B] border border-white/10 text-white shadow-lg">
                                <TbSparkles className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[13px] font-black uppercase tracking-[0.2em] text-white leading-none">
                                    {t("train.title")}
                                </label>
                                <span className="text-[11px] font-bold text-zinc-400 mt-1.5 leading-none">
                                    {t("train.subtitle")}
                                </span>
                            </div>
                        </div>
                        <div className="px-5 py-2.5 rounded-xl bg-[#121214] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-none">
                            <Zap className="w-3.5 h-3.5 text-[#FF3D5A]" />
                            {models.filter(m => m.status === "ready").length} {t("train.modelsReady")}
                        </div>
                    </div>

                    <div className="">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "models")}>
                            <TabsList className="bg-[#121214] border border-white/5 p-1 h-12 rounded-xl max-w-md">
                                <TabsTrigger value="create" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 px-6">
                                    <Plus className="w-3.5 h-3.5" />
                                    {t("train.createNew")}
                                </TabsTrigger>
                                <TabsTrigger value="models" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:text-black transition-all gap-2 px-6">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {t("train.myModels")}
                                </TabsTrigger>
                            </TabsList>

                            {/* Create New Training */}
                            <TabsContent value="create" className="space-y-12 mt-10 animate-in fade-in duration-500">
                                {/* Step 1: Select Type */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center text-[12px] font-black shadow-xl shrink-0">1</div>
                                        <div>
                                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t("train.selectType")}</h2>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">CHOOSE YOUR TRAINING CATEGORY</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {TRAINING_TYPES.map((type) => (
                                            <div
                                                key={type.id}
                                                className={`cursor-pointer transition-all duration-300 rounded-3xl border border-white/5 hover:border-white/20 group relative overflow-hidden ${selectedType === type.id
                                                    ? "bg-white text-black shadow-2xl"
                                                    : "bg-[#121214] text-white"
                                                    }`}
                                                onClick={() => setSelectedType(type.id)}
                                            >
                                                <div className="p-8 text-center flex flex-col items-center">
                                                    <div className={`w-14 h-14 rounded-2xl ${selectedType === type.id ? 'bg-black/5' : 'bg-white/5'} flex items-center justify-center shadow-none mb-6 group-hover:scale-110 transition-transform`}>
                                                        <type.icon className={`w-6 h-6 ${selectedType === type.id ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`} />
                                                    </div>
                                                    <h3 className="font-black uppercase tracking-widest text-[11px] mb-2">{t(type.titleKey)}</h3>
                                                    <p className={`text-[10px] font-bold uppercase tracking-tight leading-relaxed max-w-[140px] ${selectedType === type.id ? 'text-black/60' : 'text-zinc-500'}`}>{t(type.descKey)}</p>
                                                </div>
                                                {selectedType === type.id && (
                                                    <div className="absolute top-4 right-4 text-black">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 2: Model Details */}
                                {selectedType && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center text-[12px] font-black shadow-xl shrink-0">2</div>
                                            <div>
                                                <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t("train.modelDetails")}</h2>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">NAME AND DESCRIBE YOUR AI ENTITY</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 bg-[#121214] p-8 rounded-3xl border border-white/5">
                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">{t("train.modelName")}</Label>
                                                <Input
                                                    className="h-12 bg-black/40 border-white/5 focus:border-white/20 text-white rounded-xl placeholder:text-zinc-700 font-bold px-4"
                                                    placeholder={t("train.modelNamePlaceholder")}
                                                    value={modelName}
                                                    onChange={(e) => setModelName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 px-1">{t("train.modelDescriptionLabel")}</Label>
                                                <Input
                                                    className="h-12 bg-black/40 border-white/5 focus:border-white/20 text-white rounded-xl placeholder:text-zinc-700 font-bold px-4"
                                                    placeholder={t("train.modelDescriptionPlaceholder")}
                                                    value={modelDescription}
                                                    onChange={(e) => setModelDescription(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Upload Images */}
                                {selectedType && modelName && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center text-[12px] font-black shadow-xl shrink-0">3</div>
                                            <div>
                                                <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t("train.uploadImages")}</h2>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">UPLOAD PHOTO DATASET (MIN 5 IMAGES)</p>
                                            </div>
                                        </div>

                                        <div className="border border-dashed border-white/10 rounded-3xl p-12 bg-[#121214] hover:border-white/20 transition-colors">
                                            <div className="text-center flex flex-col items-center">
                                                <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                                    <Upload className="w-10 h-10 text-zinc-600" />
                                                </div>
                                                <h3 className="font-black text-xl uppercase tracking-tighter text-white mb-2">{t("train.dropImages")}</h3>
                                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-8 max-w-[280px] mx-auto opacity-70 leading-relaxed">{t("train.imageRequirements")}</p>
                                                <Button className="h-12 bg-white text-black hover:bg-zinc-200 font-black text-[10px] uppercase tracking-widest px-8 rounded-xl shadow-xl transition-all" asChild>
                                                    <label className="cursor-pointer">
                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                        {t("train.selectImages")}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={handleImageUpload}
                                                        />
                                                    </label>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Uploaded Images Grid */}
                                        {uploadedImages.length > 0 && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pt-4">
                                                {uploadedImages.map((img, i) => (
                                                    <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5 bg-[#121214]">
                                                        <img
                                                            src={img}
                                                            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                                                        />
                                                        <button
                                                            onClick={() => removeImage(i)}
                                                            className="absolute top-2 right-2 w-7 h-7 bg-black/80 text-white rounded-xl border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:border-red-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between px-2 pt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-48 h-2 bg-[#121214] rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full bg-[#FF3D5A] transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (uploadedImages.length / 5) * 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    {uploadedImages.length} / 5 MIN
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Start Training Button */}
                                {selectedType && modelName && uploadedImages.length >= 5 && (
                                    <div className="pt-12 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <Button
                                            className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-[#FF3D5A] text-white hover:bg-[#FF3D5A]/90 shadow-2xl rounded-2xl border-none transition-all hover:scale-[1.01]"
                                            onClick={handleStartTraining}
                                            disabled={isTraining}
                                        >
                                            {isTraining ? (
                                                <><Clock className="w-5 h-5 mr-3 animate-spin" /> {t("train.starting")}</>
                                            ) : (
                                                <><Play className="w-5 h-5 mr-3" /> {t("train.startTraining")}</>
                                            )}
                                        </Button>
                                        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-6 opacity-60">
                                            {t("train.trainingTime")}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* My Models */}
                            <TabsContent value="models" className="mt-10 animate-in fade-in duration-500">
                                {models.length === 0 ? (
                                    <div className="py-24 text-center flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-full bg-[#121214] border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                                            <TbSparkles className="w-10 h-10 text-white opacity-20" />
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">{t("train.noModels")}</h3>
                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-10 max-w-[320px] mx-auto leading-relaxed">{t("train.noModelsDesc")}</p>
                                        <Button onClick={() => setActiveTab("create")} className="h-12 bg-white text-black hover:bg-zinc-200 font-black px-10 rounded-xl uppercase tracking-widest text-[10px] shadow-2xl transition-all">
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t("train.createFirst")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {models.map((model) => (
                                            <div key={model.id} className="bg-[#121214] border border-white/5 p-6 rounded-3xl hover:border-white/20 transition-all group shadow-none">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${model.status === "ready"
                                                            ? "bg-green-500/10"
                                                            : "bg-amber-500/10 animate-pulse"
                                                            }`}>
                                                            {model.status === "ready" ? (
                                                                <CheckCircle2 className="w-7 h-7 text-green-500" />
                                                            ) : (
                                                                <Clock className="w-7 h-7 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-black uppercase tracking-tighter text-white text-lg leading-none pt-1">{model.name}</h3>
                                                                <div className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-zinc-500 border border-white/5">
                                                                    {getTypeLabel(model.type)}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-3">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    {model.images} PHOTOS
                                                                </span>
                                                                <span className="text-zinc-800">•</span>
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {new Date(model.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {model.status === "training" && model.progress !== undefined && (
                                                                <div className="flex items-center gap-3 mt-4">
                                                                    <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                                        <div
                                                                            className="h-full bg-[#FF3D5A]"
                                                                            style={{ width: `${model.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{model.progress}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                                        {model.status === "ready" && (
                                                            <Button size="sm" className="h-10 bg-white text-black hover:bg-zinc-200 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all" onClick={() => handleUseModel(model)}>
                                                                {t("train.useModel")}
                                                                <TbChevronRight className="w-4 h-4 ml-1" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="w-10 h-10 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                            onClick={() => handleDeleteModel(model.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
