"use client"
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function TermsPage() {
    const { language } = useLanguage();

    const trContent = (
        <div className="space-y-12 text-zinc-300 leading-relaxed text-[15px]">
            <section>
                <div className="text-[12px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Hoş Geldiniz</div>
                <p>
                    ModeOn.ai platformuna ("Şirket", "Biz" veya "Sistem") hoş geldiniz. Bu Kullanım Koşulları ("Sözleşme"), yapay zeka destekli moda üretim ve görsel iyileştirme hizmetlerimize ("Hizmetler") erişiminizi ve bunları kullanımınızı kapsar. Sistemimizi ziyaret ederek veya bir hesap oluşturarak bu koşulların tamamını yasal olarak kabul etmiş sayılırsınız.
                </p>
                <p className="mt-4 font-bold text-white">
                    ÖNEMLİ İHTAR: Platformumuzu kullanmaya devam ederek, Şirket ile aranızdaki uyuşmazlıkların toplu dava süreçleri yerine münhasıran bireysel tahkim veya doğrudan uzlaşma ile çözüleceğini peşinen kabul edersiniz.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Kullanıcı Bilgileri ve Doğruluğu</h2>
                <p>
                    Servislerimizden verimli şekilde yararlanabilmek için hesap oluştururken bize bazı kayıt ve ödeme verileri sunarsınız. İlettiğiniz her tür kimlik, iletişim veya kredi kartı/ödeme bilgisinin güncel, geçerli, yasal ve tamamen sizin şahsınıza veya yetkili olduğunuz kuruma ait olduğunu beyan ve taahhüt edersiniz.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Yaş Sınırı ve Yasal Uygunluk</h2>
                <p>
                    Bu platform yalnızca 18 yaş ve üzeri, reşit kabul edilen bireylerin ve yasal tüzel kişiliklerin kullanımına yöneliktir. 18 yaşından küçükseniz ModeOn.ai web sitesinde hesap oluşturamaz, kredi yükleyemez ve görsel üretimi faaliyetlerinde bulunamazsınız.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Kapsam ve Terim Tanımları</h2>
                <ul className="list-none space-y-4">
                    <li><span className="text-white font-bold">"Kullanıcı Verisi":</span> AI motoruna işlenmesi için tarafınızca yüklenen fotoğraflar, ürün görselleri, metin komutları (promptlar) veya sisteme bizzat ilettiğiniz diğer materyaller.</li>
                    <li><span className="text-white font-bold">"Üretilen İçerik":</span> Sizin verilerinizden ve komutlarınızdan yola çıkarak yapay zeka tarafından sentezlenmiş ve size geri sunulan bitmiş dijital çıktılar, medya veya görseller.</li>
                    <li><span className="text-white font-bold">"Kullanım Verileri":</span> Hizmetin teknik performansını optimize etmek amacıyla sistem tarafından arka planda izlenen, tarafınızdan bağımsız anonimleştirilmiş sistem etkileşimleri.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Hizmet Kullanımı ve Sınırlar</h2>
                <p>
                    Tabi olduğunuz üyelik limitleri veya ödediğiniz krediler dahilinde; Şirket bu Hizmetleri kişisel tasarım süreçlerinizde veya dahili ticari markalarınızın vitrinlerinde kullanmanız adına size devredilemez, münhasır olmayan ve herhangi bir ihlalde geri alınabilir esnek bir kullanım lisansı verir.
                </p>
                <p className="mt-4">
                    Yapay Zeka (AI) algoritmaları doğaları gereği tam kusursuzluk güvencesi vermezler. Üretilen görsellerde zaman zaman perspektif, anatomi veya renk sapmaları olabileceğini; AI özelliklerinin tamamen hatasız çıktılar üretmeyi kesin olarak vaat etmediğini kabul edersiniz.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Hesap Güvenliği Başvurusu</h2>
                <p>
                    Hesap giriş şifrelerinizi ve oturum anahtarlarınızı muhafaza etmek kişisel sorumluluğunuzdadır. Yeterince güçlü bir şifre kullanmanız ve oturum yetkilerinizi tanımadığınız üçüncü kişilerle asla paylaşmamanız gerekmektedir. Hesabınızın yetkisiz kişilerce kullanımı sonucu doğacak her türlü zarardan hesabın ilk sahibi sorumludur.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">6. Yasaklı Eylemler ve İhlaller</h2>
                <p>Sistemin refahı ve yasal düzenine aykırı düşmemek adına aşağıdaki işlemler kesinlikle yasaktır:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>Ticari haklarını elinizde bulundurmadığınız, rakiplerinize veya diğer marka tescillerine ait görsel fikri mülkiyetleri yasa dışı çoğaltmak/taklit etmek.</li>
                    <li>Nefret söylemi barındıran, müstehcen, karalayıcı, ayrımcı, istismara yönelik veya genel ahlak kurallarına açıkça uygunsuz görseller işlemek, üretmek ve saklamak.</li>
                    <li>Oluşturulan çıktılar üzerinden üçüncü kişileri aldatmaya çekmek veya sahte kimliklerle manipülasyon yapmak.</li>
                    <li>Bilinçli bir biçimde sistem sunucularına saldırı teşebbüsünde bulunmak veya hizmet işleyişini yavaşlatmayı kurgulamak.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">7. Kesin İade Politikası (Geri Ödemesizlik)</h2>
                <p className="text-[#F5F5F5] font-black bg-white/5 p-6 rounded-xl border border-white/10">
                    İADE POLİTİKASI: ModeOn.ai üzerinden kullanıcı paneli vasıtasıyla cüzdana yatırılan, paket olarak alınan veya hediye edilen kredilerin hiçbir formda parasal İADESİ YOKTUR. Yapay zeka maliyetlerinin anlık sunucu işleyişine dayalı olması sebebiyle harcanan veya hesaba yüklenen bakiyeler için geriye dönük hak talebinde bulunulamaz.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">8. İletişim Kanalları</h2>
                <p>
                    Bu yasal bildirim veya Hizmetlerin genel yönetimi ile ilgili aklınıza takılan sorular, şikayetler veya işbirliği talepleriniz varsa bizimle resmi destek hattımızdan iletişime geçebilirsiniz:
                </p>
                <p className="mt-4 font-bold text-white">Destek: <span className="underline underline-offset-4 decoration-white/20">support@modeon.ai</span></p>
            </section>
        </div>
    );

    const enContent = (
        <div className="space-y-12 text-zinc-300 leading-relaxed text-[15px]">
            <section>
                <div className="text-[12px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Welcome</div>
                <p>
                    Welcome to the ModeOn.ai platform ("Company", "We", or "System"). These Terms of Service ("Terms") govern your access to and use of our AI-powered fashion rendering and image enhancement services ("Services"). By visiting our system or creating an account, you legally agree to be bound by all of these conditions.
                </p>
                <p className="mt-4 font-bold text-white">
                    IMPORTANT NOTICE: By using our Platform, you acknowledge and agree that any disputes arising between you and the Company will be resolved exclusively through individual arbitration or direct settlement, rather than through class action lawsuits.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. User Information and Accuracy</h2>
                <p>
                    To efficiently use our Services, you provide us with certain registration and payment data. You declare and warrant that all identification, communication, or payment information you provide is current, legally valid, and belongs to you or the organization you represent.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Age Limit and Eligibility</h2>
                <p>
                    This platform is intended exclusively for individuals aged 18 or older. If you are under 18, you may not create an account, purchase credits, or generate images on the ModeOn.ai website.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Scope and Definitions</h2>
                <ul className="list-none space-y-4">
                    <li><span className="text-white font-bold">"User Data":</span> Photos, product images, text prompts, or other materials you intentionally upload or submit to be processed by the AI engine.</li>
                    <li><span className="text-white font-bold">"Generated Content":</span> The synthesized digital outputs, media, or finished images returned to you, created by the AI engine based on your data and commands.</li>
                    <li><span className="text-white font-bold">"Usage Data":</span> Anonymized metrics collected passively by the system to improve technical performance, devoid of personally identifying information.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Service Usage and Limitations</h2>
                <p>
                    Subject to your active credits or membership tiers; the Company grants you a non-exclusive, non-transferable, and revocable flexible license to use these Services for your personal design workflows or commercial storefronts.
                </p>
                <p className="mt-4">
                    Please understand that Artificial Intelligence (AI) algorithms, by their experimental nature, do not guarantee complete perfection. You accept that generated images may occasionally contain perspective, anatomical, or color anomalies, and that the AI features are not guaranteed to produce entirely error-free outputs at all times.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Account Security</h2>
                <p>
                    You remain personally responsible for keeping your account passwords and session keys secure. You must use an adequately strong password and never share your login credentials with unknown third parties. The primary account holder assumes liability for any damage resulting from unauthorized access.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">6. Prohibited Actions</h2>
                <p>To ensure a safe environment and legal compliance, the following actions are strictly prohibited:</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>Illegally replicating or imitating intellectual property, logos, or styles belonging to third parties or competitors without commercial authorization.</li>
                    <li>Generating, storing, or processing images classified as hate speech, explicitly obscene, defamatory, discriminatory, or grossly inappropriate.</li>
                    <li>Using generated outputs to deceive third parties or manipulate situations using fake identities.</li>
                    <li>Deliberately attempting to overload server capacities, attack the system infrastructure, or interfere with other users' access.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">7. Strict No-Refund Policy</h2>
                <p className="text-[#F5F5F5] font-black bg-white/5 p-6 rounded-xl border border-white/10">
                    REFUND POLICY: All purchases of credits—whether loaded into the wallet, bought as a package, or gifted via the ModeOn.ai user panel—are STRICTLY NON-REFUNDABLE. Because AI rendering costs are incurred instantly by our backend servers, users cannot claim retroactive refunds or cash-outs for purchased balances.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">8. Contact Channels</h2>
                <p>
                    If you have questions, complaints, or business inquiries regarding these legal terms or our general service handling, you may reach our official support network:
                </p>
                <p className="mt-4 font-bold text-white">Support: <span className="underline underline-offset-4 decoration-white/20">support@modeon.ai</span></p>
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
                    {language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}
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
