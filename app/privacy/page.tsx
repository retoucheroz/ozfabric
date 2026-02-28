"use client"
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function PrivacyPage() {
    const { language } = useLanguage();

    const trContent = (
        <div className="space-y-12 text-zinc-300 leading-relaxed text-[15px]">
            <section>
                <div className="text-[12px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Gizliliğiniz Bizim Önceliğimizdir</div>
                <p>
                    ModeOn.ai olarak gizliliğinizi korumaya ve bize emanet ettiğiniz verilerin güvenliğini en üst standartlarda sağlamaya kararlıyız. Sistemimizi kullandığınız süre boyunca kişisel verileriniz, yalnızca size sunduğumuz yapay zeka deneyimini mükemmelleştirmek amacıyla işlenir.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Topladığımız Bilgiler</h2>
                <p>ModeOn.ai platformuna erişiminiz esnasında doğrudan tarafınızca sağlanan şu bilgileri toplarız:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li><span className="text-white font-medium">Hesap Bilgileri:</span> Sisteme kayıt olurken beyan ettiğiniz ad, soyad ve e-posta adresi.</li>
                    <li><span className="text-white font-medium">İçerik Verileri:</span> İşlenmek ve iyileştirilmek üzere yapay zeka motorumuza yüklediğiniz ürün görselleri.</li>
                    <li><span className="text-white font-medium">Kullanım Eğilimleri:</span> İletişim tercihleri, bağlantı detayları ve anonimleştirilmiş sistem analizleri.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Bilgilerinizin Kullanım Amacı</h2>
                <p>Topladığımız tüm bu operasyonel ve kişisel verileri yalnızca aşağıdaki dar çerçeveli amaçlar doğrultusunda kullanmaktayız:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>İlettiğiniz ham görselleri işlemek, estetikleştirmek ve üretilen çıktıları size sunmak,</li>
                    <li>Yaşayabileceğiniz olası sorunlarda hızlı ve etkili müşteri desteği sağlamak,</li>
                    <li>Algoritmalarımızı eğitmek ve genel hizmet kalitesini artırmak,</li>
                    <li>Hesabınızı ve güvenliğinizi ilgilendiren önemli güncellemeleri size iletmek.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Veri Paylaşımı ve Sınırları</h2>
                <p>
                    Kişisel bilgilerinizi hiçbir şekilde <span className="text-white font-bold underline underline-offset-4 decoration-white/20">reklam amaçlı üçüncü taraflarla satmaz veya paylaşmayız.</span> Bilgileriniz yalnızca şu istisnai durumlarda paylaşılabilir:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>Resmi kurumlarca, geçerli yasalar çerçevesinde yasal olarak zorunlu kılındığında,</li>
                    <li>İşlem veya paylaşım için sizin açık ve belgelenebilir onayınız olduğunda,</li>
                    <li>Sunucu, barındırma veya ödeme altyapısı gibi hayati servis sağlayıcılarla, yalnızca hizmetin sürdürülebilmesi için gerektiği kadar.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Kullanıcı Temel Hakları</h2>
                <p>İlgili yasal düzenlemeler kapsamında, ModeOn.ai sistemindeki verileriniz üzerinde şu haklara sahipsiniz:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>Sistemimizde barındırılan kişisel verilerinize erişim sağlama hakkı,</li>
                    <li>Hatalı veya eksik işlendiğini düşündüğünüz bilgilerinizi düzeltilmesini talep etme hakkı,</li>
                    <li>Hesabınızın ve size ait tüm verilerin sunucularımızdan tamamen silinmesini bekleme hakkı,</li>
                    <li>Ticari pazarlama veya promosyon e-postalarından koşulsuz olarak çıkış (opt-out) hakkı.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Veri Güvenliği Standardı</h2>
                <p>
                    Depoladığımız kişisel bilgilerinizi, yetkisiz erişime, kaybolmaya veya siber saldırılara karşı korumak adına endüstri standardı şifreleme yöntemleri ve katı güvenlik güvenlik yapılandırmaları uygulamaktayız.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">6. KVKK (6698 Sayılı Kanun) Uyumluluğu</h2>
                <p>
                    Sistemimizde yürütülen tüm veri süreçleri, Türkiye Cumhuriyeti KVKK (Kişisel Verilerin Korunması Kanunu) yönergelerine uygun şekilde tasarlanmıştır. Verilerinizin işlenmesi, belirli bir süre güvenle saklanması ve yasal imha süreçleri tamamen hukuki yükümlülüklere uygun olarak icra edilmektedir.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">7. Bizimle İletişime Geçin</h2>
                <p>
                    İşbu Gizlilik Politikası, kişisel verilerinizin kullanımı veya KVKK haklarınızla ilgili her türlü soru, endişe ve talebiniz için belirtilen resmi kanal üzerinden bize ulaşabilirsiniz:
                </p>
                <p className="mt-4 font-bold text-white">E-posta: <span className="underline underline-offset-4 decoration-white/20">support@modeon.ai</span></p>
            </section>
        </div>
    );

    const enContent = (
        <div className="space-y-12 text-zinc-300 leading-relaxed text-[15px]">
            <section>
                <div className="text-[12px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Your Privacy is Our Priority</div>
                <p>
                    At ModeOn.ai, we are highly committed to protecting your privacy and ensuring the top-level security of the data you entrust to us. Throughout your usage of our system, your personal data is processed solely to perfect the artificial intelligence experience we provide you.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p>We collect the following information provided directly by you during your interaction with the ModeOn.ai platform:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li><span className="text-white font-medium">Account Information:</span> Your declared first name, last name, and email address upon registration.</li>
                    <li><span className="text-white font-medium">Content Data:</span> The product images you upload to our AI engine to be processed and enhanced.</li>
                    <li><span className="text-white font-medium">Usage Trends:</span> Communication preferences, connectivity details, and anonymized system analytics.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p>All operational and personal data collected is utilized exclusively for the following narrow purposes:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>To process and aestheticize your raw images and deliver the generated outputs to you,</li>
                    <li>To provide responsive and effective customer support should you face any issues,</li>
                    <li>To train our core algorithms and elevate the overall quality of algorithms,</li>
                    <li>To directly communicate important updates regarding your account or security.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Data Sharing and its Limits</h2>
                <p>
                    We <span className="text-white font-bold underline underline-offset-4 decoration-white/20">never sell or share your personal information with third parties for advertising purposes.</span> There are only specific exceptions where your data may be shared:
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>When legally mandated by official authorities under applicable law,</li>
                    <li>When we have acquired your explicit and verifiable consent for a specific action,</li>
                    <li>With critical service providers (such as hosting or payment gateways) solely to exactly the extent required for the continuation of service.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Essential User Rights</h2>
                <p>In accordance with relevant legal frameworks, you maintain the following rights over your data hosted by ModeOn.ai:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>The right to request access to the detailed personal data we preserve about you,</li>
                    <li>The right to demand corrections for any data you perceive as inaccurate or flawed,</li>
                    <li>The right to request absolute deletion of your account and all associated data from server drives,</li>
                    <li>The right to unconditionally opt-out from receiving further commercial marketing emails.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Data Security Standards</h2>
                <p>
                    We deploy robust industry-standard encryption methodologies and strict security configuration frameworks to protect your stored personal information relentlessly against unauthorized breaches, loss, or cyberattacks.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">6. Adherence to KVKK (Law No. 6698)</h2>
                <p>
                    All data processing operations conducted within our platform strictly comply with the Republic of Turkey's KVKK (Personal Data Protection Law) directives. The processing, safeguarded retention for defined periods, and systematic legal disposal processes of your data are entirely aligned with our statutory legal obligations.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">7. Contact Us</h2>
                <p>
                    If you hold any concerns, questions, or requests regarding this Privacy Policy, your fundamental KVKK rights, or how we manage your information, please reach out directly through our specific formal channel:
                </p>
                <p className="mt-4 font-bold text-white">Email: <span className="underline underline-offset-4 decoration-white/20">support@modeon.ai</span></p>
            </section>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0D0D0F] text-white selection:bg-[#F5F5F5]/30 selection:text-black font-sans py-24 px-6 relative">

            {/* Minimal Header Nav */}
            <div className="max-w-3xl mx-auto flex items-center justify-between mb-16 relative z-10">
                <Link href="/login" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {language === 'tr' ? 'Geri Dön' : 'Go Back'}
                </Link>
                <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-white">
                    <span>ModeOn<span className="text-white/40">.ai</span></span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto relative z-10">
                <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight mb-4">
                    {language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
                </h1>
                <p className="text-sm text-zinc-500 mb-16 font-medium">
                    {language === 'tr' ? 'Son Güncelleme: 14 Şubat 2026' : 'Last Updated: February 14, 2026'}
                </p>

                {language === 'tr' ? trContent : enContent}
            </div>

            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        </div>
    );
}
