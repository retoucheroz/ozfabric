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
    <div className="w-full min-h-screen relative flex bg-background">

      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 hidden lg:block overflow-hidden pointer-events-none">
        {/* The user's image spans 75% of the screen width to give a wider reach towards the form */}
        <img
          src="/login-bg.jpg"
          alt="rawless login background"
          className="absolute top-0 left-0 w-[75vw] h-full object-cover object-[center_top]"
        />

        {/* Right-ward smooth fade to match theme background */}
        <div className="absolute top-0 left-0 w-[75vw] h-full bg-gradient-to-r from-transparent from-20% via-background/50 via-60% to-background"></div>

        {/* Extra gradient from the right side, extending over the login form area securely to fade out the image's right edge */}
        <div className="absolute inset-y-0 right-0 w-[55vw] bg-gradient-to-l from-background via-background/90 to-transparent"></div>

        {/* Bottom-up fade for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-gradient-to-t from-background/90 from-20% to-transparent"></div>
      </div>

      {/* Content Grid */}
      <div className="w-full lg:grid lg:grid-cols-2 relative z-10 flex-1">

        {/* Left side: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12">

          <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">rawless</span>.ai
            </div>
          </div>
          <div className="relative z-10 max-w-lg space-y-4 text-white">
            <blockquote className="text-3xl font-medium leading-tight">
              {language === "tr" ? `"${randomQuote.quoteTr}"` : `"${randomQuote.quoteEn || randomQuote.quoteTr}"`}
            </blockquote>
            <footer className="text-sm text-white/70">
              <div className="font-semibold text-white">{randomQuote.author}</div>
              {language === "tr" ? randomQuote.roleTr : (randomQuote.roleEn || randomQuote.roleTr)}
            </footer>
          </div>
        </div>

        {/* Right side: Auth Form */}
        <div className="flex items-center justify-center py-12 px-8 relative">
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

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("login.orContinue")}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full font-bold gap-2"
                onClick={() => window.location.href = '/api/auth/google'}
                disabled={isLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
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
    </div>
  )
}
