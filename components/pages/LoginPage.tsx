"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, Globe, Lock, Mail, Shield, ShieldCheck, Eye, EyeOff, UserPlus, User, LogIn, Check } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import { signIn, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HeroVideo } from "@/components/ui/HeroVideo"

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUsername = localStorage.getItem("modeon_remembered_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        login: username,
        password: password,
        redirect: false,
      });

      if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem("modeon_remembered_username", username);
        } else {
          localStorage.removeItem("modeon_remembered_username");
        }

        toast.success(language === 'tr' ? 'Giriş başarılı' : 'Login successful');
        router.push('/home');
      } else {
        setError(result?.error || (language === 'tr' ? 'Geçersiz kullanıcı adı veya şifre' : 'Invalid username or password'));
        setIsLoading(false);
      }
    } catch (err) {
      setError("Connection error");
      setIsLoading(false);
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(language === 'tr' ? 'Kayıt işlemi admin tarafından yapılmaktadır.' : 'Registration is handled by admin.');
  }

  return (
    <div className="w-full min-h-[100vh] relative flex flex-col items-center justify-center bg-[#0D0D0F] text-white selection:bg-[#F5F5F5]/30 selection:text-black font-sans overflow-y-scroll overflow-x-hidden">

      {/* IDENTICAL NAVBAR FROM LANDING PAGE */}
      <nav className="fixed top-0 w-full pt-6 pb-12 flex justify-center z-40 bg-gradient-to-b from-[#0D0D0F]/90 via-[#0D0D0F]/50 to-transparent pointer-events-none">
        <div className="w-full max-w-6xl flex justify-between items-center px-6 md:px-12 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-white cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-5 bg-[#F5F5F5] rounded-full flex items-center justify-between px-1 shadow-inner border border-white/20">
              <div className="w-[1.5px] h-2.5 bg-[#0D0D0F]/70 rounded-full ml-1" />
              <div className="w-3.5 h-3.5 bg-[#0D0D0F] rounded-full shadow-sm" />
            </div>
            <span>ModeOn<span className="text-[#F5F5F5]">.ai</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="hidden md:inline-flex h-9 text-[10px] px-3 font-medium text-white/50 uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-md transition-colors">
                {language === "tr" ? "Ana Sayfa" : "Home"}
              </Button>
            </Link>
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 text-[10px] px-3 font-medium text-white/50 uppercase tracking-widest hover:bg-white/5 hover:text-white rounded-md transition-colors gap-1">
                    <Globe className="w-4 h-4" />
                    {language.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0D0D0F] border-white/10 text-white">
                  <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-white/10" : "hover:bg-white/5"}>
                    🇬🇧 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("tr")} className={language === "tr" ? "bg-white/10" : "hover:bg-white/5"}>
                    🇹🇷 Türkçe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {/* Centered Auth Form */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-6 py-24">

        <div className="w-full max-w-[400px] border border-white/10 rounded-[1.5rem] p-8 md:p-8 bg-[#0D0D0F] shadow-2xl">
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 w-fit px-3 py-1.5 rounded-full mb-6 relative left-[-4px]">
            {isRegistering ? (
              <UserPlus className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-zinc-300" />
            )}
            <span className="text-xs font-medium text-zinc-300">
              {isRegistering
                ? (language === 'tr' ? 'Hesap Oluştur' : 'Create Account')
                : (language === 'tr' ? 'Güvenli Giriş' : 'Secure Login')}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            {isRegistering
              ? (language === 'tr' ? 'Hesabınızı oluşturun' : 'Create your account')
              : (language === 'tr' ? 'Tekrar Hoş Geldiniz' : 'Welcome Back')}
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed pr-4">
            {isRegistering
              ? (language === 'tr' ? 'Saniyeler içinde ürün fotoğraflarınızı dönüştürmeye başlayın.' : 'Start transforming your product photos in seconds.')
              : (language === 'tr' ? 'Ürün fotoğraflarınızı premium moda kampanyalarına dönüştürmeye devam edin.' : 'Continue transforming your product photos into premium fashion campaigns.')}
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white rounded-md h-10 text-[11px] font-black uppercase tracking-widest transition-colors"
            onClick={() => signIn('google', { callbackUrl: '/home' })}
            disabled={isLoading}
          >
            <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isRegistering ? (language === 'tr' ? 'Google ile Devam Et' : 'Continue with Google') : (language === 'tr' ? 'Google ile Giriş Yap' : 'Sign in with Google')}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-medium">
              <span className="bg-[#0D0D0F] px-4 text-zinc-500">{language === 'tr' ? 'VEYA' : 'OR'}</span>
            </div>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="grid gap-5">
            {isRegistering && (
              <div className="grid gap-2 text-left">
                <Label htmlFor="fullName" className="text-zinc-300 text-[12px] font-medium">{language === 'tr' ? 'Ad Soyad' : 'Full Name'}</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-zinc-500" />
                  <Input id="fullName" name="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={language === 'tr' ? 'Adınız Soyadınız' : 'Full Name'} required disabled={isLoading} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 h-10 pl-9 text-[13px] rounded-md" />
                </div>
              </div>
            )}

            <div className="grid gap-2 text-left">
              <Label htmlFor="username" className="text-zinc-300 text-[12px] font-medium">{language === 'tr' ? 'E-posta' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-zinc-500" />
                <Input id="username" name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ornek@mail.com" required disabled={isLoading} className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 h-10 pl-9 text-[13px] rounded-md" />
              </div>
            </div>

            <div className="grid gap-2 text-left">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-zinc-300 text-[12px] font-medium">{language === 'tr' ? 'Şifre' : 'Password'}</Label>
                {!isRegistering && <Link href="/forgot-password" className="ml-auto inline-block text-[11px] text-zinc-400 hover:text-white transition-colors">{language === 'tr' ? 'Şifremi unuttum' : 'Forgot password'}</Link>}
              </div>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-zinc-500" />
                <Input id="password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="bg-white/5 border-white/10 text-white placeholder:text-[#3f3f46] focus-visible:ring-1 focus-visible:ring-white/30 h-10 pl-9 pr-9 rounded-md text-base tracking-[0.2em]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {isRegistering && <span className="text-[11px] text-zinc-500 mt-1">{language === 'tr' ? 'En az 8 karakter kullanın.' : 'Use at least 8 characters.'}</span>}
            </div>

            {isRegistering && (
              <div className="grid gap-2 text-left">
                <Label htmlFor="confirmPassword" className="text-zinc-300 text-[12px] font-medium">{language === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-zinc-500" />
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="bg-white/5 border-white/10 text-white placeholder:text-[#3f3f46] focus-visible:ring-1 focus-visible:ring-white/30 h-10 pl-9 pr-9 rounded-md text-base tracking-[0.2em]" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

            <div className="flex items-center justify-between mt-4">
              {!isRegistering ? (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`w-9 h-5 flex items-center rounded-full p-[3px] transition-colors duration-300 ${rememberMe ? 'bg-white' : 'bg-white/10 group-hover:bg-white/20'}`}>
                    <div className={`h-[14px] w-[14px] rounded-full shadow-sm transition-transform duration-300 ${rememberMe ? 'bg-black translate-x-4' : 'bg-white translate-x-0'}`} />
                  </div>
                  <span className="text-[13px] text-zinc-300">{language === 'tr' ? 'Beni hatırla' : 'Remember me'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAcceptTerms(!acceptTerms)}>
                  <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${acceptTerms ? 'bg-white border-white' : 'border-white/10 bg-transparent group-hover:border-white/30'}`}>
                    {acceptTerms && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                  </div>
                  <span className="text-[12px] text-zinc-300 leading-tight">{language === 'tr' ? 'Koşullar ve Gizlilik\'i kabul ediyorum' : 'I accept the Terms and Privacy'}</span>
                </div>
              )}

              <Button type="submit" className="bg-[#F5F5F5] text-black hover:bg-white rounded-md text-[11px] font-black uppercase tracking-widest transition-all shadow-none drop-shadow-none px-5 h-10 gap-2" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRegistering ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> {language === 'tr' ? 'Hesap Oluştur' : 'Sign Up'}
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" /> {language === 'tr' ? 'Giriş Yap' : 'Login'}
                  </>
                )}
              </Button>
            </div>

            <p className="text-[12px] text-zinc-500 mt-5 mb-2 border-b border-white/5 pb-6 leading-relaxed">
              {language === 'tr' ? 'Devam ederek ' : 'By continuing, you agree to our '}
              <Link href="/terms" className="underline decoration-white/20 underline-offset-4 hover:decoration-white hover:text-white transition-all">{language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}</Link>
              {language === 'tr' ? ' ve ' : ' and '}
              <Link href="/privacy" className="underline decoration-white/20 underline-offset-4 hover:decoration-white hover:text-white transition-all">{language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
              {language === 'tr' ? "'nı kabul etmiş olursunuz." : '.'}
            </p>

            <div className="text-center text-[14px] text-zinc-500">
              {isRegistering ? (
                <>
                  {language === 'tr' ? 'Zaten hesabınız var mı?' : 'Already have an account?'}{" "}
                  <button type="button" onClick={() => setIsRegistering(false)} className="text-zinc-300 hover:text-white hover:underline underline-offset-4 transition-all">
                    {language === 'tr' ? 'Giriş yapın' : 'Sign in'}
                  </button>
                </>
              ) : (
                <>
                  {language === 'tr' ? 'Hesabınız yok mu?' : 'Don\'t have an account?'}{" "}
                  <button type="button" onClick={() => setIsRegistering(true)} className="text-zinc-300 hover:text-white hover:underline underline-offset-4 transition-all">
                    {language === 'tr' ? 'Kayıt Olun' : 'Sign up'}
                  </button>
                </>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
