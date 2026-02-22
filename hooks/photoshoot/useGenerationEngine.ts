import { useState, useRef } from "react";
import { toast } from "sonner";
import { uploadToR2 } from "@/lib/uploadToR2";
import { buildBatchSpecs, buildStandardBatchSpecs, type BatchSpec } from "@/lib/batch-helpers";

export const useGenerationEngine = (
    // States from caller
    language: string,
    assets: any,
    assetsHighRes: any,
    savedPoses: any[],
    savedModels: any[],
    savedFits: any[],
    savedShoes: any[],
    productName: string,
    workflowType: string,
    resolution: string,
    aspectRatio: string,
    gender: string,
    seed: number | "",
    enableWebSearch: boolean,
    buttonsOpen: boolean,
    closureType: string,
    userAddedPrompt: string,
    tucked: boolean,
    sleevesRolled: boolean,
    lookAtCamera: boolean,
    enableWind: boolean,
    enableExpression: boolean,
    enableGaze: boolean,
    hairBehindShoulders: boolean,
    socksType: string,
    collarType: string,
    shoulderType: string,
    waistType: string,
    riseType: string,
    legType: string,
    hemType: string,
    pantLength: string,
    lightingPositive: string,
    lightingNegative: string,
    lightingSendImage: boolean,
    poseDescription: string | null,
    poseStickman: string | null,
    productDescription: string | null,
    fitDescription: string | null,
    upperGarmentDescription: string | null,
    lowerGarmentDescription: string | null,
    innerWearDescription: string | null,
    shoesDescription: string | null,
    modelDescription: string | null,
    isMaviBatch: boolean,
    productCode: string,
    upperFraming: "full" | "medium_full",
    batchShotSelection: Record<string, boolean>,
    stylingSideOnly: Record<string, boolean>,
    techAccessories: Record<string, boolean>,
    singleCost: number,
    poseFocus: string,
    detailView: string,

    // Setters
    setSeed: (seed: number | "") => void,
    setProductDescription: (desc: string | null) => void,
    setFitDescription: (desc: string | null) => void,
    setProductName: (name: string) => void,
    setUpperGarmentDescription: (desc: string | null) => void,
    setLowerGarmentDescription: (desc: string | null) => void,
    setInnerWearDescription: (desc: string | null) => void,
    setShoesDescription: (desc: string | null) => void,
    setClosureType: (type: any) => void,
    setPoseDescription: (desc: string | null) => void,
    setUserAddedPrompt: (prompt: string) => void,
    setActiveLibraryAsset: (val: string | null) => void,

    // External Actions
    addProject: (project: any) => void,
    deductCredits: (amount: number) => Promise<boolean>
) => {
    // Hook-local states
    const [stylingIteration, setStylingIteration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImages, setResultImages] = useState<any[]>([]);
    const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'complete'>('idle');
    const [previewData, setPreviewData] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [pendingOptions, setPendingOptions] = useState<any>(null);
    const [previewMode, setPreviewMode] = useState<'text' | 'json'>('json');
    const [isGenerationSuccess, setIsGenerationSuccess] = useState(false);

    const [isStoppingBatch, setIsStoppingBatch] = useState(false);
    const isStoppingBatchRef = useRef(false);

    // Batch related local states
    const [batchPreviewPrompts, setBatchPreviewPrompts] = useState<any[]>([]);
    const [editedBatchPrompts, setEditedBatchPrompts] = useState<string[]>([]);
    const [selectedBatchImages, setSelectedBatchImages] = useState<boolean[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);

    const executeRealGeneration = async (options: { isThreeAngles?: boolean, isReStyling?: boolean, targetView?: string, editedPrompt?: string } = {}) => {
        const { isThreeAngles = false, isReStyling = false, targetView, editedPrompt } = options;

        let currentFocus = poseFocus;
        if (!isThreeAngles && generationStage === 'complete') {
            const base = 'full';
            const alternate = 'upper';
            currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
        }

        const selectedModel = savedModels.find(m => m.url === assets.model);
        let modelGender = selectedModel ? selectedModel.gender : "model";
        if (modelGender === "model") {
            const combinedText = (productName + " " + (assets.prompt || "")).toLowerCase();
            if (combinedText.includes("erkek") || combinedText.includes("bay ") || combinedText.includes("male") || combinedText.includes("man")) {
                modelGender = "male";
            } else if (combinedText.includes("kadın") || combinedText.includes("bayan") || combinedText.includes("female") || combinedText.includes("woman")) {
                modelGender = "female";
            }
        }

        const finalSeed = (seed !== null && seed !== "") ? Number(seed) : Math.floor(Math.random() * 1000000000);
        if (seed === "") setSeed(finalSeed);

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productName,
                workflowType,
                uploadedImages: Object.keys(assets).reduce((acc, k) => {
                    if (k === 'lighting' && !lightingSendImage) return acc;
                    acc[k] = assetsHighRes[k] || assets[k];
                    return acc;
                }, {} as any),
                gender: gender || modelGender,
                prompt: assets.prompt,
                poseFocus: poseFocus,
                resolution,
                aspectRatio,
                isAngles: isThreeAngles,
                preview: false,
                poseDescription,
                poseStickman,
                hairBehindShoulders,
                lookAtCamera,
                enableWind,
                buttonsOpen,
                tucked,
                socksType,
                pantLength,
                techAccessories,
                detailView,
                targetView,
                upperGarmentDescription,
                lowerGarmentDescription,
                innerWearDescription,
                shoesDescription,
                closureType,
                productDescription,
                fitDescription,
                editedPrompt,
                seed: finalSeed,
                enableWebSearch,
                enableExpression,
                enableGaze,
                lightingPositive,
                lightingNegative
            })
        });

        if (!response.ok) {
            let errorMessage = "Generation failed";
            try {
                const err = await response.json();
                errorMessage = err.error || err.message || errorMessage;
            } catch (jsonErr) {
                errorMessage = `HTTP Error ${response.status} - ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();

        if (data.images) {
            setResultImages(data.images);
            setGenerationStage('complete');

            toast.success(isThreeAngles
                ? (language === "tr" ? "3'lü açı seti oluşturuldu!" : "3-Angle set generated!")
                : (language === "tr" ? "Styling görseli oluşturuldu!" : "Styling shot generated!")
            );

            data.images.forEach((img: string, idx: number) => {
                const finalPrompt = (data.prompts && data.prompts[idx]) ? data.prompts[idx] : `Generated for ${productName}`;
                addProject({
                    title: `Photoshoot - ${productName} - ${new Date().toLocaleTimeString()}`,
                    type: "Photoshoot",
                    imageUrl: img,
                    description: `Seed: ${finalSeed} | Prompt: ${finalPrompt}`
                });
            });

            if (!isThreeAngles) setStylingIteration(prev => prev + 1);
        }
        setIsProcessing(false);
    };

    const handleGenerate = async (options: { isThreeAngles?: boolean, isReStyling?: boolean, targetView?: string } = {}) => {
        const { isThreeAngles = false, isReStyling = false, targetView } = options;

        if (isReStyling) {
            setStylingIteration(prev => prev + 1);
        } else if (!isThreeAngles) {
            setStylingIteration(0);
        }

        if (!assets.model) {
            toast.error(language === "tr" ? "Lütfen bir model görseli yükleyin" : "Please upload a model image");
            return;
        }

        setIsProcessing(true);
        if (!isReStyling && !isThreeAngles) setResultImages(null);

        setActiveLibraryAsset(null);

        let currentPoseDesc = poseDescription;
        let currentProductDesc = productDescription;
        let currentClosureType = closureType;
        let currentProductName = productName;
        let currentUpperDesc = upperGarmentDescription;
        let currentInnerDesc = innerWearDescription;

        if (!isReStyling) {
            if (poseStickman && !currentPoseDesc) {
                currentPoseDesc = "Use stickman reference";
                setPoseDescription(currentPoseDesc);
            }
        }

        let garmentImages: string[] = [];
        const allDetails = [
            assets.detail_front_1, assets.detail_front_2, assets.detail_front_3, assets.detail_front_4,
            assets.detail_back_1, assets.detail_back_2, assets.detail_back_3, assets.detail_back_4
        ].filter(Boolean) as string[];

        garmentImages = [
            assets.main_product,
            assets.top_front, assets.top_back,
            assets.bottom_front, assets.bottom_back,
            assets.dress_front,
            assets.inner_wear,
            assets.shoes,
            ...allDetails
        ].filter(Boolean) as string[];

        if (!isReStyling && garmentImages.length > 0 && !currentProductDesc) {
            try {
                toast.info(language === "tr" ? "Ürün toplu analizi yapılıyor..." : "Analyzing garment collective views...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: garmentImages, type: 'fabric', language, workflowType, productName: productCode || productName })
                });
                const data = await res.json();
                if (data.data) {
                    if (data.data.visualPrompt) {
                        currentProductDesc = data.data.visualPrompt;
                        setProductDescription(currentProductDesc);
                    }
                    if (data.data.fitDescription) {
                        setFitDescription(data.data.fitDescription);
                    }
                    if (data.data.productName && !currentProductName) {
                        currentProductName = data.data.productName;
                        setProductName(currentProductName);
                    }
                    if (data.data.upperBrief) {
                        setUpperGarmentDescription(data.data.upperBrief);
                        currentUpperDesc = data.data.upperBrief;
                    }
                    if (data.data.lowerBrief) {
                        if (workflowType !== 'lower') {
                            setLowerGarmentDescription(data.data.lowerBrief);
                        }
                    }
                    if (data.data.innerBrief) {
                        setInnerWearDescription(data.data.innerBrief);
                        currentInnerDesc = data.data.innerBrief;
                    }
                    if (data.data.closureType) {
                        const detected = data.data.closureType.toLowerCase();
                        if (detected.includes('zipper') || detected.includes('zip')) {
                            currentClosureType = 'zipper';
                            setClosureType('zipper');
                        } else if (detected.includes('button')) {
                            currentClosureType = 'buttons';
                            setClosureType('buttons');
                        } else {
                            currentClosureType = 'none';
                            setClosureType('none');
                        }
                    }
                }
            } catch (e) {
                console.error("Collective product analysis failed", e);
            }
        }

        if (!currentProductName && !productName) {
            currentProductName = "Fashion Garment";
        }

        setUserAddedPrompt("");
        try {
            const detailImages = [
                assets.detail_front_1, assets.detail_front_2, assets.detail_front_3, assets.detail_front_4,
                assets.detail_back_1, assets.detail_back_2, assets.detail_back_3, assets.detail_back_4
            ].filter(Boolean);

            let currentFocus = poseFocus;
            if (!isThreeAngles && generationStage === 'complete' && workflowType === 'upper') {
                const base = 'full';
                const alternate = 'upper';
                currentFocus = (stylingIteration % 2 === 0) ? base : alternate;
            }

            const selectedModel = savedModels.find(m => m.url === assets.model);
            let modelGender = selectedModel ? selectedModel.gender : "model";

            if (modelGender === "model") {
                const combinedText = (currentProductName + " " + (assets.prompt || "")).toLowerCase();
                if (combinedText.includes("erkek") || combinedText.includes("bay ") || combinedText.includes("male") || combinedText.includes("man")) {
                    modelGender = "male";
                } else if (combinedText.includes("kadın") || combinedText.includes("bayan") || combinedText.includes("female") || combinedText.includes("woman")) {
                    modelGender = "female";
                }
            }

            let currentShoesDesc = shoesDescription;
            if (!currentShoesDesc && assets.shoes) {
                const selectedShoe = savedShoes.find(s => s.url === assets.shoes);
                if (selectedShoe?.customPrompt) {
                    currentShoesDesc = selectedShoe.customPrompt;
                    setShoesDescription(currentShoesDesc);
                }
            }

            const useR2 = process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true";
            let uploadedImages: any;

            if (useR2) {
                uploadedImages = {};
                for (const key of Object.keys(assets)) {
                    const imageData = assetsHighRes[key] || assets[key];
                    if (imageData) {
                        uploadedImages[key] = await uploadToR2(imageData, `${key}.png`);
                    }
                }
            } else {
                uploadedImages = Object.keys(assets).reduce((acc, k) => {
                    if (k === 'lighting' && !lightingSendImage) return acc;
                    acc[k] = assetsHighRes[k] || assets[k];
                    return acc;
                }, {} as any);
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName: currentProductName || productName,
                    workflowType,
                    uploadedImages,
                    detailImages,
                    gender: gender || modelGender,
                    prompt: assets.prompt,
                    poseFocus: currentFocus,
                    isAngles: isThreeAngles,
                    resolution,
                    aspectRatio,
                    upperGarmentDescription: currentUpperDesc,
                    innerWearDescription: currentInnerDesc,
                    closureType: currentClosureType,
                    productDescription: currentProductDesc,
                    fitDescription,
                    poseDescription: currentPoseDesc,
                    poseStickman,
                    modelDescription,
                    shoesDescription: currentShoesDesc,
                    enableExpression,
                    enableGaze,
                    hairBehindShoulders,
                    lookAtCamera,
                    enableWind,
                    isStylingShot: !isThreeAngles && (poseFocus as string) !== 'closeup',
                    shotIndex: stylingIteration + 1,
                    shotRole: (isThreeAngles || (poseFocus as string) === 'closeup') ? 'technical' : 'styling',
                    buttonsOpen,
                    tucked,
                    sleevesRolled,
                    socksType,
                    collarType,
                    shoulderType,
                    waistType,
                    riseType,
                    legType,
                    hemType,
                    lightingPositive,
                    lightingNegative,
                    seed: seed === "" ? null : Number(seed),
                    enableWebSearch,
                    preview: true
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || errData.message || "Generation failed");
            }

            const data = await response.json();

            if (data.images) {
                setIsGenerationSuccess(true);
                await new Promise(r => setTimeout(r, 1000));

                setResultImages(data.images);
                setGenerationStage('complete');

                // ADD TO HISTORY
                data.images.forEach((img: string, idx: number) => {
                    const finalPrompt = (data.prompts && data.prompts[idx]) ? data.prompts[idx] : `Generated for ${productName}`;
                    addProject({
                        title: `Photoshoot - ${productName} - ${new Date().toLocaleTimeString()}`,
                        type: "Photoshoot",
                        imageUrl: img,
                        description: `Seed: ${seed || 'Random'} | Prompt: ${finalPrompt}`
                    });
                });

                toast.success(language === "tr" ? "Oluşturuldu!" : "Generated!");
                setIsProcessing(false);
                setIsGenerationSuccess(false);
                return;
            }

            if (data.status === "preview") {
                setPreviewData(data.previews);
                if (data.previews && data.previews.length > 0) {
                    if (previewMode === 'json') {
                        setUserAddedPrompt(JSON.stringify(data.previews[0].structured, null, 2));
                    } else {
                        setUserAddedPrompt(data.previews[0].prompt);
                    }
                }
                setPendingOptions(options);
                setShowPreview(true);
                setIsProcessing(false);
                return;
            }
        } catch (error: any) {
            console.error("Generation error:", error);
            toast.error(error.message || (language === "tr" ? "Oluşturma başarısız oldu" : "Generation failed"));
            setIsProcessing(false);
        }
    };

    const handleConfirmGeneration = async () => {
        setShowPreview(false);
        setIsProcessing(true);
        const isReStyling = pendingOptions?.isReStyling || false;
        if (!isReStyling && !pendingOptions?.isThreeAngles) setResultImages(null);

        const costToDeduct = pendingOptions?.isThreeAngles ? singleCost * 3 : singleCost;
        if (!(await deductCredits(costToDeduct))) {
            toast.error(language === 'tr' ? "Yetersiz kredi!" : "Insufficient credits!");
            setIsProcessing(false);
            return;
        }

        try {
            await executeRealGeneration({
                ...pendingOptions,
                targetView: pendingOptions?.targetView,
                editedPrompt: userAddedPrompt
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed");
            setIsProcessing(false);
        }
    };

    const buildSpecsInternal = () => {
        const selectedPose = savedPoses.find(p => p.url === assets.pose);
        const libraryPosePrompt = selectedPose?.customPrompt || poseDescription;

        const selectedModel = savedModels.find(m => m.url === assets.model);
        const modelGender = (selectedModel?.gender || gender || "female") as 'male' | 'female';
        const angledPoses = savedPoses.filter(p =>
            p.gender === modelGender &&
            p.tags &&
            p.tags.includes('yan_aci')
        );
        const randomAngledPose = angledPoses.length > 0 ? angledPoses[Math.floor(Math.random() * angledPoses.length)] : null;
        const angledPosePrompt = randomAngledPose?.customPrompt || null;

        if (isMaviBatch) {
            return buildBatchSpecs(workflowType as any, upperFraming, libraryPosePrompt, hairBehindShoulders, modelGender, savedPoses, angledPosePrompt, enableWind);
        } else {
            return buildStandardBatchSpecs(hairBehindShoulders, modelGender, libraryPosePrompt, stylingSideOnly, enableWind, savedPoses);
        }
    };

    const handleBatchGenerate = async () => {
        if (!productCode.trim()) {
            toast.error(language === "tr" ? "Ürün kodu gerekli!" : "Product code required!");
            return;
        }
        if (!assets.model) {
            toast.error(language === "tr" ? "Model görseli gerekli!" : "Model image required!");
            return;
        }

        setIsProcessing(true);
        setResultImages([]);

        try {
            let currentProductDesc = productDescription;
            let currentFitDesc = fitDescription;
            let currentProductName = productName;

            const selectedModel = savedModels.find(m => m.url === assets.model);
            const modelGender = (selectedModel?.gender || gender || "female") as 'male' | 'female';

            const selectedPose = savedPoses.find(p => p.url === assets.pose);
            const libraryPosePrompt = selectedPose?.customPrompt || poseDescription;

            const selectedFit = savedFits.find(f => f.url === assets.fit_pattern);
            if (selectedFit?.customPrompt && !currentFitDesc) {
                currentFitDesc = selectedFit.customPrompt;
                setFitDescription(currentFitDesc);
            }

            const garmentImages = [
                assets.main_product,
                assets.top_front, assets.top_back,
                assets.bottom_front, assets.bottom_back,
                assets.dress_front,
                assets.inner_wear
            ].filter(Boolean) as string[];

            if (garmentImages.length > 0 && !currentProductDesc) {
                toast.info(language === "tr" ? "Ürün analizi..." : "Analyzing...");
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: garmentImages, type: 'fabric', language: 'en', workflowType, productName: productCode || productName })
                });
                const data = await res.json();
                if (data.data) {
                    if (data.data.visualPrompt) {
                        currentProductDesc = data.data.visualPrompt;
                        setProductDescription(currentProductDesc);
                    }
                    if (data.data.fitDescription && !currentFitDesc) {
                        currentFitDesc = data.data.fitDescription;
                        setFitDescription(currentFitDesc);
                    }
                    if (data.data.productName && !currentProductName) {
                        currentProductName = data.data.productName;
                        setProductName(currentProductName);
                    }
                    if (data.data.upperBrief) setUpperGarmentDescription(data.data.upperBrief);
                    if (data.data.lowerBrief && workflowType !== 'lower') setLowerGarmentDescription(data.data.lowerBrief);
                    if (data.data.innerBrief) setInnerWearDescription(data.data.innerBrief);
                    if (data.data.shoesBrief) setShoesDescription(data.data.shoesBrief);
                }
            }

            if (!currentProductName) currentProductName = "Fashion Garment";

            const allBatchSpecs = (buildSpecsInternal() as BatchSpec[]);
            const batchSpecs = allBatchSpecs.filter((spec: BatchSpec) => batchShotSelection[spec.view] === true);
            if (batchSpecs.length === 0) {
                toast.error(language === "tr" ? "En az bir kare seçmelisiniz!" : "Select at least one shot!");
                setIsProcessing(false);
                return;
            }

            const previews = batchSpecs.map((spec: BatchSpec, idx: number) => {
                let previewFitDesc = currentFitDesc;
                if (spec.fitDescriptionMode === 'first_sentence_only' && previewFitDesc) {
                    const firstSentenceMatch = previewFitDesc.match(/^[^.!?]+[.!?]/);
                    if (firstSentenceMatch) previewFitDesc = firstSentenceMatch[0].trim();
                }

                const isDetailShot = spec.view.includes('detail');
                const structured: any = {
                    productName: currentProductName,
                    productDescription: currentProductDesc,
                    fitDescription: previewFitDesc,
                    pose: spec.pose,
                    view: spec.view,
                    camera: spec.camera
                };

                if (!isDetailShot) {
                    structured.lookAtCamera = spec.lookAtCamera;
                    structured.hairBehind = spec.hairBehind;
                }

                return {
                    title: productCode ? `${productCode}${idx + 1}` : `image_${idx + 1}`,
                    spec: spec,
                    structured
                };
            });

            toast.info(language === "tr" ? "Promptlar hazırlanıyor..." : "Preparing prompts...");

            const textPrompts = await Promise.all(previews.map(async (preview, idx) => {
                const payload = {
                    productName: preview.structured.productName,
                    workflowType: workflowType,
                    uploadedImages: Object.keys(assets).reduce((acc: any, k: string) => {
                        const isAccessory = ['jacket', 'bag', 'glasses', 'hat', 'belt', 'jewelry'].includes(k);
                        const isStylingShot = preview.spec.isStyling;

                        if (isAccessory && !isStylingShot && !techAccessories[k]) return acc;
                        if (preview.spec.excludeAllAccessories && isAccessory) return acc;

                        if (k === 'glasses') {
                            acc[k] = preview.spec.includeGlasses || (isStylingShot ? true : techAccessories.glasses) ? (assetsHighRes.glasses || assets.glasses) : undefined;
                        } else if (k === 'lighting' && !lightingSendImage) {
                            acc[k] = undefined;
                        } else {
                            acc[k] = assetsHighRes[k] || assets[k];
                        }
                        return acc;
                    }, {}),
                    gender: modelGender,
                    resolution: "1K",
                    aspectRatio: "3:4",
                    buttonsOpen,
                    tucked,
                    socksType: preview.spec.excludeSocksInfo ? 'none' : socksType,
                    pantLength,
                    techAccessories,
                    closureType,
                    upperGarmentDescription,
                    lowerGarmentDescription,
                    innerWearDescription,
                    modelDescription,
                    shoesDescription,
                    sleevesRolled,
                    excludeBeltAsset: preview.spec.excludeAllAccessories ? true : preview.spec.excludeBeltAsset,
                    excludeHatAsset: preview.spec.excludeAllAccessories ? true : preview.spec.excludeHatAsset,
                    excludeShoesAsset: preview.spec.excludeShoesAsset,
                    productDescription: preview.structured.productDescription,
                    fitDescription: preview.structured.fitDescription,
                    poseDescription: preview.structured.pose,
                    poseStickman: preview.spec.useStickman ? poseStickman : undefined,
                    targetView: preview.spec.camera.angle === 'angled' || preview.spec.view.includes('angled') ? 'side' : (preview.spec.camera.angle === 'back' || preview.spec.view.includes('back') ? 'back' : 'front'),
                    poseFocus: preview.spec.view.includes('detail') ? 'detail' : (preview.spec.camera.shot_type === 'close_up' ? 'closeup' : (preview.spec.camera.shot_type === 'cowboy_shot' ? 'upper' : 'full')),
                    hairBehindShoulders: (preview.spec.excludeHairInfo && modelGender !== 'male') ? undefined : preview.spec.hairBehind,
                    lookAtCamera: (preview.spec.excludeHairInfo && modelGender !== 'male') ? undefined : preview.spec.lookAtCamera,
                    enableWind: preview.spec.enableWind,
                    isStylingShot: preview.spec.isStyling,
                    shotIndex: idx + 1,
                    shotRole: preview.spec.isStyling ? 'styling' : 'technical',
                    lightingPositive,
                    lightingNegative,
                    seed: seed === "" ? null : Number(seed),
                    enableWebSearch,
                    enableExpression,
                    enableGaze,
                    preview: true,
                    isAngles: false
                };

                try {
                    const res = await fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    return data.previews?.[0]?.prompt || JSON.stringify(preview.structured, null, 2);
                } catch (e) {
                    return JSON.stringify(preview.structured, null, 2);
                }
            }));

            setBatchPreviewPrompts(previews);
            setEditedBatchPrompts(textPrompts);
            setSelectedBatchImages(previews.map(() => true));
            setShowBatchPreview(true);

        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmBatchGeneration = async () => {
        setShowBatchPreview(false);
        setIsProcessing(true);
        setResultImages([]);
        setIsStoppingBatch(false);
        isStoppingBatchRef.current = false;

        const finalSeed = (seed !== null && seed !== "") ? Number(seed) : Math.floor(Math.random() * 1000000000);
        if (seed === "") setSeed(finalSeed);

        const finalSelectionCount = selectedBatchImages.filter(Boolean).length;
        const totalBatchCost = singleCost * finalSelectionCount;

        if (totalBatchCost > 0) {
            if (!(await deductCredits(totalBatchCost))) {
                toast.error(language === "tr" ? "Yetersiz kredi!" : "Insufficient credits!");
                setIsProcessing(false);
                return;
            }
        }

        try {
            const generatedImages: any[] = [];
            for (let i = 0; i < batchPreviewPrompts.length; i++) {
                if (isStoppingBatchRef.current) break;
                if (!selectedBatchImages[i]) continue;

                const preview = batchPreviewPrompts[i];
                const currentIndex = selectedBatchImages.slice(0, i + 1).filter(Boolean).length;
                toast.info(`${language === "tr" ? "Üretiliyor" : "Generating"} ${currentIndex}/${finalSelectionCount}...`);

                const uploadedImages: any = {
                    model: assetsHighRes.model || assets.model,
                    background: assetsHighRes.background || assets.background
                };

                if (preview.spec.includeGlasses && (assetsHighRes.glasses || assets.glasses)) {
                    uploadedImages.glasses = assetsHighRes.glasses || assets.glasses;
                }
                if (!preview.spec.excludeShoesAsset) {
                    uploadedImages.shoes = assetsHighRes.shoes || assets.shoes;
                }
                if (assetsHighRes.inner_wear || assets.inner_wear) uploadedImages.inner_wear = assetsHighRes.inner_wear || assets.inner_wear;
                if (assetsHighRes.jacket || assets.jacket) uploadedImages.jacket = assetsHighRes.jacket || assets.jacket;
                if (assetsHighRes.hat || assets.hat) uploadedImages.hat = assetsHighRes.hat || assets.hat;
                if (assetsHighRes.bag || assets.bag) uploadedImages.bag = assetsHighRes.bag || assets.bag;
                if (assetsHighRes.belt || assets.belt) uploadedImages.belt = assetsHighRes.belt || assets.belt;
                if (assetsHighRes.jewelry || assets.jewelry) uploadedImages.jewelry = assetsHighRes.jewelry || assets.jewelry;
                if (lightingSendImage && (assetsHighRes.lighting || assets.lighting)) uploadedImages.lighting = assetsHighRes.lighting || assets.lighting;

                if (!preview.spec.isStyling) {
                    if (!techAccessories.jacket) delete uploadedImages.jacket;
                    if (!techAccessories.bag) delete uploadedImages.bag;
                    if (!techAccessories.glasses) delete uploadedImages.glasses;
                    if (!techAccessories.hat) delete uploadedImages.hat;
                    if (!techAccessories.jewelry) delete uploadedImages.jewelry;
                    if (!techAccessories.belt) delete uploadedImages.belt;
                }

                if (preview.spec.excludeBeltAsset) delete uploadedImages.belt;
                if (preview.spec.excludeHatAsset) delete uploadedImages.hat;
                if (preview.spec.excludeShoesAsset) delete uploadedImages.shoes;
                if (preview.spec.excludeBagAsset) delete uploadedImages.bag;
                if (preview.spec.excludeAllAccessories) {
                    delete uploadedImages.jacket;
                    delete uploadedImages.belt;
                    delete uploadedImages.bag;
                    delete uploadedImages.hat;
                    delete uploadedImages.glasses;
                    delete uploadedImages.jewelry;
                }

                if (preview.spec.assets.includes('front')) {
                    uploadedImages.top_front = assetsHighRes.top_front || assets.top_front;
                    uploadedImages.bottom_front = assetsHighRes.bottom_front || assets.bottom_front;
                    for (let j = 1; j <= 4; j++) uploadedImages[`detail_front_${j}`] = assetsHighRes[`detail_front_${j}`] || assets[`detail_front_${j}`];
                }
                if (preview.spec.assets.includes('back')) {
                    uploadedImages.top_back = assetsHighRes.top_back || assets.top_back;
                    uploadedImages.bottom_back = assetsHighRes.bottom_back || assets.bottom_back;
                    for (let j = 1; j <= 4; j++) uploadedImages[`detail_back_${j}`] = assetsHighRes[`detail_back_${j}`] || assets[`detail_back_${j}`];
                }

                let finalFitDescription = preview.structured.fitDescription;
                if (preview.spec.fitDescriptionMode === 'first_sentence_only' && finalFitDescription) {
                    const firstSentenceMatch = finalFitDescription.match(/^[^.!?]+[.!?]/);
                    if (firstSentenceMatch) finalFitDescription = firstSentenceMatch[0].trim();
                }

                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productName: preview.structured.productName,
                        workflowType,
                        uploadedImages,
                        gender,
                        resolution,
                        aspectRatio,
                        hairBehindShoulders: preview.spec.excludeHairInfo ? undefined : preview.spec.hairBehind,
                        enableWind: preview.spec.enableWind,
                        isStylingShot: preview.spec.isStyling,
                        shotIndex: i + 1,
                        shotRole: preview.spec.isStyling ? 'styling' : 'technical',
                        lookAtCamera: preview.spec.excludeHairInfo ? undefined : preview.spec.lookAtCamera,
                        buttonsOpen,
                        tucked,
                        socksType: preview.spec.excludeSocksInfo ? 'none' : socksType,
                        pantLength,
                        techAccessories,
                        closureType,
                        upperGarmentDescription,
                        lowerGarmentDescription,
                        innerWearDescription,
                        shoesDescription,
                        sleevesRolled,
                        excludeBeltAsset: preview.spec.excludeBeltAsset,
                        excludeHatAsset: preview.spec.excludeHatAsset,
                        excludeShoesAsset: preview.spec.excludeShoesAsset,
                        productDescription: preview.structured.productDescription,
                        fitDescription: finalFitDescription,
                        poseDescription: preview.structured.pose,
                        targetView: preview.spec.camera.angle === 'angled' || preview.spec.view.includes('angled') ? 'side' : (preview.spec.camera.angle === 'back' || preview.spec.view.includes('back') ? 'back' : 'front'),
                        poseFocus: preview.spec.view.includes('detail') ? 'detail' : (preview.spec.camera.shot_type === 'close_up' ? 'closeup' : (preview.spec.camera.shot_type === 'cowboy_shot' ? 'upper' : 'full')),
                        editedPrompt: editedBatchPrompts[i],
                        seed: finalSeed,
                        enableWebSearch,
                        enableExpression,
                        enableGaze,
                        lightingPositive,
                        lightingNegative,
                        poseStickman: preview.spec.useStickman ? poseStickman : undefined,
                        preview: false
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const imageUrl = data.images?.[0] || data.image_url;
                    if (imageUrl) {
                        const nameSuffix = preview.title.replace(/\s+/g, '_').toLowerCase();
                        const fullFilename = `${productCode || 'shot'}_${nameSuffix}.jpg`;
                        const newImg = { filename: fullFilename, url: imageUrl, downloadName: fullFilename };
                        generatedImages.push(newImg);

                        // Force update with latest array to ensure PreviewArea sees it
                        setResultImages([...generatedImages]);

                        addProject({
                            title: `Batch: ${productCode} - ${preview.title}`,
                            type: "Photoshoot",
                            imageUrl: imageUrl,
                            description: `Seed: ${finalSeed} | Prompt: ${editedBatchPrompts[i]}`
                        });
                    } else {
                        toast.error(`${preview.title}: ${language === 'tr' ? 'Görsel URL alınamadı' : 'Image URL not found'}`);
                    }
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    console.error("Batch item error:", errorData);
                    toast.error(`${preview.title}: ${errorData.error || (language === 'tr' ? 'Üretim hatası' : 'Generation error')}`);
                }
            }

            if (generatedImages.length > 0) {
                setIsGenerationSuccess(true);
                setGenerationStage('complete');
                await new Promise(r => setTimeout(r, 800));
                // Final sync
                setResultImages([...generatedImages]);
            }
        } catch (e: any) {
            toast.error(`Batch Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
            setIsGenerationSuccess(false);
        }
    };

    const handleStopBatch = () => {
        setIsStoppingBatch(true);
        isStoppingBatchRef.current = true;
    };

    return {
        isProcessing,
        setIsProcessing,
        resultImages,
        setResultImages,
        generationStage,
        setGenerationStage,
        previewData,
        setPreviewData,
        showPreview,
        setShowPreview,
        previewMode,
        setPreviewMode,
        pendingOptions,
        setPendingOptions,
        handleGenerate,
        executeRealGeneration,
        handleConfirmGeneration,
        handleBatchGenerate,
        handleConfirmBatchGeneration,
        handleStopBatch,
        isStoppingBatch,
        batchPreviewPrompts,
        editedBatchPrompts,
        selectedBatchImages,
        setSelectedBatchImages,
        showBatchPreview,
        setShowBatchPreview,
        setEditedBatchPrompts,
        isGenerationSuccess,
        setIsGenerationSuccess
    };
};
