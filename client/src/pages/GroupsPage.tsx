import type { Match, GroupPrediction } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check, GripVertical } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const FLAG_MAP: Record<string, string> = {
  "Мексика": "🇲🇽", "ЮАР": "🇿🇦", "Южная Корея": "🇰🇷", "Чехия": "🇨🇿",
  "Канада": "🇨🇦", "Босния и Герцеговина": "🇧🇦", "США": "🇺🇸", "Парагвай": "🇵🇾",
  "Катар": "🇶🇦", "Швейцария": "🇨🇭", "Бразилия": "🇧🇷", "Марокко": "🇲🇦",
  "Гаити": "🇭🇹", "Шотландия": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Австралия": "🇦🇺", "Турция": "🇹🇷",
  "Германия": "🇩🇪", "Кюрасао": "🇨🇼", "Нидерланды": "🇳🇱", "Япония": "🇯🇵",
  "Кот-д'Ивуар": "🇨🇮", "Эквадор": "🇪🇨", "Швеция": "🇸🇪", "Тунис": "🇹🇳",
  "Испания": "🇪🇸", "Кабо-Верде": "🇨🇻", "Бельгия": "🇧🇪", "Египет": "🇪🇬",
  "Саудовская Аравия": "🇸🇦", "Уругвай": "🇺🇾", "Иран": "🇮🇷", "Новая Зеландия": "🇳🇿",
  "Франция": "🇫🇷", "Сенегал": "🇸🇳", "Ирак": "🇮🇶", "Норвегия": "🇳🇴",
  "Аргентина": "🇦🇷", "Алжир": "🇩🇿", "Австрия": "🇦🇹", "Иордания": "🇯🇴",
  "Португалия": "🇵🇹", "ДР Конго": "🇨🇩", "Узбекистан": "🇺🇿", "Колумбия": "🇨🇴",
  "Гана": "🇬🇭", "Панама": "🇵🇦", "Англия": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Хорватия": "🇭🇷",
};

const GROUP_TEAMS: Record<string, string[]> = {
  A: ["Мексика", "ЮАР", "Южная Корея", "Чехия"],
  B: ["Канада", "Швейцария", "Катар", "Босния и Герцеговина"],
  C: ["Бразилия", "Марокко", "Гаити", "Шотландия"],
  D: ["США", "Парагвай", "Австралия", "Турция"],
  E: ["Германия", "Кюрасао", "Кот-д'Ивуар", "Эквадор"],
  F: ["Нидерланды", "Япония", "Тунис", "Швеция"],
  G: ["Бельгия", "Египет", "Иран", "Новая Зеландия"],
  H: ["Испания", "Кабо-Верде", "Саудовская Аравия", "Уругвай"],
  I: ["Франция", "Сенегал", "Норвегия", "Ирак"],
  J: ["Аргентина", "Алжир", "Австрия", "Иордания"],
  K: ["Португалия", "Узбекистан", "Колумбия", "ДР Конго"],
  L: ["Англия", "Хорватия", "Гана", "Панама"],
};

type TeamStats = {
  name: string; played: number; won: number; drawn: number;
  lost: number; gf: number; ga: number; gd: number; pts: number;
};

function buildGroupTable(teams: string[], matches: Match[]): TeamStats[] {
  const stats: Record<string, TeamStats> = {};
  for (const t of teams) stats[t] = { name: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

  for (const m of matches) {
    if (m.status !== "finished" || m.homeScore == null || m.awayScore == null) continue;
    const h = stats[m.homeTeam], a = stats[m.awayTeam];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; h.pts += 3; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; h.pts += 1; a.drawn++; a.pts += 1; }
  }
  return Object.values(stats).map(s => ({ ...s, gd: s.gf - s.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

// ─── Drag-and-drop ranking widget ───────────────────────────────
function RankingWidget({
  group, teams, savedPred, onSave,
}: {
  group: string;
  teams: string[];
  savedPred?: GroupPrediction;
  onSave: (group: string, order: string[]) => void;
}) {
  const initialOrder = savedPred
    ? [savedPred.pos1, savedPred.pos2, savedPred.pos3, savedPred.pos4]
    : [...teams];

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [saved, setSaved] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const isDirty = JSON.stringify(order) !== JSON.stringify(
    savedPred ? [savedPred.pos1, savedPred.pos2, savedPred.pos3, savedPred.pos4] : teams
  );

  function handleDragStart(idx: number) { dragItem.current = idx; }
  function handleDragEnter(idx: number) { dragOver.current = idx; }
  function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    const newOrder = [...order];
    const [removed] = newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOver.current, 0, removed);
    setOrder(newOrder);
    dragItem.current = null;
    dragOver.current = null;
  }

  // Touch support: tap to swap with next
  function moveUp(idx: number) {
    if (idx === 0) return;
    const n = [...order];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    setOrder(n);
  }
  function moveDown(idx: number) {
    if (idx === order.length - 1) return;
    const n = [...order];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    setOrder(n);
  }

  function handleSave() {
    onSave(group, order);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const POS_COLORS = [
    "text-yellow-400", "text-slate-300", "text-amber-600", "text-muted-foreground"
  ];
  const POS_LABELS = ["1-е", "2-е", "3-е", "4-е"];

  // Points badge if saved
  function getMatchPoints(team: string, pos: number): number | null {
    if (!savedPred) return null;
    const actual = [savedPred.pos1, savedPred.pos2, savedPred.pos3, savedPred.pos4];
    // we don't know actual result yet so just show saved order
    return null;
  }

  return (
    <div className="border-t border-border pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <span>🎯</span> Мой прогноз на группу
          <span className="text-muted-foreground font-normal">(+2 за каждое место)</span>
        </div>
        {savedPred && (
          <span className="text-xs text-primary font-medium">сохранено ✓</span>
        )}
      </div>

      {/* Drag list */}
      <div className="space-y-1">
        {order.map((team, idx) => (
          <div
            key={team}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-secondary/80"
            style={{ background: "hsl(220 18% 14%)", border: "1px solid hsl(var(--border))" }}
            data-testid={`rank-item-${group}-${idx}`}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />

            {/* Position */}
            <span className={`text-xs font-bold w-7 flex-shrink-0 ${POS_COLORS[idx]}`}>
              {POS_LABELS[idx]}
            </span>

            {/* Team */}
            <span className="text-base flex-shrink-0">{FLAG_MAP[team] || "🏳️"}</span>
            <span className="text-xs font-medium text-foreground flex-1 truncate">{team}</span>

            {/* Up/down arrows for mobile */}
            <div className="flex flex-col gap-0 ml-1">
              <button
                className="text-muted-foreground/50 hover:text-foreground text-xs leading-none py-0.5 px-0.5"
                onClick={() => moveUp(idx)}
                aria-label="Выше"
              >▲</button>
              <button
                className="text-muted-foreground/50 hover:text-foreground text-xs leading-none py-0.5 px-0.5"
                onClick={() => moveDown(idx)}
                aria-label="Ниже"
              >▼</button>
            </div>
          </div>
        ))}
      </div>

      <Button
        size="sm"
        variant={saved ? "default" : "outline"}
        className="w-full mt-2 h-7 text-xs"
        onClick={handleSave}
        data-testid={`button-save-group-${group}`}
      >
        {saved ? <><Check className="w-3 h-3 mr-1" /> Сохранено</> : "Сохранить прогноз на группу"}
      </Button>
    </div>
  );
}

// ─── Group Card ──────────────────────────────────────────────────
function GroupCard({
  group, matches, savedPred, onSavePred,
}: {
  group: string;
  matches: Match[];
  savedPred?: GroupPrediction;
  onSavePred: (group: string, order: string[]) => void;
}) {
  const teams = GROUP_TEAMS[group] || [];
  const groupMatches = matches.filter(m => m.group === group);
  const table = buildGroupTable(teams, groupMatches);

  return (
    <div className="rounded-xl overflow-hidden border border-border" data-testid={`group-card-${group}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: "hsl(220 18% 10%)" }}>
        <span className="group-badge">{group}</span>
        <span className="font-display font-semibold">Группа {group}</span>
      </div>

      <div style={{ background: "hsl(220 18% 8%)" }}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_repeat(6,2.5rem)] px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
          <span>Команда</span>
          <span className="text-center">И</span>
          <span className="text-center">В</span>
          <span className="text-center">Н</span>
          <span className="text-center">П</span>
          <span className="text-center">РМ</span>
          <span className="text-center font-bold text-foreground">О</span>
        </div>

        {table.map((t, idx) => {
          const isAdvancing = idx < 2;
          return (
            <div
              key={t.name}
              className={`grid grid-cols-[1fr_repeat(6,2.5rem)] px-3 py-2.5 text-sm items-center
                ${idx < table.length - 1 ? "border-b border-border/50" : ""}
                ${idx === 1 ? "border-b border-primary/20" : ""}
              `}
              style={isAdvancing ? { background: "hsl(142 70% 45% / 0.05)" } : {}}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground text-xs w-4 flex-shrink-0">{idx + 1}</span>
                <span className="text-base flex-shrink-0">{FLAG_MAP[t.name] || "🏳️"}</span>
                <span className={`truncate text-sm font-medium ${isAdvancing ? "text-foreground" : "text-muted-foreground"}`}>
                  {t.name}
                </span>
              </div>
              <span className="text-center text-muted-foreground">{t.played}</span>
              <span className="text-center text-green-400">{t.won}</span>
              <span className="text-center text-muted-foreground">{t.drawn}</span>
              <span className="text-center text-red-400">{t.lost}</span>
              <span className="text-center text-muted-foreground text-xs">{t.gf}:{t.ga}</span>
              <span className={`text-center font-bold ${isAdvancing ? "text-primary" : "text-foreground"}`}>{t.pts}</span>
            </div>
          );
        })}

        {/* Matches */}
        <div className="px-3 pb-2 pt-2 space-y-1 border-t border-border">
          {groupMatches
            .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
            .map(m => {
              const d = new Date(m.matchDate);
              const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
              const isFinished = m.status === "finished";
              return (
                <div key={m.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-14 flex-shrink-0 text-muted-foreground/60">{dateStr}</span>
                  <span className="flex-1 text-right truncate">{FLAG_MAP[m.homeTeam] || "🏳️"} {m.homeTeam}</span>
                  <span className={`w-10 text-center font-mono font-bold flex-shrink-0 ${isFinished ? "text-foreground" : "text-muted-foreground/40"}`}>
                    {isFinished ? `${m.homeScore}:${m.awayScore}` : "—:—"}
                  </span>
                  <span className="flex-1 truncate">{m.awayTeam} {FLAG_MAP[m.awayTeam] || "🏳️"}</span>
                </div>
              );
            })}
        </div>

        {/* Prediction widget */}
        <div className="px-3 pb-3">
          <RankingWidget
            group={group}
            teams={teams}
            savedPred={savedPred}
            onSave={onSavePred}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function GroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches, isLoading } = useQuery<Match[]>({ queryKey: ["/api/matches"] });
  const { data: groupPreds } = useQuery<GroupPrediction[]>({
    queryKey: ["/api/group-predictions", user?.id],
    enabled: !!user,
  });

  const predMap: Record<string, GroupPrediction> = {};
  groupPreds?.forEach(p => { predMap[p.group] = p; });

  const saveMutation = useMutation({
    mutationFn: async ({ group, order }: { group: string; order: string[] }) => {
      const res = await apiRequest("POST", "/api/group-predictions", {
        userId: user!.id, group,
        pos1: order[0], pos2: order[1], pos3: order[2], pos4: order[3],
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/group-predictions", user?.id] });
      toast({ title: "Прогноз сохранён" });
    },
    onError: (e: Error) => { toast({ title: e.message, variant: "destructive" }); },
  });

  const totalGroupPreds = groupPreds?.length ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl text-foreground">Группы</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          48 команд · 12 групп · Прогнозы на итоговые места: {totalGroupPreds}/12 групп
        </p>
      </div>

      {/* Score legend */}
      <div className="flex flex-wrap items-center gap-3 mb-5 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card">
          <span className="text-primary font-bold">+5</span>
          <span className="text-muted-foreground">точный счёт матча</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card">
          <span className="text-yellow-400 font-bold">+2</span>
          <span className="text-muted-foreground">верный исход матча</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card">
          <span className="text-accent font-bold">+2</span>
          <span className="text-muted-foreground">угаданное место в группе</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GROUPS.map(g => (
          <GroupCard
            key={g}
            group={g}
            matches={matches || []}
            savedPred={predMap[g]}
            onSavePred={(group, order) => saveMutation.mutate({ group, order })}
          />
        ))}
      </div>
    </div>
  );
}
