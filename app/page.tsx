"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, Globe } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const QUOTES = [
  { id: 1, author: "Pierpaolo Piccioli", roleTr: "Kreatif Direktör, Valentino", roleEn: "Creative Director, Valentino", quoteTr: "Hayal gücümüzü genişletmek ve duyguları harekete geçirmek için kullanılan bu teknoloji, artık en güçlü yaratıcı aracımız.", quoteEn: "This technology, used to expand our imagination and evoke emotions, is now our most powerful creative tool." },
  { id: 2, author: "Jörgen Andersson", roleTr: "Kreatif Direktör, H&M", roleEn: "Creative Director, H&M", quoteTr: "Yaratıcı alet çantamıza eklenen bu yeni enstrüman, tasarım süreçlerimizi bir üst seviyeye taşımak için heyecan verici.", quoteEn: "This new instrument added to our creative toolkit is exciting to take our design processes to the next level." },
  { id: 3, author: "Bruno Pavlovsky", roleTr: "Moda Başkanı, Chanel", roleEn: "President of Fashion, Chanel", quoteTr: "Uygulama biçimleri tamamen değişse de tasarımın özündeki felsefe, bu dijital dönüşümle daha da güçleniyor.", quoteEn: "Although the forms of application change completely, the philosophy at the core of design is strengthened even more with this digital transformation." },
  { id: 4, author: "Matthew Drinkwater", roleTr: "Moda İnovasyon Başkanı, LCF", roleEn: "Head of Fashion Innovation, LCF", quoteTr: "Moda dünyasında henüz her şeyin başındayız; bu teknolojik devrimin zirvesine giden yol daha yeni açılıyor.", quoteEn: "We are just at the beginning in the fashion world; the path to the peak of this technological revolution is just opening." },
  { id: 5, author: "Norma Kamali", roleTr: "Moda Tasarımcısı", roleEn: "Fashion Designer", quoteTr: "Algoritmaların beklenmedik 'yanılsamaları' bile, modern tasarımlarımız için eşsiz bir ilham kaynağına dönüşebiliyor.", quoteEn: "Even the unexpected 'illusions' of algorithms can turn into a unique source of inspiration for our modern designs." },
  { id: 6, author: "Tommy Hilfiger", roleTr: "Kurucu & Tasarımcı, Tommy Hilfiger", roleEn: "Founder & Designer, Tommy Hilfiger", quoteTr: "Modanın geleceği dijitalleşmede yatıyor; bu yeni akıllı sistemler tasarımın lojistik başarısını kalıcı kılacak.", quoteEn: "The future of fashion lies in digitalization; these new smart systems will make the logistical success of design permanent." },
  { id: 7, author: "Lorenzo Bertelli", roleTr: "Pazarlama Direktörü, Prada Group", roleEn: "Marketing Director, Prada Group", quoteTr: "Zaman kazandıran bu teknolojik yardımcılar sayesinde, el işçiliğinin ve insan emeğinin değerini çok daha iyi anlayacağız.", quoteEn: "Thanks to these time-saving technological assistants, we will understand the value of craftsmanship and human labor much better." },
  { id: 8, author: "Gonzague de Pirey", roleTr: "Veri Direktörü, LVMH", roleEn: "Chief Data Officer, LVMH", quoteTr: "Yaratıcı bir 'dış iskelet' gibi düşündüğümüz bu araç, insan dehasını koruyarak onu daha verimli kılıyor.", quoteEn: "This tool, which we think of as a creative 'exoskeleton', protects human genius while making it more efficient." },
  { id: 9, author: "Soumia Hadjali", roleTr: "Dijital Başkan Yrd., Louis Vuitton", roleEn: "VP of Digital, Louis Vuitton", quoteTr: "Kreatif süreçlerin yerini almayan, aksine onları devasa boyutlara ulaştıran bir büyüteçle karşı karşıyayız.", quoteEn: "We are facing a magnifying glass that does not replace creative processes but rather magnifies them to enormous dimensions." },
  { id: 10, author: "Michael Mente", roleTr: "CEO & Kurucu, REVOLVE", roleEn: "CEO & Founder, REVOLVE", quoteTr: "Benzersiz trendleri keşfetme yolunda, akıllı algoritmalar bize devrimsel bir rekabet avantajı sağlıyor.", quoteEn: "On the way to discovering unique trends, smart algorithms provide us with a revolutionary competitive advantage." },
  { id: 11, author: "Jordi Alex", roleTr: "Teknoloji Direktörü, Mango", roleEn: "Technology Director, Mango", quoteTr: "Çalışanlarımızın yeteneklerini parlatan bir yardımcı pilot olarak, tasarım yolculuğumuza eşlik ediyor.", quoteEn: "It accompanies our design journey as a co-pilot that polishes the talents of our employees." },
  { id: 12, author: "Olivier Rousteing", roleTr: "Kreatif Direktör, Balmain", roleEn: "Creative Director, Balmain", quoteTr: "Özgür ifadenin yeni platformu olan bu teknoloji, bizi bambaşka bir yaratıcılık perspektifine yükseltiyor.", quoteEn: "This technology, which is the new platform of free expression, elevates us to a completely different perspective of creativity." },
  { id: 13, author: "José Neves", roleTr: "Kurucu & CEO, Farfetch", roleEn: "Founder & CEO, Farfetch", quoteTr: "İnsan zekasına asistanlık eden bu sistemler, modada yaratıcılığı daha önce hiç olmadığı kadar erişilebilir kılıyor.", quoteEn: "These systems assisting human intelligence make creativity in fashion more accessible than ever before." },
  { id: 14, author: "Rankin", roleTr: "Moda Fotoğrafçısı", roleEn: "Fashion Photographer", quoteTr: "İşinde uzman olan vizyonerlerin, bu yeni çalışma biçimiyle çok daha görkemli eserler yaratacağına inanıyorum.", quoteEn: "I believe that visionaries who are experts in their work will create much more magnificent works with this new way of working." },
  { id: 15, author: "Robert Gentz", roleTr: "CEO & Kurucu, Zalando", roleEn: "CEO & Founder, Zalando", quoteTr: "E-ticaret deneyimi artık sadece bir alışveriş değil; teknolojiyle harmanlanmış, ilham verici bir keşif yolculuğu.", quoteEn: "The e-commerce experience is no longer just shopping; it's an inspiring journey of discovery blended with technology." },
  { id: 16, author: "Nelly Mensah", roleTr: "İnovasyon Başkan Yrd., LVMH", roleEn: "VP of Innovation, LVMH", quoteTr: "Lüks dünyasında kişiselleştirme, üretken sistemler sayesinde artık hayal bile edilemeyecek bir ölçeğe ulaştı.", quoteEn: "Personalization in the luxury world has now reached a scale unimaginable thanks to generative systems." },
  { id: 17, author: "Charaf Tajer", roleTr: "Kreatif Direktör, Casablanca", roleEn: "Creative Director, Casablanca", quoteTr: "Dünyanın estetiğine bakış açımızı modern inovasyonla birleştirerek geleceğin uyumunu yakalıyoruz.", quoteEn: "We capture the harmony of the future by combining our perspective on the world's aesthetics with modern innovation." },
  { id: 18, author: "Ian Rogers", roleTr: "Eski Dijital Direktör, LVMH", roleEn: "Former Chief Digital Officer, LVMH", quoteTr: "Markalarımızın hikayelerini daha güçlü anlatmak için karmaşıklığı yöneten en değerli yardımcımız dijital akıldır.", quoteEn: "Digital intelligence is our most valuable assistant in managing complexity to tell the stories of our brands more powerfully." },
  { id: 19, author: "Peter Pernot-Day", roleTr: "Strateji Başkanı, Burberry", roleEn: "Head of Strategy, Burberry", quoteTr: "Talepleri öngören ileri teknolojiler, modanın sürdürülebilir geleceğinde en ön safta yer alıyor.", quoteEn: "Advanced technologies that predict demands are at the forefront of fashion's sustainable future." },
  { id: 20, author: "Nicolas Ghesquière", roleTr: "Kreatif Direktör, Louis Vuitton", roleEn: "Creative Director, Louis Vuitton", quoteTr: "Moda bir oyun alanıdır ve modern enstrümanlar bu alanda kendi imzamızı bulmamıza rehberlik eder.", quoteEn: "Fashion is a playground and modern instruments guide us to find our own signature in this field." },
];

export default function LoginPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [randomQuote, setRandomQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setMounted(true);
    // Select random quote only on client side to avoid hydration mismatch
    setRandomQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (username === "ozgur" && password === "ozgur") {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } else {
      alert(language === "tr" ? "Hatalı kullanıcı adı veya şifre!" : "Invalid username or password!");
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left side: Branding */}
      <div className="hidden bg-stone-900 lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
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

      {/* Right side: Login Form */}
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
            <h1 className="text-3xl font-bold tracking-tight">{t("login.welcome")}</h1>
            <p className="text-muted-foreground">{t("login.enterEmail")}</p>
          </div>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">{language === 'tr' ? 'Kullanıcı Adı' : 'Username'}</Label>
              <Input id="username" name="username" type="text" placeholder="ozgur" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary">{t("login.forgotPassword")}</Link>
              </div>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full bg-violet-500 text-white hover:bg-violet-600" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("login.signIn")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t("login.noAccount")}{" "}
            <Link href="#" className="underline text-primary">{t("login.signUp")}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
