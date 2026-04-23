import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { Match, Prediction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Check, Clock, MapPin } from "lucide-react";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" });
}
function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

type PredMap = Record<number, Prediction>;

function MatchCard({ match, pred, onSave }: {
  match: Match;
  pred?: Prediction;
  onSave: (matchId: number, home: number, away: number) => void;
}) {
  const [home, setHome] = useState<string>(pred?.homeScore?.toString() ?? "");
  const [away, setAway] = useState<string>(pred?.awayScore?.toString() ?? "");
  const [saved, setSaved] = useState(false);

  const isDirty = home !== (pred?.homeScore?.toString() ?? "") || away !== (pred?.awayScore?.toString() ?? "");
  const isFinished = match.status === "finished";

  function handleSave() {
    if (home === "" || away === "") return;
    onSave(match.id, Number(home), Number(away));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function clampInput(val: string) {
    const n = parseInt(val);
    if (isNaN(n)) return "";
    return Math.max(0, Math.min(20, n)).toString();
  }

  return (
    <div className="match-card" data-testid={`card-match-${match.id}`}>
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="flag">{match.homeTeamFlag}</span>
          <span className="font-medium text-sm leading-tight truncate">{match.homeTeam}</span>
        </div>

        {/* Score prediction */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFinished ? (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <span className="font-bold text-foreground">{match.homeScore}</span>
              <span>:</span>
              <span className="font-bold text-foreground">{match.awayScore}</span>
            </div>
          ) : (
            <>
              <input
                type="number"
                min={0} max={20}
                className="score-input"
                value={home}
                onChange={(e) => setHome(clampInput(e.target.value))}
                placeholder="?"
                data-testid={`input-home-${match.id}`}
              />
              <span className="text-muted-foreground font-bold text-lg">:</span>
              <input
                type="number"
                min={0} max={20}
                className="score-input"
                value={away}
                onChange={(e) => setAway(clampInput(e.target.value))}
                placeholder="?"
                data-testid={`input-away-${match.id}`}
              />
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          <span className="font-medium text-sm leading-tight truncate text-right">{match.awayTeam}</span>
          <span className="flag">{match.awayTeamFlag}</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(match.matchDate)} · {formatTime(match.matchDate)}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {match.city}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pred && !isFinished && (
            <span className="text-xs text-muted-foreground">
              Прогноз: {pred.homeScore}:{pred.awayScore}
            </span>
          )}
          {pred && isFinished && (
            <span className={`text-xs font-semibold ${pred.points === 5 ? "result-exact" : pred.points === 2 ? "result-outcome" : "result-wrong"}`}>
              {pred.points === 5 ? "+5 точный" : pred.points === 2 ? "+2 исход" : "0 очков"}
            </span>
          )}
          {!isFinished && (
            <Button
              size="sm"
              variant={saved ? "default" : isDirty || !pred ? "outline" : "ghost"}
              disabled={home === "" || away === ""}
              onClick={handleSave}
              className="h-7 text-xs px-3"
              data-testid={`button-save-${match.id}`}
            >
              {saved ? <Check className="w-3 h-3" /> : "Сохранить"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map((g) => [g, true]))
  );

  const { data: matches, isLoading: loadingMatches } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: myPredictions } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions", user?.id],
    enabled: !!user,
  });

  const predMap: PredMap = {};
  myPredictions?.forEach((p) => { predMap[p.matchId] = p; });

  const saveMutation = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: number; home: number; away: number }) => {
      const res = await apiRequest("POST", "/api/predictions", {
        userId: user!.id,
        matchId,
        homeScore: home,
        awayScore: away,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/predictions", user?.id] });
      qc.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (e: Error) => {
      toast({ title: e.message, variant: "destructive" });
    },
  });

  function toggleGroup(g: string) {
    setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }));
  }

  if (loadingMatches) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const groupedMatches: Record<string, Match[]> = {};
  matches?.forEach((m) => {
    if (!groupedMatches[m.group]) groupedMatches[m.group] = [];
    groupedMatches[m.group].push(m);
  });

  const totalPreds = myPredictions?.length ?? 0;
  const totalMatches = matches?.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">Прогнозы</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalPreds} из {totalMatches} матчей предсказано
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-muted-foreground">+5 точный счёт</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-muted-foreground">+2 верный исход</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: totalMatches ? `${(totalPreds / totalMatches) * 100}%` : "0%" }}
        />
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {GROUPS.filter((g) => groupedMatches[g]?.length).map((group) => {
          const isOpen = openGroups[group];
          const groupMatches = groupedMatches[group] || [];

          return (
            <div key={group} className="rounded-xl overflow-hidden border border-border">
              {/* Group header */}
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                style={{ background: "hsl(220 18% 10%)" }}
                onClick={() => toggleGroup(group)}
                data-testid={`button-group-${group}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="group-badge">{group}</span>
                  <span className="font-semibold text-sm">Группа {group}</span>
                  <span className="text-xs text-muted-foreground">
                    {groupMatches.filter((m) => predMap[m.id]).length}/{groupMatches.length} прогнозов
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Matches */}
              {isOpen && (
                <div className="p-3 space-y-2" style={{ background: "hsl(220 18% 8%)" }}>
                  {groupMatches
                    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
                    .map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        pred={predMap[match.id]}
                        onSave={(matchId, home, away) =>
                          saveMutation.mutate({ matchId, home, away })
                        }
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
