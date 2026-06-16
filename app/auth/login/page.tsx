"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/send-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao enviar. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-[#EDE9FF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#2E1A73]">Radar Precya</h1>
          <p className="text-sm text-[#9999BB] mt-1">Precificação inteligente para clínicas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">Link enviado!</h2>
              <p className="text-sm text-[#4A4A6A]">
                Verifique seu e-mail. O link expira em 15 minutos.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-[#5E3ECF] hover:underline"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A2E] mb-1">Entre com seu e-mail</h2>
                <p className="text-sm text-[#9999BB]">Você receberá um link mágico. Sem senha! 🔮</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#4A4A6A]">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 px-4 rounded-xl border border-[#E5E5F0] text-base
                             focus:outline-none focus:ring-2 focus:ring-[#B79CFF] focus:border-[#5E3ECF]
                             transition-all placeholder:text-[#9999BB]"
                />
              </div>

              {error && <p className="text-sm text-[#E65A5A]">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email}
                className="h-11 bg-[#5E3ECF] text-white rounded-xl font-semibold
                           hover:bg-[#7C4DFF] transition-all active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
