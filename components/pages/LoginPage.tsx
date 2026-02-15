"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, Globe } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import QUOTES from "@/lib/quotes.json"

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [randomQuote, setRandomQuote] = useState(QUOTES[0]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    setRandomQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Check if already authenticated
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/home');
        }
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(language === 'tr' ? 'Giriş başarılı' : 'Login successful');
        router.push('/home');
      } else {
        setError(data.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Connection error");
      setIsLoading(false);
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setIsRegistering(false);
        setIsLoading(false);
      } else {
        setError(data.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Connection error");
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left side: Branding */}
      <div className="hidden bg-[#14171f] lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2400')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">rawless</span>.ai
          </div>
        </div>
        <div className="relative z-10 max-w-lg space-y-4">
          <blockquote className="text-3xl font-medium leading-tight">
            {language === "tr" ? `"${randomQuote.quoteTr}"` : `"${randomQuote.quoteEn || randomQuote.quoteTr}"`}
          </blockquote>
          <footer className="text-sm text-white/60">
            <div className="font-semibold text-white">{randomQuote.author}</div>
            {language === "tr" ? randomQuote.roleTr : (randomQuote.roleEn || randomQuote.roleTr)}
          </footer>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex items-center justify-center py-12 px-8 bg-background relative">
        {/* Language Switcher */}
        {mounted && (
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <Globe className="w-4 h-4" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent" : ""}>
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("tr")} className={language === "tr" ? "bg-accent" : ""}>
                  🇹🇷 Türkçe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="mx-auto grid w-full max-w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {isRegistering
                ? (language === 'tr' ? 'Hesap Oluştur' : 'Create Account')
                : t("login.welcome")}
            </h1>
            <p className="text-muted-foreground">
              {isRegistering
                ? (language === 'tr' ? 'Detaylarınızı girerek kayıt olun.' : 'Enter your details to sign up.')
                : t("login.enterEmail")}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">{language === 'tr' ? 'Kullanıcı Adı' : 'Username'}</Label>
              <Input id="username" name="username" type="text" placeholder={language === 'tr' ? 'Kullanıcı Adı' : 'Username'} required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t("login.password")}</Label>
                {!isRegistering && <Link href="#" className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary">{t("login.forgotPassword")}</Link>}
              </div>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-700 font-bold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegistering
                ? (language === 'tr' ? 'Kayıt Ol' : 'Sign Up')
                : t("login.signIn")}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isRegistering ? (
              <>
                {language === 'tr' ? 'Zaten hesabınız var mı?' : 'Already have an account?'}{" "}
                <button onClick={() => setIsRegistering(false)} className="underline text-violet-600 font-bold">
                  {t("login.signIn")}
                </button>
              </>
            ) : (
              <>
                {t("login.noAccount")}{" "}
                <button onClick={() => setIsRegistering(true)} className="underline text-violet-600 font-bold">
                  {t("login.signUp")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
