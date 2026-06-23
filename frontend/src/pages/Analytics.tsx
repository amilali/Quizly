import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ResponsiveContainer
} from "recharts";
import { Users, Target, TrendingUp, Zap, BarChart2, HelpCircle, Clock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Overview {
  totalGames: number;
  totalPlayers: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracyPercent: number;
}

interface PlayerStat {
  playerName: string;
  correct: number;
  incorrect: number;
  totalPoints: number;
  accuracyPercent: number;
}

interface QuestionStat {
  questionId: number;
  stem: string;
  stack: string;
  topic: string;
  totalAttempts: number;
  correctPercent: number;
  incorrectCount: number;
}

interface TimelinePoint {
  time: string;
  correct: number;
  incorrect: number;
  total: number;
}

// ── Colour palette ─────────────────────────────────────────────────────────────
const CORRECT_COLOR = "#22c55e";
const INCORRECT_COLOR = "#f43f5e";

// ── Small helpers ──────────────────────────────────────────────────────────────
const formatHour = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:00`;
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 shadow-lg"
    >
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center gap-3 mb-3">
        <span className="rounded-xl p-2" style={{ background: color + "22" }}>
          <Icon size={20} style={{ color }} />
        </span>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-xl text-sm">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Analytics() {
  const role = useSelector((state: RootState) => state.auth.role);
  const token = localStorage.getItem("token");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [questions, setQuestions] = useState<QuestionStat[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (role !== "Admin" && role !== "SME") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-3xl font-bold mb-4 text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view analytics.</p>
      </div>
    );
  }

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/analytics/overview", { headers }).then((r) => r.json()),
      fetch("/api/analytics/players", { headers }).then((r) => r.json()),
      fetch("/api/analytics/questions", { headers }).then((r) => r.json()),
      fetch("/api/analytics/timeline?days=7", { headers }).then((r) => r.json()),
    ])
      .then(([ov, pl, qs, tl]) => {
        setOverview(ov);
        setPlayers(pl);
        setQuestions(qs.slice(0, 10));
        setTimeline(tl);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load analytics data. Make sure a game has been played.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <BarChart2 size={48} className="text-muted-foreground/40" />
        <h2 className="text-2xl font-bold">No Data Yet</h2>
        <p className="text-muted-foreground max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">
          Player <span className="text-primary">Analytics</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Real-time insights into player performance, accuracy, and question quality.
        </p>
      </motion.div>

      {/* Summary cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="Games Played" value={overview.totalGames} color="#818cf8" delay={0} />
          <StatCard icon={Users} label="Unique Players" value={overview.totalPlayers} color="#22d3ee" delay={0.05} />
          <StatCard icon={Target} label="Total Answers" value={overview.totalAnswers} sub={`${overview.correctAnswers} correct`} color="#22c55e" delay={0.1} />
          <StatCard icon={TrendingUp} label="Overall Accuracy" value={`${overview.accuracyPercent}%`} color="#f59e0b" delay={0.15} />
        </div>
      )}

      {/* Player Performance chart */}
      {players.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users size={18} className="text-primary" />
            <h2 className="font-bold text-lg">Player Performance</h2>
            <span className="ml-auto text-xs text-muted-foreground">{players.length} players</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={players} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="playerName" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="correct" name="Correct" fill={CORRECT_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="incorrect" name="Incorrect" fill={INCORRECT_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock size={18} className="text-primary" />
            <h2 className="font-bold text-lg">Activity Timeline</h2>
            <span className="ml-auto text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradCorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CORRECT_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CORRECT_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIncorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INCORRECT_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={INCORRECT_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tickFormatter={formatHour} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip content={<CustomTooltip />} labelFormatter={(label) => formatHour(String(label))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="correct" name="Correct" stroke={CORRECT_COLOR} fill="url(#gradCorrect)" strokeWidth={2} />
              <Area type="monotone" dataKey="incorrect" name="Incorrect" stroke={INCORRECT_COLOR} fill="url(#gradIncorrect)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Question Difficulty */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle size={18} className="text-primary" />
            <h2 className="font-bold text-lg">Question Difficulty</h2>
            <span className="ml-auto text-xs text-muted-foreground">Low correct% = needs improvement</span>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.questionId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.stem || `Question #${q.questionId}`}</p>
                  <p className="text-xs text-muted-foreground">{q.stack} · {q.topic} · {q.totalAttempts} attempts</p>
                </div>
                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${q.correctPercent}%`,
                        background: q.correctPercent >= 60 ? CORRECT_COLOR : q.correctPercent >= 30 ? "#f59e0b" : INCORRECT_COLOR,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">{q.correctPercent}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Players table */}
      {players.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg"
        >
          <div className="flex items-center gap-2 p-6 border-b border-border/30">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-bold text-lg">Leaderboard</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20 bg-muted/20">
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Player</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Correct</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Incorrect</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Accuracy</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.playerName} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.playerName}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-semibold">{p.correct}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-semibold">{p.incorrect}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${p.accuracyPercent >= 60 ? "text-green-400" : p.accuracyPercent >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                        {p.accuracyPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-primary">{p.totalPoints.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {players.length === 0 && questions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-2xl border border-dashed border-border/40"
        >
          <BarChart2 size={56} className="text-muted-foreground/30" />
          <h3 className="text-xl font-bold text-muted-foreground">No Game Data Yet</h3>
          <p className="text-muted-foreground/60 text-sm max-w-xs">
            Start a game, have players join and answer questions. Analytics will appear here in real time!
          </p>
        </motion.div>
      )}
    </div>
  );
}
