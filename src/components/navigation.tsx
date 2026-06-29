"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  LogOut,
  LogIn,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { authClient } from "@/lib/auth-client";

const navItems = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/assets", label: "资产", icon: Package },
  { href: "/add", label: "新增", icon: PlusCircle },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [session, setSession] = useState<{ user: { id: string; name: string; email: string } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      setSession(data as any);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    setSession(null);
    window.location.href = "/";
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-card border-r z-30">
        <div className="flex items-center gap-2 px-6 h-16 border-b">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Mammon</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t space-y-2">
          {!loading && (
            session ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm truncate">
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{session.user.name || session.user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogIn className="h-4 w-4" />
                登录 / 注册
              </Link>
            )
          )}
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 bg-background/80 backdrop-blur-md border-b z-30">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="font-bold">Mammon</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Spacers for mobile header + bottom nav */}
      <div className="md:hidden h-14" />
      <div className="md:hidden h-16" />
    </>
  );
}