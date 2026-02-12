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
    Circle,
    Activity,
    Settings2
} from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/auth-types"

const AVAILABLE_PAGES = [
    { label: 'Photoshoot (AI Model)', path: '/photoshoot' },
    { label: 'Try-On', path: '/photoshoot/try-on' },
    { label: 'Editorial', path: '/editorial' },
    { label: 'Video', path: '/video' },
    { label: 'Face & Head Swap', path: '/face-head-swap' },
    { label: 'E-Com', path: '/ecom' },
    { label: 'Analysis', path: '/analysis' },
    { label: 'Studio (Tech Pack)', path: '/studio' },
    { label: 'Train', path: '/train' },
];

// Helper to add admin auth headers
const getAdminHeaders = () => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // Add ADMIN_SECRET if available (for production without KV)
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
    if (adminSecret) {
        headers['x-admin-secret'] = adminSecret;
    }
    return headers;
};

export default function AdminPage() {
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
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
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
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Manage users, permissions and system health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Card className="flex items-center gap-4 px-4 py-2 bg-violet-500/5 border-violet-500/20">
                        <Activity className="w-5 h-5 text-violet-500" />
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Online Users</p>
                            <p className="text-xl font-bold text-violet-600 leading-none">{onlineStats.onlineCount}</p>
                        </div>
                    </Card>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </header>

            {/* Quick Create User Section */}
            <Card className="border-violet-500/20 bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-500" /> Yeni Kullanıcı Oluştur
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-wrap items-end gap-4" onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const username = formData.get('username') as string;
                        const password = formData.get('password') as string;
                        const role = formData.get('role') as string;

                        if (!username || !password) return toast.error("Kullanıcı adı ve şifre zorunludur");

                        try {
                            const res = await fetch('/api/admin/users', {
                                method: 'POST',
                                headers: getAdminHeaders(),
                                body: JSON.stringify({ username, password, role })
                            });
                            if (res.ok) {
                                toast.success("Kullanıcı başarıyla oluşturuldu");
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
                            <Label htmlFor="username">Kullanıcı Adı</Label>
                            <Input id="username" name="username" placeholder="örn: mehmet" required />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label htmlFor="password">Şifre</Label>
                            <Input id="password" name="password" type="password" placeholder="••••••••" required />
                        </div>
                        <div className="space-y-1.5 w-[140px]">
                            <Label htmlFor="role">Yetki</Label>
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
                            Kullanıcı Ekle
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <Card key={user.username} className={`border-2 transition-all ${user.status === 'pending' ? 'border-amber-500/30' : 'border-muted'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${onlineStats.users.includes(user.username) ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                                    <CardTitle className="text-lg">{user.username}</CardTitle>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    {user.status === 'pending' && (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>
                                    )}
                                    {user.status === 'disabled' && (
                                        <Badge variant="destructive">Disabled</Badge>
                                    )}
                                </div>
                            </div>
                            <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Profile Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                {user.status === 'pending' ? (
                                    <Button size="sm" className="col-span-2 bg-green-600 hover:bg-green-700" onClick={() => updateUser(user.username, { status: 'active' })}>
                                        <UserCheck className="w-4 h-4 mr-2" /> Approve
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
                                            <span className="truncate">{user.status === 'active' ? 'Disable' : 'Enable'}</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full font-bold"
                                            onClick={() => updateUser(user.username, { role: user.role === 'admin' ? 'user' : 'admin' })}
                                            disabled={user.username === 'admin'}
                                        >
                                            <Shield className={`w-4 h-4 mr-2 shrink-0 ${user.role === 'admin' ? 'text-violet-500' : ''}`} />
                                            <span className="truncate">{user.role === 'admin' ? 'Revoke' : 'Make Admin'}</span>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Layout className="w-3 h-3" /> Authorized Pages
                                </Label>
                                <div className="grid grid-cols-1 gap-2 border rounded-xl p-3 bg-muted/20">
                                    {user.authorizedPages?.includes('*') ? (
                                        <div className="text-xs font-bold text-violet-500 flex items-center gap-2 py-1">
                                            <Shield className="w-3 h-3" /> Full System Access (Admin)
                                        </div>
                                    ) : (
                                        AVAILABLE_PAGES.map((page) => (
                                            <div key={page.path} className="flex items-center justify-between py-1">
                                                <span className="text-xs font-medium">{page.label}</span>
                                                <Switch
                                                    checked={user.authorizedPages?.includes(page.path)}
                                                    onCheckedChange={() => togglePageAccess(user, page.path)}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* JSON settings for "designing pages" */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Settings2 className="w-3 h-3" /> Custom UI Config (JSON)
                                </Label>
                                <textarea
                                    className="w-full h-20 text-[10px] bg-muted/30 border rounded-lg p-2 font-mono focus:ring-1 ring-violet-500 outline-none"
                                    placeholder='{ "theme": "dark", "compact": true }'
                                    defaultValue={JSON.stringify(user.customSettings || {}, null, 2)}
                                    onBlur={(e) => {
                                        try {
                                            const json = JSON.parse(e.target.value);
                                            updateUser(user.username, { customSettings: json });
                                        } catch (err) {
                                            toast.error("Invalid JSON config");
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {users.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center opacity-40">
                        <Users className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No users registered yet</h3>
                        <p>Tell your team to sign up on the landing page.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
