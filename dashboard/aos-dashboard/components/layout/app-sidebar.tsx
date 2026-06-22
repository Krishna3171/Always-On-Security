"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutDashboard, ShieldAlert, Server, Radar } from "lucide-react";

const items = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: ShieldAlert,
  },
  {
    title: "Nodes",
    href: "/nodes",
    icon: Server,
  },
  {
    title: "Intel",
    href: "/intel",
    icon: Radar,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
    fixed
    left-0
    top-0
    z-50
    flex
    h-screen
    w-64
    flex-col
    border-r
    border-zinc-800
    bg-zinc-950/95
    backdrop-blur-md
  "
    >
      {/* Logo */}
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-lg font-bold text-white">Always-On Security</h1>

        <p className="text-xs text-zinc-500">Security Operations Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2
                  transition-colors

                  ${
                    active
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Status */}
      <div className="p-4">
        <div
          className="
            rounded-lg
            border
            border-zinc-800
            bg-zinc-900
            p-3
          "
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

            <span className="text-sm text-zinc-300">Monitoring Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
