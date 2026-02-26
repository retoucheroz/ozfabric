import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deductCredits } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, credits: true, role: true } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const POSE_ANALYZE_COST = 20;
        if (user.role !== 'admin' && (user.credits || 0) < POSE_ANALYZE_COST) {
            return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
        }

        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Deduct credits
        if (user.role !== 'admin') {
            await deductCredits(user.id, POSE_ANALYZE_COST, "Pose Analysis");
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY mismatch" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Fetch the image and convert to base64
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const prompt = `
Sen bir yapay zeka fotoğraf poz analiz uzmanısın. Görevin, sana verilen bir model fotoğrafını sadece anatomik duruşu ve poz geometrisi açısından değerlendirmek. Nihai hedefin, bu analizi "Nano Banana Pro" görüntü oluşturma modeline uygun, sadece poz odaklı bir İngilizce prompt öbeği olarak çıktı vermektir.

**Analiz Kuralları:**
1.  **Gövde (Torso):** Omurga hattı (dik, kavisli, eğik), omuzların ve kalçaların göreceli pozisyonları, ağırlık dağılımı.
2.  **Omuzlar (Shoulders):** Asimetri, yükseklik, öne/arkaya açılanma.
3.  **Kollar ve Eller (Arms & Hands):** Dirsek ve bilek eklemlerindeki bükülmeler, kolların vücuda göre konumu, ellerin kolların her birinin pozisyonu (cepte, belde, saçta, ensede, duvarda, arkada, serbest vb.).
4.  **Baş ve Bakış (Head & Gaze):** Başın eğimi, çene pozisyonu, gözlerin odak noktası ve ifade.
5.  **Alt Vücut (Lower Body):** Bacakların duruşu, dizlerin bükülmesi, ayakların pozisyonu (eğer fotoğraf kadrajına dahilse).

**Kullanım Kılavuzu (Bilgi Kaynağı):**
* Analiz sırasında aşağıda verilen "Poz Terminolojisi ve Anatomik Rehber" adlı bilgi kaynağını aktif olarak kullan.
* Mümkün olduğunca bu rehberdeki teknik terimleri ve anatomik tanımları tercih et.
* Örneğin, "bir bacağına yaslanmak" yerine "contrapposto", "kambur durmak" yerine "slouching posture" gibi ifadeler kullan.

**Kısıtlamalar (KESİNLİKLE YAPMA):**
* **Kıyafet veya Stil:** Giysilerden, kumaş yapısından, marka veya aksesuarlardan bahsetme. Sadece elleri bi cepte ya da başka bir etkileşimdeyse ondan bahset. Örneğin sağ eli ön cebinde, sol elinin parmakları saçının aralarında. 
* **Çevre veya Arka Plan:** Arka plan, stüdyo, ışıklandırma, renkler veya mekandan bahsetme.
* **Kadraj veya Kamera Tekniği:** Kamera açısı (close-up, medium shot, wide shot vb.), lens bilgisi, ışıklandırma teknikleri veya görsel efektlerden bahsetme.
* **Modelin Fiziksel Özellikleri:** Modelin cinsiyeti, yaşı, saç rengi, etnik kökeni veya fiziksel çekiciliği gibi özelliklerden bahsetme. Yalnızca pozun mekanik yapısını tanımla.
* **Duygu veya İfade Yorumu:** Modelin yüz ifadesinin "mutlu", "üzgün", "havalı" gibi öznel yorumlarını yapma. 

**Çıktı Formatı:**
* Sadece virgüllerle ayrılmış, tek bir akıcı İngilizce prompt öbeği üret.
* Prompt öbeği tamamen pozun anatomik ve geometrik tanımlarına odaklanmalı ve "Nano Banana Pro" modelinin anlayacağı sade ve direkt bir dil kullanmalı.
* Cümleler kısa, net ve betimleyici olmalı.

**Örnek İdeal Çıktı:**
contrapposto stance, one hip jutted out, left arm casually bent at elbow, right hand tucked into pocket, head slightly tilted, shoulders asymmetrical

**Poz Terminolojisi ve Anatomik Rehber**
1. Gövde ve Omurga (Torso & Spine):
    * Contrapposto: Ağırlığın bir bacağa verildiği, kalçaların ve omuzların zıt açılara sahip olduğu klasik, doğal duruş.
    * S-Curve: Omurganın veya vücudun yan hattının oluşturduğu kıvrımlı, estetik "S" şekli.
    * C-Curve: Omurganın veya vücudun yan hattının oluşturduğu "C" şekli, genellikle hafifçe kambur veya yana eğik duruşlarda görülür.
    * Slouching Posture: Omuzların öne doğru yuvarlandığı, omurganın hafif kambur olduğu gevşek, rahat duruş.
    * Upright Posture: Omurganın dik ve hizalı olduğu duruş.
    * Leaning Forward/Backward: Gövdenin ağırlık merkezinin öne veya arkaya doğru kaydırılması.
    * Torso Twist: Gövdenin alt kısmının bir yöne, üst kısmının ise farklı bir yöne dönmesi.
    * Hip Jutted/Popped: Bir kalçanın yana doğru belirgin şekilde dışarı doğru çıkması.
2. Omuzlar ve Boyun (Shoulders & Neck):
    * Shrugged Shoulders: Omuzların yukarı, kulaklara doğru kaldırılması.
    * Dropped/Dipped Shoulder: Bir omzun diğerine göre belirgin şekilde aşağıda durması.
    * Asymmetrical Shoulders: Omuzların farklı yüksekliklerde veya açılarda olması.
    * Forward Rolled Shoulders: Omuzların hafifçe öne doğru yuvarlanması.
    * Head Tilt: Başın sağa veya sola doğru yana eğilmesi.
    * Chin Tuck: Çenenin hafifçe boyna doğru çekilmesi.
    * Chin Up/Extended: Çenenin yukarı doğru kaldırılması.
    * Neck Elongated: Boynun uzatılmış görünümü.
3. Kollar ve Eller (Arms & Hands):
    * Elbow Flexion: Dirseğin bükülme derecesi (örn: "elbow bent at 90 degrees").
    * Straight Arm: Kolun dirsekten tamamen gergin olması.
    * Relaxed Arm: Kolun vücudun yanında doğal ve gerginliksiz durması.
    * Arm Akimbo: Elin kalçaya yerleştirilmesiyle dirseğin dışarı doğru açıldığı poz.
    * Hands on Hips: Ellerin kalçalara yerleştirilmesi.
    * Hands in Pockets: Ellerin ceplere sokulması.
    * Interlocked Fingers: Parmakların birbirine geçmesi.
    * Resting Hands: Ellerin ön planda bir yere (masa, diz vb.) serbestçe yerleştirilmesi.
    * Arm Crossed: Kolların göğüs üzerinde çaprazlanması.
    * Arm Extended: Kolun bir yöne doğru uzatılması.
4. Baş ve Bakış (Head & Gaze):
    * Direct Gaze/Eye Contact: Gözlerin doğrudan kameraya veya izleyiciye bakması.
    * Neutral Gaze: Yüzde belirgin bir ifade olmayan, sakin bakış.
    * Looking Away: Gözlerin kameradan farklı bir yöne bakması.
    * Downcast Gaze: Gözlerin aşağı doğru bakması.
    * Head Turned: Başın tamamen bir yöne doğru çevrilmesi.
5. Alt Vücut ve Bacaklar (Lower Body & Legs):
    * Crossed Legs (at knee/ankle): Bacakların dizden veya bilekten çaprazlanması.
    * Knee Bent/Flexed: Dizlerin hafifçe bükülmesi.
    * Weight on One Leg: Vücut ağırlığının tek bir bacağa verilmesi.
    * Feet Apart/Together: Ayakların açık veya kapalı durması.
    * Toe Pointed: Ayak parmaklarının uzatılması.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg" // Assuming jpeg for simplicity, or we can detect
                }
            }
        ]);

        const text = result.response.text();
        console.log("Pose Analysis Result:", text);

        return NextResponse.json({ description: text.trim() });

    } catch (error: any) {
        console.error("Pose analysis error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
