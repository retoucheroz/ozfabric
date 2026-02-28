"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyContent() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const email = sp.get("email");

  const calledRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      if (!token || !email) return setStatus("fail");

      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        setStatus(res.ok ? "ok" : "fail");
      } catch (err) {
        setStatus("fail");
      }
    })();
  }, [token, email]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <h2 className="text-xl font-bold text-white tracking-tight">Doğrulanıyor...</h2>
        <p className="text-zinc-400 text-sm">Lütfen bekleyin, hesabınız aktifleştiriliyor.</p>
      </div>
    );
  }

  if (status === "ok") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Hesabınız Doğrulandı!</h2>
          <p className="text-zinc-400 text-sm">E-posta adresiniz başarıyla onaylandı.</p>
        </div>
        <Link
          href="/login"
          className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all w-full text-center"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Doğrulama Başarısız</h2>
        <p className="text-zinc-400 text-sm">Doğrulama linki geçersiz, daha önce kullanılmış<br />veya süresi dolmuş olabilir.</p>
      </div>
      <Link
        href="/login"
        className="bg-transparent border border-white/10 text-white hover:bg-white/5 px-8 py-3 rounded-md text-[11px] font-black uppercase tracking-widest transition-all w-full text-center"
      >
        Giriş Ekranına Dön
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center p-6 relative">
      <div className="w-full max-w-[400px] border border-white/10 rounded-[1.5rem] p-8 md:p-10 bg-[#0D0D0F] shadow-2xl relative z-10 flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <span className="font-black text-2xl tracking-tighter text-white">
            ModeOn<span className="text-white/40">.ai</span>
          </span>
        </div>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-zinc-400 text-sm">Yükleniyor...</p>
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}