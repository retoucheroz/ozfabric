import { GoogleGenerativeAI } from "@google/generative-ai";
import { GarmentAnalysisResult, SlotKey } from "@/types/garment";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ANALYSIS_PROMPT = `
Sen bir moda ürünü sınıflandırma uzmanısın.
Sana beyaz veya şeffaf arka planlı bir ürün fotoğrafı göndereceğim.
Görsel tam ürün fotoğrafı veya yakın plan detay çekimi olabilir — ikisi de geçerlidir.

Görseli analiz edip SADECE aşağıdaki JSON formatında yanıt ver.
Başka hiçbir şey yazma, açıklama yapma, markdown kullanma.

{
  "slotKey": "<aşağıdaki değerlerden TAM OLARAK biri>",
  "productType": "<türkçe ürün tipi>",
  "confidence": <0 ile 100 arasında tam sayı>
}

=== DETAY ÇEKİMİ TANIMI ===
Detay çekimi: Bir ürünün belirli bir bölgesinin yakın plan fotoğrafı.
Örnekler: yaka yakın plan, cep yakın plan, etiket yakın plan, düğme yakın plan, kumaş dokusu, bel bölgesi.
Görsel karenin büyük bölümünü tek bir ürün parçası dolduruyorsa ve ürünün tamamı görünmüyorsa → detay çekimidir.

=== SLOT KARAR KURALLARI ===

**"çorap"**
Her türlü çorap: kısa çorap, uzun çorap, spor çorap, ince çorap.

**"ayakkabı"**
Her türlü ayakkabı, bot, sandalet, terlik.
Tek görsel içinde çok açı (üst/yan/taban) olsa bile → "ayakkabı".

**"kemer"**
Her türlü kemer. Görselde birden fazla kemer olsa bile → "kemer".

**"çanta"**
El çantası, omuz çantası, sırt çantası, clutch, tote.

**"gözlük"**
Güneş gözlüğü, numaralı gözlük.

**"şapka"**
Kep, bere, fötr, bucket hat, kasket.

**"takılar"**
Kolye, bileklik, küpe, yüzük, saat, broş.

**"dış_giyim"**
Mont, kaban, trençkot, deri ceket, blazer, yağmurluk, hırka, overshirt.
OVERSHIRT: Kalın/yapılandırılmış kumaşlı, dış katman olarak giyilen düğmeli üst.
Gömlekten farkı: Kumaş belirgin şekilde kalın/sert, dışarı giyilmek üzere tasarlanmış.

**"üst_ön"**
Gömlek, tişört, bluz, kazak, sweatshirt, atlet — TAM ÜRÜN, ÖNDEN.
ÖN işaretleri:
- Düğme patı tam ortada dikey uzanıyor → ÖN
- Göğüs cebi sol üstte görünüyor → ÖN
- Yaka önden görünüyor, iç yüzey görünmüyor → ÖN
- Yan dikişler öne doğru dönük → ÖN

**"üst_arka"**
Gömlek, tişört, bluz, kazak, sweatshirt, atlet — TAM ÜRÜN, ARKADAN.
ARKA işaretleri:
- Beden/yıkama/marka etiketi görünüyor → ARKA (en güçlü ipucu)
- Sırt ortasında dikey dikiş → ARKA
- Yaka içi görünüyor (kıvrılmış, iç yüzey açıkta) → ARKA
- Yan dikişler arkaya doğru dönük → ARKA
KOLSUZ ATLET/BLUZ:
- Yaka daha derin/açık → ÖN
- Yaka daha kapalı/yüksek → ARKA
- Omuz dikişleri arkaya kaçık → ARKA
- Hiçbir ipucu yoksa → "üst_ön", confidence: 55

**"üst_detay_ön"**
Üst giysinin ön bölgesinin YAKIN PLAN detay çekimi.
Örnekler: yaka ön detay, göğüs cebi detay, düğme detay, ön kumaş dokusu, kolun ön yüzü.
KARAR: Üst giyime ait detay çekimi VE ön/iç yüzey görünüyorsa → "üst_detay_ön".

**"üst_detay_arka"**
Üst giysinin arka bölgesinin YAKIN PLAN detay çekimi.
Örnekler: yaka arka/iç detay, sırt dikişi detay, etiket detay, arka kumaş dokusu, kolun arka yüzü.
KARAR: Üst giyime ait detay çekimi VE arka/etiket bölgesi görünüyorsa → "üst_detay_arka".

**"alt_ön"**
Pantolon, etek, şort, tayt — TAM ÜRÜN, ÖNDEN.
ÖN işaretleri:
- Fermuar görünüyor → ÖN (en güçlü ipucu)
- Metal düğme veya kanca üst ortada → ÖN
- Ön cep ağzı iki yanda görünüyor → ÖN

**"alt_arka"**
Pantolon, etek, şort, tayt — TAM ÜRÜN, ARKADAN.
ARKA işaretleri:
- Deri/kumaş marka patch etiketi görünüyor → ARKA (en güçlü ipucu)
- Arka cep(ler) görünüyor → ARKA
- Arka ceplerde dekoratif dikiş deseni → ARKA
- Fermuar yok, arka orta dikiş belirgin → ARKA

**"alt_detay_ön"**
Alt giysinin ön bölgesinin YAKIN PLAN detay çekimi.
Örnekler: bel+fermuar yakın plan, ön cep detay, paça ön detay, ön kumaş dokusu.
KARAR: Alt giyime ait detay çekimi VE fermuar/ön cep/ön bel bölgesi görünüyorsa → "alt_detay_ön".

**"alt_detay_arka"**
Alt giysinin arka bölgesinin YAKIN PLAN detay çekimi.
Örnekler: marka etiket yakın plan, arka cep detay, arka bel detay, paça arka detay.
KARAR: Alt giyime ait detay çekimi VE marka etiketi/arka cep/arka bel bölgesi görünüyorsa → "alt_detay_arka".

**"iç_giyim"**
İç çamaşırı, sütyen, boxer, külot, mayo, bikini.
İnce/dantel/elastik kumaş, minimal tasarım.

=== KARAR AĞACI ===

1. Çorap mı? → "çorap"
2. Ayakkabı mı? → "ayakkabı"
3. Kemer mi? → "kemer"
4. Çanta mı? → "çanta"
5. Gözlük mü? → "gözlük"
6. Şapka mı? → "şapka"
7. Takı mı? → "takılar"
8. Dış giyim mi? (mont, kaban, blazer, overshirt) → "dış_giyim"
9. Alt giyim mi? (pantolon, etek, şort)
   - TAM ÜRÜN + fermuar/ön cep → "alt_ön"
   - TAM ÜRÜN + marka etiketi/arka cep → "alt_arka"
   - DETAY ÇEKİMİ + fermuar/ön cep/ön bel → "alt_detay_ön"
   - DETAY ÇEKİMİ + marka etiketi/arka cep/arka bel → "alt_detay_arka"
10. Üst giyim mi? (gömlek, tişört, kazak, atlet)
    - TAM ÜRÜN + düğme patı/göğüs cebi önde → "üst_ön"
    - TAM ÜRÜN + beden etiketi/sırt dikişi → "üst_arka"
    - DETAY ÇEKİMİ + ön yüzey/yaka dışı → "üst_detay_ön"
    - DETAY ÇEKİMİ + etiket/yaka içi/sırt → "üst_detay_arka"
11. Minimal iç giyim → "iç_giyim"
`;

const VALID_SLOTS: SlotKey[] = [
    "üst_ön", "üst_arka", "üst_detay_ön", "üst_detay_arka",
    "alt_ön", "alt_arka", "alt_detay_ön", "alt_detay_arka",
    "iç_giyim", "ayakkabı", "çorap", "dış_giyim",
    "çanta", "gözlük", "şapka", "takılar", "kemer",
];

export async function analyzeGarmentImage(
    imageBase64: string,
    mimeType: string
): Promise<GarmentAnalysisResult> {
    // Use gemini-2.5-flash-lite as requested.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    try {
        const result = await model.generateContent([
            ANALYSIS_PROMPT,
            { inlineData: { mimeType, data: imageBase64 } },
        ]);

        const responseText = result.response.text().trim();
        const clean = responseText.replace(/```json|```/g, "").trim();

        let parsed: GarmentAnalysisResult;
        try {
            parsed = JSON.parse(clean);
        } catch {
            console.error("Gemini JSON parse hatası:", responseText);
            throw new Error("Gemini geçersiz JSON döndürdü");
        }

        if (!VALID_SLOTS.includes(parsed.slotKey)) {
            // Find closest slot or default
            console.warn(`Geçersiz slotKey: ${parsed.slotKey}`);
        }

        return parsed;
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
}
