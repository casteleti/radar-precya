"use client";

import { usePathname, useRouter } from "next/navigation";

interface Props {
  clinicName: string;
  children: React.ReactNode;
}

type NavKey = "inicio" | "procedimentos" | "custos" | "conta";

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "inicio", label: "Início", href: "/calculadora" },
  { key: "procedimentos", label: "Procedimentos", href: "/procedimentos" },
  { key: "custos", label: "Custos", href: "/configuracoes" },
  { key: "conta", label: "Conta", href: "/conta" },
];

function activeKeyFromPath(pathname: string): NavKey {
  if (pathname.startsWith("/procedimentos")) return "procedimentos";
  if (pathname.startsWith("/configuracoes")) return "custos";
  if (pathname.startsWith("/conta")) return "conta";
  return "inicio";
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function IconProcedures({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.5 2.5l3 3-9.5 9.5-4-1-1-4 9.5-9.5z" />
      <path d="M14 7l3 3" />
      <path d="M5.5 16.5l-2 5 5-2" />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  );
}

function NavIcon({ navKey, active }: { navKey: NavKey; active: boolean }) {
  switch (navKey) {
    case "inicio":
      return <IconHome active={active} />;
    case "procedimentos":
      return <IconProcedures active={active} />;
    case "custos":
      return <IconSettings active={active} />;
    case "conta":
      return <IconUser active={active} />;
  }
}

export default function AppShell({ clinicName, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeKeyFromPath(pathname);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <div className="min-h-screen bg-[#FAFAFE]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-[#E5E5F0] px-4 py-6">
        <div className="px-2 mb-8">
          <span className="text-lg font-bold text-[#2E1A73]">Radar Precya</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium text-left transition-all ${
                  isActive ? "bg-[#EDE9FF] text-[#5E3ECF]" : "text-[#4A4A6A] hover:bg-[#FAFAFE]"
                }`}
              >
                <span className={isActive ? "text-[#5E3ECF]" : "text-[#9999BB]"}>
                  <NavIcon navKey={item.key} active={isActive} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="bg-[#FAFAFE] border border-[#E5E5F0] rounded-xl px-3 py-3">
            <p className="text-xs text-[#9999BB]">Clínica</p>
            <p className="text-sm font-semibold text-[#1A1A2E] truncate">{clinicName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium text-[#9999BB] hover:text-[#4A4A6A] hover:bg-[#FAFAFE] transition-all text-left"
          >
            <IconUser active={false} />
            Sair
          </button>
        </div>
      </aside>

      {/* Content wrapper */}
      <div className="lg:pl-64">
        <div className="pb-24 lg:pb-0">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5F0] pb-[env(safe-area-inset-bottom)] z-40">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] py-2"
              >
                <span className={isActive ? "text-[#5E3ECF]" : "text-[#9999BB]"}>
                  <NavIcon navKey={item.key} active={isActive} />
                </span>
                <span className={`text-[10px] font-medium ${isActive ? "text-[#5E3ECF]" : "text-[#9999BB]"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
