import { SavedLighting } from "./photoshoot-shared";

export const STUDIO_STEPS_TR = [
    { icon: "🏢", text: "Stüdyo açılıyor...", detail: "Set hazırlanıyor" },
    { icon: "🔌", text: "Ekipmanlar hazırlanıyor...", detail: "Sistemler kontrol ediliyor" },
    { icon: "💡", text: "Ana ışıklar kuruluyor...", detail: "Key light pozisyonlanıyor" },
    { icon: "✨", text: "Fill light ayarlanıyor...", detail: "Gölge dengeleniyor" },
    { icon: "🌟", text: "Rim light ekleniyor...", detail: "Kontur aydınlatması" },
    { icon: "🎚️", text: "Işık testleri yapılıyor...", detail: "Exposure ölçülüyor" },
    { icon: "📸", text: "Kamera ayarları yapılıyor...", detail: "ISO, aperture, shutter" },
    { icon: "🔍", text: "Capture One açılıyor...", detail: "Auto-focus kalibrasyonu" },
    { icon: "👔", text: "Kıyafetler ütüleniyor...", detail: "Kırışıklıklar gideriliyor" },
    { icon: "🧵", text: "Modeller saç makyaja geçiyor...", detail: "Detaylar inceleniyor" },
    { icon: "📐", text: "Styling düzenleniyor...", detail: "Fit ayarlanıyor" },
    { icon: "🎨", text: "İlk test ve beyaz ayarı yapılıyor...", detail: "White balance ayarı" },
    { icon: "👤", text: "Model set'e alınıyor...", detail: "Pozisyon ayarı" },
    { icon: "💄", text: "Saç makyaj kontrol ediliyor...", detail: "Parlamalar kontrol ediliyor" },
    { icon: "📋", text: "Test çekimi yapılıyor...", detail: "Histogram kontrol" },
    { icon: "🖥️", text: "Fotoğraf çekiliyor...", detail: "GPU hesaplaması" },
    { icon: "⚙️", text: "Görüntü işleniyor...", detail: "Neural network aktif" },
    { icon: "🎞️", text: "Son rötuşlar uygulanıyor...", detail: "Post-processing" },
    { icon: "📷", text: "Fotoğraf oluşturuluyor...", detail: "Export hazırlanıyor" },
];

export const STUDIO_STEPS_EN = [
    { icon: "🚪", text: "Opening studio...", detail: "Preparing set" },
    { icon: "🔌", text: "Powering up equipment...", detail: "Running system checks" },
    { icon: "💡", text: "Setting up key light...", detail: "Positioning main light" },
    { icon: "✨", text: "Adjusting fill light...", detail: "Balancing shadows" },
    { icon: "🌟", text: "Adding rim light...", detail: "Creating contour" },
    { icon: "🎚️", text: "Calibrating light intensity...", detail: "Measuring exposure" },
    { icon: "📸", text: "Configuring camera...", detail: "ISO, aperture, shutter" },
    { icon: "🔍", text: "Checking focus...", detail: "Auto-focus calibration" },
    { icon: "👔", text: "Steaming garments...", detail: "Removing wrinkles" },
    { icon: "🧵", text: "Final stitch check...", detail: "Inspecting details" },
    { icon: "📐", text: "Adjusting styling...", detail: "Perfecting fit" },
    { icon: "🎨", text: "White balance with color card...", detail: "Color calibration" },
    { icon: "👤", text: "Model entering set...", detail: "Taking position" },
    { icon: "💄", text: "Final makeup touchups...", detail: "Checking shine" },
    { icon: "📋", text: "Test shot...", detail: "Histogram check" },
    { icon: "🖥️", text: "Starting AI render...", detail: "GPU processing" },
    { icon: "⚙️", text: "Processing image...", detail: "Neural network active" },
    { icon: "🎞️", text: "Applying final touches...", detail: "Post-processing" },
    { icon: "📷", text: "Generating photo...", detail: "Preparing export" },
];

export const BACKGROUND_PRESETS = [
    { id: "studio", label: "Studio White", labelTr: "Stüdyo Beyaz", preview: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=200&h=200&fit=crop" },
    { id: "street", label: "Urban Street", labelTr: "Şehir Sokağı", preview: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop" },
    { id: "nature", label: "Nature", labelTr: "Doğa", preview: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop" },
    { id: "beach", label: "Beach", labelTr: "Plaj", preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop" },
    { id: "gradient", label: "Gradient", labelTr: "Gradyan", preview: null, color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
];

export const POSE_PRESETS = [
    { id: "standing", label: "Standing", labelTr: "Ayakta", icon: "🧍", preview: null },
    { id: "walking", label: "Walking", labelTr: "Yürüyen", icon: "🚶", preview: null },
    { id: "sitting", label: "Sitting", labelTr: "Oturan", icon: "🪑", preview: null },
    { id: "hands-hips", label: "Hands on Hips", labelTr: "Eller Belde", icon: "💪", preview: null },
    { id: "casual", label: "Casual", labelTr: "Günlük", icon: "😎", preview: null },
    { id: "dynamic", label: "Dynamic", labelTr: "Dinamik", icon: "⚡", preview: null },
];

export const ANGLE_PRESETS = [
    { id: "front-3/4", label: "Front 3/4", labelTr: "Ön 3/4" },
    { id: "back-3/4", label: "Back 3/4", labelTr: "Arka 3/4" },
];

export const ASPECT_RATIOS = [
    { id: "1:1", label: "1:1", labelTr: "1:1 (Kare)" },
    { id: "2:3", label: "2:3", labelTr: "2:3 (Portre)" },
    { id: "3:4", label: "3:4", labelTr: "3:4 (Portre)" },
    { id: "4:3", label: "4:3", labelTr: "4:3 (Yatay)" },
    { id: "16:9", label: "16:9", labelTr: "16:9" },
    { id: "9:16", label: "9:16", labelTr: "9:16" },
];

export const RESOLUTION_OPTIONS = [
    { id: "1K", label: "1K Standard", labelTr: "1K Standart", credits: 50 },
    { id: "2K", label: "2K High", labelTr: "2K Yüksek", credits: 50 },
    { id: "4K", label: "4K Ultra", labelTr: "4K Ultra", credits: 100 },
];
