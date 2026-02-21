"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "tr";

interface Translations {
    [key: string]: {
        en: string;
        tr: string;
    }
}

const translations: Translations = {
    // Navigation
    "nav.home": { en: "Home", tr: "Ana Sayfa" },
    "nav.create": { en: "Create", tr: "Oluştur" },
    "nav.edit": { en: "Edit", tr: "Düzenle" },
    "nav.train": { en: "Train", tr: "Eğit" },
    "nav.myCreations": { en: "My Creations", tr: "Kreasyonlarım" },
    "nav.newPhotoshoot": { en: "New Photoshoot", tr: "Yeni Çekim" },

    // Sidebar
    "sidebar.design": { en: "Design", tr: "Tasarım" },
    "sidebar.photoshoot": { en: "Studio", tr: "Stüdyo" },
    "sidebar.studio": { en: "STUDIO", tr: "STÜDYO" },
    "sidebar.catalog": { en: "CATALOG", tr: "KATALOG" },
    "sidebar.tools": { en: "TOOLS", tr: "ARAÇLAR" },
    "sidebar.library": { en: "Library", tr: "Kütüphane" },
    "sidebar.resize": { en: "Upscale", tr: "Upscale" },
    "sidebar.techPack": { en: "Product Info", tr: "Ürün Bilgisi" },
    "sidebar.train": { en: "Train Model", tr: "Model Eğit" },
    "sidebar.styles": { en: "Styles", tr: "Stiller" },
    "sidebar.sketch": { en: "Sketch to Design", tr: "Eskizden Üret" },
    "sidebar.patterns": { en: "Patterns", tr: "Desenler" },
    "sidebar.retexture": { en: "Retexture", tr: "Doku" },
    "sidebar.aiModel": { en: "Generate Photo", tr: "Fotoğraf Üret" },
    "sidebar.tryOn": { en: "Detail Shot", tr: "Detay Çekim" },
    "sidebar.ghost": { en: "Ghost / Flatlay", tr: "Ghost / Flatlay" },
    "sidebar.editorial": { en: "Campaign", tr: "Kampanya" },
    "sidebar.ecom": { en: "E-com", tr: "E-com" },
    "sidebar.collections": { en: "Collections", tr: "Koleksiyonlar" },
    "sidebar.history": { en: "History", tr: "Geçmiş" },
    "sidebar.community": { en: "Community", tr: "Topluluk" },
    "sidebar.settings": { en: "Settings", tr: "Ayarlar" },
    "sidebar.video": { en: "Video", tr: "Video" },
    "sidebar.analysis": { en: "Analysis", tr: "Analiz" },
    "sidebar.faceHeadSwap": { en: "Face Swap", tr: "Face Swap" },

    "faceSwap.title": { en: "Face & Head Swap", tr: "Yüz & Kafa Değiştir" },
    "faceSwap.identitySource": { en: "Identity Source", tr: "Kimlik Kaynağı" },
    "faceSwap.identityDesc": { en: "Identity source — lighting/pose don't matter, only facial/head identity is taken.", tr: "Kimlik kaynağı — ışık/poz önemli değil, sadece yüz/kafa kimliği alınır." },
    "faceSwap.baseImage": { en: "Base Image (Target)", tr: "Hedef Görsel" },
    "faceSwap.baseDesc": { en: "Target image — pose, head angle, light, shadow, and color are taken from here.", tr: "Hedef görsel — poz, baş açısı, ışık, gölge ve renk buradan alınır." },
    "faceSwap.mode": { en: "Swap Mode", tr: "Değiştirme Modu" },
    "faceSwap.headSwap": { en: "Head Swap", tr: "Kafa Değiştir" },
    "faceSwap.headSwapDesc": { en: "Replaces the entire head (hair, ears, head shape included)", tr: "Tüm kafayı değiştirir (saç, kulaklar, kafa şekli dahil)" },
    "faceSwap.faceSwap": { en: "Face Swap", tr: "Yüz Değiştir" },
    "faceSwap.faceSwapDesc": { en: "Replaces only facial features (keeps hair, head shape from base)", tr: "Sadece yüz hatlarını değiştirir (saç ve kafa şeklini korur)" },
    "faceSwap.generate": { en: "Generate", tr: "Oluştur" },
    "faceSwap.result": { en: "Result", tr: "Sonuç" },
    "faceSwap.uploadReference": { en: "Upload Identity Source", tr: "Kimlik Kaynağı Yükle" },
    "faceSwap.uploadBase": { en: "Upload Base Image", tr: "Hedef Görsel Yükle" },
    "faceSwap.generating": { en: "Swapping...", tr: "Değiştiriliyor..." },
    "faceSwap.success": { en: "Swap completed successfully!", tr: "Değiştirme işlemi başarıyla tamamlandı!" },
    "faceSwap.error": { en: "Swap failed. Please try again.", tr: "Değiştirme başarısız oldu. Lütfen tekrar deneyin." },
    "faceSwap.errorBothImages": { en: "Please upload both identity source and base image.", tr: "Lütfen hem kimlik kaynağını hem de hedef görseli yükleyin." },

    // Home Page
    "home.welcome": { en: "Welcome back", tr: "Tekrar hoş geldin" },
    "home.readyToCreate": { en: "Ready to create studio-quality photos with AI?", tr: "Yapay zeka ile stüdyo kalitesinde fotoğraflar oluşturmaya hazır mısın?" },
    "home.topUpCredits": { en: "Top Up Credits", tr: "Kredi Yükle" },
    "home.newDesign": { en: "New Design", tr: "Yeni Tasarım" },
    "home.totalDesigns": { en: "Total Designs", tr: "Toplam Tasarım" },
    "home.creditsAvailable": { en: "Credits Available", tr: "Mevcut Kredi" },
    "home.aiGenerations": { en: "AI Generations", tr: "AI Üretimleri" },
    "home.createVisualize": { en: "Create & Visualize", tr: "Oluştur & Görselleştir" },

    "home.photoshootTitle": { en: "AI Studio", tr: "Stüdyo" },
    "home.photoshootDesc": { en: "Create professional studio photos.", tr: "Profesyonel stüdyo çekimleri gerçekleştirin." },
    "home.videoTitle": { en: "Generate Video", tr: "Video Üret" },
    "home.videoDesc": { en: "Create cinematic reels and stories with AI.", tr: "AI ile sinematik reels ve hikayeler oluşturun." },

    "home.sketchTitle": { en: "Sketch to Design", tr: "Eskizden Üret" },
    "home.sketchDesc": { en: "Turn sketches into realistic products.", tr: "Eskizlerinizi gerçek ürünlere dönüştürün." },

    "home.virtualTryOn": { en: "Generate Detail", tr: "Detay Üret" },
    "home.virtualTryOnDesc": { en: "Visualize garments in AI studios instantly.", tr: "Giysileri AI stüdyolar içerisinde anında görselleştirin." },

    "home.ghostModelTitle": { en: "Ghost / Flatlay", tr: "Ghost / Flatlay Üret" },
    "home.ghostModelDesc": { en: "Transform hanging/flat items into 3D ghost mannequin shots.", tr: "Askıda veya düz ürünlerinizi 3D hayalet manken çekimine çevirin." },

    "home.trainTitle": { en: "Train Model", tr: "Model Eğit" },
    "home.trainDesc": { en: "Train custom models and styles.", tr: "Özel modeller ve stiller eğitin." },

    "home.newStyle": { en: "New Style", tr: "Yeni Stil" },
    "home.newStyleDesc": { en: "Generate complete garments from text prompts.", tr: "Metin açıklamalarından komple giysiler oluşturun." },
    "home.patternAI": { en: "Pattern AI", tr: "Desen AI" },
    "home.patternAIDesc": { en: "Create seamless textures and fabric prints.", tr: "Dikişsiz dokular ve kumaş desenleri oluşturun." },


    "home.retexture": { en: "Retexture", tr: "Doku Değiştir" },
    "home.retextureDesc": { en: "Apply new fabrics to existing photos.", tr: "Mevcut fotoğraflara yeni kumaşlar uygulayın." },
    "home.recentProjects": { en: "Recent Projects", tr: "Son Projeler" },
    "home.viewAll": { en: "View All", tr: "Tümünü Gör" },
    "home.trending": { en: "Trending", tr: "Trendler" },
    "home.noProjects": { en: "No projects yet. Start creating!", tr: "Henüz proje yok. Oluşturmaya başla!" },
    "home.proPlan": { en: "Pro Plan", tr: "Pro Plan" },
    "home.proPlanDesc": { en: "Unlock unlimited generations and higher resolution downloads.", tr: "Sınırsız üretim ve yüksek çözünürlüklü indirmeler için Pro'ya geç." },
    "home.upgradeNow": { en: "Upgrade Now", tr: "Şimdi Yükselt" },

    // Photoshoot Page
    "photoshoot.singleUpload": { en: "Single Upload", tr: "Tekli Yükleme" },
    "photoshoot.bulkUpload": { en: "Bulk Upload", tr: "Toplu Yükleme" },
    "photoshoot.dropGarment": { en: "Drop garment image here", tr: "Giysi görselini buraya bırakın" },
    "photoshoot.dropMultiple": { en: "Drag multiple images or click to select", tr: "Birden fazla görsel sürükleyin veya tıklayarak seçin" },
    "photoshoot.howToGetResults": { en: "HOW TO GET GOOD RESULTS?", tr: "İYİ SONUÇLAR NASIL ALINIR?" },
    "photoshoot.tip1": { en: "Longest side of image should be less than 3000px.", tr: "Görselin en uzun kenarı 3000px'den küçük olmalı." },
    "photoshoot.tip2": { en: "Supports studio, full-body shots.", tr: "Stüdyo ve tam vücut çekimlerini destekler." },
    "photoshoot.tip3": { en: "Does not support hanging, flat lay, or shots without limbs.", tr: "Asılı, düz serili veya uzvusuz çekimleri desteklemez." },
    "photoshoot.quickSelectModel": { en: "QUICK SELECT MODEL", tr: "HIZLI MODEL SEÇİMİ" },
    "photoshoot.selectModel": { en: "Select Studio", tr: "Stüdyo Seç" },
    "photoshoot.selectBackground": { en: "Select Background", tr: "Arka Plan Seç" },
    "photoshoot.selectPose": { en: "Select Pose", tr: "Poz Seç" },
    "photoshoot.chooseAngle": { en: "Choose Angle", tr: "Açı Seç" },
    "photoshoot.create": { en: "Create", tr: "Oluştur" },
    "photoshoot.creating": { en: "Creating...", tr: "Oluşturuluyor..." },
    "photoshoot.history": { en: "HISTORY", tr: "GEÇMİŞ" },
    "photoshoot.noResult": { en: "No Result Yet", tr: "Henüz Sonuç Yok" },
    "photoshoot.noResultDesc": { en: "Upload a garment and click Create to generate a photoshoot.", tr: "Giysi yükleyin ve çekim oluşturmak için Oluştur'a tıklayın." },
    "photoshoot.noHistory": { en: "No history yet. Create your first photoshoot!", tr: "Henüz geçmiş yok. İlk çekiminizi oluşturun!" },

    // Model options
    "model.female": { en: "Female", tr: "Kadın" },
    "model.male": { en: "Male", tr: "Erkek" },
    "model.diverse": { en: "Diverse", tr: "Çeşitli" },
    "model.caucasian": { en: "Caucasian", tr: "Kafkas" },
    "model.asian": { en: "Asian", tr: "Asyalı" },
    "model.african": { en: "African", tr: "Afrikalı" },
    "model.latino": { en: "Latino", tr: "Latin" },

    // Poses
    "pose.standing": { en: "Standing", tr: "Ayakta" },
    "pose.walking": { en: "Walking", tr: "Yürüyen" },
    "pose.sitting": { en: "Sitting", tr: "Oturan" },
    "pose.handsHips": { en: "Hands on Hips", tr: "Eller Kalçada" },
    "pose.casual": { en: "Casual", tr: "Günlük" },

    // Angles
    "angle.front": { en: "Front", tr: "Ön" },
    "angle.side": { en: "Side", tr: "Yan" },
    "angle.back": { en: "Back", tr: "Arka" },
    "angle.threeQuarter": { en: "3/4 View", tr: "3/4 Görünüm" },

    // Settings
    "settings.title": { en: "Settings", tr: "Ayarlar" },
    "settings.profile": { en: "Profile", tr: "Profil" },
    "settings.userProfile": { en: "User Profile", tr: "Kullanıcı Profili" },
    "settings.apiKeys": { en: "API Keys", tr: "API Anahtarları" },
    "settings.aiConfig": { en: "AI Configuration", tr: "AI Yapılandırması" },
    "settings.billing": { en: "Credits", tr: "Kredi" },
    "settings.billingCredits": { en: "Credits & Billing", tr: "Kredi & Fatura" },
    "settings.notifications": { en: "Notifications", tr: "Bildirimler" },
    "settings.security": { en: "Security", tr: "Güvenlik" },
    "settings.credits": { en: "Credits", tr: "Krediler" },
    "settings.currentBalance": { en: "Current Balance", tr: "Mevcut Bakiye" },
    "settings.topUp": { en: "Top Up", tr: "Yükle" },
    "settings.logOut": { en: "Log out", tr: "Çıkış Yap" },
    "settings.theme": { en: "Theme", tr: "Tema" },
    "settings.themeDesc": { en: "Choose light or dark mode", tr: "Açık veya koyu modu seçin" },
    "settings.fullName": { en: "Full Name", tr: "Ad Soyad" },
    "settings.email": { en: "Email", tr: "E-posta" },
    "settings.company": { en: "Company", tr: "Şirket" },
    "settings.saveChanges": { en: "Save Changes", tr: "Değişiklikleri Kaydet" },
    "settings.runpodKey": { en: "RunPod API Key", tr: "RunPod API Anahtarı" },
    "settings.runpodDesc": { en: "Enter your personal RunPod key to use your own quotas.", tr: "Kendi kotanızı kullanmak için RunPod anahtarınızı girin." },
    "settings.proPlan": { en: "Pro Plan", tr: "Pro Plan" },
    "settings.billedMonthly": { en: "Billed monthly", tr: "Aylık faturalandırma" },
    "settings.active": { en: "Active", tr: "Aktif" },
    "settings.nextBilling": { en: "Next billing date", tr: "Sonraki fatura tarihi" },
    "settings.paymentMethod": { en: "Payment Method", tr: "Ödeme Yöntemi" },
    "settings.update": { en: "Update", tr: "Güncelle" },
    "settings.pushNotifications": { en: "Push Notifications", tr: "Anlık Bildirimler" },
    "settings.pushDesc": { en: "Receive push notifications when renders complete", tr: "Render tamamlandığında bildirim al" },
    "settings.emailUpdates": { en: "Email Updates", tr: "E-posta Güncellemeleri" },
    "settings.emailUpdatesDesc": { en: "Receive weekly digest and product updates", tr: "Haftalık özet ve ürün güncellemeleri al" },
    "settings.marketingEmails": { en: "Marketing Emails", tr: "Pazarlama E-postaları" },
    "settings.marketingDesc": { en: "Receive promotional offers and news", tr: "Promosyon teklifleri ve haberler al" },
    "settings.changePassword": { en: "Change Password", tr: "Şifre Değiştir" },
    "settings.changePasswordDesc": { en: "Update your password regularly for security", tr: "Güvenlik için şifrenizi düzenli güncelleyin" },
    "settings.currentPassword": { en: "Current Password", tr: "Mevcut Şifre" },
    "settings.newPassword": { en: "New Password", tr: "Yeni Şifre" },
    "settings.confirmPassword": { en: "Confirm New Password", tr: "Yeni Şifreyi Onayla" },
    "settings.updatePassword": { en: "Update Password", tr: "Şifreyi Güncelle" },
    "settings.twoFactor": { en: "Two-Factor Authentication", tr: "İki Faktörlü Kimlik Doğrulama" },
    "settings.twoFactorDesc": { en: "Add an extra layer of security to your account", tr: "Hesabınıza ekstra güvenlik katmanı ekleyin" },
    "settings.deleteAccount": { en: "Delete Account", tr: "Hesabı Sil" },
    "settings.deleteAccountDesc": { en: "Permanently delete your account and all data", tr: "Hesabınızı ve tüm verilerinizi kalıcı olarak silin" },
    "settings.ozzieChat": { en: "Ozzie AI Assistant", tr: "Ozzie AI Asistanı" },
    "settings.ozzieChatDesc": { en: "Enable the floating AI chat assistant", tr: "Yüzen AI sohbet asistanını etkinleştir" },

    // Styles Page
    "styles.title": { en: "AI Style Studio", tr: "AI Stil Stüdyosu" },
    "styles.createNewStyle": { en: "Create New Style", tr: "Yeni Stil Oluştur" },
    "styles.subtitle": { en: "Generate fashion designs from text descriptions", tr: "Metin açıklamalarından moda tasarımları oluşturun" },
    "styles.describeEngine": { en: "Describe the fashion piece you want to generate using our SDXL engine.", tr: "SDXL motorumuzu kullanarak oluşturmak istediğiniz moda parçasını tanımlayın." },
    "styles.referenceSketch": { en: "Reference Sketch", tr: "Referans Eskiz" },
    "styles.drawSketch": { en: "Draw Sketch", tr: "Eskiz Çiz" },
    "styles.dropSketch": { en: "Drop sketch or click to upload", tr: "Eskiz bırakın veya yüklemek için tıklayın" },
    "styles.clickToChange": { en: "Click to change", tr: "Değiştirmek için tıklayın" },
    "styles.prompt": { en: "Prompt", tr: "Açıklama" },
    "styles.promptPlaceholder": { en: "E.g. A futuristic white silk dress with gold embroidery, high fashion, studio lighting, 8k...", tr: "Örn: Altın işlemeli fütüristik beyaz ipek elbise, yüksek moda, stüdyo aydınlatması, 8k..." },
    "styles.negativePrompt": { en: "Negative Prompt", tr: "Negatif Açıklama" },
    "styles.negativePromptPlaceholder": { en: "Low quality, blurry, distorted, ugly, bad anatomy...", tr: "Düşük kalite, bulanık, bozuk, çirkin, kötü anatomi..." },
    "styles.generate": { en: "Generate", tr: "Oluştur" },
    "styles.generateStyle": { en: "Generate Style", tr: "Stil Oluştur" },
    "styles.generating": { en: "Generating...", tr: "Oluşturuluyor..." },
    "styles.cost": { en: "Cost: 1 Credit • Est. Time: 8s", tr: "Maliyet: 1 Kredi • Tahmini Süre: 8sn" },
    "styles.noResult": { en: "Your generated design will appear here", tr: "Oluşturulan tasarımınız burada görünecek" },
    "styles.noResultDesc": { en: "Enter a prompt and click generate to create a new fashion design.", tr: "Yeni bir moda tasarımı oluşturmak için açıklama girin ve oluştur'a tıklayın." },
    "styles.addToCollection": { en: "Add to Collection", tr: "Koleksiyona Ekle" },
    "styles.tryOn": { en: "Try On", tr: "Dene" },
    "styles.getSpecs": { en: "Get Specs", tr: "Özellikleri Al" },
    "styles.readyToCreate": { en: "Ready to Create", tr: "Oluşturmaya Hazır" },
    "styles.readyToCreateDesc": { en: "Enter your prompt in the sidebar and hit Generate.", tr: "Kenar çubuğuna açıklamanızı girin ve Oluştur'a tıklayın." },
    "styles.designing": { en: "Designing your Piece...", tr: "Parçanız Tasarlanıyor..." },
    "styles.designingDesc": { en: "Our AI is weaving the pixels. Please wait.", tr: "AI'mız pikselleri dokuyor. Lütfen bekleyin." },

    // Patterns Page
    "patterns.title": { en: "AI Pattern Studio", tr: "AI Desen Stüdyosu" },
    "patterns.subtitle": { en: "Generate seamless, tileable textures for your digital fashion garments.", tr: "Dijital moda giysileri için dikişsiz, döşenebilir dokular oluşturun." },
    "patterns.promptPlaceholder": { en: "Describe your pattern (e.g. 'Gold art deco geometric seamless')", tr: "Deseninizi tanımlayın (örn: 'Altın art deco geometrik dikişsiz')" },

    // Collections Page
    "collections.title": { en: "My Collections", tr: "Koleksiyonlarım" },
    "collections.subtitle": { en: "Organize your designs into moodboards", tr: "Tasarımlarınızı moodboard'larda düzenleyin" },
    "collections.newCollection": { en: "New Collection", tr: "Yeni Koleksiyon" },
    "collections.createFirst": { en: "Create your first collection", tr: "İlk koleksiyonunuzu oluşturun" },
    "collections.createFirstDesc": { en: "Organize your designs into themed moodboards.", tr: "Tasarımlarınızı temalı moodboard'larda düzenleyin." },
    "collections.items": { en: "items", tr: "öğe" },

    // Community Page
    "community.title": { en: "Community Feed", tr: "Topluluk Akışı" },
    "community.subtitle": { en: "Discover and remix designs from the community", tr: "Topluluktan tasarımları keşfedin ve yeniden düzenleyin" },
    "community.remix": { en: "Remix", tr: "Yeniden Düzenle" },
    "community.copyPrompt": { en: "Copy Prompt", tr: "Promptu Kopyala" },

    // Studio/Tech Pack
    "studio.title": { en: "Tech Pack Studio", tr: "Teknik Dosya Stüdyosu" },
    "studio.uploadAnalyze": { en: "Upload & Analyze", tr: "Yükle & Analiz Et" },
    "studio.dropImage": { en: "Drop image to analyze", tr: "Analiz için görsel bırakın" },
    "studio.analyze": { en: "Analyze", tr: "Analiz Et" },
    "studio.analyzing": { en: "Analyzing...", tr: "Analiz ediliyor..." },
    "studio.history": { en: "History", tr: "Geçmiş" },
    "studio.addToCollection": { en: "Add to Collection", tr: "Koleksiyona Ekle" },
    "studio.exportPDF": { en: "Export PDF", tr: "PDF Dışa Aktar" },
    "studio.designerNotes": { en: "Designer Notes", tr: "Tasarımcı Notları" },
    "studio.notesPlaceholder": { en: "Add notes about this design...", tr: "Bu tasarım hakkında notlar ekleyin..." },
    "studio.extracting": { en: "Extracting fabric points, measurements, and Pantone codes.", tr: "Kumaş noktaları, ölçümler ve Pantone kodları çıkarılıyor." },
    "studio.techSpecSheet": { en: "Technical Specification Sheet", tr: "Teknik Şartname Belgesi" },
    "studio.print": { en: "Print Spec Sheet", tr: "Teknik Sayfayı Yazdır" },
    "studio.exportExcel": { en: "Export Excel", tr: "Excel Dışa Aktar" },
    "studio.techAnalysis": { en: "Technical Analysis & Spec Sheet", tr: "Teknik Analiz ve Şartname Belgesi" },
    "studio.analysisFailed": { en: "Failed to analyze design. Please try again.", tr: "Tasarım analiz edilemedi. Lütfen tekrar deneyin." },
    "studio.analysisSuccess": { en: "Design analyzed successfully", tr: "Tasarım başarıyla analiz edildi" },
    "studio.selectCollection": { en: "Select Collection", tr: "Koleksiyon Seç" },
    "studio.addToMoodboard": { en: "Add this design to a moodboard.", tr: "Bu tasarımı bir moodboard'a ekle." },
    "studio.projectError": { en: "Project must be saved first (from generators) to add to collection.", tr: "Koleksiyona eklemek için önce proje kaydedilmelidir." },
    "studio.addedToCollection": { en: "Added to Collection", tr: "Koleksiyona Eklendi" },

    // Try-On Page
    "tryOn.title": { en: "Virtual Try-On", tr: "Deneme Kabini" },
    "tryOn.subtitle": { en: "See it on. Instantly.", tr: "Üzerinde gör. Anında." },
    "tryOn.garmentCategory": { en: "Garment Category", tr: "Giysi Kategorisi" },
    "tryOn.upperBody": { en: "Upper Body (Tops)", tr: "Üst Giyim (Üstler)" },
    "tryOn.lowerBody": { en: "Lower Body (Pants/Skirts)", tr: "Alt Giyim (Pantolon/Etek)" },
    "tryOn.dresses": { en: "Dresses (Full Body)", tr: "Elbiseler (Tam Vücut)" },
    "tryOn.uploadModel": { en: "Upload Studio", tr: "Stüdyo Yükle" },
    "tryOn.uploadGarment": { en: "Upload Garment", tr: "Giysi Yükle" },
    "tryOn.dropModel": { en: "Drop studio image here", tr: "Stüdyo görselini buraya bırakın" },
    "tryOn.generateTryOn": { en: "Generate Try-On", tr: "Deneme Oluştur" },
    "tryOn.processing": { en: "Processing...", tr: "İşleniyor..." },
    "tryOn.noResultDesc": { en: "Select a studio and a garment to start the virtual try-on process.", tr: "Sanal deneme işlemi başlatmak için stüdyo ve giysi seçin." },

    // Ghost Mannequin Page
    "ghost.title": { en: "Ghost / Flatlay", tr: "Ghost / Flatlay" },
    "ghost.subtitle": { en: "TRANSFORM GARMENTS SHOT ON HANGER OR TABLE INTO GHOST MODEL", tr: "ASKIDA YA DA MASADA ÇEKİLEN ÜRÜNLERİ GHOST MODEL'E DÖNÜŞTÜRÜN" },
    "ghost.uploadFlatLay": { en: "Upload Flat Lay Garment", tr: "Düz Serim Giysi Yükle" },
    "ghost.generate3D": { en: "Generate 3D View", tr: "3D Görünüm Oluştur" },
    "ghost.studioTitle": { en: "3D Volume Studio", tr: "3D Hacim Stüdyosu" },
    "ghost.studioDesc": { en: "Upload a clothing item to see it transformed into a ghost mannequin product shot.", tr: "Bir giysiyi hayalet manken ürün çekimine dönüştürmek için yükleyin." },
    "ghost.generate": { en: "Generate", tr: "Oluştur" },
    "ghost.processing": { en: "Generating...", tr: "Oluşturuluyor..." },

    // Retexture Page
    "retexture.title": { en: "Retexture Studio", tr: "Doku Değiştirme Stüdyosu" },
    "retexture.subtitle": { en: "Apply new fabrics and textures to existing garments", tr: "Mevcut giysilere yeni kumaş ve dokular uygulayın" },
    "retexture.uploadGarment": { en: "Upload Garment Image", tr: "Giysi Görseli Yükle" },
    "retexture.texturePrompt": { en: "Describe the new texture", tr: "Yeni dokuyu tanımlayın" },
    "retexture.promptPlaceholder": { en: "e.g. 'Velvet burgundy fabric with subtle sheen'", tr: "örn: 'Hafif parıltılı bordo kadife kumaş'" },

    // Resize Page
    "resize.title": { en: "AI Image Resize", tr: "AI Görsel Boyutlandırma" },
    "resize.subtitle": { en: "Expand or upscale your images with AI", tr: "Görsellerinizi AI ile genişletin veya büyütün" },
    "resize.expand": { en: "Expand", tr: "Genişlet" },
    "resize.upscale": { en: "Upscale", tr: "Büyüt" },
    "resize.expandDirection": { en: "Expand Direction", tr: "Genişletme Yönü" },
    "resize.allSides": { en: "All Sides", tr: "Tüm Yönler" },
    "resize.horizontal": { en: "Horizontal", tr: "Yatay" },
    "resize.vertical": { en: "Vertical", tr: "Dikey" },
    "resize.top": { en: "Top", tr: "Üst" },
    "resize.bottom": { en: "Bottom", tr: "Alt" },
    "resize.left": { en: "Left", tr: "Sol" },
    "resize.right": { en: "Right", tr: "Sağ" },
    "resize.expandAmount": { en: "Expand Amount", tr: "Genişletme Miktarı" },
    "resize.expandPrompt": { en: "Content Description (Optional)", tr: "İçerik Açıklaması (İsteğe Bağlı)" },
    "resize.expandPromptPlaceholder": { en: "Describe what should fill the expanded area (e.g. 'seamless fabric pattern', 'studio background')", tr: "Genişletilecek alanı doldurmak için ne olması gerektiğini tanımlayın (örn: 'dikişsiz kumaş deseni', 'stüdyo arka planı')" },
    "resize.expandPromptHint": { en: "AI will generate content matching your image style", tr: "AI görselinizin stiliyle eşleşen içerik oluşturacak" },
    "resize.upscaleFactor": { en: "Upscale Factor", tr: "Büyütme Faktörü" },
    "resize.aiEnhanced": { en: "AI-Enhanced Upscaling", tr: "AI Geliştirilmiş Büyütme" },
    "resize.aiEnhancedDesc": { en: "Uses advanced AI to add realistic details and textures while upscaling.", tr: "Büyütme sırasında gerçekçi detaylar ve dokular eklemek için gelişmiş AI kullanır." },
    "resize.note": { en: "Note", tr: "Not" },
    "resize.upscaleNote": { en: "Higher upscale factors may take longer to process.", tr: "Daha yüksek büyütme faktörleri işlenmesi daha uzun sürebilir." },
    "resize.uploadImage": { en: "Source Image", tr: "Kaynak Görsel" },
    "resize.dropImage": { en: "Drop image or click to upload", tr: "Görsel bırakın veya yüklemek için tıklayın" },
    "resize.processing": { en: "Processing...", tr: "İşleniyor..." },
    "resize.expandNow": { en: "Expand Image", tr: "Görseli Genişlet" },
    "resize.upscaleNow": { en: "Upscale Image", tr: "Görseli Büyüt" },
    "resize.cost": { en: "Cost", tr: "Maliyet" },
    "resize.enhanced": { en: "Enhanced", tr: "Geliştirilmiş" },
    "resize.noResult": { en: "No Result Yet", tr: "Henüz Sonuç Yok" },
    "resize.noResultDesc": { en: "Upload an image and select expand or upscale options to get started.", tr: "Başlamak için bir görsel yükleyin ve genişletme veya büyütme seçeneklerini belirleyin." },
    "resize.expandResult": { en: "Expanded Image", tr: "Genişletilmiş Görsel" },
    "resize.upscaleResult": { en: "Upscaled Image", tr: "Büyütülmüş Görsel" },
    "resize.expandSuccess": { en: "Image expanded successfully!", tr: "Görsel başarıyla genişletildi!" },
    "resize.upscaleSuccess": { en: "Image upscaled successfully!", tr: "Görsel başarıyla büyütüldü!" },



    // Common
    "common.save": { en: "Save", tr: "Kaydet" },
    "common.cancel": { en: "Cancel", tr: "İptal" },
    "common.delete": { en: "Delete", tr: "Sil" },
    "common.edit": { en: "Edit", tr: "Düzenle" },
    "common.prompt": { en: "Prompt", tr: "Prompt" },
    "common.download": { en: "Download", tr: "İndir" },
    "common.reset": { en: "Reset", tr: "Sıfırla" },
    "common.getSpecs": { en: "Get Specs", tr: "Özellikleri Al" },
    "common.viewDetails": { en: "View Details", tr: "Detayları Gör" },
    "common.insufficientCredits": { en: "Insufficient Credits", tr: "Yetersiz Kredi" },

    // Additional Retexture
    "retexture.baseGarment": { en: "Base Garment", tr: "Ana Giysi" },
    "retexture.transfer": { en: "Transfer Texture", tr: "Doku Aktar" },
    "retexture.weaving": { en: "Weaving...", tr: "Dokuma yapılıyor..." },
    "retexture.resultHere": { en: "Result will appear here", tr: "Sonuç burada görünecek" },
    "retexture.success": { en: "Texture Transferred!", tr: "Doku Aktarıldı!" },

    // Sketch to Design
    "sketch.title": { en: "Sketch to Design", tr: "Eskizden Tasarıma" },
    "sketch.desc": { en: "Turn your sketches into realistic products.", tr: "Eskizlerinizi gerçekçi ürünlere dönüştürün." },

    // Additional Community
    "community.newest": { en: "Newest", tr: "En Yeni" },
    "community.topCreator": { en: "Top Creator", tr: "Üst Düzey Yaratıcı" },
    "community.promptLoaded": { en: "Prompt loaded! Click Generate.", tr: "Prompt yüklendi! Oluştur'a tıklayın." },
    "community.promptCopied": { en: "Prompt copied to clipboard", tr: "Prompt panoya kopyalandı" },

    // Additional Studio
    "studio.uploadDesign": { en: "Upload Design", tr: "Tasarım Yükle" },
    "studio.uploadToAnalyze": { en: "Upload a design to generate Technical Analysis", tr: "Teknik analiz oluşturmak için tasarım yükleyin" },

    // Login Page
    "login.welcome": { en: "Welcome back", tr: "Tekrar hoş geldiniz" },
    "login.enterEmail": { en: "Enter your email to sign in to your workspace.", tr: "Çalışma alanınıza giriş yapmak için e-postanızı girin." },
    "login.email": { en: "Email", tr: "E-posta" },
    "login.password": { en: "Password", tr: "Şifre" },
    "login.forgotPassword": { en: "Forgot your password?", tr: "Şifrenizi mi unuttunuz?" },
    "login.signIn": { en: "Sign In", tr: "Giriş Yap" },
    "login.orContinue": { en: "Or continue with", tr: "Veya şununla devam edin" },
    "login.github": { en: "GitHub", tr: "GitHub" },
    "login.noAccount": { en: "Don't have an account?", tr: "Hesabınız yok mu?" },
    "login.signUp": { en: "Sign up", tr: "Kayıt ol" },

    // AI Training
    "train.title": { en: "AI Model Training", tr: "AI Model Eğitimi" },
    "train.subtitle": { en: "Train custom AI models for your brand, garments, and creative style", tr: "Markanız, giysileri ve yaratıcı tarzınız için özel AI modelleri eğitin" },
    "train.modelsReady": { en: "models ready", tr: "model hazır" },
    "train.createNew": { en: "Create New", tr: "Yeni Oluştur" },
    "train.myModels": { en: "My Models", tr: "Modellerim" },
    "train.selectType": { en: "Select Training Type", tr: "Eğitim Türü Seçin" },

    "train.modelTitle": { en: "Model", tr: "Model" },
    "train.modelDesc": { en: "Train a specific human model face/body", tr: "Belirli bir insan yüzü/vücudu eğitin" },
    "train.brandTitle": { en: "Brand Style", tr: "Marka Tarzı" },
    "train.brandDesc": { en: "Train your brand's photography style", tr: "Markanızın fotoğrafçılık tarzını eğitin" },
    "train.garmentTitle": { en: "Garment", tr: "Giysi" },
    "train.garmentDesc": { en: "Train a specific garment or collection", tr: "Belirli bir giysi veya koleksiyonu eğitin" },
    "train.poseTitle": { en: "Pose", tr: "Poz" },
    "train.poseDesc": { en: "Train a specific set of poses", tr: "Belirli bir poz setini eğitin" },

    "train.typeModel": { en: "Model", tr: "Model" },
    "train.typeBrand": { en: "Brand Style", tr: "Marka Tarzı" },
    "train.typeGarment": { en: "Garment", tr: "Giysi" },
    "train.typePose": { en: "Pose", tr: "Poz" },

    "train.modelDetails": { en: "Model Details", tr: "Model Detayları" },
    "train.modelName": { en: "Model Name", tr: "Model Adı" },
    "train.modelNamePlaceholder": { en: "e.g. Summer 2024 Collection", tr: "örn. Yaz 2024 Koleksiyonu" },
    "train.modelDescriptionLabel": { en: "Description / Trigger Word", tr: "Açıklama / Tetikleyici Kelime" },
    "train.modelDescriptionPlaceholder": { en: "e.g. A conceptual shoot with...", tr: "örn. Konsept bir çekim..." },

    "train.uploadImages": { en: "Upload Images", tr: "Görselleri Yükle" },
    "train.dropImages": { en: "Drop images here", tr: "Görselleri buraya bırakın" },
    "train.imageRequirements": { en: "Min 5 images. High quality, diverse angles recommended.", tr: "Min 5 görsel. Yüksek kalite, farklı açılar önerilir." },
    "train.selectImages": { en: "Select Images", tr: "Görselleri Seç" },
    "train.minImages": { en: "images (Min 5)", tr: "görsel (Min 5)" },

    "train.starting": { en: "Starting...", tr: "Başlatılıyor..." },
    "train.startTraining": { en: "Start Training", tr: "Eğitimi Başlat" },
    "train.trainingTime": { en: "Training typically takes 10-20 minutes.", tr: "Eğitim genellikle 10-20 dakika sürer." },
    "train.trainingStarted": { en: "Training started successfully!", tr: "Eğitim başarıyla başlatıldı!" },
    "train.errorMinImages": { en: "Please upload at least 5 images.", tr: "Lütfen en az 5 görsel yükleyin." },

    "train.noModels": { en: "No models found", tr: "Model bulunamadı" },
    "train.noModelsDesc": { en: "You haven't trained any custom models yet.", tr: "Henüz özel bir model eğitmediniz." },
    "train.createFirst": { en: "Create your first model", tr: "İlk modelinizi oluşturun" },
    "train.images": { en: "images", tr: "görsel" },
    "train.useModel": { en: "Use Model", tr: "Modeli Kullan" },
    "train.modelDeleted": { en: "Model deleted", tr: "Model silindi" },
    "train.usingModel": { en: "Using Model", tr: "Kullanılan Model" },
    "train.modelActivated": { en: "Model activated", tr: "Model aktif edildi" },

    // Admin Page
    "admin.title": { en: "Admin Dashboard", tr: "Admin Paneli" },
    "admin.subtitle": { en: "Manage users, permissions and system health.", tr: "Kullanıcıları, yetkileri ve sistem sağlığını yönetin." },
    "admin.onlineUsers": { en: "Online Users", tr: "Çevrimiçi Kullanıcılar" },
    "admin.createNewUser": { en: "Create New User", tr: "Yeni Kullanıcı Oluştur" },
    "admin.username": { en: "Username", tr: "Kullanıcı Adı" },
    "admin.password": { en: "Password", tr: "Şifre" },
    "admin.role": { en: "Role", tr: "Yetki" },
    "admin.brandedTitle": { en: "Branded Title", tr: "Branding Başlığı" },
    "admin.brandedLogo": { en: "Branded Logo", tr: "Branding Logosu" },
    "admin.addUser": { en: "Add User", tr: "Kullanıcı Ekle" },
    "admin.approve": { en: "Approve", tr: "Onayla" },
    "admin.disable": { en: "Disable", tr: "Devre Dışı Bırak" },
    "admin.enable": { en: "Enable", tr: "Etkinleştir" },
    "admin.makeAdmin": { en: "Make Admin", tr: "Admin Yap" },
    "admin.revokeAdmin": { en: "Revoke Admin", tr: "Yetkiyi Al" },
    "admin.authorizedPages": { en: "Authorized Pages", tr: "Yetkili Sayfalar" },
    "admin.customConfig": { en: "Custom UI Config (JSON)", tr: "Özel UI Yapılandırması (JSON)" },
    "admin.deleteUser": { en: "Delete User", tr: "Kullanıcıyı Sil" },
    "admin.deleteConfirm": { en: "Are you sure you want to delete this user? This action cannot be undone.", tr: "Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz." },
    "admin.history": { en: "History", tr: "Geçmişi" },
    "admin.date": { en: "Date", tr: "Tarih" },
    "admin.description": { en: "Description", tr: "Açıklama" },
    "admin.credits": { en: "Credits", tr: "Kredi" },
    "admin.noUsers": { en: "No users registered yet", tr: "Henüz kayıtlı kullanıcı yok" },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("tr");

    useEffect(() => {
        const stored = localStorage.getItem("retoucheroz_language") as Language;
        if (stored) setLanguage(stored);
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("retoucheroz_language", lang);
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);

    const t = (key: string): string => {
        const translation = translations[key];
        if (!translation) return key;
        return translation[language] || translation.en || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within LanguageProvider");
    return context;
}
