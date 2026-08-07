"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  FileSearch,
  Files,
  History,
  Bot,
  Menu,
  X,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = "primary-navigation-mobile";

  const navLinks = [
    { href: "/analyze", label: "Phân tích đơn", icon: FileSearch },
    { href: "/analyze/batch", label: "Phân tích Batch", icon: Files },
    { href: "/skills", label: "Bộ Skills HR", icon: Sparkles },
    { href: "/history", label: "Lịch sử", icon: History },
  ];

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-stone-900 flex items-center gap-1.5">
              HiLab <span className="gradient-text">HR Agent</span>
            </span>
            <span className="text-[10px] text-stone-500 block -mt-1 font-mono">CV Screening AI System</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/analyze"
                ? pathname === "/analyze"
                : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: status badge and mobile navigation */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Screening System</span>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
            aria-label={isMobileMenuOpen ? "Đóng điều hướng chính" : "Mở điều hướng chính"}
            aria-controls={mobileMenuId}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          id={mobileMenuId}
          aria-label="Điều hướng chính"
          className="border-t border-stone-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md md:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1 px-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/analyze"
                  ? pathname === "/analyze"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
