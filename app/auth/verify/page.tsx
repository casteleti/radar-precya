"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    if (error) {
      setStatus("error");
      return;
    }
    if (token) {
      window.location.href = `/api/auth/verify?token=${token}`;
    } else {
      setStatus("error");
    }
  }, [token, error]);

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">⏰</div>
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">
          {error === "expired" ? "Este link expirou." : "Link inválido."}
        </h2>
        <p className="text-sm text-[#4A4A6A] mb-4">
          Links de acesso são válidos por 15 minutos e só podem ser usados uma vez.
        </p>
        <a
          href="/auth/login"
          className="inline-block bg-[#5E3ECF] text-white px-6 py-2.5 rounded-xl font-semibold
                     hover:bg-[#7C4DFF] transition-all text-sm"
        >
          Solicitar novo link
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-4xl mb-3 animate-pulse">⏳</div>
      <h2 className="text-lg font-semibold text-[#1A1A2E]">Verificando seu acesso...</h2>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[#EDE9FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-[#2E1A73]">Radar Precya</h1>
        </div>
        <Suspense fallback={<div className="text-center text-[#9999BB]">Carregando...</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
