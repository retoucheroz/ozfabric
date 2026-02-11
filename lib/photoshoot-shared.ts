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
    url: string;
    name: string;
    thumbUrl?: string;
    createdAt: number;
}

export interface SavedPose extends LibraryItem {
    originalThumb: string;
    stickmanUrl: string;
    gender: 'male' | 'female';
    customPrompt?: string;
}

export interface SavedModel extends LibraryItem {
    gender: 'male' | 'female';
}

export interface SavedBackground extends LibraryItem { }

export interface SavedFit extends LibraryItem {
    customPrompt?: string;
}

export interface SavedShoe extends LibraryItem { }

// Pose Library
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
