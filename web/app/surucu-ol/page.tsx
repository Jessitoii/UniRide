import { Car, Wallet, Shield, Clock } from "lucide-react";
import { DriverStepper } from "@/components/DriverStepper";
import Link from "next/link";

export const metadata = {
    title: "Kampüs Sürücü Ol - UniRide",
    description: "Boş koltuklarını değerlendir, masraflarını paylaş. UniRide ile kampusünde sürücü ol, kampüsün hızını belirle.",
    keywords: "kampüs sürücü ol, uniride sürücü, öğrenci araç paylaşımı",
};

export default function SurucuOlPage() {
    return (
        <div className="min-h-screen bg-transparent transition-colors duration-300 overflow-hidden relative">
            {/* Background Gradient with Black Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2575FC]/20 dark:bg-[var(--color-uniride-magenta)]/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#6A11CB]/20 dark:bg-[var(--color-uniride-deep-purple)]/20 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />
                {/* Visual backdrop removed dynamically via transition-colors root implementation */}
            </div>

            {/* Navigation Handled Globally via Header */}

            <main className="relative z-10 max-w-7xl mx-auto px-8 lg:pt-8 pt-20 pb-32">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20 space-y-8">
                    <div className="inline-flex flex-row items-center gap-2 px-5 py-2 rounded-full border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-sm font-semibold backdrop-blur-md transition-colors">
                        Sürücü Alımları Açıldı
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white drop-shadow-xl transition-colors">
                        Boş Koltuklarını Değerlendir, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6A11CB] to-[#2575FC]">Kampüsün Hızını Belirle.</span>
                    </h1>

                    <h2 className="text-xl md:text-2xl text-gray-700 dark:text-white/80 max-w-3xl font-light mt-6 transition-colors">
                        Sadece edu.tr onaylı yolcuları taşıyarak masraflarını paylaş. Kotalara veya kurallara takılmadan kendi rotanı kendin çiz.
                    </h2>

                    <a
                        href="https://play.google.com/store/apps/details?id=com.alper.uniride"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-fit gap-3 px-10 py-5 mt-8 hover:scale-105 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg hover:bg-black dark:hover:bg-gray-100 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
                    >
                        <Car size={24} />
                        <span>Direksiyona Geç</span>
                    </a>
                </div>

                {/* Stepper Section */}
                <section className="mt-32 w-full mx-auto relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--color-uniride-magenta)]/50 to-transparent" />
                    <h2 className="text-3xl font-bold text-center mb-6 pt-16 text-gray-900 dark:text-white tracking-wide transition-colors">
                        Sıfır Sürtünme: Sürücü Olmak Çok Kolay
                    </h2>
                    <DriverStepper />
                </section>

                {/* Value Proposition Grid */}
                <section className="mt-32 pt-20 border-t border-white/5 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--color-uniride-deep-purple)]/50 to-transparent" />

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Neden UniRide Sürücüsü Olmalısın?</h2>
                        <p className="text-gray-600 dark:text-white/60 text-lg transition-colors">Kampüs içi ulaşımı domine ederken kendine değer kat.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Masraf Paylaşımı */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-[#2575FC]/10 dark:bg-[var(--color-uniride-magenta)]/10 rounded-full blur-2xl group-hover:bg-[#2575FC]/20 dark:group-hover:bg-[var(--color-uniride-magenta)]/20 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-[#2575FC]/20 dark:bg-[var(--color-uniride-magenta)]/20 flex items-center justify-center mb-6 text-[#2575FC] dark:text-[#4FB0FF] border border-[#2575FC]/30 dark:border-[var(--color-uniride-magenta)]/30">
                                    <Wallet size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Masraf Paylaşımı</h3>
                                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                                    Kampüse veya eve giderken boş kalan koltuklarını değerlendir, yakıt maliyetini bölüş ve ekonomik mantık yarat.
                                </p>
                            </div>
                        </div>

                        {/* Güvenli Ağ */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-[#6A11CB]/10 dark:bg-[var(--color-uniride-deep-purple)]/10 rounded-full blur-2xl group-hover:bg-[#6A11CB]/20 dark:group-hover:bg-[var(--color-uniride-deep-purple)]/20 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-[#6A11CB]/20 dark:bg-[var(--color-uniride-deep-purple)]/20 flex items-center justify-center mb-6 text-[#6A11CB] dark:text-white border border-[#6A11CB]/30 dark:border-[var(--color-uniride-deep-purple)]/30">
                                    <Shield size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Güvenli Ağ</h3>
                                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                                    Standart araç paylaşımının taşıdığı riskleri unut. <strong className="text-gray-900 dark:text-white font-medium">Gmail API</strong> doğrulamasıyla sadece edu.tr erişimi olan onaylı öğrencilerle eşleş.
                                </p>
                            </div>
                        </div>

                        {/* Esneklik */}
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-gray-200 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-gray-300 dark:group-hover:bg-white/10 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
                                    <Clock size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Sınırsız Esneklik</h3>
                                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                                    Kota yok, zorunlu mesai yok. Direksiyon senin elinde; sadece kampüse gidip geldiğin rotalarda dilediğin zaman sürücü modunu aktif et.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
