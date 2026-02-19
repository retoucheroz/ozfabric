# Photoshoot Hook Architecture

Yeni kod yazarken şu kurallara uy:

## Hook Sorumlulukları
- useAssetManager     → upload, resize, remove
- useLibraryState     → kaydetme, silme, kütüphane CRUD
- useDialogState      → dialog aç/kapat, temp data
- useGenerationEngine → API çağrıları, batch generation
- usePhotoshootWorkflow → wizard step, workflow state

## Kurallar
- page.tsx MAX 50 satır olmalı
- Hiçbir hook 1000 satırı geçemez
- Yeni feature → önce hangi hook'a gideceğine karar ver
- photoshoot/ klasörüne direkt kod yazma