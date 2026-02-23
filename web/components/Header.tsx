"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    const pathname = usePathname();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <header className="w-full relative z-50 px-6 lg:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="w-12 h-12" />
            </header>
        );
    }

    const isDark = theme === "dark";

    return (
        <header className="w-full relative z-[60] px-6 lg:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
                UniRide
            </Link>

            <div className="flex items-center gap-4">
                {pathname !== "/surucu-ol" ? (
                    <Link
                        href="/surucu-ol"
                        className="cursor-pointer px-6 py-2.5 rounded-full font-semibold transition-all hover:scale-105 bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md hover:shadow-lg inline-flex items-center justify-center text-sm"
                    >
                        Neden Sürücü Olmalısın?
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="cursor-pointer px-6 py-2.5 rounded-full font-semibold transition-all hover:scale-105 bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md hover:shadow-lg inline-flex items-center justify-center text-sm"
                    >
                        {"UniRide'ı Keşfet"}
                    </Link>
                )}
                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 transition-colors hover:bg-gray-100 dark:hover:bg-white/20 shadow-sm dark:shadow-none"
                    aria-label="Toggle Theme"
                >
                    <motion.div
                        initial={false}
                        animate={{
                            rotate: isDark ? 0 : 180,
                            scale: isDark ? 1 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="absolute"
                    >
                        <Moon className="w-5 h-5 text-gray-800 dark:text-white" />
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={{
                            rotate: isDark ? -180 : 0,
                            scale: isDark ? 0 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="absolute"
                    >
                        <Sun className="w-5 h-5 text-gray-800 dark:text-white" />
                    </motion.div>
                </button>
            </div>
        </header>
    );
}
