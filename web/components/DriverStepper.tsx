"use client";

import { motion } from "framer-motion";
import { Mail, Map, Users } from "lucide-react";

const steps = [
    {
        icon: Mail,
        title: "Kurumsal Doğrulama",
        description: "Sadece .edu.tr uzantılı mail adresinle kayıt ol. Güvenli ağın bir parçası olduğunu kanıtla.",
    },
    {
        icon: Map,
        title: "Rotanı Çiz",
        description: "Günlük kampüs güzergahını belirle. Yola çıkacağın saati ve rotayı önceden ayarla.",
    },
    {
        icon: Users,
        title: "Eşleş ve Kazan",
        description: "Sıfır gecikmeli coğrafi eşleşme ile yolcularını bul, masrafları paylaş.",
    },
];

export function DriverStepper() {
    return (
        <div className="flex flex-col md:flex-row gap-12 md:gap-8 relative mt-16 mb-16 max-w-5xl mx-auto">
            {/* Desktop Line */}
            <div className="hidden md:block absolute top-8 left-[16.666%] right-[16.666%] h-[2px] bg-gray-200 dark:bg-white/10 -z-10 rounded-full transition-colors duration-300" />
            {/* Mobile Line */}
            <div className="md:hidden absolute top-8 left-8 w-[2px] h-[calc(100%-64px)] bg-gray-200 dark:bg-white/10 -z-10 rounded-full transition-colors duration-300" />

            {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: index * 0.2, duration: 0.5, ease: "easeOut" }}
                        className="flex-1 relative flex flex-row md:flex-col items-start md:items-center text-left md:text-center group gap-6 md:gap-0"
                    >
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-white dark:bg-[#050510] md:mx-auto border border-[#2575FC]/30 dark:border-[var(--color-uniride-magenta)]/30 flex items-center justify-center md:mb-6 text-[#2575FC] dark:text-[var(--color-uniride-magenta)] group-hover:bg-[#2575FC]/10 dark:group-hover:bg-[var(--color-uniride-magenta)]/20 transition-all shadow-[0_0_15px_rgba(37,117,252,0.1)] group-hover:shadow-[0_0_30px_rgba(37,117,252,0.3)] relative z-10">
                            <Icon size={28} />
                        </div>

                        <div className="mt-2 md:mt-0">
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white transition-colors">{step.title}</h3>
                            <p className="text-gray-600 dark:text-white/50 leading-relaxed text-sm max-w-xs transition-colors">{step.description}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
