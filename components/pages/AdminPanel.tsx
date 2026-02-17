"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    UserCheck,
    UserMinus,
    Shield,
    Layout,
    RefreshCw,
    Activity,
    Settings2,
    Trash2,
    Plus,
    X,
    Image as ImageIcon
} from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/auth-types"
import { useLanguage } from "@/context/language-context"

const AVAILABLE_PAGES = [
    { label: 'Photoshoot (AI Model)', path: '/photoshoot' },
    { label: 'Batch Mode (Photoshoot)', path: 'photoshoot:batch' },
    { label: 'Try-On', path: '/try-on' },
    { label: 'Editorial', path: '/editorial' },
    { label: 'Video', path: '/video' },
    { label: 'Face & Head Swap', path: '/face-head-swap' },
    { label: 'E-Com', path: '/ecom' },
    { label: 'Analysis', path: '/analysis' },
    { label: 'Studio (Tech Pack)', path: '/studio' },
    { label: 'Train', path: '/train' },
    { label: 'Ghost Mannequin', path: '/ghost' },
    { label: 'Sketch to Photo', path: '/sketch' },
    { label: 'Patterns', path: '/patterns' },
];

const getAdminHeaders = () => {
    return { 'Content-Type': 'application/json' };
};

export default function AdminPanel() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<Omit<User, 'passwordHash'>[]>([]);
    const [onlineStats, setOnlineStats] = useState<{ onlineCount: number, users: string[] }>({ onlineCount: 0, users: [] });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const headers = getAdminHeaders();
            const [usersRes, onlineRes] = await Promise.all([
                fetch('/api/admin/users', { headers }),
                fetch('/api/admin/online', { headers })
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (onlineRes.ok) setOnlineStats(await onlineRes.json());
        } catch (error) {
            toast.error("Failed to fetch admin data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateUser = async (username: string, updates: Partial<User>) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: getAdminHeaders(),
                body: JSON.stringify({ username, updates })
            });
            if (res.ok) {
                toast.success(`User ${username} updated`);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update user");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const deleteUser = async (username: string) => {
        if (!confirm(t('admin.deleteConfirm'))) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: getAdminHeaders(),
                body: JSON.stringify({ username })
            });
            if (res.ok) {
                toast.success(`User ${username} deleted`);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete user");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const togglePageAccess = (user: Omit<User, 'passwordHash'>, path: string) => {
        const current = user.authorizedPages || [];
        const updated = current.includes(path)
            ? current.filter(p => p !== path)
            : [...current, path];
        updateUser(user.username, { authorizedPages: updated });
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('admin.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Card className="flex items-center gap-4 px-4 py-2 bg-violet-500/5 border-violet-500/20">
                        <Activity className="w-5 h-5 text-violet-500" />
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('admin.onlineUsers')}</p>
                            <p className="text-xl font-bold text-violet-600 leading-none">{onlineStats.onlineCount}</p>
                        </div>
                    </Card>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            <Card className="border-violet-500/20 bg-zinc-50/50 dark:bg-background/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-500" /> {t('admin.createNewUser')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-wrap items-end gap-4" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const username = formData.get('username') as string;
                        const password = formData.get('password') as string;
                        const role = formData.get('role') as string;
                        const customTitle = formData.get('customTitle') as string;

                        if (!username || !password) return toast.error(t('login.errorBothImages'));

                        try {
                            const res = await fetch('/api/admin/users', {
                                method: 'POST',
                                headers: getAdminHeaders(),
                                body: JSON.stringify({ username, password, role, customTitle })
                            });
                            if (res.ok) {
                                toast.success(t('admin.addUser'));
                                fetchData();
                                (e.target as HTMLFormElement).reset();
                            } else {
                                const data = await res.json();
                                toast.error(data.error || "Hata oluştu");
                            }
                        } catch (err) {
                            toast.error("İşlem başarısız");
                        }
                    }}>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label htmlFor="username">{t('admin.username')}</Label>
                            <Input id="username" name="username" placeholder="örn: mehmet" required />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label htmlFor="password">{t('admin.password')}</Label>
                            <Input id="password" name="password" type="password" placeholder="••••••••" required />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label htmlFor="customTitle">{t('admin.brandedTitle')}</Label>
                            <Input id="customTitle" name="customTitle" placeholder="örn: Autography" />
                        </div>
                        <div className="space-y-1.5 w-[140px]">
                            <Label htmlFor="role">{t('admin.role')}</Label>
                            <select
                                id="role"
                                name="role"
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:ring-2 ring-violet-500 outline-none"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                            {t('admin.addUser')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <Card key={user.username} className={`border-2 transition-all flex flex-col min-w-0 ${user.status === 'pending' ? 'border-amber-500/30' : 'border-muted'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${onlineStats.users.includes(user.username) ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                                    <CardTitle className="text-sm font-black break-all flex-1">{user.username}</CardTitle>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                    {user.authType === 'google' && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                                            </svg>
                                            Google
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {user.status === 'pending' && (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">{user.status}</Badge>
                                    )}
                                    {user.status === 'disabled' && (
                                        <Badge variant="destructive">{user.status}</Badge>
                                    )}
                                    {user.username !== 'admin' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                            onClick={() => deleteUser(user.username)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                                Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-2 gap-2">
                                {user.status === 'pending' ? (
                                    <Button size="sm" className="col-span-2 bg-green-600 hover:bg-green-700" onClick={() => updateUser(user.username, { status: 'active' })}>
                                        <RefreshCw className="w-4 h-4 mr-2" /> {t('admin.approve')}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="sm"
                                            variant={user.status === 'active' ? 'destructive' : 'default'}
                                            className="w-full font-bold"
                                            onClick={() => updateUser(user.username, { status: user.status === 'active' ? 'disabled' : 'active' })}
                                            disabled={user.username === 'admin'}
                                        >
                                            {user.status === 'active' ? <UserMinus className="w-4 h-4 mr-2 shrink-0" /> : <UserCheck className="w-4 h-4 mr-2 shrink-0" />}
                                            <span className="truncate">{user.status === 'active' ? t('admin.disable') : t('admin.enable')}</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full font-bold"
                                            onClick={() => updateUser(user.username, { role: user.role === 'admin' ? 'user' : 'admin' })}
                                            disabled={user.username === 'admin'}
                                        >
                                            <Shield className={`w-4 h-4 mr-2 shrink-0 ${user.role === 'admin' ? 'text-violet-500' : ''}`} />
                                            <span className="truncate">{user.role === 'admin' ? t('admin.revokeAdmin') : t('admin.makeAdmin')}</span>
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4 p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                        <Layout className="w-3 h-3" /> {t('admin.brandedTitle')}
                                    </Label>
                                    <Input
                                        value={user.customTitle || ''}
                                        onChange={(e) => {
                                            const newUsers = users.map(u => u.username === user.username ? { ...u, customTitle: e.target.value } : u);
                                            setUsers(newUsers);
                                        }}
                                        onBlur={(e) => updateUser(user.username, { customTitle: e.target.value })}
                                        placeholder="e.g. Autography"
                                        className="h-8 text-xs bg-muted/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                        <RefreshCw className="w-3 h-3 text-amber-500" /> {t('settings.credits')}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-9 flex items-center px-3 rounded-lg bg-background border font-black text-sm text-amber-600">
                                            {user.credits || 0}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                id={`credits-${user.username}`}
                                                type="number"
                                                placeholder="+/-"
                                                className="w-16 h-9 text-xs"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 border-amber-500/20 hover:bg-amber-500/10 text-amber-600 font-bold text-[10px]"
                                                onClick={() => {
                                                    const input = document.getElementById(`credits-${user.username}`) as HTMLInputElement;
                                                    const val = parseInt(input.value);
                                                    if (!isNaN(val)) {
                                                        updateUser(user.username, { credits: (user.credits || 0) + val });
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                ADD
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <ImageIcon className="w-3 h-3" /> {t('admin.brandedLogo')}
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg border bg-muted/20 flex-shrink-0 overflow-hidden flex items-center justify-center relative group">
                                            {user.customLogo ? (
                                                <>
                                                    <img src={user.customLogo} alt="Logo" className="w-full h-full object-contain" />
                                                    <button
                                                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            updateUser(user.username, { customLogo: '' });
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                                            )}
                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
                                                <Plus className="w-4 h-4 text-white" />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/png"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.type !== 'image/png') return toast.error("Only transparent PNG allowed");
                                                        const reader = new FileReader();
                                                        reader.onload = async (ev) => {
                                                            const base64 = ev.target?.result as string;
                                                            updateUser(user.username, { customLogo: base64 });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold leading-tight">PNG ONLY <br /> (TRANSPARENT)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Layout className="w-3 h-3" /> {t('admin.authorizedPages')}
                                </Label>
                                <div className="grid grid-cols-1 gap-1 border rounded-xl p-3 bg-muted/20 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {user.authorizedPages?.includes('*') ? (
                                        <div className="text-[10px] font-bold text-violet-500 flex items-center gap-2 py-1">
                                            <Shield className="w-3 h-3" /> FULL SYSTEM ACCESS (ADMIN)
                                        </div>
                                    ) : (
                                        AVAILABLE_PAGES.map((page) => (
                                            <div key={page.path} className="flex items-center justify-between py-1 border-b border-muted/20 last:border-0">
                                                <span className="text-[10px] font-bold uppercase tracking-tight">{page.label}</span>
                                                <Switch
                                                    className="scale-75"
                                                    checked={user.authorizedPages?.includes(page.path)}
                                                    onCheckedChange={() => togglePageAccess(user, page.path)}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div >
    )
}
