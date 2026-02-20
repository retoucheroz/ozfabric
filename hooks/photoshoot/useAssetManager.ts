import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

export const useAssetManager = (
    assets: any,
    setAssets: any,
    assetsHighRes: any,
    setAssetsHighRes: any,
    setPoseDescription: (desc: string | null) => void,
    setPoseStickman: (url: string | null) => void,
    setTempPoseData: (data: any) => void,
    setShowSavePoseDialog: (show: boolean) => void,
    setTempModelData: (data: any) => void,
    setShowSaveModelDialog: (show: boolean) => void,
    setTempLightingData: (data: any) => void,
    setShowSaveLightingDialog: (show: boolean) => void,
    setTempAssetData: (data: any) => void,
    setShowSaveAssetDialog: (show: boolean) => void,
    setProductDescription: (desc: string | null) => void,
    setUpperGarmentDescription: (desc: string | null) => void,
    setInnerWearDescription: (desc: string | null) => void,
    setUserAddedPrompt: (p: string) => void,
    setFitDescription: (desc: string | null) => void,
    setLightingPositive: (p: string) => void,
    setLightingNegative: (n: string) => void
) => {
    const { language } = useLanguage();

    const getMaxSizeForAsset = (key: string): number => {
        if (key === 'pose' || key === 'lighting' || key.startsWith('detail_')) {
            return 1024;
        }
        return 3000;
    };

    const resizeImage = (file: File, maxSize: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
                    resolve(resizedDataUrl);
                };
                img.onerror = (err) => {
                    reject(new Error(`Image load failed: ${file.name}`));
                };
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    };

    const resizeImageDual = async (file: File, key: string): Promise<{ lowRes: string, highRes: string }> => {
        const highResSize = getMaxSizeForAsset(key);
        const lowResSize = key === 'pose' ? 512 : 768;

        const highRes = await resizeImage(file, highResSize);

        const lowRes = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    let { width, height } = img;
                    if (width > lowResSize || height > lowResSize) {
                        const ratio = Math.min(lowResSize / width, lowResSize / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
                    resolve(resizedDataUrl);
                };
                img.onerror = (err) => {
                    reject(new Error(`LOW-RES image load failed: ${file.name}`));
                };
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });

        return { lowRes, highRes };
    };

    const handleAssetUpload = async (key: string, file: File) => {
        try {
            const { lowRes, highRes } = await resizeImageDual(file, key);
            setAssets((prev: Record<string, string | null>) => ({ ...prev, [key]: lowRes }));
            setAssetsHighRes((prev: Record<string, string | null>) => ({ ...prev, [key]: highRes }));

            if (key === 'pose') {
                setPoseDescription(null);
                setTempPoseData({ original: highRes, stickman: "" });
                setShowSavePoseDialog(true);
            }

            if (key === 'model') {
                setTempModelData({ url: lowRes, name: "", gender: 'female' });
                setShowSaveModelDialog(true);
            }

            if (key === 'lighting') {
                setTempLightingData({
                    url: highRes,
                    name: "",
                    positivePrompt: "",
                    negativePrompt: "",
                    sendImageAsAsset: true
                });
                setShowSaveLightingDialog(true);
            }

            if (['background', 'fit_pattern', 'shoes', 'jacket', 'bag', 'glasses', 'hat', 'jewelry', 'belt'].includes(key)) {
                setTempAssetData({ key, url: lowRes, name: "" });
                setShowSaveAssetDialog(true);
            }

            const detailKeys = ['detail_front_1', 'detail_front_2', 'detail_front_3', 'detail_front_4', 'detail_back_1', 'detail_back_2', 'detail_back_3', 'detail_back_4'];
            if (['main_product', 'top_front', 'bottom_front', ...detailKeys].includes(key)) {
                if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') {
                    setProductDescription(null);
                    setUpperGarmentDescription(null);
                    setInnerWearDescription(null);
                    setUserAddedPrompt("");
                }
            }

            if (key === 'fit_pattern') {
                setFitDescription(null);
            }
        } catch (error) {
            console.error('Image resize failed:', error);
            toast.error(language === "tr" ? "Görsel işlenemedi" : "Image processing failed");
        }
    };

    const removeAsset = (key: string) => {
        setAssets((prev: Record<string, string | null>) => ({ ...prev, [key]: null }));
        setAssetsHighRes((prev: Record<string, string | null>) => ({ ...prev, [key]: null }));
        if (key === 'pose') {
            setPoseDescription(null);
            setPoseStickman(null);
        }
        if (key === 'main_product' || key === 'top_front' || key === 'bottom_front') {
            setProductDescription(null);
            setUpperGarmentDescription(null);
            setInnerWearDescription(null);
        }
        if (key === 'fit_pattern') setFitDescription(null);
        if (key === 'lighting') {
            setLightingPositive("");
            setLightingNegative("");
        }
    };

    return {
        assets,
        setAssets,
        assetsHighRes,
        setAssetsHighRes,
        handleAssetUpload,
        removeAsset,
        resizeImage,
        resizeImageDual
    };
};
