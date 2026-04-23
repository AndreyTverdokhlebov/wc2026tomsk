import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import type { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 pts-gold" />;
  if (rank === 2) return <Medal className="w-5 h-5 pts-silver" />;
  if (rank === 3) return <Award className="w-5 h-5 pts-bronze" />;
  return <span className="text-muted-foreground text-sm font-medium w-5 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  const { user } = useAuth();

  const { data: leaders, isLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2 max-w-xl mx-auto">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-foreground">Таблица лидеров</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {leaders?.length ?? 0} участников
        </p>
      </div>

      {/* Score legend */}
      <div className="glass rounded-xl p-4 mb-6 grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-green-400 font-bold text-xs">+5</span>
          </div>
          <span className="text-muted-foreground">Точный счёт</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 font-bold text-xs">+2</span>
          </div>
          <span className="text-muted-foreground">Верный исход</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 font-bold text-xs">+2</span>
          </div>
          <span className="text-muted-foreground">Место в группе</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {leaders?.map((u, idx) => {
          const rank = idx + 1;
          const isMe = u.id === user?.id;
          return (
            <div
              key={u.id}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isMe
                  ? "border border-primary/50 bg-primary/5"
                  : "border border-border bg-card"
              }`}
              data-testid={`row-user-${u.id}`}
            >
              <div className="flex items-center justify-center w-6">
                <RankIcon rank={rank} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                    {u.username}
                  </span>
                  {isMe && (
                    <span className="text-xs text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      вы
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`font-display font-bold text-lg ${
                    rank === 1 ? "pts-gold" : rank === 2 ? "pts-silver" : rank === 3 ? "pts-bronze" : "text-foreground"
                  }`}
                  data-testid={`text-points-${u.id}`}
                >
                  {u.points}
                </span>
                <span className="text-muted-foreground text-xs">оч.</span>
              </div>
            </div>
          );
        })}

        {(!leaders || leaders.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Пока никто не делал прогнозов</p>
          </div>
        )}
      </div>
    </div>
  );
}
