// Bracket page — knockout stage of WC 2026
// R32 → R16 → QF → SF → Final + 3rd place

const ROUND32: { id: number; label: string; home: string; away: string }[] = [
  { id: 73, label: "М73", home: "2-е A", away: "2-е B" },
  { id: 74, label: "М74", home: "1-е E", away: "3-е A/B/C/D/F" },
  { id: 75, label: "М75", home: "1-е F", away: "2-е C" },
  { id: 76, label: "М76", home: "1-е C", away: "2-е F" },
  { id: 77, label: "М77", home: "1-е I", away: "3-е C/D/F/G/H" },
  { id: 78, label: "М78", home: "2-е E", away: "2-е I" },
  { id: 79, label: "М79", home: "1-е A", away: "3-е C/E/F/H/I" },
  { id: 80, label: "М80", home: "1-е L", away: "3-е E/H/I/J/K" },
  { id: 81, label: "М81", home: "1-е D", away: "3-е B/E/F/I/J" },
  { id: 82, label: "М82", home: "1-е G", away: "3-е A/E/H/I/J" },
  { id: 83, label: "М83", home: "2-е K", away: "2-е L" },
  { id: 84, label: "М84", home: "1-е H", away: "2-е J" },
  { id: 85, label: "М85", home: "1-е B", away: "3-е E/F/G/I/J" },
  { id: 86, label: "М86", home: "1-е J", away: "2-е H" },
  { id: 87, label: "М87", home: "1-е K", away: "3-е D/E/I/J/L" },
  { id: 88, label: "М88", home: "2-е D", away: "2-е G" },
];

// Dates for each round (Moscow time context)
const ROUND_DATES: Record<string, string> = {
  r32: "28 июня — 3 июля",
  r16: "4–7 июля",
  qf: "9–11 июля",
  sf: "14–15 июля",
  final: "19 июля",
  third: "18 июля",
};

type BracketMatch = {
  label: string;
  home: string;
  away: string;
  homeScore?: number | null;
  awayScore?: number | null;
  finished?: boolean;
  date?: string;
};

// Static bracket structure — groups of 16 matches in R32, then 8 in R16, etc.
// Left side (top half) and right side (bottom half)
const LEFT_R32: BracketMatch[] = [
  { label: "М73", home: "2-е A", away: "2-е B", date: "28 июн" },
  { label: "М74", home: "1-е E", away: "3-е A/B/C/D/F", date: "29 июн" },
  { label: "М75", home: "1-е F", away: "2-е C", date: "29 июн" },
  { label: "М76", home: "1-е C", away: "2-е F", date: "29 июн" },
  { label: "М77", home: "1-е I", away: "3-е C/D/F/G/H", date: "30 июн" },
  { label: "М78", home: "2-е E", away: "2-е I", date: "30 июн" },
  { label: "М79", home: "1-е A", away: "3-е C/E/F/H/I", date: "30 июн" },
  { label: "М80", home: "1-е L", away: "3-е E/H/I/J/K", date: "1 июл" },
];

const RIGHT_R32: BracketMatch[] = [
  { label: "М81", home: "1-е D", away: "3-е B/E/F/I/J", date: "1 июл" },
  { label: "М82", home: "1-е G", away: "3-е A/E/H/I/J", date: "1 июл" },
  { label: "М83", home: "2-е K", away: "2-е L", date: "2 июл" },
  { label: "М84", home: "1-е H", away: "2-е J", date: "2 июл" },
  { label: "М85", home: "1-е B", away: "3-е E/F/G/I/J", date: "2 июл" },
  { label: "М86", home: "1-е J", away: "2-е H", date: "3 июл" },
  { label: "М87", home: "1-е K", away: "3-е D/E/I/J/L", date: "3 июл" },
  { label: "М88", home: "2-е D", away: "2-е G", date: "3 июл" },
];

const R16: BracketMatch[] = [
  { label: "М89", home: "Побед. М74", away: "Побед. М77", date: "4 июл" },
  { label: "М90", home: "Побед. М73", away: "Побед. М75", date: "4 июл" },
  { label: "М91", home: "Побед. М76", away: "Побед. М78", date: "5 июл" },
  { label: "М92", home: "Побед. М79", away: "Побед. М80", date: "5 июл" },
  { label: "М93", home: "Побед. М83", away: "Побед. М84", date: "6 июл" },
  { label: "М94", home: "Побед. М81", away: "Побед. М82", date: "6 июл" },
  { label: "М95", home: "Побед. М86", away: "Побед. М88", date: "7 июл" },
  { label: "М96", home: "Побед. М85", away: "Побед. М87", date: "7 июл" },
];

const QF: BracketMatch[] = [
  { label: "М97", home: "Побед. М89", away: "Побед. М90", date: "9 июл" },
  { label: "М98", home: "Побед. М93", away: "Побед. М94", date: "10 июл" },
  { label: "М99", home: "Побед. М91", away: "Побед. М92", date: "11 июл" },
  { label: "М100", home: "Побед. М95", away: "Побед. М96", date: "11 июл" },
];

const SF: BracketMatch[] = [
  { label: "М101", home: "Побед. М97", away: "Побед. М98", date: "14 июл" },
  { label: "М102", home: "Побед. М99", away: "Побед. М100", date: "15 июл" },
];

const FINAL: BracketMatch = { label: "Финал", home: "Побед. М101", away: "Побед. М102", date: "19 июл" };
const THIRD: BracketMatch = { label: "3-е место", home: "Проигр. М101", away: "Проигр. М102", date: "18 июл" };

function MatchSlot({ match, size = "sm" }: { match: BracketMatch; size?: "sm" | "md" | "lg" }) {
  const isPlaceholder = !match.home.includes("Побед.") && !match.home.includes("Проигр.");

  return (
    <div
      className={`rounded-lg border border-border overflow-hidden flex-shrink-0 ${
        size === "lg" ? "w-52" : size === "md" ? "w-44" : "w-36"
      }`}
      style={{ background: "hsl(220 18% 11%)" }}
    >
      {/* Match label */}
      <div className="px-2 py-0.5 flex items-center justify-between" style={{ background: "hsl(220 18% 8%)" }}>
        <span className="text-xs text-muted-foreground font-medium">{match.label}</span>
        {match.date && <span className="text-xs text-muted-foreground/60">{match.date}</span>}
      </div>
      {/* Home */}
      <div className={`px-2 py-1.5 border-b border-border flex items-center justify-between gap-1 ${
        match.finished && match.homeScore! > match.awayScore! ? "bg-primary/10" : ""
      }`}>
        <span className={`text-xs truncate ${isPlaceholder ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {match.home}
        </span>
        {match.finished && (
          <span className="text-xs font-bold text-foreground flex-shrink-0">{match.homeScore}</span>
        )}
      </div>
      {/* Away */}
      <div className={`px-2 py-1.5 flex items-center justify-between gap-1 ${
        match.finished && match.awayScore! > match.homeScore! ? "bg-primary/10" : ""
      }`}>
        <span className={`text-xs truncate ${isPlaceholder ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {match.away}
        </span>
        {match.finished && (
          <span className="text-xs font-bold text-foreground flex-shrink-0">{match.awayScore}</span>
        )}
      </div>
    </div>
  );
}

function RoundColumn({
  title,
  date,
  matches,
  size = "sm",
}: {
  title: string;
  date: string;
  matches: BracketMatch[];
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      <div className="text-center mb-1">
        <div className="font-display font-semibold text-sm text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{date}</div>
      </div>
      <div className="flex flex-col justify-around gap-3 flex-1">
        {matches.map((m) => (
          <MatchSlot key={m.label} match={m} size={size} />
        ))}
      </div>
    </div>
  );
}

export default function BracketPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-foreground">Сетка плей-офф</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          32 команды · 5 раундов · Финал 19 июля в Нью-Джерси (MetLife Stadium)
        </p>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-1">
        {[
          { label: "1/16", date: "28 июн – 3 июл", active: false },
          { label: "1/8", date: "4–7 июля", active: false },
          { label: "Четв.", date: "9–11 июля", active: false },
          { label: "Полуф.", date: "14–15 июля", active: false },
          { label: "Финал", date: "19 июля", active: true },
        ].map((r, i, arr) => (
          <div key={r.label} className="flex items-center">
            <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${r.active ? "bg-accent/20 border border-accent/40" : ""}`}>
              <span className={`text-xs font-bold ${r.active ? "text-accent" : "text-foreground"}`}>{r.label}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{r.date}</span>
            </div>
            {i < arr.length - 1 && (
              <div className="h-px w-4 bg-border flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* ===== FULL BRACKET SCROLL ===== */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px]">

          {/* ---- 1/16 ---- */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">
                1/16 финала · {ROUND_DATES.r32}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Left half */}
              <div>
                <div className="text-xs text-muted-foreground text-center mb-2">Верхняя часть сетки</div>
                <div className="grid grid-cols-2 gap-2">
                  {LEFT_R32.map((m) => (
                    <MatchSlot key={m.label} match={m} size="sm" />
                  ))}
                </div>
              </div>
              {/* Right half */}
              <div>
                <div className="text-xs text-muted-foreground text-center mb-2">Нижняя часть сетки</div>
                <div className="grid grid-cols-2 gap-2">
                  {RIGHT_R32.map((m) => (
                    <MatchSlot key={m.label} match={m} size="sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---- 1/8 ---- */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">
                1/8 финала · {ROUND_DATES.r16}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-2">
                {R16.slice(0, 4).map((m) => (
                  <MatchSlot key={m.label} match={m} size="md" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {R16.slice(4).map((m) => (
                  <MatchSlot key={m.label} match={m} size="md" />
                ))}
              </div>
            </div>
          </div>

          {/* ---- Четвертьфиналы ---- */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">
                Четвертьфиналы · {ROUND_DATES.qf}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-3xl mx-auto">
              {QF.map((m) => (
                <MatchSlot key={m.label} match={m} size="md" />
              ))}
            </div>
          </div>

          {/* ---- Полуфиналы ---- */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">
                Полуфиналы · {ROUND_DATES.sf}
              </span>
            </div>
            <div className="flex justify-center gap-6">
              {SF.map((m) => (
                <MatchSlot key={m.label} match={m} size="lg" />
              ))}
            </div>
          </div>

          {/* ---- Финал + 3-е место ---- */}
          <div>
            <div className="flex justify-center gap-8 flex-wrap">
              {/* Final */}
              <div className="text-center">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold border border-accent/40 text-accent" style={{ background: "hsl(35 95% 55% / 0.1)" }}>
                    🏆 Финал · {ROUND_DATES.final} · MetLife Stadium, Нью-Джерси
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl opacity-30 blur-sm" style={{ background: "linear-gradient(135deg, hsl(35 95% 55%), hsl(142 70% 45%))" }} />
                  <MatchSlot match={FINAL} size="lg" />
                </div>
              </div>
              {/* 3rd place */}
              <div className="text-center">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">
                    Матч за 3-е место · {ROUND_DATES.third}
                  </span>
                </div>
                <MatchSlot match={THIRD} size="lg" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Note */}
      <div className="mt-4 p-3 rounded-lg border border-border text-xs text-muted-foreground" style={{ background: "hsl(220 18% 10%)" }}>
        <span className="text-foreground font-medium">Примечание:</span> Конкретные пары в сетке определяются по результатам группового этапа. 8 лучших команд, занявших 3-е место, также выходят в плей-офф. Сетка обновится по завершении групп.
      </div>
    </div>
  );
}
