"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
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

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      setStatus(res.ok ? "ok" : "fail");
    })();
  }, [token, email]);

  if (status === "loading") return <div>Doğrulanıyor…</div>;
  if (status === "ok")
    return (
      <div>
        ✅ E-posta doğrulandı. <a href="/login">Giriş yap</a>
      </div>
    );
  return <div>❌ Link geçersiz veya süresi dolmuş.</div>;
}