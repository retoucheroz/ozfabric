export interface LensSpec {
    name: string;
    focalRange: string;
    minFocal: number;
    maxFocal: number;
    apertureRange: string;
    apertures: string[];
    effect: string;
    image?: string;
}

export interface CameraSpec {
    id: string;
    name: string;
    lenses: LensSpec[];
    image?: string;
}

export interface EditorialLocation {
    id: string;
    name: string;
    nameTr: string;
    cities: {
        id: string;
        name: string;
        nameTr: string;
        images: {
            id: string;
            url: string;
            prompt: string; // The embedded prompt for this background
        }[];
    }[];
}

export const CAMERAS: CameraSpec[] = [
    {
        id: "arri-alexa-35",
        name: "ARRI ALEXA 35",
        image: "/camera_control/arri-alexa-35.webp",
        lenses: [
            {
                name: "ARRI Signature Prime",
                focalRange: "18–135mm",
                minFocal: 18,
                maxFocal: 135,
                apertureRange: "T1.8–T8",
                apertures: ["f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "modern, temiz, yumuşak bokeh",
                image: "/camera_control/arri-signature-prime.webp"
            },
            {
                name: "Cooke S4",
                focalRange: "25–100mm",
                minFocal: 25,
                maxFocal: 100,
                apertureRange: "T2–T8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "sıcak tonlar, organik film look",
                image: "/camera_control/cooke-s4.webp"
            },
            {
                name: "Zeiss Ultra Prime",
                focalRange: "20–85mm",
                minFocal: 20,
                maxFocal: 85,
                apertureRange: "T1.9–T11",
                apertures: ["f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "yüksek keskinlik, nötr kontrast",
                image: "/camera_control/zeiss-ultra-prime.webp"
            },
            {
                name: "Hawk V-Lite (anamorphic)",
                focalRange: "35–80mm",
                minFocal: 35,
                maxFocal: 80,
                apertureRange: "T2.2–T11",
                apertures: ["f/2.2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "anamorfik sıkıştırma, sinematik doku",
                image: "/camera_control/hawk-v-lite.webp"
            },
            {
                name: "Soviet Vintage",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f2–f8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "retro karakter, düşük kontrast",
                image: "/camera_control/soviet_vintage.webp"
            },
            {
                name: "Helios",
                focalRange: "50–85mm",
                minFocal: 50,
                maxFocal: 85,
                apertureRange: "f2–f8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "swirl bokeh, vintage etki",
                image: "/camera_control/helios.webp"
            },
        ]
    },
    {
        id: "red-v-raptor",
        name: "RED V-RAPTOR",
        image: "/camera_control/red-v-raptor.webp",
        lenses: [
            {
                name: "Zeiss Master Prime",
                focalRange: "21–150mm",
                minFocal: 21,
                maxFocal: 150,
                apertureRange: "T1.3–T8",
                apertures: ["f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "aşırı keskin, modern dijital",
                image: "/camera_control/zeiss_master_prime.webp"
            },
            {
                name: "Zeiss Ultra Prime",
                focalRange: "18–135mm",
                minFocal: 18,
                maxFocal: 135,
                apertureRange: "T1.9–T11",
                apertures: ["f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "temiz ve kontrastlı",
                image: "/camera_control/zeiss-ultra-prime.webp"
            },
            {
                name: "Canon K-35",
                focalRange: "24–85mm",
                minFocal: 24,
                maxFocal: 85,
                apertureRange: "T1.4–T8",
                apertures: ["f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "klasik film glow",
                image: "/camera_control/canon-k35.webp"
            },
            {
                name: "Panavision C-Series (anamorphic)",
                focalRange: "40–100mm",
                minFocal: 40,
                maxFocal: 100,
                apertureRange: "T2.8–T11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "oval bokeh, flare",
                image: "/camera_control/panavision_c_series.webp"
            },
            {
                name: "Lensbaby",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f1.8–f8",
                apertures: ["f/1.8", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "artistik, yumuşak kenarlar",
                image: "/camera_control/lensbaby.webp"
            },
            {
                name: "Laowa Macro",
                focalRange: "50–100mm",
                minFocal: 50,
                maxFocal: 100,
                apertureRange: "f2.8–f11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "makro detay",
                image: "/camera_control/Laowa-macro.webp"
            },
        ]
    },
    {
        id: "sony-venice",
        name: "SONY VENICE",
        image: "/camera_control/sony-venice.webp",
        lenses: [
            {
                name: "Zeiss Ultra Prime",
                focalRange: "20–135mm",
                minFocal: 20,
                maxFocal: 135,
                apertureRange: "T1.9–T11",
                apertures: ["f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "nötr, profesyonel look",
                image: "/camera_control/zeiss-ultra-prime.webp"
            },
            {
                name: "Canon K-35",
                focalRange: "24–85mm",
                minFocal: 24,
                maxFocal: 85,
                apertureRange: "T1.4–T8",
                apertures: ["f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "vintage sinema hissi",
                image: "/camera_control/canon-k35.webp"
            },
            {
                name: "Panavision Primo",
                focalRange: "24–135mm",
                minFocal: 24,
                maxFocal: 135,
                apertureRange: "T2–T11",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "dengeli sinema estetiği",
                image: "/camera_control/panavision_primo.webp"
            },
            {
                name: "Cooke S4",
                focalRange: "25–100mm",
                minFocal: 25,
                maxFocal: 100,
                apertureRange: "T2–T8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "sıcak, yumuşak geçişler",
                image: "/camera_control/cooke-s4.webp"
            },
            {
                name: "Lensbaby",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f1.8–f8",
                apertures: ["f/1.8", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "dramatik bokeh",
                image: "/camera_control/lensbaby.webp"
            },
        ]
    },
    {
        id: "panavision-dxl2",
        name: "PANAVISION DXL2 / PANAFLEX",
        image: "/camera_control/panavision-millenium_dxl2.webp",
        lenses: [
            {
                name: "Panavision Primo",
                focalRange: "24–135mm",
                minFocal: 24,
                maxFocal: 135,
                apertureRange: "T2–T11",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "temiz film look",
                image: "/camera_control/panavision_primo.webp"
            },
            {
                name: "Hawk V-Lite (anamorphic)",
                focalRange: "35–80mm",
                minFocal: 35,
                maxFocal: 80,
                apertureRange: "T2.2–T11",
                apertures: ["f/2.2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "klasik sinema anamorfik",
                image: "/camera_control/hawk-v-lite.webp"
            },
            {
                name: "Panavision C-Series (anamorphic)",
                focalRange: "40–100mm",
                minFocal: 40,
                maxFocal: 100,
                apertureRange: "T2.8–T11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "güçlü anamorfik karakter",
                image: "/camera_control/panavision_c_series.webp"
            },
            {
                name: "JDC Xtal Xpress",
                focalRange: "40–135mm",
                minFocal: 40,
                maxFocal: 135,
                apertureRange: "T2.8–T11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "agresif flare, sinema dili",
                image: "/camera_control/jdx-xtal-express.webp"
            },
            {
                name: "Laowa Macro",
                focalRange: "50–100mm",
                minFocal: 50,
                maxFocal: 100,
                apertureRange: "f2.8–f11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "konsept & detay çekimleri",
                image: "/camera_control/Laowa-macro.webp"
            },
        ]
    },
    {
        id: "imax-film",
        name: "IMAX FILM CAMERA",
        image: "/camera_control/imax-film-camera.webp",
        lenses: [
            {
                name: "Panavision C-Series (anamorphic)",
                focalRange: "40–100mm",
                minFocal: 40,
                maxFocal: 100,
                apertureRange: "T2.8–T11",
                apertures: ["f/2.8", "f/4", "f/5.6", "f/8", "f/11"],
                effect: "geniş sinema çerçevesi",
                image: "/camera_control/panavision_c_series.webp"
            },
            {
                name: "Soviet Vintage",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f2–f8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "organik grain hissi",
                image: "/camera_control/soviet_vintage.webp"
            },
        ]
    },
    {
        id: "arriflex-16sr",
        name: "ARRIFLEX 16SR (16mm)",
        image: "/camera_control/arriflex_16sr.webp",
        lenses: [
            {
                name: "Helios",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f2–f8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "nostaljik bokeh",
                image: "/camera_control/helios.webp"
            },
            {
                name: "Soviet Vintage",
                focalRange: "35–85mm",
                minFocal: 35,
                maxFocal: 85,
                apertureRange: "f2–f8",
                apertures: ["f/2", "f/2.8", "f/4", "f/5.6", "f/8"],
                effect: "retro film karakteri",
                image: "/camera_control/soviet_vintage.webp"
            },
        ]
    }
];

export const LOCATIONS: EditorialLocation[] = [
    {
        id: "france",
        name: "France",
        nameTr: "Fransa",
        cities: [
            {
                id: "paris",
                name: "Paris",
                nameTr: "Paris",
                images: [
                    { id: "p1", url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800", prompt: "Parisian street with Eiffel Tower in background, cobblestone, chic atmosphere" },
                    { id: "p2", url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800", prompt: "Cafe in Montmartre, Paris, romantic setting, vintage storefront" }
                ]
            },
            {
                id: "nice",
                name: "Nice",
                nameTr: "Nice",
                images: [
                    { id: "n1", url: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&q=80&w=800", prompt: "French Riviera beach in Nice, crystal clear water, promenade" }
                ]
            }
        ]
    },
    {
        id: "italy",
        name: "Italy",
        nameTr: "İtalya",
        cities: [
            {
                id: "rome",
                name: "Rome",
                nameTr: "Roma",
                images: [
                    { id: "r1", url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800", prompt: "Colosseum background in Rome, ancient ruins, sunset" }
                ]
            },
            {
                id: "milan",
                name: "Milan",
                nameTr: "Milano",
                images: [
                    { id: "m1", url: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&q=80&w=800", prompt: "Duomo di Milano square, high fashion capital, luxury background" }
                ]
            }
        ]
    },
    {
        id: "usa",
        name: "USA",
        nameTr: "ABD",
        cities: [
            {
                id: "new-york",
                name: "New York",
                nameTr: "New York",
                images: [
                    { id: "ny1", url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800", prompt: "Times Square New York background, neon lights, busy city atmosphere" },
                    { id: "ny2", url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800", prompt: "Manhattan skyline background, skyscrapers, sunset over New York" }
                ]
            }
        ]
    },
    {
        id: "japan",
        name: "Japan",
        nameTr: "Japonya",
        cities: [
            {
                id: "tokyo",
                name: "Tokyo",
                nameTr: "Tokyo",
                images: [
                    { id: "t1", url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800", prompt: "Shibuya Crossing Tokyo background, futuristic city, neon signs" },
                    { id: "t2", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800", prompt: "Akihabara Tokyo, manga and tech aesthetic, colorful lights" }
                ]
            }
        ]
    }
];
