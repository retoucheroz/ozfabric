export type SlotKey =
    | "üst_ön"
    | "üst_arka"
    | "üst_detay_ön"
    | "üst_detay_arka"
    | "alt_ön"
    | "alt_arka"
    | "alt_detay_ön"
    | "alt_detay_arka"
    | "iç_giyim"
    | "ayakkabı"
    | "çorap"
    | "dış_giyim"
    | "çanta"
    | "gözlük"
    | "şapka"
    | "takılar"
    | "kemer";

export const SLOT_LABELS: Record<SlotKey, string> = {
    "üst_ön": "Üst Ön",
    "üst_arka": "Üst Arka",
    "üst_detay_ön": "Üst Detay Ön",
    "üst_detay_arka": "Üst Detay Arka",
    "alt_ön": "Alt Ön",
    "alt_arka": "Alt Arka",
    "alt_detay_ön": "Alt Detay Ön",
    "alt_detay_arka": "Alt Detay Arka",
    "iç_giyim": "İç Giyim Modeli",
    "ayakkabı": "Ayakkabı",
    "çorap": "Çorap",
    "dış_giyim": "Dış Giyim",
    "çanta": "Çanta",
    "gözlük": "Gözlük",
    "şapka": "Şapka",
    "takılar": "Takılar",
    "kemer": "Kemer",
};

export interface GarmentAnalysisResult {
    slotKey: SlotKey;
    productType: string;
    confidence: number;
}
