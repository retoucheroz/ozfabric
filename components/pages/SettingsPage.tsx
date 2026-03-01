"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Key, CreditCard, Bell, Shield, LogOut, Moon, Sun, Bot, Trash2, Globe } from "lucide-react"
import { toast } from "sonner"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"

type SettingsSection = "profile" | "billing" | "notifications" | "security";

function SettingsContent() {
    const { credits, addCredits } = useProjects();
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();
    const searchParams = useSearchParams();
    const initialSection = (searchParams.get("tab") as SettingsSection) || "profile";
    const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<{
        name?: string,
        email?: string,
        username?: string,
        role?: string,
        avatar?: string,
        createdAt?: number
    } | null>(null);

    const fetchSession = async () => {
        try {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
                const data = await res.json();
                if (data?.user) {
                    setUser(data.user);
                }
            }
        } catch (e) {
            console.error("Session fetch failed", e);
        }
    };

    useEffect(() => {
        setMounted(true);

        fetchSession();

        // Sync section with URL if it changes
        const tab = searchParams.get("tab") as SettingsSection;
        if (tab && ["profile", "api", "billing", "notifications", "security"].includes(tab)) {
            setActiveSection(tab);
        }
    }, [searchParams]);



    const handleTopUp = () => {
        toast.info(language === 'tr' ? "Kredi eklemek için lütfen yönetici ile iletişime geçin." : "Please contact administrator to add credits.");
    };

    const sections = [
        { id: "profile" as SettingsSection, label: t("settings.profile"), icon: User },
        { id: "billing" as SettingsSection, label: t("settings.billing"), icon: CreditCard },
        { id: "notifications" as SettingsSection, label: t("settings.notifications"), icon: Bell },
        { id: "security" as SettingsSection, label: t("settings.security"), icon: Shield },
    ];

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
            {/* Navigation - Mobile: Horizontal Scroll, Desktop: Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-[var(--bg-sidebar)]/50 p-2 md:p-4 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex flex-row md:flex-col gap-1 min-w-max md:min-w-0">
                    {sections.map((section) => (
                        <Button
                            key={section.id}
                            variant="ghost"
                            className={cn(
                                "justify-start transition-all px-4 py-2 h-auto md:h-10 rounded-xl whitespace-nowrap",
                                activeSection === section.id
                                    ? "bg-[var(--accent-soft)] text-[var(--accent-primary)] font-black shadow-sm"
                                    : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)]/30 hover:text-[var(--text-primary)]"
                            )}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon className={cn("w-4 h-4 mr-0 md:mr-2", activeSection === section.id ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]")} />
                            <span className="hidden md:inline font-bold text-xs uppercase tracking-widest">{section.label}</span>
                            <span className="md:hidden text-[10px] font-black uppercase tracking-tighter mt-1">{section.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-thin scrollbar-thumb-[var(--border-subtle)] scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* Profile Section */}
                    {activeSection === "profile" && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                                        <User className="w-6 h-6" />
                                    </div>
                                    {t("settings.userProfile")}
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-13">
                                    {t("settings.profileDesc") || "PERSONAL INFORMATION & ACCOUNT SETTINGS"}
                                </p>
                            </div>

                            <Card className="p-6 md:p-8 space-y-8 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] overflow-hidden relative shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 blur-3xl rounded-full -mr-16 -mt-16" />

                                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--accent-primary)] to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-[var(--accent-primary)]/20 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.name?.substring(0, 2).toUpperCase() || (user?.email?.substring(0, 2).toUpperCase() || 'U')
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-lg hover:text-[var(--accent-primary)] flex items-center justify-center cursor-pointer transition-all active:scale-90">
                                            <Bot className="w-4 h-4" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = async (ev) => {
                                                        const base64 = ev.target?.result as string;
                                                        // Update avatar local state
                                                        setUser(prev => prev ? { ...prev, avatar: base64 } : null);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="text-xl font-black uppercase italic tracking-tight text-[var(--text-primary)]">
                                            {user?.name || user?.email || t("common.user")}
                                        </div>
                                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                            {user?.email || user?.email}
                                        </div>
                                        <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                                            <Badge variant="outline" className="border-[var(--accent-primary)]/20 text-[var(--accent-primary)] bg-[var(--accent-soft)] text-[9px] font-black uppercase tracking-widest">
                                                {user?.role === 'admin' ? 'ADMIN PLAN' : 'FREE PLAN'}
                                            </Badge>
                                            <Badge variant="outline" className="border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-surface)] text-[9px] font-black uppercase tracking-widest">
                                                EST. {user?.createdAt ? new Date(user.createdAt).getFullYear() : 2025}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="rounded-xl border-[var(--border-subtle)] font-black uppercase tracking-widest text-[10px] h-10 px-6 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)] transition-all shrink-0">
                                        {t("common.edit")}
                                    </Button>
                                </div>

                                <Separator className="bg-[var(--border-subtle)]" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{t("settings.fullName")}</Label>
                                        <Input
                                            id="settings-name"
                                            defaultValue={user?.name || ""}
                                            key={user?.name}
                                            className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl px-4 font-bold focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{t("settings.email")}</Label>
                                        <Input
                                            defaultValue={user?.email || ""}
                                            key={user?.email}
                                            disabled
                                            className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl px-4 font-bold opacity-50 text-[var(--text-primary)]"
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full sm:w-auto h-12 px-10 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[var(--accent-primary)]/20 transition-all active:scale-95 text-xs"
                                    onClick={async () => {
                                        const nameInput = document.getElementById('settings-name') as HTMLInputElement;
                                        const name = nameInput.value;
                                        const avatar = user?.avatar;

                                        try {
                                            const res = await fetch('/api/user/profile', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name, avatar })
                                            });
                                            if (res.ok) {
                                                toast.success(t("settings.saveSuccess") || "Değişiklikler kaydedildi.");
                                                fetchSession();
                                            } else {
                                                toast.error("Hata oluştu.");
                                            }
                                        } catch (e) {
                                            toast.error("Hata oluştu.");
                                        }
                                    }}
                                >
                                    {t("settings.saveChanges")}
                                </Button>
                            </Card>

                            {/* Appearance & Experience */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* Language Switcher */}
                                <Card className="p-6 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] overflow-hidden shadow-lg transition-all hover:border-[var(--accent-primary)]/30 group">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
                                                {t("settings.language") || "SELECT LANGUAGE"}
                                            </Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter">
                                                {language === 'tr' ? 'UYGULAMA DİLİNİ SEÇİN' : 'SELECT APP LANGUAGE'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                    language === "tr" ? "bg-[var(--accent-soft)] text-[var(--accent-primary)] border-[var(--accent-primary)]/30" : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                                                )}
                                                onClick={() => setLanguage("tr")}
                                            >
                                                🇹🇷 TR
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "flex-1 h-8 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                    language === "en" ? "bg-[var(--accent-soft)] text-[var(--accent-primary)] border-[var(--accent-primary)]/30" : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                                                )}
                                                onClick={() => setLanguage("en")}
                                            >
                                                🇬🇧 EN
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>
                    )}



                    {/* Billing Section */}
                    {activeSection === "billing" && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    {t("settings.billingCredits")}
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-13">
                                    {t("settings.billingDesc") || "BALANCE, SUBSCRIPTIONS & PAYMENTS"}
                                </p>
                            </div>

                            <Card className="p-8 space-y-8 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] overflow-hidden relative shadow-xl">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-primary)]/5 blur-3xl rounded-full -mr-24 -mt-24" />

                                <div className="space-y-4 relative z-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--bg-surface)] p-6 rounded-[24px] border border-[var(--border-subtle)] transition-all hover:border-[var(--accent-primary)]/30 gap-4">
                                        <div className="text-center sm:text-left">
                                            <div className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{t("settings.proPlan")}</div>
                                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter mt-1">{t("settings.billedMonthly")}</div>
                                        </div>
                                        <Badge className="bg-[var(--accent-primary)] text-white px-4 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase">{t("settings.active")}</Badge>
                                    </div>
                                    <p className="text-[10px] text-center sm:text-left font-black text-[var(--text-muted)] uppercase tracking-widest px-2 italic">
                                        {t("settings.nextBilling")}: Feb 14, 2026
                                    </p>
                                </div>
                            </Card>

                            <Card className="p-8 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] shadow-xl">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">{t("settings.paymentMethod")}</h3>
                                <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[24px] gap-4">
                                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                        <div className="w-14 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white text-[10px] font-black italic shadow-lg shrink-0">VISA</div>
                                        <div>
                                            <div className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">•••• •••• •••• 4242</div>
                                            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter mt-1">Expires 12/28</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="rounded-xl border-[var(--border-subtle)] font-black uppercase tracking-widest text-[9px] h-9 px-4 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)] transition-all w-full sm:w-auto">
                                        {t("settings.update")}
                                    </Button>
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Notifications Section */}
                    {activeSection === "notifications" && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    {t("settings.notifications")}
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-13">
                                    {t("settings.notificationsDesc") || "PREFERENCES, ALERTS & UPDATES"}
                                </p>
                            </div>

                            <Card className="p-8 space-y-8 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] shadow-xl">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t("settings.pushNotifications")}</Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-70">{t("settings.pushDesc")}</div>
                                        </div>
                                        <Switch
                                            checked={notificationsEnabled}
                                            onCheckedChange={setNotificationsEnabled}
                                            className="data-[state=checked]:bg-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <Separator className="bg-[var(--border-subtle)]" />

                                    <div className="flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t("settings.emailUpdates")}</Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-70">{t("settings.emailUpdatesDesc")}</div>
                                        </div>
                                        <Switch
                                            checked={emailUpdates}
                                            onCheckedChange={setEmailUpdates}
                                            className="data-[state=checked]:bg-[var(--accent-primary)]"
                                        />
                                    </div>

                                    <Separator className="bg-[var(--border-subtle)]" />

                                    <div className="flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t("settings.marketingEmails")}</Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-70">{t("settings.marketingDesc")}</div>
                                        </div>
                                        <Switch className="data-[state=checked]:bg-[var(--accent-primary)]" />
                                    </div>
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Security Section */}
                    {activeSection === "security" && (
                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    {t("settings.security")}
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-13">
                                    {t("settings.securityDesc") || "PASSWORD & ACCOUNT PROTECTION"}
                                </p>
                            </div>

                            <Card className="p-8 space-y-8 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] shadow-xl">
                                <div>
                                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">{t("settings.changePassword")}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter opacity-70">{t("settings.changePasswordDesc")}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{t("settings.currentPassword")}</Label>
                                        <Input
                                            type="password"
                                            className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl px-4 font-bold focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{t("settings.newPassword")}</Label>
                                            <Input
                                                type="password"
                                                className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl px-4 font-bold focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">{t("settings.confirmPassword")}</Label>
                                            <Input
                                                type="password"
                                                className="h-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-2xl px-4 font-bold focus:ring-1 focus:ring-[var(--accent-primary)]/30 text-[var(--text-primary)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full sm:w-auto h-12 px-10 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[var(--accent-primary)]/20 transition-all active:scale-95 text-xs">
                                    {t("settings.updatePassword")}
                                </Button>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-6 bg-[var(--bg-sidebar)] border-[var(--border-subtle)] rounded-[32px] shadow-lg transition-all hover:border-[var(--accent-primary)]/30">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t("settings.twoFactor")}</Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-70">{t("settings.twoFactorDesc")}</div>
                                        </div>
                                        <Switch
                                            checked={twoFactorEnabled}
                                            onCheckedChange={setTwoFactorEnabled}
                                            className="data-[state=checked]:bg-[var(--accent-primary)]"
                                        />
                                    </div>
                                </Card>

                                <Card className="p-6 bg-[var(--bg-sidebar)] border-red-500/20 rounded-[32px] shadow-lg border relative overflow-hidden group hover:bg-red-500/[0.02] transition-colors">
                                    <div className="flex items-center justify-between relative z-10 gap-4">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t("settings.deleteAccount")}</Label>
                                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-70">{t("settings.deleteAccountDesc")}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500 hover:text-white rounded-xl shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </section>
                    )}

                    <div className="pt-8 flex justify-center md:justify-start">
                        <Button variant="ghost" className="gap-2 text-red-500 hover:text-white hover:bg-red-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl px-6 h-12 transition-all">
                            <LogOut className="w-4 h-4" /> {t("settings.logOut")}
                        </Button>
                    </div>
                </div>

                {/* Global Styles for hidden scrollbar */}
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </div>
        </div >
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    )
}
