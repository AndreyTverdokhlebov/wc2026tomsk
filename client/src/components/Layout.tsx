import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { Trophy, Calendar, LogOut, User, Users, GitBranch, Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const APP_URL = "https://wc2026tomsk.ru";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
declare global { interface Window { _deferredPrompt?: BeforeInstallPromptEvent; } }
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window._deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

const NAV = [
  { path: "/", label: "Главная", icon: Home, testId: "nav-home" },
  { path: "/matches", label: "Прогнозы", icon: Calendar, testId: "nav-matches" },
  { path: "/groups", label: "Группы", icon: Users, testId: "nav-groups" },
  { path: "/bracket", label: "Сетка", icon: GitBranch, testId: "nav-bracket" },
  { path: "/leaderboard", label: "Рейтинг", icon: Trophy, testId: "nav-leaderboard" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [showIOSHint, setShowIOSHint] = useState(false);
  const { toast } = useToast();

  async function handleAndroidInstall() {
    if (window._deferredPrompt) {
      await window._deferredPrompt.prompt();
      await window._deferredPrompt.userChoice;
      window._deferredPrompt = undefined;
    } else {
      window.open(APP_URL, "_blank");
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "ЧМ2026 Прогнозы", url: APP_URL }).catch(() => {});
    } else {
      const el = document.createElement("input");
      el.value = APP_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast({ title: "Ссылка скопирована!" });
    }
  }

  if (!user) {
    window.location.hash = "/auth";
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: "hsl(220 20% 6%)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
              <svg aria-label="WC2026 Logo" viewBox="0 0 36 36" width="32" height="32" fill="none">
                <circle cx="18" cy="18" r="16" stroke="hsl(142 70% 45%)" strokeWidth="2.5"/>
                <polygon points="18,6 22,14 30,14 24,20 26,28 18,23 10,28 12,20 6,14 14,14" fill="hsl(35 95% 55%)" stroke="none"/>
              </svg>
              <span className="font-display font-bold text-base text-foreground hidden sm:block">
                ЧМ<span className="text-primary">2026</span>
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ path, label, icon: Icon, testId }) => {
              const isActive = location === path;
              return (
                <Link key={path} href={path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`gap-1.5 px-2.5 ${isActive ? "" : "text-muted-foreground hover:text-foreground"}`}
                    data-testid={testId}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">{label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Install buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* iOS */}
            <button
              onClick={() => setShowIOSHint(v => !v)}
              title="Установить на iPhone"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              data-testid="button-install-ios"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </button>
            {/* Android */}
            <button
              onClick={handleAndroidInstall}
              title="Установить на Android"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              data-testid="button-install-android"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.523 15.341c-.3 0-.546-.246-.546-.545V9.945c0-.3.246-.546.546-.546.3 0 .545.246.545.546v4.851c0 .299-.245.545-.545.545zm-11.046 0c-.3 0-.545-.246-.545-.545V9.945c0-.3.245-.546.545-.546.3 0 .546.246.546.546v4.851c0 .299-.246.545-.546.545zM8.392 5.051l-.87-1.508a.177.177 0 0 0-.241-.065.177.177 0 0 0-.065.241l.882 1.527A5.645 5.645 0 0 0 6.01 7.824h11.98a5.645 5.645 0 0 0-2.088-2.578l.882-1.527a.177.177 0 0 0-.065-.241.177.177 0 0 0-.241.065l-.87 1.508A5.567 5.567 0 0 0 12 4.364a5.567 5.567 0 0 0-3.608.687zm3.61-1.506c4.197 0 7.076 2.848 7.076 6.745v3.682c0 .535-.434.969-.969.969H5.89a.969.969 0 0 1-.969-.969V10.29c0-3.897 2.879-6.745 7.081-6.745zM9.964 6.5a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zm4.072 0a.545.545 0 1 1 0 1.09.545.545 0 0 1 0-1.09zM6.919 16.745h10.162v2.042a1.21 1.21 0 0 1-1.21 1.213h-.847v1.818a.727.727 0 1 1-1.455 0V20h-3.138v1.818a.727.727 0 1 1-1.455 0V20H8.13a1.21 1.21 0 0 1-1.212-1.213v-2.042z"/>
              </svg>
            </button>
            {/* Share */}
            <button
              onClick={handleShare}
              title="Поделиться ссылкой"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* User */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-sm">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium text-foreground text-xs hidden sm:block" data-testid="text-username">
                {user.username}
              </span>
              <span className="text-primary font-bold text-xs">{user.points} оч.</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="button-logout"
              title="Выйти"
              className="w-8 h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* iOS install hint */}
      {showIOSHint && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="rounded-xl bg-secondary border border-border p-3 text-sm text-muted-foreground flex items-start gap-3">
            <span className="text-lg">📱</span>
            <div>
              <p className="font-semibold text-foreground mb-1">Как установить на iPhone:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Открой <span className="text-foreground font-medium">Safari</span> → перейди на сайт</li>
                <li>Нажми <span className="text-foreground font-medium">«Поделиться»</span> (квадрат со стрелкой ↑)</li>
                <li>Выбери <span className="text-foreground font-medium">«На экран «Домой»»</span></li>
              </ol>
            </div>
            <button onClick={() => setShowIOSHint(false)} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
