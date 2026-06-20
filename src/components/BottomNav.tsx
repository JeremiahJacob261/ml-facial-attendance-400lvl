"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/attendance", icon: "center_focus_weak", label: "Capture" },
  { href: "/records", icon: "history_edu", label: "Records" },
  { href: "/admin", icon: "admin_panel_settings", label: "Admin" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(26,28,28,0.06)] border-t border-outline-variant/15">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex flex-col items-center justify-center bg-primary-container text-white rounded-2xl px-3 sm:px-5 py-2 active:translate-y-0.5 transition-transform"
                : "flex flex-col items-center justify-center text-on-surface-variant px-3 sm:px-5 py-2 hover:text-primary active:translate-y-0.5 transition-transform"
            }
          >
            <span
              className="material-symbols-outlined mb-1"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-inter text-[12px] font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
