"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DataDeletionPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (!email.trim() || !email.toLowerCase().includes(".edu.tr")) {
            setStatus("error");
            setErrorMessage("Lütfen geçerli bir üniversite/öğrenci (.edu.tr) e-posta adresi girin.");
            return;
        }

        setStatus("submitting");

        try {
            // Execute the asynchronous POST request to the Express backend
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${apiUrl}/users/delete-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            // Handle typical failure cases natively
            if (!response.ok) {
                throw new Error("Sunucu ile iletişim reddedildi veya böyle bir hesap zaten bulunmuyor.");
            }

            setStatus("success");
        } catch (err: unknown) {
            setStatus("error");
            // Provide a generic fallback error if generic network failure
            const message = err instanceof Error ? err.message : "Talebiniz işlenirken beklenmedik bir sistem hatası oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.";
            setErrorMessage(message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col pt-24 pb-12 px-6 transition-colors duration-300">
            <div className="max-w-xl mx-auto w-full">
                {/* Navigation Context */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Ana Sayfaya Dön
                </Link>

                {status === "success" ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 text-center flex flex-col items-center shadow-lg">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Silme Talebiniz Kaydedildi</h1>
                        <p className="text-gray-400 leading-relaxed text-sm mt-2">
                            <strong className="text-emerald-400">{email}</strong> adresine bağlı dijital hesabınızın ve tüm ilişkili şahsi verilerinizin tasfiye süreci başlatılmıştır. Google Play Data Safety standartları gereği, en geç <strong className="text-gray-200">30 gün</strong> içerisinde verileriniz sunucularımızdan kalıcı ve geri döndürülemez biçimde yok edilecektir.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 shadow-2xl rounded-3xl p-8 sm:p-10 transition-colors">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight transition-colors">Hesabımı ve Verilerimi Sil</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                                Bu eylem <strong>kesinlikle geri alınamaz</strong>. Onaylandığı takdirde kimlik bilgileriniz, sürüş kayıtlarınız, mesajlaşmalarınız ve aktif cüzdan bakiyeniz dahil olmak üzere her türlü dijital ayak iziniz silinecektir.
                            </p>
                        </div>

                        {status === "error" && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-400 font-medium">{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block transition-colors">
                                    Kurumsal E-posta Adresi (.edu.tr)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@ogrenci.uniler.edu.tr"
                                    required
                                    disabled={status === "submitting"}
                                    className="w-full bg-gray-100 dark:bg-black/60 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50 font-medium"
                                    spellCheck={false}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === "submitting"}
                                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl px-4 py-4 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-wait"
                            >
                                {status === "submitting" ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Silme Talebi İletiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Kalıcı Olarak Tasfiye Et
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 text-[11px] text-gray-500 text-center flex flex-col gap-2 uppercase tracking-wide font-semibold">
                            <p>
                                Bu portal, Google Play platformu Veri Güvenliği (Data Safety) zorunlulukları uyarınca genel erişime açık tutulmaktadır.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
