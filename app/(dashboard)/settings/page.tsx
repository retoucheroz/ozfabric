"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Key, CreditCard, Bell, Shield, LogOut, Moon, Sun, Bot } from "lucide-react"
import { toast } from "sonner"
import { useProjects } from "@/context/projects-context"
import { useLanguage } from "@/context/language-context"
import { useTheme } from "next-themes"

type SettingsSection = "profile" | "api" | "billing" | "notifications" | "security";

function SettingsContent() {
    const { credits, addCredits } = useProjects();
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
    const [apiKey, setApiKey] = useState("")
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [ozzieEnabled, setOzzieEnabled] = useState(false);

    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("retoucheroz_runpod_key");
        if (stored) setApiKey(stored);
        const ozzieStored = localStorage.getItem("ozzie-chat-enabled");
        setOzzieEnabled(ozzieStored === "true");

        // Check for section query param
        const sectionParam = searchParams.get("section");
        if (sectionParam && ["profile", "api", "billing", "notifications", "security"].includes(sectionParam)) {
            setActiveSection(sectionParam as SettingsSection);
        }
    }, [searchParams]);

    const handleSaveKey = () => {
        localStorage.setItem("retoucheroz_runpod_key", apiKey);
        toast.success(t("common.save") + "!");
    };

    const handleTopUp = () => {
        addCredits(500);
        toast.success("500 " + t("settings.credits") + " added!");
    };

    const sections = [
        { id: "profile" as SettingsSection, label: t("settings.profile"), icon: User },
        { id: "api" as SettingsSection, label: t("settings.apiKeys"), icon: Key },
        { id: "billing" as SettingsSection, label: t("settings.billing"), icon: CreditCard },
        { id: "notifications" as SettingsSection, label: t("settings.notifications"), icon: Bell },
        { id: "security" as SettingsSection, label: t("settings.security"), icon: Shield },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r bg-[var(--bg-surface)] p-4 space-y-1">
                {sections.map((section) => (
                    <Button
                        key={section.id}
                        variant="ghost"
                        className={`w-full justify-start ${activeSection === section.id ? 'font-semibold bg-[var(--bg-elevated)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'}`}
                        onClick={() => setActiveSection(section.id)}
                    >
                        <section.icon className={`w-4 h-4 mr-2 ${activeSection === section.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}`} />
                        {section.label}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl space-y-8">

                    {/* Profile Section */}
                    {activeSection === "profile" && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5" /> {t("settings.userProfile")}</h2>
                            <Card className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                        RO
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">Retoucheroz Designer</div>
                                        <div className="text-sm text-muted-foreground">designer@retoucheroz.ai</div>
                                    </div>
                                    <Button variant="outline">{t("common.edit")}</Button>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t("settings.fullName")}</Label>
                                        <Input defaultValue="Retoucheroz Designer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.email")}</Label>
                                        <Input defaultValue="designer@retoucheroz.ai" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("settings.company")}</Label>
                                    <Input placeholder={t("settings.company")} />
                                </div>
                                <Button className="bg-violet-500 text-white hover:bg-violet-600">{t("settings.saveChanges")}</Button>
                            </Card>

                            {/* Theme Toggle */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.theme")}</Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.themeDesc")}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sun className="w-4 h-4" />
                                        <Switch
                                            checked={mounted && theme === "dark"}
                                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                        />
                                        <Moon className="w-4 h-4" />
                                    </div>
                                </div>
                            </Card>

                            {/* Ozzie Chat Toggle */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-violet-500" />
                                            {t("settings.ozzieChat")}
                                        </Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.ozzieChatDesc")}</div>
                                    </div>
                                    <Switch
                                        checked={ozzieEnabled}
                                        onCheckedChange={(checked) => {
                                            setOzzieEnabled(checked);
                                            localStorage.setItem("ozzie-chat-enabled", checked ? "true" : "false");
                                            window.dispatchEvent(new Event("ozzie-toggle"));
                                        }}
                                    />
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* API Key Section */}
                    {activeSection === "api" && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Key className="w-5 h-5" /> {t("settings.aiConfig")}</h2>
                            <Card className="p-6 space-y-4 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10">
                                <div>
                                    <h3 className="font-medium">{t("settings.runpodKey")}</h3>
                                    <p className="text-sm text-muted-foreground">{t("settings.runpodDesc")}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        placeholder="rp_xxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <Button onClick={handleSaveKey} className="bg-violet-500 text-white hover:bg-violet-600">{t("common.save")}</Button>
                                </div>
                            </Card>
                            <Card className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-medium">Replicate API Key</h3>
                                    <p className="text-sm text-muted-foreground">Optional: Use Replicate for additional AI models.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Input type="password" placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxx" />
                                    <Button variant="outline">{t("common.save")}</Button>
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Billing Section */}
                    {activeSection === "billing" && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" /> {t("settings.billingCredits")}</h2>
                            <Card className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-medium">{t("settings.currentBalance")}</h3>
                                        <p className="text-3xl font-bold">{credits} <span className="text-sm font-normal text-muted-foreground">{t("settings.credits")}</span></p>
                                    </div>
                                    <Button size="lg" onClick={handleTopUp} className="bg-violet-500 text-white hover:bg-violet-600 font-semibold">{t("settings.topUp")} (+500)</Button>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
                                        <div>
                                            <div className="font-medium">{t("settings.proPlan")}</div>
                                            <div className="text-xs text-muted-foreground">{t("settings.billedMonthly")}</div>
                                        </div>
                                        <Badge className="bg-violet-500 text-white">{t("settings.active")}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{t("settings.nextBilling")}: Feb 14, 2026</p>
                                </div>
                            </Card>
                            <Card className="p-6">
                                <h3 className="font-medium mb-4">{t("settings.paymentMethod")}</h3>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                                        <div>
                                            <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                                            <div className="text-xs text-muted-foreground">Expires 12/28</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">{t("settings.update")}</Button>
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Notifications Section */}
                    {activeSection === "notifications" && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5" /> {t("settings.notifications")}</h2>
                            <Card className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.pushNotifications")}</Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.pushDesc")}</div>
                                    </div>
                                    <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.emailUpdates")}</Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.emailUpdatesDesc")}</div>
                                    </div>
                                    <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.marketingEmails")}</Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.marketingDesc")}</div>
                                    </div>
                                    <Switch />
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Security Section */}
                    {activeSection === "security" && (
                        <section className="space-y-4 animate-in fade-in duration-300">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" /> {t("settings.security")}</h2>
                            <Card className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-medium">{t("settings.changePassword")}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{t("settings.changePasswordDesc")}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>{t("settings.currentPassword")}</Label>
                                        <Input type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.newPassword")}</Label>
                                        <Input type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("settings.confirmPassword")}</Label>
                                        <Input type="password" />
                                    </div>
                                </div>
                                <Button className="bg-violet-500 text-white hover:bg-violet-600">{t("settings.updatePassword")}</Button>
                            </Card>
                            <Card className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>{t("settings.twoFactor")}</Label>
                                        <div className="text-sm text-muted-foreground">{t("settings.twoFactorDesc")}</div>
                                    </div>
                                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                                </div>
                            </Card>
                            <Card className="p-6 border-red-200 dark:border-red-900">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-red-500">{t("settings.deleteAccount")}</h3>
                                        <p className="text-sm text-muted-foreground">{t("settings.deleteAccountDesc")}</p>
                                    </div>
                                    <Button variant="destructive">{t("common.delete")}</Button>
                                </div>
                            </Card>
                        </section>
                    )}

                    <div className="pt-8">
                        <Button variant="outline" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4" /> {t("settings.logOut")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    )
}
