// Shared constants and types for Photoshoot and Mavi Almanya pages

// Aspect Ratios
export const ASPECT_RATIOS = [
    { id: "1:1", label: "1:1", labelTr: "1:1 (Kare)" },
    { id: "2:3", label: "2:3", labelTr: "2:3 (Portre)" },
    { id: "3:4", label: "3:4", labelTr: "3:4 (Portre)" },
    { id: "4:3", label: "4:3", labelTr: "4:3 (Yatay)" },
    { id: "16:9", label: "16:9", labelTr: "16:9" },
    { id: "9:16", label: "9:16", labelTr: "9:16" },
];

// Resolutions
export const RESOLUTION_OPTIONS = [
    { id: "1K", label: "1K Standard", labelTr: "1K Standart", credits: 4 },
    { id: "2K", label: "2K High", labelTr: "2K Yüksek", credits: 4 },
    { id: "4K", label: "4K Ultra", labelTr: "4K Ultra", credits: 8 },
];

// Library Item Interfaces
export interface LibraryItem {
    id: string;
    url: string;        // The actual asset URL (base64 or cloud)
    name: string;       // Display name
    thumbUrl?: string;  // OPTIONAL: Custom preview image
    createdAt: number;
}

export interface SavedPose extends LibraryItem {
    originalThumb: string; // The thumb used currently
    stickmanUrl: string;   // The API result
    gender: 'male' | 'female';
    customPrompt?: string;
    tags?: string[];
}

export interface SavedModel extends LibraryItem {
    gender: 'male' | 'female';
    customPrompt?: string;
}

export interface SavedBackground extends LibraryItem {
    customPrompt?: string;
}

export interface SavedFit extends LibraryItem {
    customPrompt?: string;
}

export interface SavedShoe extends LibraryItem {
    customPrompt?: string;
}

export interface SavedLighting extends LibraryItem {
    positivePrompt: string;
    negativePrompt: string;
    sendImageAsAsset: boolean;
}

export interface SavedJacket extends LibraryItem { customPrompt?: string; }
export interface SavedBag extends LibraryItem { customPrompt?: string; }
export interface SavedGlasses extends LibraryItem { customPrompt?: string; }
export interface SavedInnerWear extends LibraryItem { customPrompt?: string; }
export interface SavedHat extends LibraryItem { customPrompt?: string; }
export interface SavedJewelry extends LibraryItem { customPrompt?: string; }
export interface SavedBelt extends LibraryItem { customPrompt?: string; }

// Pose Library Presets (Fallback)
export const POSE_LIBRARY = {
    female: {
        random: [
            "Standing with one hand on hip, weight shifted to left leg, confident pose",
            "Hands in pockets, relaxed stance, looking slightly away",
            "Arms crossed casually, standing straight, natural expression",
            "One hand touching hair, other hand relaxed at side, elegant pose"
        ],
        angled: [
            "Body rotated 45 degrees to the right, looking over shoulder at camera",
            "Three-quarter turn to the left, hands on hips, dynamic stance",
            "Slight rotation showing side profile, one leg forward"
        ]
    },
    male: {
        random: [
            "Standing with hands in pockets, shoulders relaxed, confident stance",
            "Arms at sides, weight on one leg, casual pose",
            "One hand in pocket, other hand relaxed, natural expression",
            "Hands clasped in front, standing straight, professional pose"
        ],
        angled: [
            "Body rotated 45 degrees to the right, looking at camera, strong stance",
            "Three-quarter turn to the left, hands in pockets, casual angle",
            "Slight rotation showing side profile, arms crossed"
        ]
    }
};

export const getRandomPose = (gender: 'male' | 'female', type: 'random' | 'angled'): string => {
    const poses = POSE_LIBRARY[gender][type];
    return poses[Math.floor(Math.random() * poses.length)];
};

export const BACKGROUND_PRESETS = [
    { id: "studio", label: "Studio White", labelTr: "Stüdyo Beyaz", preview: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=200&h=200&fit=crop" },
    { id: "street", label: "Urban Street", labelTr: "Şehir Sokağı", preview: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop" },
    { id: "nature", label: "Nature", labelTr: "Doğa", preview: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop" },
    { id: "beach", label: "Beach", labelTr: "Plaj", preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop" },
    { id: "gradient", label: "Gradient", labelTr: "Gradyan", preview: null, color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
];

export const LIGHTING_PRESETS: SavedLighting[] = [
    {
        id: "hard-flash-5200k",
        name: "SERT/FLAŞ 5200K SETUP",
        url: "",
        positivePrompt: "Single hard strobe/flash look (small source), neutral daylight balance 5200 Kelvin. Place the key light near camera but slightly camera‑left and slightly above eye level, producing crisp specular highlights on forehead/cheekbones/shoulders and a defined, sharp shadow cast onto the background that falls toward camera‑right. Minimal fill (keep contrast), no rim light, no colored gels, no haze; modern editorial fashion studio aesthetic, punchy but clean.",
        negativePrompt: "softbox look, diffused lighting, multiple light sources, rim light, colored gels, cinematic moody low‑key lighting, heavy film grain, HDR glow, background bokeh.",
        sendImageAsAsset: false,
        createdAt: 1770124800000
    },
    {
        id: "soft-5200k",
        name: "SOFT 5200K SETUP",
        url: "",
        positivePrompt: "High-key e-commerce studio lighting, neutral daylight white balance 5200 Kelvin. Large diffused key light (big softbox/octabox look) placed close to camera axis but slightly camera-left and slightly above eye level (about 15–25° off-axis), creating very soft, low-contrast shadows under the chin/arms and smooth, even highlights (no harsh specular hotspots). Add broad, low-contrast fill from camera-right near axis to keep shadows open and clean. Keep contrast low-to-medium, clean edges, accurate skin and fabric tones. No visible rim light, no colored gels, no haze.",
        negativePrompt: "Single hard flash look, small-source strobe, sharp cast shadows, dramatic side lighting, strong rim light, colored gels, cinematic moody low-key lighting, heavy film grain, HDR glow, over-sharpening halos, plastic skin, oily hotspots.",
        sendImageAsAsset: false,
        createdAt: 1770124800001
    }
];

export const UPPER_SHOTS = [
    { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front', descriptionTr: 'Ön styling karesi.', descriptionEn: 'Front styling shot.', image: '/crops/styling_tam_boy.jpg' },
    { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled', descriptionTr: 'Yan açı styling karesi.', descriptionEn: 'Angled styling shot.', image: '/crops/styling_tam_boy.jpg' },
    { id: 'styling_front_2', label: 'Styling 3. Kare', labelEn: 'Styling Front 2', descriptionTr: 'Alternatif ön styling karesi.', descriptionEn: 'Alternative front styling shot.', image: '/crops/styling_ust_vucut.jpg' },
    { id: 'technical_back', label: 'Düz Arka Kare', labelEn: 'Technical Back', descriptionTr: 'Düz arka teknik çekim.', descriptionEn: 'Straight back technical shot.', image: '/crops/arka_tam_boy.jpg' },
    { id: 'closeup_front', label: 'Yakın Çekim Ön', labelEn: 'Close-Up Front', descriptionTr: 'Ön yakın çekim.', descriptionEn: 'Front close-up shot.', image: '/crops/ust_closeup.jpg' },
];

export const LOWER_SHOTS = [
    { id: 'styling_front', label: 'Styling 1. Kare', labelEn: 'Styling Front', descriptionTr: 'Ön styling karesi.', descriptionEn: 'Front styling shot.', image: '/crops/styling_tam_boy.jpg' },
    { id: 'styling_angled', label: 'Styling 2. Yan Kare', labelEn: 'Styling Angled', descriptionTr: 'Yan açı styling karesi.', descriptionEn: 'Angled styling shot.', image: '/crops/styling_tam_boy.jpg' },
    { id: 'technical_front', label: 'Düz Ön 3. Kare', labelEn: 'Technical Front', descriptionTr: 'Düz ön teknik çekim.', descriptionEn: 'Straight front technical shot.', image: '/crops/on_tam_boy.jpg' },
    { id: 'technical_back', label: 'Düz Arka 4. Kare', labelEn: 'Technical Back', descriptionTr: 'Düz arka teknik çekim.', descriptionEn: 'Straight back technical shot.', image: '/crops/arka_tam_boy.jpg' },
    { id: 'detail_front', label: 'Detay Ön Kare', labelEn: 'Detail Front', descriptionTr: 'Ön detay çekimi.', descriptionEn: 'Front detail shot.', image: '/crops/alt_on_detay.jpg' },
    { id: 'detail_back', label: 'Detay Arka Kare', labelEn: 'Detail Back', descriptionTr: 'Arka detay çekimi.', descriptionEn: 'Back detail shot.', image: '/crops/alt_arka_detay.jpg' },
];

export const STANDARD_SHOTS = [
    { id: 'std_styling_full', label: 'Tam Boy Styling', labelEn: 'Full Body Styling', descriptionTr: 'Tam boy, artistik pozlama.', descriptionEn: 'Full body, artistic posing.', image: '/crops/styling_tam_boy.jpg' },
    { id: 'std_styling_upper', label: 'Üst Vücut Styling', labelEn: 'Upper Body Styling', descriptionTr: 'Üst vücut, artistik pozlama.', descriptionEn: 'Upper body, artistic posing.', image: '/crops/styling_ust_vucut.jpg' },
    { id: 'std_tech_full_front', label: 'Ön Tam Boy', labelEn: 'Front Full Body', descriptionTr: 'Tam boy ön, kollar yanlarda.', descriptionEn: 'Full body front, arms at sides.', image: '/crops/on_tam_boy.jpg' },
    { id: 'std_tech_full_back', label: 'Arka Tam Boy', labelEn: 'Back Full Body', descriptionTr: 'Tam boy arka, kollar yanlarda.', descriptionEn: 'Full body back, arms at sides.', image: '/crops/arka_tam_boy.jpg' },
    { id: 'std_tech_upper_front', label: 'Ön Üst Vücut', labelEn: 'Front Upper Body', descriptionTr: 'Üst vücut ön, kollar yanlarda.', descriptionEn: 'Upper body front, arms at sides.', image: '/crops/on_ust_vucut.jpg' },
    { id: 'std_tech_upper_back', label: 'Arka Üst Vücut', labelEn: 'Back Upper Body', descriptionTr: 'Üst vücut arka, kollar yanlarda.', descriptionEn: 'Upper body back, arms at sides.', image: '/crops/arka_ust_vucut.jpg' },
    { id: 'std_detail_front', label: 'Alt Ürün Ön Detay', labelEn: 'Lower Front Detail', descriptionTr: 'Belden dize kadar ön detay çekimi.', descriptionEn: 'Lower front detail from waist to knee.', image: '/crops/alt_on_detay.jpg' },
    { id: 'std_detail_back', label: 'Alt Ürün Arka Detay', labelEn: 'Lower Back Detail', descriptionTr: 'Belden dize kadar arka detay çekimi.', descriptionEn: 'Lower back detail from waist to knee.', image: '/crops/alt_arka_detay.jpg' },
    { id: 'std_closeup_front', label: 'Üst Ürün Ön Yakın Çekim', labelEn: 'Upper Front Closeup', descriptionTr: 'Yüzden göğüs altına yakın çekim.', descriptionEn: 'Close-up from face to chest.', image: '/crops/ust_closeup.jpg' },
];
export const MODEL_PRESETS: SavedModel[] = [
    // Female Models
    {
        id: "f-emma",
        name: "Emma",
        url: "/models/female_2048/Generated-Image-February-19,-2026---8_39AM.jpg",
        gender: "female",
        createdAt: 1771401600000
    },
    {
        id: "f-sophia",
        name: "Sophia",
        url: "/models/female_2048/Generated-Image-February-19,-2026---8_42AM.jpg",
        gender: "female",
        createdAt: 1771401600001
    },
    {
        id: "f-isabella",
        name: "Isabella",
        url: "/models/female_2048/Generated-Image-February-19,-2026---8_46AM.jpg",
        gender: "female",
        createdAt: 1771401600002
    },
    {
        id: "f-olivia",
        name: "Olivia",
        url: "/models/female_2048/Generated-Image-February-19,-2026---8_56AM+.jpg",
        gender: "female",
        createdAt: 1771401600003
    },
    {
        id: "f-ava",
        name: "Ava",
        url: "/models/female_2048/Generated-Image-February-19,-2026---8_56AM.jpg",
        gender: "female",
        createdAt: 1771401600004
    },
    {
        id: "f-mia",
        name: "Mia",
        url: "/models/female_2048/Generated-Image-February-19,-2026---9_02AM.jpg",
        gender: "female",
        createdAt: 1771401600005
    },

    // Male Models
    {
        id: "m-liam",
        name: "Liam",
        url: "/models/male_2048/1.jpg",
        gender: "male",
        createdAt: 1771401600100
    },
    {
        id: "m-noah",
        name: "Noah",
        url: "/models/male_2048/2.jpg",
        gender: "male",
        createdAt: 1771401600101
    },
    {
        id: "m-oliver",
        name: "Oliver",
        url: "/models/male_2048/3.jpg",
        gender: "male",
        createdAt: 1771401600102
    },
    {
        id: "m-james",
        name: "James",
        url: "/models/male_2048/4.jpg",
        gender: "male",
        createdAt: 1771401600103
    },
    {
        id: "m-elijah",
        name: "Elijah",
        url: "/models/male_2048/5.jpg",
        gender: "male",
        createdAt: 1771401600104
    },
    {
        id: "m-william",
        name: "William",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_20AM.jpg",
        gender: "male",
        createdAt: 1771401600105
    },
    {
        id: "m-henry",
        name: "Henry",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_22AM.jpg",
        gender: "male",
        createdAt: 1771401600106
    },
    {
        id: "m-lucas",
        name: "Lucas",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_28AM.jpg",
        gender: "male",
        createdAt: 1771401600107
    },
    {
        id: "m-benjamin",
        name: "Benjamin",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_30AM.jpg",
        gender: "male",
        createdAt: 1771401600108
    },
    {
        id: "m-theodore",
        name: "Theodore",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_33AM.jpg",
        gender: "male",
        createdAt: 1771401600109
    },
    {
        id: "m-jack",
        name: "Jack",
        url: "/models/male_2048/Generated-Image-February-19,-2026---8_35AM.jpg",
        gender: "male",
        createdAt: 1771401600110
    }
];
