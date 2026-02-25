// Batch Generation Helper Functions for Photoshoot (Trigger Redeploy)

export interface BatchSpec {
    view: string;
    pose: string;
    dynamic: boolean;
    lookAtCamera: boolean;
    hairBehind: boolean;
    camera: {
        shot_type: string;
        framing: string;
        angle: string;
    };
    assets: string[]; // 'front', 'back', or both
    fitDescriptionMode?: 'full' | 'first_sentence_only'; // Control fit description length
    excludeHairInfo?: boolean; // Exclude hair info from prompt
    excludeSocksInfo?: boolean; // Exclude socks info from prompt
    excludeShoesAsset?: boolean; // Don't send shoes asset to API
    excludeBeltAsset?: boolean; // Don't send belt asset
    excludeHatAsset?: boolean; // Don't send hat asset
    excludeBagAsset?: boolean; // Don't send bag asset
    excludeAllAccessories?: boolean; // Strip ALL accessories (belt, bag, hat, glasses, jewelry) from API & prompt
    enableWind?: boolean; // Subtle airflow toggle
    isStyling?: boolean; // Flag to identify styling shots
    includeGlasses?: boolean; // Include glasses for this shot
    includeBag?: boolean; // Include bag for this shot
    includeHat?: boolean; // Include hat for this shot
    includeJewelry?: boolean; // Include jewelry for this shot
    includeJacket?: boolean; // Include jacket for this shot
    useStickman?: boolean; // Only use stickman for specific shots
}

interface SavedPose {
    // ... existing SavedPose ...
}

export function buildBatchSpecs(
    workflowType: 'upper' | 'lower' | 'dress' | 'set',
    upperFraming: 'full' | 'medium_full',
    poseLibraryPrompt: string | null,
    hairBehindShoulders: boolean,
    genderVal: 'male' | 'female',
    savedPoses: SavedPose[],
    angledPosePrompt: string | null,
    enableWind: boolean
): BatchSpec[] {
    const getRandomPose = (type: 'random' | 'angled'): string => {
        // ... existing implementation ...
        const poses = type === 'random'
            ? (genderVal === 'female'
                ? ["Standing with one hand on hip, weight shifted to left leg", "Hands in pockets, relaxed stance", "Arms crossed casually", "One hand touching hair"]
                : ["Standing with hands in pockets, shoulders relaxed", "Arms at sides, weight on one leg", "One hand in pocket, other relaxed", "Hands clasped in front"])
            : (genderVal === 'female'
                ? ["Body rotated 45 degrees to the right, looking over shoulder", "Three-quarter turn to the left, hands on hips", "Slight rotation showing side profile"]
                : ["Body rotated 45 degrees to the right, looking at camera", "Three-quarter turn to the left, hands in pockets", "Slight rotation showing side profile"]);
        return poses[Math.floor(Math.random() * poses.length)];
    };

    if (workflowType === 'upper') {
        return [
            // 1. Styling Front
            {
                view: "styling_front",
                pose: poseLibraryPrompt || getRandomPose('random'),
                dynamic: true,
                lookAtCamera: true,
                hairBehind: hairBehindShoulders,
                camera: {
                    shot_type: upperFraming === 'full' ? 'full_body' : 'cowboy_shot',
                    framing: upperFraming === 'full' ? 'head_to_toe' : 'cowboy_shot',
                    angle: "front"
                },
                assets: ['front'],
                fitDescriptionMode: 'full',
                enableWind: enableWind,
                isStyling: true,
                includeGlasses: true, // Only for first styling shot
                useStickman: true, // ONLY for the first shot
                excludeShoesAsset: upperFraming === 'medium_full'
            },
            // ... rest of the array (no useStickman: true)

            // 2. Styling Angled
            {
                view: "styling_angled",
                pose: angledPosePrompt || getRandomPose('angled'),
                dynamic: true,
                lookAtCamera: false,
                hairBehind: hairBehindShoulders,
                camera: {
                    shot_type: 'full_body',
                    framing: 'head_to_toe',
                    angle: "angled"
                },
                assets: ['front', 'back'],
                fitDescriptionMode: 'full',
                isStyling: true,
                useStickman: true,
                excludeShoesAsset: false
            },
            // 3. Styling Front (Second Pose from Library)
            {
                view: "styling_front_2",
                pose: poseLibraryPrompt || getRandomPose('random'),
                dynamic: true,
                lookAtCamera: true,
                hairBehind: hairBehindShoulders,
                camera: {
                    shot_type: 'full_body',
                    framing: 'head_to_toe',
                    angle: "front"
                },
                assets: ['front'],
                fitDescriptionMode: 'full',
                enableWind: enableWind,
                isStyling: true,
                useStickman: true,
                excludeShoesAsset: false
            },
            // 4. Technical Back (Cowboy Shot - Only technical shot)
            {
                view: "technical_back",
                pose: "Standing perfectly straight, back directly to camera, arms at sides. The upper garment hangs straight and smooth over the pants without any wrinkles, folds, or curling at the hemline. Hem is completely flat and horizontal.",
                dynamic: false,
                lookAtCamera: false,
                hairBehind: true,
                camera: { shot_type: 'cowboy_shot', framing: 'cowboy_shot', angle: "back" },
                assets: ['back'],
                fitDescriptionMode: 'full',
                excludeHairInfo: true,
                excludeShoesAsset: true, // User request
                excludeHatAsset: true, // User request
                excludeBeltAsset: true, // User request
                isStyling: false
            },
            // 5. Close-Up Front (Face to Chest)
            {
                view: "closeup_front",
                pose: "Close-up fashion photography shot, focusing on the collar and face area. Model is standing perfectly straight, facing the camera directly, arms at sides. Neutral expression, direct eye contact.",
                dynamic: false,
                lookAtCamera: true,
                hairBehind: hairBehindShoulders,
                camera: { shot_type: 'close_up', framing: 'chest_and_face', angle: "front" },
                assets: ['front'],
                fitDescriptionMode: 'full',
                isStyling: false
            }
        ];
    } else {
        // LOWER BODY / DRESS / SET
        return [
            // 1. Styling Front
            {
                view: "styling_front",
                pose: poseLibraryPrompt || getRandomPose('random'),
                dynamic: true,
                lookAtCamera: true,
                hairBehind: hairBehindShoulders,
                camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "front" },
                assets: ['front'],
                fitDescriptionMode: 'full',
                enableWind: enableWind,
                isStyling: true,
                includeGlasses: true, // Only for first styling shot
                useStickman: true // ONLY for the first shot
            },
            // 2. Styling Angled
            {
                view: "styling_angled",
                pose: angledPosePrompt || getRandomPose('angled'),
                dynamic: true,
                lookAtCamera: false,
                hairBehind: hairBehindShoulders,
                camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "angled" },
                assets: ['front', 'back'],
                fitDescriptionMode: 'full',
                enableWind: enableWind,
                isStyling: true,
                useStickman: true // Allow stickman
            },
            // 3. Technical Front — NO ACCESSORIES
            {
                view: "technical_front",
                pose: "Standing straight, arms at sides, neutral stance. Professional studio photography.",
                dynamic: false,
                lookAtCamera: true,
                hairBehind: true,
                camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "front" },
                assets: ['front'],
                fitDescriptionMode: 'full',
                excludeAllAccessories: true,
                isStyling: false
            },
            // 4. Technical Back — NO ACCESSORIES
            {
                view: "technical_back",
                pose: "Standing straight, back to camera, arms at sides. Professional studio photography.",
                dynamic: false,
                lookAtCamera: false,
                hairBehind: true,
                camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "back" },
                assets: ['back'],
                fitDescriptionMode: 'full',
                excludeHairInfo: true,
                excludeAllAccessories: true,
                isStyling: false
            },
            // 4.5. Technical 3/4 Front — NO ACCESSORIES
            {
                view: "technical_threequarter_front",
                pose: "upright posture, three-quarter profile view facing right, shoulders level and relaxed, natural shoulder alignment, arms resting straight along the sides, hands relaxed with fingers slightly curved, no hand-to-body interaction, weight subtly distributed with slight emphasis on rear leg, neutral balanced stance, feet parallel and slightly apart, knees softly extended, neutral gaze directed forward in profile direction, head aligned with spine, chin neutral, elongated neck line",
                dynamic: false,
                lookAtCamera: false,
                hairBehind: true,
                camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "angled" },
                assets: ['front', 'back'],
                fitDescriptionMode: 'full',
                excludeAllAccessories: true,
                isStyling: false
            },
            // 5. Detail Front
            {
                view: "detail_front",
                pose: "Close-Up fashion photography detail shot. Camera framing is waist-to-knees. Standing straight.",
                dynamic: false,
                lookAtCamera: true,
                hairBehind: true,
                camera: { shot_type: 'close_up', framing: 'waist_to_above_knees', angle: "front" },
                assets: ['front'],
                fitDescriptionMode: 'first_sentence_only',
                excludeHairInfo: true,
                excludeSocksInfo: true,
                excludeShoesAsset: true,
                excludeBeltAsset: true,
                isStyling: false
            },
            // 6. Detail Back
            {
                view: "detail_back",
                pose: "Close-Up fashion photography back detail shot. Camera framing is waist-to-knees. Standing straight, back to camera.",
                dynamic: false,
                lookAtCamera: false,
                hairBehind: true,
                camera: { shot_type: 'close_up', framing: 'waist_to_above_knees', angle: "back" },
                assets: ['back'],
                fitDescriptionMode: 'first_sentence_only',
                excludeHairInfo: true,
                excludeSocksInfo: true,
                excludeShoesAsset: true,
                excludeBeltAsset: true,
                isStyling: false
            }
        ];
    }
}

export function buildStandardBatchSpecs(
    hairBehindShoulders: boolean,
    genderVal: 'male' | 'female',
    poseLibraryPrompt: string | null,
    stylingSideOnly: Record<string, boolean>,
    enableWind: boolean,
    savedPoses: any[]
): BatchSpec[] {
    const getRandomPose = (type: 'random' | 'angled'): string => {
        // Try to get from library first
        const libraryPoses = savedPoses.filter(p =>
            p.gender === genderVal &&
            (type === 'random' || (p.tags && p.tags.includes('yan_aci')))
        );

        if (libraryPoses.length > 0) {
            return libraryPoses[Math.floor(Math.random() * libraryPoses.length)].customPrompt;
        }

        const poses = type === 'random'
            ? (genderVal === 'female'
                ? ["Standing with one hand on hip, weight shifted to left leg", "Hands in pockets, relaxed stance", "Arms crossed casually", "One hand touching hair"]
                : ["Standing with hands in pockets, shoulders relaxed", "Arms at sides, weight on one leg", "One hand in pocket, other relaxed", "Hands clasped in front"])
            : (genderVal === 'female'
                ? ["Body rotated 45 degrees to the right, looking over shoulder", "Three-quarter turn to the left, hands on hips", "Slight rotation showing side profile"]
                : ["Body rotated 45 degrees to the right, looking at camera", "Three-quarter turn to the left, hands in pockets", "Slight rotation showing side profile"]);
        return poses[Math.floor(Math.random() * poses.length)];
    };

    return [
        {
            view: "std_styling_full",
            pose: poseLibraryPrompt ? poseLibraryPrompt : (stylingSideOnly["std_styling_full"] ? getRandomPose('angled') : getRandomPose('random')),
            dynamic: true,
            lookAtCamera: !stylingSideOnly["std_styling_full"],
            hairBehind: hairBehindShoulders,
            camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: stylingSideOnly["std_styling_full"] ? "angled" : "front" },
            assets: stylingSideOnly["std_styling_full"] ? ['front', 'back'] : ['front'],
            fitDescriptionMode: 'full',
            enableWind: enableWind,
            isStyling: true,
            useStickman: true,
            includeGlasses: true
        },
        {
            view: "std_styling_upper",
            pose: poseLibraryPrompt ? poseLibraryPrompt : (stylingSideOnly["std_styling_upper"] ? getRandomPose('angled') : getRandomPose('random')),
            dynamic: true,
            lookAtCamera: !stylingSideOnly["std_styling_upper"],
            hairBehind: hairBehindShoulders,
            camera: { shot_type: 'cowboy_shot', framing: 'cowboy_shot', angle: stylingSideOnly["std_styling_upper"] ? "angled" : "front" },
            assets: stylingSideOnly["std_styling_upper"] ? ['front', 'back'] : ['front'],
            fitDescriptionMode: 'full',
            enableWind: enableWind,
            isStyling: true,
            useStickman: true, // Allow stickman
            excludeShoesAsset: true
        },
        {
            view: "std_tech_full_front",
            pose: "Standing straight, arms at sides, neutral stance. Professional studio photography.",
            dynamic: false,
            lookAtCamera: true,
            hairBehind: true,
            camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "front" },
            assets: ['front'],
            fitDescriptionMode: 'full',
            isStyling: false
        },
        {
            view: "std_tech_full_back",
            pose: "Standing straight, back to camera, arms at sides. Professional studio photography.",
            dynamic: false,
            lookAtCamera: false,
            hairBehind: true,
            camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "back" },
            assets: ['back'],
            fitDescriptionMode: 'full',
            excludeHairInfo: true,
            isStyling: false
        },
        {
            view: "std_tech_threequarter_front",
            pose: "upright posture, three-quarter profile view facing right, shoulders level and relaxed, natural shoulder alignment, arms resting straight along the sides, hands relaxed with fingers slightly curved, no hand-to-body interaction, weight subtly distributed with slight emphasis on rear leg, neutral balanced stance, feet parallel and slightly apart, knees softly extended, neutral gaze directed forward in profile direction, head aligned with spine, chin neutral, elongated neck line",
            dynamic: false,
            lookAtCamera: false,
            hairBehind: true,
            camera: { shot_type: 'full_body', framing: 'head_to_toe', angle: "angled" },
            assets: ['front', 'back'],
            fitDescriptionMode: 'full',
            excludeAllAccessories: true,
            isStyling: false
        },
        {
            view: "std_tech_upper_front",
            pose: "Standing straight, arms at sides, neutral stance. Cowboy shot.",
            dynamic: false,
            lookAtCamera: true,
            hairBehind: true,
            camera: { shot_type: 'cowboy_shot', framing: 'cowboy_shot', angle: "front" },
            assets: ['front'],
            fitDescriptionMode: 'full',
            excludeShoesAsset: true,
            isStyling: false
        },
        {
            view: "std_tech_upper_back",
            pose: "Standing straight, back to camera, arms at sides. Cowboy shot.",
            dynamic: false,
            lookAtCamera: false,
            hairBehind: true,
            camera: { shot_type: 'cowboy_shot', framing: 'cowboy_shot', angle: "back" },
            assets: ['back'],
            fitDescriptionMode: 'full',
            excludeHairInfo: true,
            excludeShoesAsset: true,
            isStyling: false
        },
        {
            view: "std_detail_front",
            pose: "Close-Up fashion photography detail shot. Camera framing is waist-to-knees. Standing straight.",
            dynamic: false,
            lookAtCamera: true,
            hairBehind: true,
            camera: { shot_type: 'close_up', framing: 'waist_to_above_knees', angle: "front" },
            assets: ['front'],
            fitDescriptionMode: 'first_sentence_only',
            excludeHairInfo: true,
            excludeSocksInfo: true,
            excludeShoesAsset: true,
            isStyling: false
        },
        {
            view: "std_detail_back",
            pose: "Close-Up fashion photography back detail shot. Camera framing is waist-to-knees. Standing straight, back to camera.",
            dynamic: false,
            lookAtCamera: false,
            hairBehind: true,
            camera: { shot_type: 'close_up', framing: 'waist_to_above_knees', angle: "back" },
            assets: ['back'],
            fitDescriptionMode: 'first_sentence_only',
            excludeHairInfo: true,
            excludeSocksInfo: true,
            excludeShoesAsset: true,
            isStyling: false
        },
        {
            view: "std_closeup_front",
            pose: "Close-up fashion photography shot, focusing on the collar and face area. Model is standing perfectly straight.",
            dynamic: false,
            lookAtCamera: true,
            hairBehind: hairBehindShoulders,
            camera: { shot_type: 'close_up', framing: 'chest_and_face', angle: "front" },
            assets: ['front'],
            fitDescriptionMode: 'full',
            excludeShoesAsset: true,
            excludeBagAsset: true,
            isStyling: false
        }
    ];
}

export async function extractDominantColor(imageUrl: string): Promise<string> {
    try {
        const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!geminiKey) {
            console.warn("GEMINI_API_KEY missing, using fallback color");
            return "#8B4513";
        }

        // Fetch image and convert to base64
        const imageRes = await fetch(imageUrl);
        const imageBlob = await imageRes.blob();
        const base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(imageBlob);
        });

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const result = await model.generateContent([
            "Analyze this garment image and extract the DOMINANT color of the main product (not background, not model skin). Return ONLY a hex color code in format #RRGGBB. Example: #2E5C8A",
            {
                inlineData: {
                    data: base64Image,
                    mimeType: imageBlob.type
                }
            }
        ]);

        const response = await result.response;
        const text = response.text().trim();
        const hexMatch = text.match(/#[0-9A-Fa-f]{6}/);
        return hexMatch ? hexMatch[0] : "#8B4513";
    } catch (e) {
        console.error("Color extraction error:", e);
        return "#8B4513";
    }
}

export function generateColorPaletteSVG(color: string, productCode: string): string {
    const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="${color}"/><rect y="250" width="300" height="50" fill="rgba(0,0,0,0.6)"/><text x="150" y="275" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">${productCode}</text><text x="150" y="30" text-anchor="middle" fill="white" font-size="12" opacity="0.8">Color Palette</text><text x="150" y="50" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="monospace">${color.toUpperCase()}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}
