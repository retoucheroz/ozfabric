# OZFABRIC - JSON PROMPT YAPILARI VE KADRAJ AYARLARI

## 1. PHOTOSHOOT SAYFASI - ÖN/YAN/ARKA AÇI ÜRETİMİ (3-Angle Mode)

### Model Pozu ve Kadraj Ayarları

#### **ÖN AÇI (Front View)**
```json
{
  "pose": {
    "reference": "standing straight, arms at sides",
    "dynamic": false
  },
  "camera": {
    "shot_type": "cowboy_shot",  // Üst giyim için
    "shot_type": "full_body",     // Alt giyim/elbise için
    "framing": "cowboy_shot",     // Üst giyim: Baş-Orta Uyluk
    "framing": "head_to_toe",     // Alt giyim: Tam boy
    "angle": "front"
  }
}
```

**Text Prompt Örneği:**
```
"Technical front view. Front facing, neutral standing pose. FULL BODY shot, Head to Toe visible."
```

---

#### **YAN AÇI (Side View)**
```json
{
  "pose": {
    "reference": "profile view, natural stance",
    "dynamic": false
  },
  "camera": {
    "shot_type": "cowboy_shot",  // Üst giyim için
    "shot_type": "full_body",     // Alt giyim/elbise için
    "framing": "cowboy_shot",
    "framing": "head_to_toe",
    "angle": "side"
  }
}
```

**Text Prompt Örneği:**
```
"Technical side view. Side profile view. FULL BODY shot, Head to Toe visible."
```

---

#### **ARKA AÇI (Back View)**
```json
{
  "pose": {
    "reference": "back view, straight posture",
    "dynamic": false
  },
  "camera": {
    "shot_type": "cowboy_shot",  // Üst giyim için
    "shot_type": "full_body",     // Alt giyim/elbise için
    "framing": "cowboy_shot",
    "framing": "head_to_toe",
    "angle": "back"
  }
}
```

**Text Prompt Örneği:**
```
"Technical back view. Back view. FULL BODY shot, Head to Toe visible."
```

---

## 2. PHOTOSHOOT SAYFASI - KADRAJ SEÇENEKLERİ (Fotoğraf Çek - Styling Mode)

### Kadraj Seçenekleri ve JSON Yapıları

#### **YAKIN PLAN (Close-Up)**
```json
{
  "camera": {
    "shot_type": "close_up",
    "framing": "chest_and_face"  // Üst giyim için
    "framing": "waist_to_above_knees"  // Alt giyim için
  }
}
```

**Prompta Eklenen Bölüm:**
```
"Camera framing is close-up on chest and face."
// veya
"Camera framing is waist-down, focusing on pants and shoes."
```

---

#### **ÜST VÜCUT (Upper Body)**
```json
{
  "camera": {
    "shot_type": "cowboy_shot",
    "framing": "cowboy_shot"
  }
}
```

**Prompta Eklenen Bölüm:**
```
"Cowboy Shot (Head to Mid-Thigh) fashion photography."
"Camera framing is Cowboy Shot (Head to Mid-Thigh)."
```

---

#### **TAM BOY (Full Body)**
```json
{
  "camera": {
    "shot_type": "full_body",
    "framing": "head_to_toe"
  }
}
```

**Prompta Eklenen Bölüm:**
```
"Full Body fashion photography."
"Camera framing is full body, head to toe visible."
```

---

#### **ALT VÜCUT (Lower Body)**
```json
{
  "camera": {
    "shot_type": "full_body",
    "framing": "head_to_toe"
  }
}
```

**Prompta Eklenen Bölüm:**
```
"Full Body fashion photography."
"Camera framing is full body, head to toe visible."
```

---

## 3. PHOTOSHOOT SAYFASI - STYLING GÖRSELİ (Fotoğraf Çek) - TÜM DEĞİŞKENLER

### Tam JSON Prompt Yapısı

```json
{
  "intent": "Fashion e-commerce photography",
  
  "subject": {
    "type": "female_model",  // veya "male_model"
    "identity": "match_provided_model_image",  // veya "generic_fashion_model"
    "hair_behind_shoulders": false,  // SAÇ ARKADA ayarı
    "look_at_camera": true  // KAMERAYA BAK ayarı
  },
  
  "garment": {
    "name": "Denim Jeans",
    "type": "lower",  // "upper", "dress", "set"
    "fabric": "Medium-wash indigo denim with cross-hatch texture...",
    "fit": "High-waisted baggy tapered-leg...",
    "closure_type": "buttons"  // "zipper", "none"
  },
  
  "styling": {
    "buttons": "closed",  // DÜĞMELER: "open" veya "closed"
    "tucked": false,  // ETEK UCU İÇERDE: true/false
    "socks": "none",  // ÇORAP: "white", "black", "none"
    "inner_wear": {
      "visible": true,
      "description": "White cotton t-shirt..."
    },
    "layers": {
      "jacket": null,
      "dress": false,
      "upper_garment": {
        "visible": true,
        "description": "Blue denim shirt..."
      }
    }
  },
  
  "accessories": {
    "shoes": {
      "style": "slim low-profile sneakers",
      "size": "SMALL, thin, minimal, proportional to body"
    },
    "belt": false,
    "hat": false,
    "glasses": false,
    "bag": false
  },
  
  "pose": {
    "reference": "use reference stickman image",  // veya null
    "description": "Model is standing with hands on hips...",
    "dynamic": true
  },
  
  "camera": {
    "shot_type": "full_body",  // "cowboy_shot", "close_up"
    "angle": "styling",  // "front", "side", "back"
    "framing": "head_to_toe"  // "cowboy_shot", "chest_and_face"
  },
  
  "scene": {
    "background": "match_provided_background",  // veya "clean_studio"
    "lighting": "soft_fashion_lighting"
  }
}
```

### Text Prompt Örneği (Tüm Değişkenlerle)

```
Full Body fashion photography. A professional female model (175cm tall, wearing EU size 38 shoes) is posing wearing Denim Jeans paired with a professional shirt. Realistic body proportions. 

Camera framing is full body, head to toe visible. 

The Denim Jeans is made of Medium-wash indigo denim fabric with subtle cross-hatch texture. Solid blue color with natural fading at seams. Heavyweight cotton twill weave. Matte finish with contrast orange stitching. 

FIT & SILHOUETTE: High-waisted baggy tapered-leg pants. Loose thigh fit, significant taper beginning from the knee. Narrow leg opening at the ankle. Floor-length hem with slight pooling/stacking.

Outfit layers:
The upper garment is Blue denim shirt with button-front closure.
CRITICAL: The upper garment (Blue denim shirt) is NEATLY TUCKED INTO the waistband of the Denim Jeans.
CRITICAL: The Blue denim shirt is worn fully BUTTONED and CLOSED.

Model is wearing proportional footwear matching the shoe reference image.
Bare skin is visible at the ankles/feet with NO socks.

POSE: Model is standing with hands on hips, weight on left leg, right knee slightly bent.

Background matches reference exactly.

The model is looking DIRECTLY at the camera with confident eye contact.

CRITICAL STYLING: The model's hair is tucked BEHIND her shoulders and back. No hair should cover the front of the garment or shoulders.
```

---

## 4. DETAIL CREATE SAYFASI - ÖN/YAN/ARKA DETAY ÇEKİMLERİ

### Model Pozu ve Kadraj

#### **ÖN DETAY (Front Detail)**
```json
{
  "task": "generate_model_worn_garment_image",
  "view": "front",
  "garment_description": "Denim Jeans",
  "subject_gender": "female",
  
  "framing": {
    "crop": "waist_to_above_knees",  // Alt giyim için
    "crop": "cowboy_shot",  // Üst giyim için
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  },
  
  "model_pose": {
    "posture": "neutral_standing",
    "movement": "none",
    "fashion_pose": false
  },
  
  "CRITICAL_REFERENCE_RULES": {
    "fabric_color": "EXACTLY match the color from uploaded garment reference image",
    "fabric_pattern": "EXACTLY replicate the pattern from reference",
    "background": "USE THE EXACT uploaded background image",
    "overall_tone": "Preserve the exact color temperature and mood"
  }
}
```

---

#### **YAN DETAY (Angled Detail)**
```json
{
  "task": "generate_model_worn_garment_image",
  "view": "angled",
  "garment_description": "Denim Jeans",
  "subject_gender": "female",
  
  "angle_definition": {
    "rotation": "slight",
    "rotation_degree": "10_to_20",
    "rotation_axis": "vertical",
    "camera_facing_bias": "front_faces_camera_left",
    "keep_full_visibility": true
  },
  
  "model_pose": {
    "posture": "neutral_standing",
    "body_rotation": "right",
    "movement": "none",
    "fashion_pose": false
  },
  
  "framing": {
    "crop": "waist_to_above_knees",  // Alt giyim
    "crop": "cowboy_shot",  // Üst giyim
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  }
}
```

---

#### **ARKA DETAY (Back Detail)**
```json
{
  "task": "generate_model_worn_garment_image",
  "view": "back",
  "garment_description": "Denim Jeans",
  "subject_gender": "female",
  
  "framing": {
    "crop": "waist_to_above_knees",  // Alt giyim
    "crop": "cowboy_shot",  // Üst giyim
    "camera_angle": "eye_level",
    "lens_look": "50mm",
    "distortion": "none"
  },
  
  "model_pose": {
    "posture": "neutral_standing",
    "movement": "none",
    "fashion_pose": false
  }
}
```

---

## 5. KADRAJ KARŞILAŞTIRMA TABLOSU

| Kadraj Seçimi | Photoshoot (Styling) | Photoshoot (3-Angle) | Detail Create |
|---------------|---------------------|---------------------|---------------|
| **Yakın Plan** | `close_up` + `chest_and_face` | ❌ Yok | ❌ Yok |
| **Üst Vücut** | `cowboy_shot` | `cowboy_shot` (Üst giyim) | `cowboy_shot` (Üst giyim) |
| **Tam Boy** | `full_body` + `head_to_toe` | `full_body` (Alt giyim) | ❌ Yok |
| **Alt Vücut** | `full_body` + `head_to_toe` | `full_body` (Alt giyim) | `waist_to_above_knees` |

---

## 6. STYLING DEĞİŞKENLERİ ÖZET

| Ayar | JSON Alanı | Değerler | Prompta Eklenen |
|------|-----------|----------|----------------|
| **Saç Arkada** | `subject.hair_behind_shoulders` | `true` / `false` | "CRITICAL STYLING: The model's hair is tucked BEHIND her shoulders..." |
| **Kameraya Bak** | `subject.look_at_camera` | `true` / `false` | "The model is looking DIRECTLY at the camera..." veya "...looking away..." |
| **Düğmeler** | `styling.buttons` | `"open"` / `"closed"` | "CRITICAL: The shirt is worn completely OPEN..." veya "...fully BUTTONED..." |
| **Etek Ucu** | `styling.tucked` | `true` / `false` | "CRITICAL: The garment is NEATLY TUCKED INTO..." veya "...worn UNTUCKED" |
| **Çorap** | `styling.socks` | `"none"` / `"white"` / `"black"` | "Bare skin visible..." veya "wearing clean white crew-length socks..." |

---

## 7. WORKFLOW TİPİNE GÖRE KADRAJ MANTĞI

### **Üst Giyim (Upper Body)**
- **3-Angle Mode**: `cowboy_shot` (Baş - Orta Uyluk)
- **Styling Mode**: Kullanıcı seçimine göre (`closeup`, `upper`, `full`)
- **Detail Create**: `cowboy_shot`

### **Alt Giyim (Lower Body)**
- **3-Angle Mode**: `full_body` (Baş - Ayak)
- **Styling Mode**: `full_body` (Pantolon/etek tam görünmeli)
- **Detail Create**: `waist_to_above_knees` (Bel - Diz üstü)

### **Elbise/Set (Dress/Set)**
- **3-Angle Mode**: `full_body`
- **Styling Mode**: `full_body`
- **Detail Create**: `waist_to_above_knees` veya `full_body`

---

## NOTLAR

1. **Photoshoot 3-Angle Mode**: Teknik çekimler için sabit poz kullanır (düz duruş, eller yanda)
2. **Photoshoot Styling Mode**: Dinamik poz kullanır, kullanıcı kadraj seçebilir
3. **Detail Create**: Renk/desen koruması için çok katı kurallar içerir
4. **Kadraj Önceliği**: Alt giyim için DAIMA tam boy gösterilir (ayakkabı görünmeli)
