import { useState, useEffect } from "react";
import { dbOperations, STORES } from "@/lib/db";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import {
    SavedPose, SavedModel, SavedBackground, SavedFit, SavedLighting, SavedShoe,
    SavedJacket, SavedBag, SavedGlasses, SavedInnerWear, SavedHat, SavedJewelry, SavedBelt
} from "@/lib/photoshoot-shared";

export const useLibraryState = (
    setAssets: any,
    setAssetsHighRes: any,
    setPoseStickman: any,
    setPoseDescription: any,
    setModelDescription: any,
    setFitDescription: any,
    setShoesDescription: any,
    setInnerWearDescription: any,
    setGender: any,
    setLightingPositive: any,
    setLightingNegative: any,
    setLightingSendImage: any
) => {
    const { language } = useLanguage();

    const [savedPoses, setSavedPoses] = useState<SavedPose[]>([]);
    const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
    const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBackground[]>([]);
    const [savedFits, setSavedFits] = useState<SavedFit[]>([]);
    const [savedShoes, setSavedShoes] = useState<SavedShoe[]>([]);
    const [savedJackets, setSavedJackets] = useState<SavedJacket[]>([]);
    const [savedBags, setSavedBags] = useState<SavedBag[]>([]);
    const [savedGlasses, setSavedGlasses] = useState<SavedGlasses[]>([]);
    const [savedHats, setSavedHats] = useState<SavedHat[]>([]);
    const [savedJewelry, setSavedJewelry] = useState<SavedJewelry[]>([]);
    const [savedBelts, setSavedBelts] = useState<SavedBelt[]>([]);
    const [savedInnerWears, setSavedInnerWears] = useState<SavedInnerWear[]>([]);
    const [savedLightings, setSavedLightings] = useState<SavedLighting[]>([]);

    const loadLibraries = async () => {
        // First run migration if needed
        await dbOperations.migrateFromLocalStorage();

        // Load all stores
        try {
            const poses = await dbOperations.getAll<SavedPose>(STORES.POSES);
            setSavedPoses(poses.sort((a, b) => b.createdAt - a.createdAt));

            const models = await dbOperations.getAll<SavedModel>(STORES.MODELS);
            setSavedModels(models.sort((a, b) => b.createdAt - a.createdAt));

            const bgs = await dbOperations.getAll<SavedBackground>(STORES.BACKGROUNDS);
            setSavedBackgrounds(bgs.sort((a, b) => b.createdAt - a.createdAt));

            const fits = await dbOperations.getAll<SavedFit>(STORES.FITS);
            setSavedFits(fits.sort((a, b) => b.createdAt - a.createdAt));

            const shoes = await dbOperations.getAll<SavedShoe>(STORES.SHOES);
            setSavedShoes(shoes.sort((a, b) => b.createdAt - a.createdAt));

            const lightings = await dbOperations.getAll<SavedLighting>(STORES.LIGHTING);
            setSavedLightings(lightings.sort((a, b) => b.createdAt - a.createdAt));

            const jackets = await dbOperations.getAll<SavedJacket>(STORES.JACKETS);
            setSavedJackets(jackets.sort((a, b) => b.createdAt - a.createdAt));

            const bags = await dbOperations.getAll<SavedBag>(STORES.BAGS);
            setSavedBags(bags.sort((a, b) => b.createdAt - a.createdAt));

            const glasses = await dbOperations.getAll<SavedGlasses>(STORES.GLASSES);
            setSavedGlasses(glasses.sort((a, b) => b.createdAt - a.createdAt));

            const hats = await dbOperations.getAll<SavedHat>(STORES.HATS);
            setSavedHats(hats.sort((a, b) => b.createdAt - a.createdAt));

            const jewelry = await dbOperations.getAll<SavedJewelry>(STORES.JEWELRY);
            setSavedJewelry(jewelry.sort((a, b) => b.createdAt - a.createdAt));

            const belts = await dbOperations.getAll<SavedBelt>(STORES.BELTS);
            setSavedBelts(belts.sort((a, b) => b.createdAt - a.createdAt));

            const innerWears = await dbOperations.getAll<SavedInnerWear>(STORES.INNER_WEAR);
            setSavedInnerWears(innerWears.sort((a, b) => b.createdAt - a.createdAt));

        } catch (e) {
            console.error("Failed to load libraries form DB", e);
        }
    };

    useEffect(() => {
        loadLibraries();
    }, []);

    const deleteSavedPose = async (id: string) => {
        const updated = savedPoses.filter(p => p.id !== id);
        setSavedPoses(updated);
        await dbOperations.delete(STORES.POSES, id);
        toast.info(language === "tr" ? "Poz silindi" : "Pose deleted");
    };

    const deleteSavedModel = async (id: string) => {
        const updated = savedModels.filter(m => m.id !== id);
        setSavedModels(updated);
        await dbOperations.delete(STORES.MODELS, id);
        toast.info(language === "tr" ? "Model silindi" : "Model deleted");
    };

    const deleteSavedAsset = async (key: string, id: string) => {
        if (key === 'background') {
            const updated = savedBackgrounds.filter(i => i.id !== id);
            setSavedBackgrounds(updated);
            await dbOperations.delete(STORES.BACKGROUNDS, id);
        } else if (key === 'fit_pattern') {
            const updated = savedFits.filter(i => i.id !== id);
            setSavedFits(updated);
            await dbOperations.delete(STORES.FITS, id);
        } else if (key === 'shoes') {
            const updated = savedShoes.filter(i => i.id !== id);
            setSavedShoes(updated);
            await dbOperations.delete(STORES.SHOES, id);
        } else if (key === 'jacket') {
            const updated = savedJackets.filter(i => i.id !== id);
            setSavedJackets(updated);
            await dbOperations.delete(STORES.JACKETS, id);
        } else if (key === 'bag') {
            const updated = savedBags.filter(i => i.id !== id);
            setSavedBags(updated);
            await dbOperations.delete(STORES.BAGS, id);
        } else if (key === 'glasses') {
            const updated = savedGlasses.filter(i => i.id !== id);
            setSavedGlasses(updated);
            await dbOperations.delete(STORES.GLASSES, id);
        } else if (key === 'hat') {
            const updated = savedHats.filter(i => i.id !== id);
            setSavedHats(updated);
            await dbOperations.delete(STORES.HATS, id);
        } else if (key === 'jewelry') {
            const updated = savedJewelry.filter(i => i.id !== id);
            setSavedJewelry(updated);
            await dbOperations.delete(STORES.JEWELRY, id);
        } else if (key === 'belt') {
            const updated = savedBelts.filter(i => i.id !== id);
            setSavedBelts(updated);
            await dbOperations.delete(STORES.BELTS, id);
        } else if (key === 'inner_wear') {
            const updated = savedInnerWears.filter(i => i.id !== id);
            setSavedInnerWears(updated);
            await dbOperations.delete(STORES.INNER_WEAR, id);
        } else if (key === 'lighting') {
            const updated = savedLightings.filter(i => i.id !== id);
            setSavedLightings(updated);
            await dbOperations.delete(STORES.LIGHTING, id);
        }
        toast.info(language === "tr" ? "Öğe silindi" : "Item deleted");
    };

    const handleSavedModelClick = (model: SavedModel) => {
        setAssets((prev: any) => ({ ...prev, model: model.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, model: null }));
        if (model.customPrompt) {
            setModelDescription(model.customPrompt);
        } else {
            setModelDescription(null);
        }
        setGender(model.gender);
    };

    const handleSavedPoseClick = (pose: SavedPose) => {
        setAssets((prev: any) => ({ ...prev, pose: pose.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, pose: null }));
        setPoseStickman(pose.stickmanUrl);

        if (pose.customPrompt) {
            setPoseDescription(pose.customPrompt);
        } else {
            setPoseDescription(null);
        }
    };

    const handleSavedFitClick = (fit: SavedFit) => {
        setAssets((prev: any) => ({ ...prev, fit_pattern: fit.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, fit_pattern: null }));
        if (fit.customPrompt) {
            setFitDescription(fit.customPrompt);
        } else {
            setFitDescription(null);
        }
    };

    const handleSavedShoeClick = (shoe: SavedShoe) => {
        setAssets((prev: any) => ({ ...prev, shoes: shoe.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, shoes: null }));
        if (shoe.customPrompt) setShoesDescription(shoe.customPrompt);
        else setShoesDescription(null);
    };

    const handleSavedJacketClick = (jack: SavedJacket) => {
        setAssets((prev: any) => ({ ...prev, jacket: jack.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, jacket: null }));
    };

    const handleSavedBagClick = (bag: SavedBag) => {
        setAssets((prev: any) => ({ ...prev, bag: bag.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, bag: null }));
    };

    const handleSavedGlassesClick = (gl: SavedGlasses) => {
        setAssets((prev: any) => ({ ...prev, glasses: gl.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, glasses: null }));
    };

    const handleSavedHatClick = (h: SavedHat) => {
        setAssets((prev: any) => ({ ...prev, hat: h.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, hat: null }));
    };

    const handleSavedJewelryClick = (jw: SavedJewelry) => {
        setAssets((prev: any) => ({ ...prev, jewelry: jw.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, jewelry: null }));
    };

    const handleSavedBeltClick = (bl: SavedBelt) => {
        setAssets((prev: any) => ({ ...prev, belt: bl.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, belt: null }));
    };

    const handleSavedInnerWearClick = (iw: SavedInnerWear) => {
        setAssets((prev: any) => ({ ...prev, inner_wear: iw.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, inner_wear: null }));
        if (iw.customPrompt) setInnerWearDescription(iw.customPrompt);
        else setInnerWearDescription(null);
    };

    const handleSavedLightingClick = (l: SavedLighting) => {
        setAssets((prev: any) => ({ ...prev, lighting: l.url }));
        setAssetsHighRes((prev: any) => ({ ...prev, lighting: null }));
        setLightingPositive(l.positivePrompt || "");
        setLightingNegative(l.negativePrompt || "");
        setLightingSendImage(l.sendImageAsAsset ?? true);
    }

    return {
        savedPoses, setSavedPoses,
        savedModels, setSavedModels,
        savedBackgrounds, setSavedBackgrounds,
        savedFits, setSavedFits,
        savedShoes, setSavedShoes,
        savedJackets, setSavedJackets,
        savedBags, setSavedBags,
        savedGlasses, setSavedGlasses,
        savedHats, setSavedHats,
        savedJewelry, setSavedJewelry,
        savedBelts, setSavedBelts,
        savedInnerWears, setSavedInnerWears,
        savedLightings, setSavedLightings,
        loadLibraries,
        deleteSavedPose,
        deleteSavedModel,
        deleteSavedAsset,
        handleSavedModelClick,
        handleSavedPoseClick,
        handleSavedFitClick,
        handleSavedShoeClick,
        handleSavedJacketClick,
        handleSavedBagClick,
        handleSavedGlassesClick,
        handleSavedHatClick,
        handleSavedJewelryClick,
        handleSavedBeltClick,
        handleSavedInnerWearClick,
        handleSavedLightingClick
    };
};
