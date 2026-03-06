import { SlotKey } from "@/types/garment";

export interface AnalysisStatus {
    fileName: string;
    status: "idle" | "processing" | "success" | "low_confidence" | "error";
    result?: {
        slotKey: SlotKey;
        productType: string;
        confidence: number;
    };
    warning?: string;
    error?: string;
}

const SLOT_TO_ID_MAP: Record<SlotKey, string> = {
    "üst_ön": "top_front",
    "üst_arka": "top_back",
    "üst_detay_ön": "detail_front_1",
    "üst_detay_arka": "detail_front_2",
    "alt_ön": "bottom_front",
    "alt_arka": "bottom_back",
    "alt_detay_ön": "detail_front_3",
    "alt_detay_arka": "detail_back_3",
    "iç_giyim": "inner_wear",
    "ayakkabı": "shoes",
    "çorap": "socks",
    "dış_giyim": "jacket",
    "çanta": "bag",
    "gözlük": "glasses",
    "şapka": "hat",
    "takılar": "jewelry",
    "kemer": "belt",
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
                // We use image/jpeg with 0.8 quality for analysis
                const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(resizedDataUrl.split(',')[1]);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
};

export async function processSmartUpload(
    files: File[],
    onStatusUpdate: (statuses: AnalysisStatus[]) => void,
    onAssetUpload: (id: string, file: File) => void
) {
    const initialStatuses: AnalysisStatus[] = files.map(f => ({
        fileName: f.name,
        status: "processing"
    }));
    onStatusUpdate(initialStatuses);

    const results: AnalysisStatus[] = [...initialStatuses];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            // Resize to 1024px before sending to API for better performance and to avoid body size limits
            const base64 = await resizeImage(file, 1024);

            const response = await fetch("/api/analysis/garment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64,
                    mimeType: "image/jpeg"
                })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const analysis = await response.json();

            results[i] = {
                fileName: file.name,
                status: analysis.confidence < 55 ? "low_confidence" : "success",
                result: analysis,
                warning: analysis.confidence < 55 ? `Düşük güven oranı (%${analysis.confidence})` : undefined
            };

            // Upload the asset to the mapped slot
            const assetId = SLOT_TO_ID_MAP[analysis.slotKey as SlotKey];
            if (assetId) {
                onAssetUpload(assetId, file);
            }

            onStatusUpdate([...results]);

        } catch (error: any) {
            console.error(error);
            results[i] = {
                fileName: file.name,
                status: "error",
                error: "Analiz sırasında hata oluştu"
            };
            onStatusUpdate([...results]);
        }
    }
}
