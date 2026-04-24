import { Link } from "wouter";
import { useAuth } from "@/App";
import { Calendar, Users, GitBranch, Trophy } from "lucide-react";

const sections = [
  {
    href: "/matches",
    icon: Calendar,
    title: "Прогнозы на матчи",
    desc: "Угадывай счета и зарабатывай очки",
    color: "from-green-900/60 to-green-800/30",
    accent: "text-green-400",
    border: "border-green-800/50",
  },
  {
    href: "/groups",
    icon: Users,
    title: "Групповой этап",
    desc: "Предсказывай места команд в группах",
    color: "from-blue-900/60 to-blue-800/30",
    accent: "text-blue-400",
    border: "border-blue-800/50",
  },
  {
    href: "/bracket",
    icon: GitBranch,
    title: "Сетка плей-офф",
    desc: "Следи за сеткой турнира",
    color: "from-purple-900/60 to-purple-800/30",
    accent: "text-purple-400",
    border: "border-purple-800/50",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "Таблица лидеров",
    desc: "Соревнуйся с друзьями",
    color: "from-yellow-900/60 to-yellow-800/30",
    accent: "text-yellow-400",
    border: "border-yellow-800/50",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-5xl">⚽</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Чемпионат мира 2026
        </h1>
        <p className="text-muted-foreground text-sm">
          Добро пожаловать,{" "}
          <span className="text-primary font-semibold">{user?.username}</span>!
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          11 июня — 19 июля 2026 · США, Канада, Мексика
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {sections.map(({ href, icon: Icon, title, desc, color, accent, border }) => (
          <Link key={href} href={href}>
            <div
              className={`
                group relative rounded-2xl border ${border} bg-gradient-to-br ${color}
                p-5 cursor-pointer transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
              `}
            >
              <div className={`${accent} mb-3`}>
                <Icon className="w-7 h-7" />
              </div>
              <h2 className="font-semibold text-foreground text-base mb-1">{title}</h2>
              <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              <div className={`absolute bottom-4 right-4 ${accent} opacity-30 group-hover:opacity-60 transition-opacity`}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Points */}
      <div className="mt-8 px-6 py-3 rounded-full bg-secondary border border-border text-sm text-muted-foreground">
        Твои очки: <span className="text-primary font-bold text-base ml-1">{user?.points ?? 0}</span>
      </div>
    </div>
  );
}
