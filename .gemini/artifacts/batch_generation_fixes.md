# Toplu Üretim Sorunları ve Çözüm Planı

## 🔴 Kritik Sorunlar

### 1. 4. Kare (Technical Back) - Details/Input Dolu
**Sorun:** İlk 3 karede input null ama 4. karede dolu. Saç promptları garip.
**Analiz Gerekli:** 
- [ ] Neden ilk 3 karede input null?
- [ ] 4. karede neden farklı davranıyor?
- [ ] Saç promptları neden ekleniyor?

**Çözüm:**
- [ ] 4. kare için saç bilgilerini tamamen kaldır
- [ ] Input/details tutarlılığını sağla

### 2. 5. Kare (Detail Front) - Tam Boy Üretmiş
**Sorun:** Bel-diz olmalıyken tam boy üretmiş. Details/Input boş.
**Kök Neden:** `poseFocus` parametresi yanlış gönderiliyor veya API'de framing uygulanmıyor.

**Çözüm:**
- [ ] `poseFocus: 'closeup'` yerine `poseFocus: 'detail'` kullan
- [ ] `camera.framing: 'waist_to_above_knees'` doğru gönderildiğinden emin ol
- [ ] API'de detail shot için özel mantık ekle

### 3. 6. Kare (Detail Back) - Tam Boy + Üstsüz
**Sorun:** Bel-diz olmalıyken tam boy + üstsüz üretmiş. Details/Input dolu.
**Kök Neden:** Arka detay için üst ürün görseli gönderilmemiş olabilir.

**Çözüm:**
- [ ] Detay arka için `top_front` veya `top_back` gönder
- [ ] Framing'i zorla: `waist_to_above_knees`
- [ ] Upper garment description ekle

## 🎯 Yeni Özellikler

### 4. Seçici Görsel Üretimi
**İstek:** Kullanıcı sadece istediği kareleri üretebilmeli (örn: sadece 4. ve 6. kare).

**Çözüm:**
- [ ] Preview dialog'a her kare için checkbox ekle
- [ ] `selectedImages` state'i ekle
- [ ] Sadece seçili kareleri üret

### 5. Sayfa Çıkış Uyarısı
**İstek:** Kullanıcı sayfadan çıkarken veri kaybı uyarısı.

**Çözüm:**
- [ ] `beforeunload` event listener ekle
- [ ] Asset varsa uyarı göster
- [ ] Next.js router için `routeChangeStart` event ekle

### 6. Otomatik İndirme (Downloads Klasörü)
**İstek:** Görseller otomatik olarak Downloads klasörüne isimlendirilerek indirilmeli.

**Çözüm:**
- [ ] Download butonu fetch ile görseli al
- [ ] Blob oluştur
- [ ] `download` attribute ile indir
- [ ] Doğru isimlendirme kullan

## 📊 Çözüm Öncelikleri

1. ✅ **Kritik:** 5. ve 6. kare framing sorunları
2. ✅ **Kritik:** 4. kare saç promptları
3. ✅ **Önemli:** Seçici görsel üretimi
4. ✅ **Önemli:** Otomatik indirme
5. ✅ **Orta:** Sayfa çıkış uyarısı

## 🔧 Teknik Detaylar

### Batch Generation API Çağrısı
```typescript
// handleConfirmBatchGeneration içinde
const res = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify({
        // ... parametreler
        poseFocus: preview.spec.camera.shot_type === 'close_up' ? 'closeup' : 'full',
        // ❌ SORUN: 'detail' değeri yok!
    })
});
```

### Çözüm Yaklaşımı
```typescript
// Doğru poseFocus mapping
const poseFocus = preview.spec.view.includes('detail') 
    ? 'detail'  // ✅ Detail shots için
    : preview.spec.camera.shot_type === 'close_up' 
        ? 'closeup' 
        : 'full';
```

## 📝 Test Senaryoları

- [ ] Alt ürün 6 kare üretimi
- [ ] 4. kare: Saç bilgisi yok, full body arka
- [ ] 5. kare: Bel-diz ön detay, üst ürün görünür
- [ ] 6. kare: Bel-diz arka detay, üst ürün görünür
- [ ] Seçici üretim: Sadece 4. ve 6. kare
- [ ] Otomatik indirme: Doğru isimlendirme
- [ ] Sayfa çıkış uyarısı: Asset varken çalışıyor
