import Link from 'next/link';
import { Shield, FileText, Trash2 } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] py-12 px-6 lg:px-16 mt-auto transition-colors duration-300">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Brand & Mission */}
                <div className="flex flex-col gap-4">
                    <Link href="/" className="flex flex-col hover:opacity-90 transition-opacity w-fit">
                        <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white transition-colors">
                            Uni<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6A11CB] to-[#2575FC]">Ride</span>
                        </span>
                        <span className="text-xs font-semibold text-[#2575FC] tracking-[0.2em] uppercase mt-1">
                            Güvenli Kampüs Ulaşımı
                        </span>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mt-4 transition-colors">
                        Üniversite öğrencilerine özel, .edu.tr uzantılı mail doğrulaması ile yeni nesil güvenli kampüs içi yolculuk paylaşım platformu.
                    </p>
                </div>

                {/* Legal Routes (Crucial for Google Play Compliance) */}
                <div className="flex flex-col gap-4 md:col-span-2 md:ml-auto">
                    <h4 className="text-gray-900 dark:text-white font-semibold text-sm tracking-wider uppercase mb-2 text-left md:text-right transition-colors">
                        Yasal & Gizlilik
                    </h4>
                    <nav className="flex flex-col gap-3 text-sm text-left md:text-right">
                        <Link
                            href="/yasal/gizlilik-politikasi"
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-start md:justify-end gap-2 group"
                        >
                            <span className="group-hover:text-[#6A11CB] transition-colors"><Shield className="w-4 h-4" /></span>
                            KVKK & Gizlilik Politikası
                        </Link>
                        <Link
                            href="/yasal/kullanim-kosullari"
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-start md:justify-end gap-2 group"
                        >
                            <span className="group-hover:text-[#2575FC] transition-colors"><FileText className="w-4 h-4" /></span>
                            Kullanım Koşulları
                        </Link>
                        <Link
                            href="/veri-silme"
                            className="text-red-500/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-start md:justify-end gap-2 group mt-2"
                        >
                            <span className="group-hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></span>
                            Hesap & Veri Silme Talebi (Data Deletion)
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col items-center justify-center text-xs text-gray-400 dark:text-gray-500 transition-colors">
                <p>&copy; {currentYear} UniRide. Tüm hakları saklıdır.</p>
                <p className="mt-2 text-center max-w-xl mx-auto">
                    Google Play, Google Inc.&apos;in ticari markasıdır. UniRide yalnızca yetkili üniversite öğrencileri (veya personeli) tarafından kullanılabilir.
                </p>
            </div>
        </footer>
    );
}
