# MAVİ ALMANYA - TOPLU GÖRSEL ÜRETİM SİSTEMİ

## 📋 Genel Bakış

Mavi Almanya sayfası, photoshoot sayfasının gelişmiş bir versiyonudur. Toplu görsel üretimi, ürün kodu sistemi ve renk paleti çıkarımı gibi özellikler içerir.

## 🎯 Özellikler

### 1. Ürün Kodu Sistemi
- **Zorunlu Alan**: Her üretim için benzersiz ürün kodu gereklidir
- **Otomatik İsimlendirme**: Görseller `{PRODUCT_CODE}_image_001.jpg` formatında adlandırılır
- **Format**: Büyük harfe otomatik dönüşüm (örn: `MAVI-2024-001`)

### 2. Toplu Görsel Üretimi

#### **Üst Giyim (Upper Body)** - 5 Görsel
1. **Styling #1**: Random poz, kullanıcı seçimi (Full Body / Medium Full)
2. **Styling #2**: Random poz, kullanıcı seçimi (Full Body / Medium Full)
3. **Styling Angled**: Yan açılı random poz, kullanıcı seçimi
4. **Back View**: Arka görünüm, cowboy shot, eller yanda
5. **Close-Up**: Göğüs ve yüz kadrajı

#### **Alt Giyim (Lower Body)** - 6 Görsel
1. **Styling #1**: Random poz, full body (head to toe)
2. **Styling Angled**: Yan açılı random poz, full body
3. **Front Technical**: Ön görünüm, full body, eller yanda
4. **Back Technical**: Arka görünüm, full body, eller yanda
5. **Front Detail**: Ön detay, bel-diz arası kadraj
6. **Back Detail**: Arka detay, bel-diz arası kadraj

### 3. Poz Kütüphanesi

**Kadın Pozları:**
- Random: 4 farklı dinamik poz
- Angled: 3 farklı yan açılı poz

**Erkek Pozları:**
- Random: 4 farklı dinamik poz
- Angled: 3 farklı yan açılı poz

**Otomatik Seçim**: Cinsiyet ve poz tipine göre kütüphaneden rastgele seçim

### 4. Renk Paleti Üretimi

- **Otomatik Renk Çıkarımı**: Gemini Vision API ile ana ürün rengini analiz eder
- **300x300px SVG**: Ürün kodu ve hex renk kodu içeren görsel
- **Format**: Base64 encoded SVG data URL
- **İçerik**:
  - Solid renk arka plan
  - Ürün kodu (alt kısımda)
  - Hex renk kodu (üst kısımda)

### 5. JSON Prompt Önizleme ve Düzenleme

- **Önizleme Modu**: Üretim öncesi tüm promptları gösterir
- **Düzenleme**: Her görsel için JSON promptu manuel düzenlenebilir
- **Toplu Onay**: Tüm düzenlemeler onaylandıktan sonra üretim başlar

### 6. Geçmiş Sistemi

- **LocalStorage**: Tüm üretimler tarayıcıda saklanır
- **Görüntüleme**: Ürün kodu, tarih, görseller ve promptlar
- **Kalıcılık**: Sayfa yenilendiğinde veriler korunur

## 🔧 Teknik Detaylar

### API Endpoints (Photoshoot ile Aynı)
**Analiz**: `/api/analyze` - Ürün analizi (kumaş, fit, kapanma tipi)
**Üretim**: `/api/generate` - Görsel üretimi (her görsel için ayrı çağrı)

### Photoshoot ile Farklar

**Mavi Almanya**, photoshoot sayfasının **aynı API'lerini** kullanır:
- ✅ `/api/analyze` - Ürün analizi
- ✅ `/api/generate` - Görsel üretimi

**Tek Fark**: Frontend'de toplu üretim mantığı ve ürün kodu sistemi.

### Request Flow
1. **Analiz**: `/api/analyze` ile ürün görselleri analiz edilir
2. **Batch Specs**: Frontend'de 5-6 görsel için spec'ler oluşturulur
3. **Preview**: JSON promptlar kullanıcıya gösterilir
4. **Generation**: Her görsel için `/api/generate` sırayla çağrılır
5. **Color Palette**: Frontend'de SVG olarak oluşturulur

## 🎨 Styling Seçenekleri

Photoshoot sayfasındaki tüm styling seçenekleri desteklenir:

- ✅ **Saç Arkada** (`hairBehindShoulders`)
- ✅ **Kameraya Bak** (`lookAtCamera`)
- ✅ **Düğmeler Açık/Kapalı** (`buttonsOpen`)
- ✅ **Etek Ucu İçerde** (`tucked`)
- ✅ **Çorap Seçimi** (`socksType`: none/white/black)

## 📁 Dosya Yapısı

```
/app/(dashboard)/mavi-almanya/
  └── page.tsx                    # Ana sayfa (toplu üretim mantığı)

/components/app-sidebar.tsx       # Menü entegrasyonu

# Kullanılan Mevcut API'ler (Photoshoot ile Paylaşımlı):
/app/api/analyze/route.ts         # Ürün analizi
/app/api/generate/route.ts        # Görsel üretimi
```

## 🚀 Kullanım Akışı

1. **Ürün Kodu Gir**: Benzersiz kod belirle (örn: MAVI-2024-001)
2. **Ürün Bilgileri**: Ad, tip (üst/alt), cinsiyet
3. **Görseller Yükle**: Model, ürün, arka plan
4. **Styling Ayarları**: Saç, bakış, çorap, vb.
5. **Önizleme**: "Görselleri Üret" → JSON promptları görüntüle
6. **Düzenle** (Opsiyonel): JSON promptları manuel düzenle
7. **Onayla**: "Onayla ve Üret" → Toplu üretim başlar
8. **İndir**: Tüm görseller + renk paleti

## 🔄 Photoshoot ile Farklar

| Özellik | Photoshoot | Mavi Almanya |
|---------|-----------|--------------|
| **Üretim Modu** | Tekli veya 3-açı | Toplu (5-6 görsel) |
| **Ürün Kodu** | ❌ Yok | ✅ Zorunlu |
| **Renk Paleti** | ❌ Yok | ✅ Otomatik |
| **Poz Kütüphanesi** | ❌ Manuel | ✅ Otomatik random |
| **JSON Düzenleme** | ✅ Var | ✅ Toplu düzenleme |
| **Geçmiş** | ✅ Projects | ✅ LocalStorage |
| **İsimlendirme** | Timestamp | Ürün kodu + sıra |

## 🎯 Hedef Kullanıcı

- **E-ticaret Firmaları**: Toplu ürün görseli ihtiyacı
- **Marka Yöneticileri**: Standart görsel setleri
- **Katalog Hazırlama**: Hızlı ve tutarlı görsel üretimi

## 📊 Performans

- **Tek Görsel**: ~5-10 saniye
- **5 Görsel (Üst)**: ~25-50 saniye
- **6 Görsel (Alt)**: ~30-60 saniye
- **Toplam (+ Renk Paleti)**: +5 saniye

## 🔐 Güvenlik

- **Ürün Kodu Validasyonu**: Boş kod kontrolü
- **Rate Limiting**: API seviyesinde (300s max duration)
- **LocalStorage**: Sadece client-side, server'a gönderilmez

## 🐛 Bilinen Sınırlamalar

1. **Poz Kütüphanesi**: Şu an sabit liste, gelecekte dinamik olabilir
2. **Renk Çıkarımı**: Gemini Vision'a bağımlı, bazen fallback kullanır
3. **Geçmiş**: LocalStorage sınırlı, büyük veri setlerinde sorun olabilir
4. **Eşzamanlılık**: Görseller sıralı üretilir (paralel değil)

## 🔮 Gelecek Geliştirmeler

- [ ] Paralel görsel üretimi (hız artışı)
- [ ] Cloud storage entegrasyonu (geçmiş için)
- [ ] Dinamik poz kütüphanesi (database)
- [ ] Toplu indirme (ZIP)
- [ ] Ürün kodu QR code entegrasyonu
- [ ] Renk paleti varyasyonları (tonal, complementary)

---

**Son Güncelleme**: 31 Ocak 2026
**Versiyon**: 1.0.0
**Durum**: ✅ Aktif
