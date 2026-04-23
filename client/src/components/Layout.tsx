import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { Trophy, Calendar, LogOut, User, Users, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { path: "/", label: "Прогнозы", icon: Calendar, testId: "nav-matches" },
  { path: "/groups", label: "Группы", icon: Users, testId: "nav-groups" },
  { path: "/bracket", label: "Сетка", icon: GitBranch, testId: "nav-bracket" },
  { path: "/leaderboard", label: "Рейтинг", icon: Trophy, testId: "nav-leaderboard" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

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

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
