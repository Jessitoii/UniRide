import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "KVKK & Gizlilik Politikası | UniRide",
    description: "UniRide platformu KVKK ve Gizlilik Politikası. Kişisel verilerinizin nasıl işlendiği ve korunduğuna dair detaylı bilgilendirme.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen py-24 px-6 lg:px-16 flex justify-center bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-300 w-full">
            <div className="max-w-4xl w-full prose dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white transition-colors duration-300">
                <h1>KVKK & Gizlilik Politikası</h1>
                <p>Son Güncelleme: 22 Şubat 2026</p>

                <p>
                    UniRide olarak gizliliğinizi ciddiye alıyoruz. Bu Gizlilik Politikası, mobil uygulamamızı ve ilgili hizmetlerimizi kullanırken bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
                </p>

                <h2>1. Topladığımız Bilgiler</h2>
                <p>Bize doğrudan sağladığınız bilgileri toplarız. Bunlar:</p>
                <ul>
                    <li>Profil bilgileri (ad, e-posta, üniversite, fakülte vb. kurumsal veriler)</li>
                    <li>Araç bilgileri (Eğer sürücüyseniz marka, model vb.)</li>
                    <li>Yolculuk paylaşım detayları ve tercihleri</li>
                    <li>Uygulama içi cihazdan cihaza aktarılan mesajlaşmalar</li>
                    <li>Konum verileri (Sadece aktif yolculuklar sırasında gerçek zamanlı takibi sağlamak amacıyla)</li>
                </ul>

                <h2>2. Bilgilerin Kullanımı</h2>
                <p>Toplanmış bilgileri aşağıdaki amaçlarla kullanmaktayız:</p>
                <ul>
                    <li>Üniversite öğrencileri arası güvenilir yolculuk eşleştirmelerini sağlamak</li>
                    <li>Yolculuk sırasında anlık konum takibi sunarak güvenliği artırmak</li>
                    <li>Sürücü ve yolcu arasındaki iletişimi uygulama dışına çıkmadan sağlamak</li>
                    <li>Kullanıcı deneyimini platform bazında optimize etmek</li>
                    <li>Topluluğumuzun güvenliğini (sadece .edu.tr onaylı) temin etmek</li>
                </ul>

                <h2>3. Kullanıcı Hakları ve Veri Silme</h2>
                <p>
                    KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR kapsamında,
                    verilerinize erişme, düzeltme ve kalıcı olarak silme hakkına sahipsiniz. Google Play Veri Güvenliği gereklilikleri uyarınca hesap ve veri silme işlemleri için web tabanlı özel bir portal yönetiyoruz.
                </p>
                <p>
                    Kişisel verilerinizin tamamen silinmesini ve sistemlerimizden (profiliniz, sürüş geçmişiniz, eşleşmeleriniz vb.) 30 gün içinde kalıcı olarak arındırılmasını sağlamak için <strong>Hesap & Veri Silme Talebi</strong> formumuzu kullanabilirsiniz.
                </p>

                <h2>4. Veri Güvenliği</h2>
                <p>
                    Verilerinizi yetkisiz erişim veya ifşaya karşı korumak için endüstri standardı modern şifreleme ve güvenlik önlemleri uyguluyoruz. Verileriniz yurt içi hizmet sağlayan şifrelenmiş sunucularımızda, katı erişim politikalarıyla saklanmaktadır.
                </p>

                <h2>5. İletişim</h2>
                <p>
                    Politikamızla ilgili herhangi bir sorunuz için <strong>iletisim@uniride.com.tr</strong> adresi üzerinden veri erişim sorumlumuzla iletişime geçebilirsiniz.
                </p>
            </div>
        </div>
    );
}
