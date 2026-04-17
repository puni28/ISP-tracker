"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "⊞" },
  { href: "/map", label: "Map", icon: "◉" },
  { href: "/assets", label: "Assets", icon: "⬡" },
  { href: "/cables", label: "Cables", icon: "⌇" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-50">
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
  );
}
