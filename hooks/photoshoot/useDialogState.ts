import { useState } from "react";
import { toast } from "sonner";
import { uploadToR2 } from "@/lib/uploadToR2";
import { resizeImageToThumbnail } from "@/lib/utils";
import { dbOperations, STORES } from "@/lib/db";
import {
    SavedPose, SavedModel, SavedBackground, SavedFit, SavedLighting, SavedShoe,
    SavedJacket, SavedBag, SavedGlasses, SavedInnerWear, SavedHat, SavedJewelry, SavedBelt, LibraryItem,
    LIGHTING_PRESETS, BACKGROUND_PRESETS
} from "@/lib/photoshoot-shared";

export const useDialogState = (
    language: string,
    // Setters for global state
    setPoseDescription: (desc: string | null) => void,
    setPoseStickman: (url: string | null) => void,
    setAssets: (fn: (prev: any) => any) => void,
    setAssetsHighRes: (fn: (prev: any) => any) => void,
    setSavedPoses: (val: any) => void,
    setSavedModels: (val: any) => void,
    setSavedBackgrounds: (val: any) => void,
    setSavedFits: (val: any) => void,
    setSavedShoes: (val: any) => void,
    setSavedJackets: (val: any) => void,
    setSavedBags: (val: any) => void,
    setSavedGlasses: (val: any) => void,
    setSavedHats: (val: any) => void,
    setSavedJewelry: (val: any) => void,
    setSavedBelts: (val: any) => void,
    setSavedInnerWears: (val: any) => void,
    setSavedLightings: (val: any) => void,
    setGender: (g: string) => void,
    setLightingPositive: (p: string) => void,
    setLightingNegative: (n: string) => void,
    setLightingSendImage: (s: boolean) => void,
    setModelDescription: (d: string | null) => void,
    setFitDescription: (d: string | null) => void,
    setShoesDescription: (d: string | null) => void,
    setInnerWearDescription: (d: string | null) => void,
    // Current state values needed for logic
    assets: any,
    assetsHighRes: any,
    savedPoses: any[],
    savedModels: any[],
    savedBackgrounds: any[],
    savedFits: any[],
    savedShoes: any[],
    savedLightings: any[],
    savedJackets: any[],
    savedBags: any[],
    savedGlasses: any[],
    savedHats: any[],
    savedJewelry: any[],
    savedBelts: any[],
    savedInnerWears: any[],
    lightingPositive: string,
    lightingNegative: string,
    poseFocus: 'full' | 'upper' | 'lower' | 'closeup'
) => {
    // Dialog Visibility States
    const [showSavePoseDialog, setShowSavePoseDialog] = useState(false);
    const [showSaveModelDialog, setShowSaveModelDialog] = useState(false);
    const [showSaveAssetDialog, setShowSaveAssetDialog] = useState(false);
    const [showSaveLightingDialog, setShowSaveLightingDialog] = useState(false);

    // Temporary Data for Saves
    const [tempPoseData, setTempPoseData] = useState<{ original: string, stickman: string } | null>(null);
    const [tempModelData, setTempModelData] = useState<{ url: string, name: string, gender: 'male' | 'female' } | null>(null);
    const [tempAssetData, setTempAssetData] = useState<{ key: string, url: string, name: string } | null>(null);
    const [tempLightingData, setTempLightingData] = useState<{ url: string, name: string, positivePrompt: string, negativePrompt: string, sendImageAsAsset: boolean } | null>(null);

    // Editing States (Thumbnail/Item updates)
    const [editingThumbItem, setEditingThumbItem] = useState<{ type: string, id: string } | null>(null);
    const [editingItemPrompt, setEditingItemPrompt] = useState("");
    const [editingItemNegativePrompt, setEditingItemNegativePrompt] = useState("");
    const [editingItemSendImage, setEditingItemSendImage] = useState(true);
    const [editingItemTags, setEditingItemTags] = useState<string[]>([]);

    // POSE HANDLER
    const handleSavePose = async (genderValue: 'male' | 'female' | 'skip') => {
        if (!tempPoseData) return;
        setShowSavePoseDialog(false);

        if (genderValue === 'skip') {
            setTempPoseData(null);
            return;
        }

        try {
            const optimizedThumb = await resizeImageToThumbnail(tempPoseData.original);

            const tags = [];
            if (poseFocus === 'upper') tags.push('ust_beden');
            if (poseFocus === 'full') tags.push('tam_boy');

            // 1. Add to library IMMEDIATELY with a processing placeholder
            const newPoseId = crypto.randomUUID();
            const newPose: SavedPose = {
                id: newPoseId,
                url: tempPoseData.original,
                name: language === "tr" ? "Yeni Poz" : "New Pose",
                thumbUrl: optimizedThumb,
                originalThumb: optimizedThumb,
                stickmanUrl: "processing", // placeholder — shows loading indicator
                gender: genderValue,
                customPrompt: undefined,
                tags,
                createdAt: Date.now()
            };
            setSavedPoses((prev: SavedPose[]) => [newPose, ...prev]);
            await dbOperations.add(STORES.POSES, newPose);
            toast.success(language === "tr" ? "Poz kütüphaneye eklendi" : "Pose added to library");
            setTempPoseData(null);

            // 2. Run stickman + analyze in background (non-blocking)
            (async () => {
                try {
                    toast.info(language === "tr" ? "Stickman oluşturuluyor..." : "Converting to stickman...");
                    const res = await fetch("/api/pose", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image_url: tempPoseData.original })
                    });
                    if (!res.ok) throw new Error("Stickman conversion failed");
                    const data = await res.json();
                    const stickmanUrl = data.pose_image;
                    setPoseStickman(stickmanUrl);

                    // Analyze the stickman for auto-prompt
                    let autoPrompt = "";
                    try {
                        const resAnalyze = await fetch("/api/analyze", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ image: stickmanUrl, type: 'pose', language })
                        });
                        const analyzeData = await resAnalyze.json();
                        if (analyzeData?.data?.description) {
                            autoPrompt = analyzeData.data.description;
                        }
                    } catch (e) {
                        console.error("Pose analysis failed:", e);
                    }

                    // 3. Update the pose entry with real stickman + prompt
                    const updatedPose: SavedPose = {
                        ...newPose,
                        stickmanUrl,
                        customPrompt: autoPrompt || undefined
                    };
                    setSavedPoses((prev: SavedPose[]) => prev.map((p: SavedPose) => p.id === newPoseId ? updatedPose : p));
                    await dbOperations.add(STORES.POSES, updatedPose); // add() uses store.put() = upsert

                    setAssets((prev: any) => ({ ...prev, pose: stickmanUrl }));
                    if (autoPrompt) setPoseDescription(autoPrompt);
                    setPoseStickman(stickmanUrl);
                    toast.success(language === "tr" ? "Stickman hazır!" : "Stickman ready!");
                } catch (bgErr) {
                    console.error("Background stickman failed:", bgErr);
                    // Update pose to show stickman failed (remove processing state)
                    const failedPose: SavedPose = { ...newPose, stickmanUrl: "" };
                    setSavedPoses((prev: SavedPose[]) => prev.map((p: SavedPose) => p.id === newPoseId ? failedPose : p));
                    await dbOperations.add(STORES.POSES, failedPose); // upsert
                    toast.error(language === "tr" ? "Stickman oluşturulamadı" : "Stickman conversion failed");
                }
            })();

        } catch (e) {
            console.error(e);
            toast.error("Failed to save pose");
        }
    };


    // MODEL HANDLER
    const handleSaveModel = async () => {
        if (!tempModelData) return;
        const uploadSource = assetsHighRes.model || tempModelData.url;
        let finalUrl = uploadSource;
        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true") {
            try {
                toast.info(language === "tr" ? "Model buluta kaydediliyor..." : "Saving model to cloud...");
                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base64: uploadSource, fileName: "model.png", folder: "models" })
                });
                if (!res.ok) throw new Error("Server upload failed");
                const data = await res.json();
                finalUrl = data.url;
            } catch (r2Error) {
                console.error("R2 Model Upload Error:", r2Error);
                toast.error(language === "tr" ? "Buluta yükleme başarısız." : "Cloud upload failed.");
            }
        }

        const newModel: SavedModel = {
            id: crypto.randomUUID(),
            url: finalUrl,
            name: tempModelData.name || (language === "tr" ? "Yeni Model" : "New Model"),
            gender: tempModelData.gender,
            thumbUrl: tempModelData.url, // LowRes Base64 / Optimized
            createdAt: Date.now()
        };
        const updated = [newModel, ...savedModels];
        setSavedModels(updated);
        await dbOperations.add(STORES.MODELS, newModel);
        toast.success(language === "tr" ? "Model kütüphaneye kaydedildi" : "Model saved to library");
        setAssets((prev: any) => ({ ...prev, model: newModel.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, model: null }));
        setGender(newModel.gender);
        setTempModelData(null);
        setShowSaveModelDialog(false);
    };

    // GENERIC ASSET HANDLER
    const handleSaveAsset = async () => {
        if (!tempAssetData) return;
        const { key, url, name } = tempAssetData; // 'url' holds the lowRes thumbnail
        const uploadSource = assetsHighRes[key] || url;
        let finalUrl = uploadSource;

        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true") {
            try {
                toast.info(language === "tr" ? "Öğe buluta kaydediliyor..." : "Saving item to cloud...");
                const res = await fetch("/api/r2/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base64: uploadSource, fileName: `${key}.png`, folder: key })
                });
                if (!res.ok) throw new Error("Server upload failed");
                const data = await res.json();
                finalUrl = data.url;
            } catch (r2Error) {
                console.error(`R2 ${key} Upload Error:`, r2Error);
                toast.error(language === "tr" ? "Buluta yükleme başarısız." : "Cloud upload failed.");
            }
        }

        const newItem: LibraryItem = {
            id: crypto.randomUUID(),
            url: finalUrl,
            name: name || (language === "tr" ? "Yeni Öğe" : "New Item"),
            thumbUrl: url, // LowRes Base64 / Optimized
            createdAt: Date.now()
        };

        if (key === 'background') {
            setSavedBackgrounds([newItem as SavedBackground, ...savedBackgrounds]);
            await dbOperations.add(STORES.BACKGROUNDS, newItem);
        } else if (key === 'fit_pattern') {
            setSavedFits([newItem as SavedFit, ...savedFits]);
            await dbOperations.add(STORES.FITS, newItem);
        } else if (key === 'shoes') {
            setSavedShoes([newItem as SavedShoe, ...savedShoes]);
            await dbOperations.add(STORES.SHOES, newItem);
        } else if (key === 'jacket') {
            setSavedJackets([newItem as SavedJacket, ...savedJackets]);
            await dbOperations.add(STORES.JACKETS, newItem);
        } else if (key === 'bag') {
            setSavedBags([newItem as SavedBag, ...savedBags]);
            await dbOperations.add(STORES.BAGS, newItem);
        } else if (key === 'glasses') {
            setSavedGlasses([newItem as SavedGlasses, ...savedGlasses]);
            await dbOperations.add(STORES.GLASSES, newItem);
        } else if (key === 'hat') {
            setSavedHats([newItem as SavedHat, ...savedHats]);
            await dbOperations.add(STORES.HATS, newItem);
        } else if (key === 'jewelry') {
            setSavedJewelry([newItem as SavedJewelry, ...savedJewelry]);
            await dbOperations.add(STORES.JEWELRY, newItem);
        } else if (key === 'belt') {
            setSavedBelts([newItem as SavedBelt, ...savedBelts]);
            await dbOperations.add(STORES.BELTS, newItem);
        } else if (key === 'inner_wear') {
            setSavedInnerWears([newItem as SavedInnerWear, ...savedInnerWears]);
            await dbOperations.add(STORES.INNER_WEAR, newItem);
        }

        toast.success(language === "tr" ? "Öğe kütüphaneye kaydedildi" : "Item saved to library");
        setAssets((prev: any) => ({ ...prev, [key]: finalUrl }));
        setAssetsHighRes((prev: any) => ({ ...prev, [key]: null }));
        setTempAssetData(null);
        setShowSaveAssetDialog(false);
    };

    // LIGHTING HANDLER
    const handleSaveLighting = async () => {
        if (!tempLightingData) return;
        const uploadSource = assetsHighRes.lighting || tempLightingData.url;
        let finalUrl = uploadSource;

        if (process.env.NEXT_PUBLIC_USE_R2_UPLOAD === "true" && finalUrl.startsWith('data:')) {
            toast.info(language === "tr" ? "Işık referansı buluta kaydediliyor..." : "Saving lighting reference to cloud...");
            finalUrl = await uploadToR2(uploadSource, "lighting_setup.png");
        }

        const newLighting: SavedLighting = {
            id: `lighting-${Date.now()}`,
            url: finalUrl,
            name: tempLightingData.name || (language === "tr" ? "Yeni Işık" : "New Lighting"),
            positivePrompt: tempLightingData.positivePrompt,
            negativePrompt: tempLightingData.negativePrompt,
            sendImageAsAsset: tempLightingData.sendImageAsAsset,
            createdAt: Date.now()
        };
        const updated = [newLighting, ...savedLightings];
        setSavedLightings(updated);
        await dbOperations.add(STORES.LIGHTING, newLighting);

        setLightingPositive(newLighting.positivePrompt);
        setLightingNegative(newLighting.negativePrompt);
        setLightingSendImage(newLighting.sendImageAsAsset);
        setAssets((p: any) => ({ ...p, lighting: newLighting.url }));
        setAssetsHighRes((p: any) => ({ ...p, lighting: null }));

        setShowSaveLightingDialog(false);
        setTempLightingData(null);
        toast.success(language === "tr" ? "Işıklandırma kütüphaneye kaydedildi" : "Lighting saved to library");
    };

    // EDIT ITEM CLICK HANDLER
    const handleEditItemClick = (type: string, id: string) => {
        setEditingThumbItem({ type, id });
        if (type === 'pose') {
            const pose = savedPoses.find(p => p.id === id);
            setEditingItemPrompt(pose?.customPrompt || "");
            setEditingItemTags(pose?.tags || []);
        } else if (type === 'model') {
            const model = savedModels.find(m => m.id === id);
            setEditingItemPrompt(model?.customPrompt || "");
            setEditingItemTags([]);
        } else if (type === 'fit_pattern') {
            const fit = savedFits.find(f => f.id === id);
            setEditingItemPrompt(fit?.customPrompt || "");
            setEditingItemTags([]);
        } else if (type === 'lighting') {
            const lighting = savedLightings.find((l: any) => l.id === id) || LIGHTING_PRESETS.find(lp => lp.id === id);
            setEditingItemPrompt(lighting?.positivePrompt || "");
            setEditingItemNegativePrompt(lighting?.negativePrompt || "");
            setEditingItemSendImage(lighting?.sendImageAsAsset ?? true);
            setEditingItemTags([]);
        } else if (type === 'shoes') {
            const shoe = savedShoes.find(s => s.id === id);
            setEditingItemPrompt(shoe?.customPrompt || "");
            setEditingItemTags([]);
        } else {
            setEditingItemPrompt("");
            setEditingItemTags([]);
        }
    };

    // UPDATE THUMBNAIL HANDLER
    const handleUpdateThumbnail = async (file: File | null) => {
        if (!editingThumbItem) return;
        const { type, id } = editingThumbItem;
        try {
            let resizedThumb = "";
            if (file) {
                resizedThumb = await resizeImageToThumbnail(await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                }));
            }

            if (type === 'pose') {
                const updated = savedPoses.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt, tags: editingItemTags } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedPoses(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.POSES, itemToUpdate);
                    if (assets.pose === itemToUpdate.stickmanUrl) {
                        setPoseDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'model') {
                const updated = savedModels.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedModels(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.MODELS, itemToUpdate);
                    if (assets.model === itemToUpdate.url) {
                        setModelDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'background') {
                const updated = savedBackgrounds.map((item: any) => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                let itemToUpdate = updated.find((i: any) => i.id === id);

                if (!itemToUpdate && BACKGROUND_PRESETS.some(bp => bp.id === id)) {
                    const preset = BACKGROUND_PRESETS.find(bp => bp.id === id)!;
                    itemToUpdate = {
                        id: preset.id,
                        url: preset.preview || "",
                        name: preset.label,
                        thumbUrl: resizedThumb || preset.preview || "",
                        customPrompt: editingItemPrompt,
                        createdAt: Date.now()
                    };
                    setSavedBackgrounds([itemToUpdate as SavedBackground, ...savedBackgrounds]);
                } else {
                    setSavedBackgrounds(updated);
                }
                if (itemToUpdate) await dbOperations.add(STORES.BACKGROUNDS, itemToUpdate);
            } else if (type === 'fit_pattern') {
                const updated = savedFits.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedFits(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.FITS, itemToUpdate);
                    if (assets.fit_pattern === itemToUpdate.url) {
                        setFitDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'shoes') {
                const updated = savedShoes.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedShoes(updated);
                if (itemToUpdate) {
                    await dbOperations.add(STORES.SHOES, itemToUpdate);
                    if (assets.shoes === itemToUpdate.url) {
                        setShoesDescription(editingItemPrompt);
                    }
                }
            } else if (type === 'lighting') {
                const updated = savedLightings.map((item: any) => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, positivePrompt: editingItemPrompt, negativePrompt: editingItemNegativePrompt, sendImageAsAsset: editingItemSendImage } : item);
                let itemToUpdate = updated.find((i: any) => i.id === id);

                if (!itemToUpdate && LIGHTING_PRESETS.some(lp => lp.id === id)) {
                    const preset = LIGHTING_PRESETS.find(lp => lp.id === id)!;
                    itemToUpdate = { ...preset, thumbUrl: resizedThumb || preset.thumbUrl, positivePrompt: editingItemPrompt, negativePrompt: editingItemNegativePrompt, sendImageAsAsset: editingItemSendImage };
                    setSavedLightings([itemToUpdate as SavedLighting, ...savedLightings]);
                } else {
                    setSavedLightings(updated);
                }

                if (itemToUpdate) {
                    await dbOperations.add(STORES.LIGHTING, itemToUpdate);
                    const oldItem = savedLightings.find((i: any) => i.id === id) || LIGHTING_PRESETS.find(lp => lp.id === id);
                    if (oldItem && (lightingPositive === oldItem.positivePrompt || lightingNegative === oldItem.negativePrompt)) {
                        setLightingPositive(itemToUpdate.positivePrompt);
                        setLightingNegative(itemToUpdate.negativePrompt);
                        setLightingSendImage(itemToUpdate.sendImageAsAsset);
                    }
                }
            } else if (type === 'jacket') {
                const updated = savedJackets.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedJackets(updated);
                if (itemToUpdate) await dbOperations.add(STORES.JACKETS, itemToUpdate);
            } else if (type === 'bag') {
                const updated = savedBags.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedBags(updated);
                if (itemToUpdate) await dbOperations.add(STORES.BAGS, itemToUpdate);
            } else if (type === 'glasses') {
                const updated = savedGlasses.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedGlasses(updated);
                if (itemToUpdate) await dbOperations.add(STORES.GLASSES, itemToUpdate);
            } else if (type === 'hat') {
                const updated = savedHats.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedHats(updated);
                if (itemToUpdate) await dbOperations.add(STORES.HATS, itemToUpdate);
            } else if (type === 'jewelry') {
                const updated = savedJewelry.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedJewelry(updated);
                if (itemToUpdate) await dbOperations.add(STORES.JEWELRY, itemToUpdate);
            } else if (type === 'belt') {
                const updated = savedBelts.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedBelts(updated);
                if (itemToUpdate) await dbOperations.add(STORES.BELTS, itemToUpdate);
            } else if (type === 'inner_wear') {
                const updated = savedInnerWears.map(item => item.id === id ? { ...item, thumbUrl: resizedThumb || item.thumbUrl, customPrompt: editingItemPrompt } : item);
                const itemToUpdate = updated.find(i => i.id === id);
                setSavedInnerWears(updated);
                if (itemToUpdate) await dbOperations.add(STORES.INNER_WEAR, itemToUpdate);
            }
            toast.success(language === "tr" ? "Güncellendi" : "Updated");
            setEditingThumbItem(null);
            setEditingItemPrompt("");
            setEditingItemTags([]);
        } catch (e) {
            console.error(e);
            toast.error("Update failed");
        }
    };

    return {
        showSavePoseDialog, setShowSavePoseDialog,
        showSaveModelDialog, setShowSaveModelDialog,
        showSaveAssetDialog, setShowSaveAssetDialog,
        showSaveLightingDialog, setShowSaveLightingDialog,
        tempPoseData, setTempPoseData,
        tempModelData, setTempModelData,
        tempAssetData, setTempAssetData,
        tempLightingData, setTempLightingData,
        // Editing states
        editingThumbItem, setEditingThumbItem,
        editingItemPrompt, setEditingItemPrompt,
        editingItemNegativePrompt, setEditingItemNegativePrompt,
        editingItemSendImage, setEditingItemSendImage,
        editingItemTags, setEditingItemTags,
        // Handlers
        handleSavePose,
        handleSaveModel,
        handleSaveAsset,
        handleSaveLighting,
        handleEditItemClick,
        handleUpdateThumbnail
    };
};
