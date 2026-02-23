"use client";

import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Zap, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2575FC]/20 dark:bg-[var(--color-uniride-magenta)]/20 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#6A11CB]/20 dark:bg-[var(--color-uniride-deep-purple)]/20 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex flex-row items-center gap-2 px-4 py-2 rounded-full border border-[#2575FC]/30 bg-[#2575FC]/10 text-[#2575FC] text-sm font-semibold mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2575FC] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2575FC]"></span>
              </span>
              Kampüsünde Yayında!
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="block">Kampüste</span>
              <span className="block mt-2 bg-gradient-to-r from-[#6A11CB] to-[#2575FC] text-transparent bg-clip-text pb-2">
                Hızlı, Güvenli Seyahat.
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-white/60 mb-10 max-w-lg leading-relaxed">
              Önder öğrenci topluluğuna katıl. UniRide ile derslerine geç kalma,
              güvenle kampüs içinde dilediğin yere seyahat et. Sadece doğrulanmış öğrencilerle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-semibold transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <Download size={20} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-gray-500 leading-none mb-1">Çok Yakında • App Store</div>
                  <div className="text-sm leading-none">UniRide Ağına Katıl</div>
                </div>
              </button>
              <a
                href="https://play.google.com/store/apps/details?id=com.alper.uniride"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#111] border border-white/10 text-white font-semibold hover:bg-[#222] transition-colors"
              >
                <Download size={20} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Hemen İndir • Google Play</div>
                  <div className="text-sm leading-none">Kampüs Yolculuğuna Başla</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Hero Asset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative h-[400px] lg:h-[600px] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-uniride-deep-purple)]/20 to-[var(--color-uniride-magenta)]/20 rounded-[40px] border border-white/5 backdrop-blur-3xl" />

            {/* White Lamborghini Asset Placeholder - Replaced by Image Token */}
            <div className="relative z-10 w-full max-w-[450px] filter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">
              <Image src="/logo.png" alt="UniRide Lamborghini Brand Token" width={800} height={450} className="w-full h-auto object-contain" priority />
            </div>
            {/* Asset Flare */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-white/20 blur-[60px] rounded-full pointer-events-none" />
          </motion.div>
        </div>

        {/* Value Proposition Grid */}
        <div className="mt-32 pt-20 border-t border-white/5 relative">
          {/* Subtle separator glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--color-uniride-magenta)]/50 to-transparent" />

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-[#6A11CB]/10 dark:bg-[var(--color-uniride-deep-purple)]/10 rounded-full blur-2xl group-hover:bg-[#6A11CB]/20 dark:group-hover:bg-[var(--color-uniride-deep-purple)]/20 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#6A11CB]/10 dark:bg-[var(--color-uniride-deep-purple)]/20 flex items-center justify-center mb-6 text-[#6A11CB] dark:text-white border border-[#6A11CB]/20 dark:border-[var(--color-uniride-deep-purple)]/30">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Sadece Onaylı Öğrenciler</h3>
                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                  Platforma sadece .edu.tr uzantılı mail adresleriyle kayıt olunabilir. Güvenliğin ve
                  huzurun her zaman ön planda.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-[#2575FC]/10 dark:bg-[var(--color-uniride-magenta)]/10 rounded-full blur-2xl group-hover:bg-[#2575FC]/20 dark:group-hover:bg-[var(--color-uniride-magenta)]/20 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#2575FC]/10 dark:bg-[var(--color-uniride-magenta)]/20 flex items-center justify-center mb-6 text-[#2575FC] dark:text-[#4FB0FF] border border-[#2575FC]/20 dark:border-[var(--color-uniride-magenta)]/30">
                  <MapPin size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Konum Bazlı Eşleşme</h3>
                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                  Akıllı coğrafi haritalama (Geospatial Matching) sayesinde sana en yakın sürücüyü
                  saniyeler içinde bul, zaman kaybetme.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-gray-200 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-gray-300 dark:group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">
                  <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">Gecikmesiz Arayüz</h3>
                <p className="text-gray-600 dark:text-white/50 leading-relaxed transition-colors">
                  Sıfır gecikme (Zero-Latency UI) ilkesiyle anlık tepki veren, akıcı ve modern
                  kullanıcı arayüzü ile tanış.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
