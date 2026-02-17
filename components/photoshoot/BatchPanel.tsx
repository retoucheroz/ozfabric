import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, Shirt, Briefcase, Glasses, GraduationCap, Sparkles, Pencil } from "lucide-react";

interface BatchShot {
    id: string;
    label: string;
    labelEn: string;
    descriptionTr?: string;
    descriptionEn?: string;
    image?: string;
}

interface BatchPanelProps {
    language: string;
    batchMode: boolean;
    setBatchMode: (val: boolean) => void;
    productCode: string;
    setProductCode: (val: string) => void;
    availableBatchShots: BatchShot[];
    batchShotSelection: Record<string, boolean>;
    setBatchShotSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isAdmin?: boolean;
    isMaviBatch?: boolean;
    setIsMaviBatch?: (val: boolean) => void;
    stylingSideOnly: Record<string, boolean>;
    setStylingSideOnly: (val: Record<string, boolean>) => void;
    techAccessories: Record<string, boolean>;
    setTechAccessories: (val: Record<string, boolean>) => void;
    assets: Record<string, string | null>;
}

export function BatchPanel({
    language,
    productCode,
    setProductCode,
    availableBatchShots,
    batchShotSelection,
    setBatchShotSelection,
    isAdmin,
    isMaviBatch,
    setIsMaviBatch,
    stylingSideOnly,
    setStylingSideOnly,
    techAccessories,
    setTechAccessories,
    assets
}: BatchPanelProps) {
    const isMaviActive = isAdmin && isMaviBatch;

    // Helper to check if an accessory asset exists
    const hasAsset = (key: string) => !!assets[key];

    const accessories = [
        { id: 'jacket', label: 'Ceket/Dış', labelEn: 'Jacket/Outer', icon: Shirt },
        { id: 'bag', label: 'Çanta', labelEn: 'Bag', icon: Briefcase },
        { id: 'glasses', label: 'Gözlük', labelEn: 'Glasses', icon: Glasses },
        { id: 'hat', label: 'Şapka', labelEn: 'Hat', icon: GraduationCap },
        { id: 'jewelry', label: 'Takı', labelEn: 'Jewelry', icon: Sparkles },
        { id: 'belt', label: 'Kemer', labelEn: 'Belt', icon: Pencil },
    ];

    const activeAccessories = accessories.filter(acc => hasAsset(acc.id));

    return (
        <div className={cn(
            "rounded-2xl transition-all duration-300 space-y-6",
            isMaviActive ? "" : ""
        )}>
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                        {language === 'tr' ? 'Toplu Üretim' : 'Batch Production'}
                    </h3>
                    {isAdmin && setIsMaviBatch && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <span className="text-[9px] font-bold text-blue-600 uppercase">MAVI</span>
                            <Switch checked={isMaviBatch} onCheckedChange={setIsMaviBatch} className="scale-75" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in duration-300">
                {/* Product Code */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-2">
                        {language === 'tr' ? 'Ürün Kodu' : 'Product Code'}
                    </label>
                    <input
                        type="text"
                        className={cn(
                            "w-full text-xs p-3 rounded-xl border transition-all duration-200 outline-none",
                            isMaviActive
                                ? "border-blue-200 dark:border-blue-800 bg-white dark:bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/10"
                        )}
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        placeholder={language === 'tr' ? "Örn: 23132_6546" : "e.g. 23132_6546"}
                    />
                </div>

                {/* Shot Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                        {language === 'tr' ? 'Açı ve Kare Seçimleri' : 'Angle & Shot Selection'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableBatchShots.map((shot, idx) => {
                            const isSelected = batchShotSelection[shot.id] ?? false;
                            const hasSideOption = shot.id.includes('styling');

                            return (
                                <div
                                    key={shot.id}
                                    className={cn(
                                        "relative aspect-square rounded-xl border transition-all duration-300 overflow-hidden group cursor-pointer",
                                        isSelected
                                            ? (isMaviActive ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg" : "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-lg")
                                            : "border-[var(--border-subtle)] opacity-40 grayscale bg-[var(--bg-elevated)]"
                                    )}
                                    onClick={() => setBatchShotSelection(prev => ({ ...prev, [shot.id]: !isSelected }))}
                                >
                                    <div className="w-full h-full relative">
                                        {shot.image ? (
                                            <img src={shot.image} alt={shot.label} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                                <Shirt className="w-4 h-4 opacity-20" />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                            <p className="text-[8px] font-black text-white truncate leading-tight uppercase">
                                                {language === 'tr' ? shot.label : shot.labelEn}
                                            </p>
                                        </div>

                                        <div className="absolute top-1.5 left-1.5">
                                            <div className={cn(
                                                "w-4 h-4 rounded-md flex items-center justify-center border transition-all",
                                                isSelected
                                                    ? (isMaviActive ? "bg-blue-600 border-blue-400 text-white" : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white")
                                                    : "bg-white/20 border-white/40 text-transparent"
                                            )}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                        </div>

                                        {hasSideOption && isSelected && (
                                            <div
                                                className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-[7px] font-bold text-white">YNC</span>
                                                <Switch
                                                    className="scale-50 origin-right"
                                                    checked={stylingSideOnly[shot.id] || false}
                                                    onCheckedChange={(val) => setStylingSideOnly({ ...stylingSideOnly, [shot.id]: val })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Technical Accessory Control */}
                {activeAccessories.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] space-y-3">
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider block">
                                {language === 'tr' ? 'Teknik Çekim Aksesuarları' : 'Technical Shot Accessories'}
                            </label>
                            <p className="text-[9px] text-[var(--text-muted)] font-medium mt-1">
                                {language === 'tr'
                                    ? 'Teknik/Detail karelerde kullanılacak aksesuarları seçin (Styling karelerde otomatik dahil edilir)'
                                    : 'Select accessories for technical/detail shots (automatically included in styling shots)'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {activeAccessories.map(acc => {
                                const Icon = acc.icon;
                                const isActive = techAccessories[acc.id];
                                return (
                                    <div
                                        key={acc.id}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                                            isActive
                                                ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30"
                                                : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30"
                                        )}
                                        onClick={() => setTechAccessories({ ...techAccessories, [acc.id]: !isActive })}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg flex items-center justify-center",
                                                isActive ? "bg-[var(--accent-primary)] text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Icon size={12} />
                                            </div>
                                            <span className="text-[10px] font-bold text-[var(--text-primary)]">
                                                {language === 'tr' ? acc.label : acc.labelEn}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={isActive}
                                            onCheckedChange={(val) => setTechAccessories({ ...techAccessories, [acc.id]: val })}
                                            className="scale-75"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
