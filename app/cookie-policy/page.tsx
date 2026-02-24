"use client";

import { useLanguage } from "@/context/language-context";
import { TopNav } from "@/components/layout/TopNav";

export default function CookiePolicyPage() {
    const { language } = useLanguage();

    const contentTr = (
        <div className="space-y-6 text-[var(--text-secondary)]">
            <h1 className="text-3xl font-black italic uppercase text-[var(--text-primary)]">Çerez Politikası</h1>
            <p>
                Son Güncelleme: <strong>21 Şubat 2026</strong>
            </p>
            <p>
                ModeOn.ai ("Biz", "Bizi" veya "Bizim") olarak gizliliğinize değer veriyoruz.
                Bu Çerez Politikası, web sitemizi ziyaret ettiğinizde (veya uygulamamızı kullandığınızda) hizmetlerimizi sağlamak
                ve geliştirmek amacıyla hangi çerezlerin ve benzer teknolojilerin kullanıldığını açıklamaktadır.
            </p>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">1. Çerez (Cookie) Nedir?</h2>
            <p>
                Çerezler, bir web sitesini ziyaret ettiğinizde bilgisayarınıza veya mobil cihazınıza kaydedilen
                küçük metin dosyalarıdır. Çerezler, web sitesinin çalışmasını sağlamak, performansını artırmak
                ve kullanıcı deneyimini kişiselleştirmek amacıyla yaygın olarak kullanılmaktadır.
            </p>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">2. Hangi Tür Çerezleri Kullanıyoruz?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li><strong>Zorunlu Çerezler:</strong> Web sitemizin temel işlevlerinin çalışması için mutlaka gereklidir (örneğin güvenli oturum açma, hesap bilgilerinize erişim). Bu çerezler olmadan hizmetlerimizi düzgün şekilde sunamayız.</li>
                <li><strong>Performans ve Analiz Çerezleri:</strong> Ziyaretçilerin sitemizi nasıl kullandığını analiz etmemize yardımcı olan çerezlerdir. Hangi sayfaların daha çok ziyaret edildiğini veya hangi özelliklerin daha çok kullanıldığını anlayarak hizmetlerimizi geliştirmemize yardımcı olur.</li>
                <li><strong>İşlevsellik Çerezleri:</strong> Dil tercihiniz, karanlık mod ayarlarınız, sidebar (kenar çubuğu) kapanma durumu gibi seçimlerinizi hatırlayarak daha iyi bir deneyim sunar.</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">3. Çerezleri Neden Kullanıyoruz?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Sisteme güvenli bir şekilde giriş yapmanızı ve AI kredilerinizi doğru yönetmenizi sağlamak.</li>
                <li>Dil ve tema tercihlerinizi hatırlayarak arayüz deneyiminizi iyileştirmek.</li>
                <li>Site trafiğini analiz edip, performans optimizasyonlarını planlamak.</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">4. Çerez Tercihlerinizi Nasıl Yönetebilirsiniz?</h2>
            <p>
                Çerezleri yönetme hakkına sahipsiniz. İnternet tarayıcınızın ayarlarını değiştirerek çerezleri reddedebilir,
                silebilir veya yeni çerez kabul edildiğinde uyarı alabilirsiniz. Ancak işlevsellik için gerekli olan çerezleri
                devre dışı bırakırsanız sitemizin bazı alanları düzgün çalışmayabilir.
            </p>

            <p className="mt-8 text-sm opacity-70">
                Bu politika zaman zaman güncellenebilir. Değişiklikler sitede yayımlandığı andan itibaren geçerlilik kazanacaktır.
            </p>
        </div>
    );

    const contentEn = (
        <div className="space-y-6 text-[var(--text-secondary)]">
            <h1 className="text-3xl font-black italic uppercase text-[var(--text-primary)]">Cookie Policy</h1>
            <p>
                Last Updated: <strong>February 21, 2026</strong>
            </p>
            <p>
                At ModeOn.ai ("We", "Us" or "Our"), we value your privacy.
                This Cookie Policy explains how cookies and similar technologies are used on our website
                (and application) to provide and improve our services when you visit us.
            </p>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">1. What is a Cookie?</h2>
            <p>
                Cookies are small text files downloaded to your computer or mobile device when you visit a website.
                They are widely used to make websites work, improve their performance, and personalize the user experience.
            </p>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">2. What Types of Cookies Do We Use?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> These are strictly necessary for the core functionalities of our website to operate correctly (such as secure login, accessing your account details). Without these cookies, we cannot provide our services properly.</li>
                <li><strong>Performance & Analytics Cookies:</strong> These help us analyze how visitors navigate and interact with our site. They allow us to understand which pages are visited most and which features are heavily used to help us improve our services.</li>
                <li><strong>Functionality Cookies:</strong> These remember your choices, such as language preference, dark mode settings, and sidebar toggle states, to provide a better personalized experience.</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">3. Why Do We Use Cookies?</h2>
            <ul className="list-disc pl-6 space-y-2">
                <li>To enable secure logins and manage your AI credits accurately.</li>
                <li>To optimize your interface experience by remembering your language and theme choices.</li>
                <li>To analyze site traffic and plan performance optimizations.</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-8">4. How Can You Manage Cookie Preferences?</h2>
            <p>
                You have the right to decide whether to accept or reject cookies. You can set or amend your web browser
                controls to accept or refuse cookies. However, if you choose to reject essential functional cookies,
                parts of our website may not function correctly properly.
            </p>

            <p className="mt-8 text-sm opacity-70">
                This policy may be updated from time to time. Changes will be effective as soon as they are published on the site.
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-default)] flex flex-col">
            <TopNav />
            <div className="container mx-auto max-w-4xl py-24 px-6 md:px-0 flex-1">
                <div className="bg-[var(--bg-surface)] p-8 md:p-12 rounded-3xl border border-[var(--border-subtle)] shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {language === "tr" ? contentTr : contentEn}
                </div>
            </div>
        </div>
    );
}
