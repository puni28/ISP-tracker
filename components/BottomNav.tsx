"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/",        label: "Home",   icon: "⊞" },
  { href: "/map",     label: "Map",    icon: "◉" },
  { href: "/assets",  label: "Assets", icon: "⬡" },
  { href: "/cables",  label: "Cables", icon: "⌇" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Mobile: bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-50">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center pt-3 pb-2 text-xs gap-1 transition-colors ${
                active ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Tablet/desktop: left sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-slate-800 border-r border-slate-700 flex-col z-50">
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="text-base font-bold text-slate-100">ISP Tracker</div>
          <div className="text-xs text-slate-500 mt-0.5">Field Technician</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="text-lg leading-none w-6 text-center">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
