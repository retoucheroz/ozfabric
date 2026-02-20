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

const TRAINING_TYPES: { id: TrainingType; icon: any; titleKey: string; descKey: string; color: string }[] = [
    {
        id: "model",
        icon: User,
        titleKey: "train.modelTitle",
        descKey: "train.modelDesc",
        color: "from-violet-500 to-purple-600"
    },
    {
        id: "brand",
        icon: Palette,
        titleKey: "train.brandTitle",
        descKey: "train.brandDesc",
        color: "from-pink-500 to-rose-600"
    },
    {
        id: "garment",
        icon: Shirt,
        titleKey: "train.garmentTitle",
        descKey: "train.garmentDesc",
        color: "from-amber-500 to-orange-600"
    },
    {
        id: "pose",
        icon: Camera,
        titleKey: "train.poseTitle",
        descKey: "train.poseDesc",
        color: "from-emerald-500 to-teal-600"
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
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("train.title")}</h1>
                    <p className="text-muted-foreground mt-1">{t("train.subtitle")}</p>
                </div>
                <Badge variant="outline" className="gap-1">
                    <Zap className="w-3 h-3" />
                    {models.filter(m => m.status === "ready").length} {t("train.modelsReady")}
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "models")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="create" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t("train.createNew")}
                    </TabsTrigger>
                    <TabsTrigger value="models" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t("train.myModels")}
                    </TabsTrigger>
                </TabsList>

                {/* Create New Training */}
                <TabsContent value="create" className="space-y-6 mt-6">
                    {/* Step 1: Select Type */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                            <h2 className="text-xl font-semibold">{t("train.selectType")}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {TRAINING_TYPES.map((type) => (
                                <Card
                                    key={type.id}
                                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedType === type.id
                                        ? "ring-2 ring-violet-500 border-violet-500"
                                        : "hover:border-violet-300"
                                        }`}
                                    onClick={() => setSelectedType(type.id)}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} mx-auto mb-4 flex items-center justify-center`}>
                                            <type.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-1">{t(type.titleKey)}</h3>
                                        <p className="text-xs text-muted-foreground">{t(type.descKey)}</p>
                                        {selectedType === type.id && (
                                            <CheckCircle2 className="w-5 h-5 text-violet-500 mx-auto mt-3" />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Model Details */}
                    {selectedType && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                                <h2 className="text-xl font-semibold">{t("train.modelDetails")}</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t("train.modelName")}</Label>
                                    <Input
                                        placeholder={t("train.modelNamePlaceholder")}
                                        value={modelName}
                                        onChange={(e) => setModelName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("train.modelDescriptionLabel")}</Label>
                                    <Input
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
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                                <h2 className="text-xl font-semibold">{t("train.uploadImages")}</h2>
                            </div>

                            <Card className="border-dashed border-2 p-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold mb-2">{t("train.dropImages")}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{t("train.imageRequirements")}</p>
                                    <Button className="bg-violet-500 text-white hover:bg-violet-600" asChild>
                                        <label>
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
                            </Card>

                            {/* Uploaded Images Grid */}
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {uploadedImages.map((img, i) => (
                                        <div key={i} className="relative group aspect-square">
                                            <img
                                                src={img}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground">
                                {uploadedImages.length} / {t("train.minImages")}
                            </p>
                        </div>
                    )}

                    {/* Start Training Button */}
                    {selectedType && modelName && uploadedImages.length >= 5 && (
                        <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-lg"
                                onClick={handleStartTraining}
                                disabled={isTraining}
                            >
                                {isTraining ? (
                                    <><Clock className="w-5 h-5 mr-2 animate-spin" /> {t("train.starting")}</>
                                ) : (
                                    <><Play className="w-5 h-5 mr-2" /> {t("train.startTraining")}</>
                                )}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground mt-3">
                                {t("train.trainingTime")}
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* My Models */}
                <TabsContent value="models" className="space-y-4 mt-6">
                    {models.length === 0 ? (
                        <Card className="p-12 text-center border-dashed">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">{t("train.noModels")}</h3>
                            <p className="text-muted-foreground mb-4">{t("train.noModelsDesc")}</p>
                            <Button onClick={() => setActiveTab("create")} className="bg-violet-500 text-white hover:bg-violet-600">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("train.createFirst")}
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {models.map((model) => (
                                <Card key={model.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${model.status === "ready"
                                                ? "bg-green-100 dark:bg-green-900/30"
                                                : "bg-amber-100 dark:bg-amber-900/30"
                                                }`}>
                                                {model.status === "ready" ? (
                                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                                ) : (
                                                    <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{model.name}</h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getTypeLabel(model.type)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {model.images} {t("train.images")} • {new Date(model.createdAt).toLocaleDateString()}
                                                </p>
                                                {model.status === "training" && model.progress !== undefined && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Progress value={model.progress} className="h-2 w-32" />
                                                        <span className="text-xs text-muted-foreground">{model.progress}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {model.status === "ready" && (
                                                <Button size="sm" className="bg-violet-500 text-white hover:bg-violet-600" onClick={() => handleUseModel(model)}>
                                                    {t("train.useModel")}
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteModel(model.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
