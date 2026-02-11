# Photoshoot Sayfası Mimari ve İşleyiş Dokümantasyonu (Ultra Detaylı)

Bu doküman, Ozfabric Photoshoot sayfasının arka plandaki çalışma mantığını, API veri alışverişini, prompt mühendisliğini ve Mavi EU toplu üretim sürecini detaylandırır.

---

## 1. Ürün Grubu ve İş Akışı (Workflow) Belirleme

Sistem, kullanıcının seçtiği veya analiz sonucunda gelen ürün adındaki anahtar kelimelere göre 4 temel iş akışından birini belirler:

*   **Upper (Üst Giyim):** Tişört, gömlek, ceket, sweatshirt vb.
*   **Lower (Alt Giyim):** Pantolon, şort, etek, tayt vb.
*   **Dress (Tam Boy):** Elbise, tulum, kaban, palto vb.
*   **Set (Takım):** Pijama takımı, eşofman takımı, bikini seti vb.

**Otomatik Tespit Mekanizması:**
`productName` değiştiğinde bir `useEffect` tetiklenir ve kelime listesine (`pantolon`, `etek`, `elbise` vb.) göre `workflowType` ayarlanır. Kullanıcı bu seçimi manuel olarak da değiştirebilir.

---

## 2. API'ye Gönderilen Görsel Mantığı

API'ye gönderilen görseller, tarayıcı belleğinde (RAM) tutulan **High-Res (2048px/1024px)** versiyonlardır. 

### Hangi Durumda Hangi Görsel Gider?
*   **Ana Model:** `uploadedImages.model` olarak her zaman gider.
*   **Ürün Görselleri:** 
    *   `main_product`: Basit modda ürün görseli.
    *   `top_front / top_back`: Üst segment iş akışlarında.
    *   `bottom_front / bottom_back`: Alt segment iş akışlarında.
    *   `inner_wear`: İç giyim seçiliyse.
    *   `jacket / bag / glasses / hat / belt`: Aksesuar olarak seçildiyse.
*   **Detay Görselleri:** `detail_front_1..4` ve `detail_back_1..4` kolektif analiz sırasında ve detay çekimlerinde kullanılır.
*   **Pose (Önemli):** Kullanıcının yüklediği **orijinal poz görseli API'ye asla ham olarak gönderilmez.** Bunun yerine, ControlNet'in doku sızdırmasını önlemek için sadece `poseStickman` (iskelet yapısı) gönderilir.

---

## 3. Analiz ve Prompt Dönüşümü

Sistem iki aşamalı bir analiz süreci yürütür:

### A. Kolektif Ürün Analizi (Gemini)
Gemini 1.5 Pro, yüklenen tüm ürün ve detay görsellerine bakarak şu JSON yapısını döndürür:
*   `visualPrompt`: Kumaş dokusu, rengi, deseni ve teknik detayları.
*   `fitDescription`: Ürünün kalıbı (Slim, Oversize vb.).
*   `closureType`: Düğmeli mi, fermuarlı mı (Otomatik tespit).
*   `productName`: Eğer girilmediyse ürünün adı.

### B. Prompt İnşası (convertStructuredToText)
API tarafında, gelen tüm parametreler bir `structuredPrompt` objesinde toplanır. Bu obje daha sonra şu hiyerarşiyle metne çevrilir:

1.  **[LOCKED_PRODUCT_CONSTRAINTS]:** En yüksek öncelikli bloktur. Modelin kıyafeti değiştirmesini engellemek için kumaş, doku ve kalıp bilgilerini "final" olarak işaretler.
2.  **[POSE_GEOMETRY_ONLY]:** Modelin biyomekanik duruşunu (biomechanics) tarif eder.
3.  **STYLING & ENVIRONMENT:** Işıklandırma, kadraj ve katman (layering) bilgilerini içerir.

---

## 4. Kadraj (Framing) Mantığı

Kadrajlar, `workflowType` ve `poseFocus` parametrelerine göre dinamik olarak belirlenir:

| Senaryo | Shot Type | Framing | Açıklama |
| :--- | :--- | :--- | :--- |
| **Upper (Üst Giyim)** | `cowboy_shot` | `cowboy_shot` | Belden yukarısı, yüz dahil. |
| **Lower / Dress / Set** | `full_body` | `head_to_toe` | Tepeden tırnağa tüm vücut. |
| **Closeup Seçimi** | `close_up` | `chest_and_face` | Yüz ve göğüs bölgesi odağı. |
| **Detail (Detay) Çekimi** | `close_up` | `waist_to_above_knees` | Bel ve diz üstü arası (Genelde ürün detayları için). |

---

## 5. Kütüphane (Library) Kullanımı

Koleksiyonlardaki öğeler seçildiğinde şu veriler devralınır:
*   **Saved Pose:** Stickman görseli + Varsa manuel girilmiş duruş açıklaması.
*   **Saved Model:** Görsel URL + Cinsiyet bilgisi.
*   **Saved Fit/Shoe:** Bu varlıklar için kütüphaneye kaydedilmiş özel promptlar, ürün analizinin üzerine yazılır (override).

---

## 6. Mavi EU (Batch Generation) İşleyişi

Mavi EU butonu, tek bir ürün için **8 farklı prodüksiyon karesi** planlar. Bu karelerin dağılımı şöyledir:

1.  **3x Styling Shot (Kreatif):** 
    *   Farklı saç modelleri (arkada/önde).
    *   Farklı bakışlar (kameraya/uzağa).
    *   Rüzgar efekti varyasyonları.
2.  **3x Technical Angles (Teknik):**
    *   **Front (Ön):** "Standing straight, arms at sides."
    *   **Angled (Açı):** "Profile view, natural stance."
    *   **Back (Arka):** "Back view, straight posture."
3.  **2x Detail Shots (Detay):**
    *   `waist_to_above_knees` kadrajı ile ürünün dokusuna ve detaylarına odaklanır.

**Süreç Akışı:**
*   Önce tüm kareler için Gemini'den promptlar istenir.
*   Kullanıcıya bir önizleme listesi sunulur (JSON veya metin olarak).
*   Kullanıcı "Onayla" dediğinde, Fal.ai API'sine her kare için aynı `request_seed` (eğer sabitlenmişse) ve farklı promptlarla istek atılır.

---

## 7. API'ye Giden Final Paket (Örnek)

```json
{
  "productName": "Mavi Skinny Jean",
  "workflowType": "lower",
  "uploadedImages": { "model": "...", "bottom_front": "...", "background": "..." },
  "gender": "female",
  "poseFocus": "full",
  "poseStickman": "...",
  "collarType": "none",
  "waistType": "high-waisted",
  "riseType": "mid",
  "tucked": true,
  "seed": 12345678,
  "preview": false
}
```

Bu yapı sayesinde AI; ürünün dokusunu `LOCKED` bloktan, duruşunu `Stickman`'den, stilini ise `tucked/waistType` gibi parametrelerden alarak tutarlı bir sonuç üretir.
