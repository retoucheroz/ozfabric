export const PRICING_PLANS = [
    {
        id: "free",
        name: "Free Trial",
        nameTr: "Ücretsiz Deneme",
        price: "0",
        credits: 50,
        description: "Get started with basic features.",
        descriptionTr: "Platformu keşfetmek için başlangıç paketi.",
        features: ["50 Credits (Free)", "Standard Models", "720p Resolution", "Community Support"],
        featuresTr: ["50 Ücretsiz Kredi", "Standart Modeller", "720p Çözünürlük", "Topluluk Desteği"],
        highlight: false
    },
    {
        id: "pro",
        name: "Pro Plan",
        nameTr: "Pro Plan",
        price: "29",
        credits: 3500,
        description: "Perfect for professional creators.",
        descriptionTr: "Profesyonel içerik üreticileri için.",
        features: ["3,500 Credits/Mo", "All Pro Models", "4K Ultra HD", "Commercial License", "Priority Processing"],
        featuresTr: ["3.500 Kredi/Ay", "Tüm Pro Modeller", "4K Ultra HD", "Ticari Lisans", "Öncelikli İşleme"],
        highlight: true
    },
    {
        id: "business",
        name: "Business",
        nameTr: "Business",
        price: "99",
        credits: 12000,
        description: "For agencies and growing teams.",
        descriptionTr: "Ajanslar ve büyüyen ekipler için.",
        features: ["12,000 Credits/Mo", "API Access", "Team Management", "Dedicated Support", "High-speed Rendering"],
        featuresTr: ["12.000 Kredi/Ay", "API Erişimi", "Ekip Yönetimi", "Özel Destek", "Yüksek Hızlı Rendering"],
        highlight: false
    },
];

export const CREDIT_PACKS = [
    { credits: 500, price: "$5", label: "Starter" },
    { credits: 1100, price: "$10", label: "Basic" }, // 10% bonus
    { credits: 6000, price: "$50", label: "Pro" },   // 20% bonus
    { credits: 13000, price: "$100", label: "Ultra" }, // 30% bonus
];

export const SERVICE_COSTS = {
    IMAGE_GENERATION: {
        NANO_BANANA_PRO_1_2K: 50, // 1024x1024 to 2048x2048 (implied)
        NANO_BANANA_PRO_4K: 100,  // 2160x3840
        FACE_SWAP_1_2K: 70,
        FACE_SWAP_4K: 140,
        GHOST_MODEL_1_2K: 75,
        GHOST_MODEL_4K: 150,
        UPSCALER_PER_MP: 10,
        EDITORIAL_ANALYZE: 20,
    },
    VIDEO_GENERATION: {
        KLING_3_SOUND_OFF: 75, // per second
        KLING_3_SOUND_ON: 115,  // per second
        KLING_3_VOICE_CONTROL: 135, // per second
        KLING_2_5_5SEC: 115, // fixed for 5 sec?
        KLING_2_5_EXTRA_SEC: 25,
    },
};
