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
    productDescription: string | null;
    setProductDescription: (val: string | null) => void;
    techAccessoryDescriptions: Record<string, string>;
    setTechAccessoryDescriptions: (val: Record<string, string>) => void;
    productName: string;
    selectedMoodId: string;
    setWizardStep?: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
    setActiveGroup?: (group: 'product' | 'accessories' | null) => void;
    setActiveLibraryAsset?: (asset: string | null) => void;
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
    assets,
    productDescription,
    setProductDescription,
    techAccessoryDescriptions,
    setTechAccessoryDescriptions,
    productName,
    selectedMoodId,
    setWizardStep,
    setActiveGroup,
    setActiveLibraryAsset
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
                        {language === 'tr' ? 'Üretim' : 'Production'}
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

                {/* Editor Summary (Missing Configurations) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-2">
                        {language === 'tr' ? 'Düzenlenebilir Çekim Seçenekleri' : 'Editable Shoot Options'}
                    </label>
                    <div className="w-full flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200 bg-[var(--bg-elevated)] border-[var(--border-subtle)] overflow-hidden">
                        {(() => {
                            const unselectedItems: { key: string; labelTr: string; labelEn: string; group: string }[] = [];

                            const itemsToCheck = [
                                { key: 'model', labelTr: 'Stüdyo Mankeni', labelEn: 'Studio Model', group: 'product' },
                                { key: 'background', labelTr: 'Arka Plan', labelEn: 'Background', group: 'product' },
                                { key: 'bag', labelTr: 'Çanta', labelEn: 'Bag', group: 'accessories' },
                                { key: 'glasses', labelTr: 'Gözlük', labelEn: 'Glasses', group: 'accessories' },
                                { key: 'hat', labelTr: 'Şapka', labelEn: 'Hat', group: 'accessories' },
                                { key: 'jacket', labelTr: 'Dış Giyim', labelEn: 'Outerwear', group: 'accessories' },
                                { key: 'jewelry', labelTr: 'Takı', labelEn: 'Jewelry', group: 'accessories' }
                            ];

                            itemsToCheck.forEach(item => {
                                if (!assets[item.key]) {
                                    unselectedItems.push(item);
                                }
                            });

                            if (unselectedItems.length === 0) {
                                return (
                                    <div className="text-xs text-green-500 font-medium">
                                        {language === 'tr' ? 'Birlikte kombinlemek için tüm temel elemanlar seçili!' : 'All basic elements selected for styling!'}
                                    </div>
                                );
                            }

                            return unselectedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                        {language === 'tr' ? item.labelTr : item.labelEn}
                                        <span className="text-red-400 ml-2 italic font-normal text-[10px] opacity-80">
                                            {language === 'tr' ? 'seçilmedi' : 'not selected'}
                                        </span>
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (setWizardStep) {
                                                setWizardStep(2);
                                            }
                                            if (setActiveGroup && setActiveLibraryAsset) {
                                                setActiveGroup(item.group as any);
                                                setActiveLibraryAsset(item.key);
                                            }
                                        }}
                                        className="text-[10px] font-bold text-[var(--accent-primary)] hover:underline uppercase px-2"
                                    >
                                        {language === 'tr' ? 'Düzenle' : 'Edit'}
                                    </button>
                                </div>
                            ));

                        })()}
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

                        <div className="space-y-2">
                            {activeAccessories.map(acc => {
                                const Icon = acc.icon;
                                const isActive = techAccessories[acc.id];
                                const description = techAccessoryDescriptions[acc.id] || "";

                                return (
                                    <div key={acc.id} className="space-y-2">
                                        <div
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30 shadow-sm"
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
                                                onClick={(e) => e.stopPropagation()}
                                                className="scale-75"
                                            />
                                        </div>

                                        {isActive && (
                                            <div className="px-1 animate-in slide-in-from-top-1 duration-200">
                                                <input
                                                    type="text"
                                                    className="w-full text-[10px] p-2.5 rounded-lg border bg-white dark:bg-background border-[var(--border-subtle)] focus:border-[var(--accent-primary)] outline-none transition-all"
                                                    value={description}
                                                    onChange={(e) => setTechAccessoryDescriptions({
                                                        ...techAccessoryDescriptions,
                                                        [acc.id]: e.target.value
                                                    })}
                                                    placeholder={language === 'tr'
                                                        ? `${acc.label} tanımı (örn: küpe, bileklik...)`
                                                        : `${acc.labelEn} description (e.g. earring, bracelet...)`}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        )}
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
