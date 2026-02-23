import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Kullanım Koşulları | UniRide",
    description: "UniRide platformu kullanım şartları ve yasal sınırlar. Sorumlulukların sınırlandırılması (Liability Mitigation).",
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen py-24 px-6 lg:px-16 flex justify-center bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-300 w-full">
            <div className="max-w-4xl w-full prose dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white transition-colors duration-300">
                <h1>Kullanım Koşulları</h1>
                <p>Son Güncelleme: 22 Şubat 2026</p>

                <p>
                    UniRide platformuna hoş geldiniz. Uygulamamızı ziyaret ederek aşağıdaki tüm şartları ve yasal uyarıları peşinen kabul etmiş sayılırsınız.
                </p>

                <h2>1. Platformun Amacı ve Uygunluk</h2>
                <p>
                    UniRide, yalnızca üniversite öğrencileri ve personeli (özel <strong>.edu.tr</strong> uzantılı e-posta sahipleri) arasındaki ulaşım kaynaklarının paylaşımını kolaylaştıran dijital ve kapalı bir platformdur.
                    UniRide bir taşıma şirketi, taksi veya kurye hizmeti sağlayıcısı <strong>değildir</strong>.
                </p>
                <ul>
                    <li>Kayıt olabilmek için aktif ve kurumsal onaylı bir .edu.tr e-posta adresiniz bulunmak zorundadır.</li>
                    <li>Uygulama kullanıcıları 18 yaşını doldurmuş, reşit bireyler olmak zorundadır.</li>
                    <li>Hesabınızı başkasına kiralayamaz, bedelsiz devredemez veya ortak olarak kullanamazsınız.</li>
                </ul>

                <h2>2. Sorumluluğun Sınırlandırılması (Liability Mitigation)</h2>
                <p>
                    UniRide, sadece sürücüleri ve aynı rota üzerindeki yolcuları bir araya getiren bağımsız bir teknoloji sağlayıcısıdır. Gerçekleştirilen ulaşım faaliyeti dahilinde doğabilecek şu durumlardan UniRide ve iştirakleri <strong>sorumlu tutulamaz</strong>:
                </p>
                <ul>
                    <li>Yolculuk sırasındaki olası trafik kazaları, bedensel yaralanmalar veya taşıta/eşyaya yönelik maddi hasarlar.</li>
                    <li>Sürücünün veya yolcunun kararlaştırılan varış/kalkış zamanlarına riayet etmemesi, bekletmeleri.</li>
                    <li>Platform vasıtasıyla bir araya gelen bireyler arasında çıkabilecek bireysel anlaşmazlıklar.</li>
                </ul>
                <p>
                    Yolculuk esnasında yürürlükteki tüm trafik kurallarına ve karayolları kanunlarına uyulmasından, kasko/trafik sigortalarının ve ehliyet geçerliliğinin sağlanmasından tüm mesuliyet sürücüye aittir.
                </p>

                <h2>3. Kullanıcı Davranışları</h2>
                <p>Tüm kullanıcılar yasal platformu güvenilir bir biçimde kullanmayı taahhüt eder. Aşağıdakiler kesinlikle ihlal sayılır:</p>
                <ul>
                    <li>Platformu ticari rant elde etme amacıyla (korsan taksicilik) kullanmak. UniRide, yolculuk masraflarının paylaşılmasını temel alır.</li>
                    <li>Diğer kullanıcılara karşı taciz, fiziksel/sözlü tehdit, ayrımcılık içeren davranışlar.</li>
                    <li>Sisteme sahte ve yanıltıcı belge (kurmaca öğrenci belgesi, sahte ruhsat) beyan etmek.</li>
                </ul>
                <p>Anılan kuralların ihlali, hesabın uyarı yapılmaksızın kalıcı olarak dondurulmasına ve mağdurun talebi üzerine adli makamlara derhal bildirim yapılmasına yol açacaktır.</p>

                <h2>4. Kullanıcı Verileri</h2>
                <p>
                    Öğrenci hesabınız ve platform içi hareketleriniz KVKK standartlarına uygun olarak şifrelenir ve işlenir. Geniş çerçeve için lütfen <strong>Gizlilik Politikamızı</strong> dikkatle okuyunuz.
                </p>
            </div>
        </div>
    );
}
