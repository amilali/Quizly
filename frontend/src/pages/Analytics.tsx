import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Users, Target, TrendingUp, Zap, BarChart2, HelpCircle, Calendar } from "lucide-react";

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

// ── Colour palette ─────────────────────────────────────────────────────────────
const CORRECT_COLOR = "#22c55e";
const INCORRECT_COLOR = "#f43f5e";

// ── Small helpers ──────────────────────────────────────────────────────────────
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 shadow-lg flex flex-col justify-center h-full"
    >
      <div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: color }}
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-xl p-1.5" style={{ background: color + "22" }}>
          <Icon size={16} style={{ color }} />
        </span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-end gap-2">
         <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
         {sub && <p className="text-[10px] text-muted-foreground mb-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-xl text-sm z-50">
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

  const [days, setDays] = useState<number | null>(7);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [questions, setQuestions] = useState<QuestionStat[]>([]);
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
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const query = days ? `?days=${days}` : "";
    
    Promise.all([
      fetch(`/api/analytics/overview${query}`, { headers }).then((r) => r.json()),
      fetch(`/api/analytics/players${query}`, { headers }).then((r) => r.json()),
      fetch(`/api/analytics/questions${query}`, { headers }).then((r) => r.json()),
    ])
      .then(([ov, pl, qs]) => {
        setOverview(ov);
        setPlayers(pl);
        setQuestions(qs.slice(0, 10)); // Top 10
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load analytics data. Make sure a game has been played.");
        setLoading(false);
      });
  }, [token, days]);

  const pieData = overview ? [
    { name: "Correct", value: overview.correctAnswers },
    { name: "Incorrect", value: overview.totalAnswers - overview.correctAnswers }
  ] : [];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col p-2 pt-0 pb-4 overflow-hidden gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1 tracking-tight leading-none">
            Player <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Real-time insights into player performance, accuracy, and question quality.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border/50 rounded-lg px-2 shadow-sm">
           <Calendar size={14} className="text-muted-foreground" />
           <select 
             value={days === null ? "all" : days}
             onChange={(e) => setDays(e.target.value === "all" ? null : Number(e.target.value))}
             className="bg-transparent border-none text-sm font-medium outline-none py-1.5 focus:ring-0 cursor-pointer"
           >
             <option value={1}>Today</option>
             <option value={7}>Last 7 Days</option>
             <option value={30}>Last 30 Days</option>
             <option value="all">All Time</option>
           </select>
        </div>
      </motion.div>

      {loading ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
         </div>
      ) : error ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <BarChart2 size={48} className="text-muted-foreground/40" />
            <h2 className="text-xl font-bold">No Data Yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
         </div>
      ) : (
         /* Bento Grid */
         <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 grid-rows-12 gap-4">
            
            {/* Top Stats Cards */}
            <div className="lg:col-span-8 row-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
               {overview && (
                 <>
                   <StatCard icon={Zap} label="Games Played" value={overview.totalGames} color="#818cf8" delay={0} />
                   <StatCard icon={Users} label="Unique Players" value={overview.totalPlayers} color="#22d3ee" delay={0.05} />
                   <StatCard icon={Target} label="Total Answers" value={overview.totalAnswers} sub={`${overview.correctAnswers} correct`} color="#22c55e" delay={0.1} />
                   <StatCard icon={TrendingUp} label="Overall Accuracy" value={`${overview.accuracyPercent}%`} color="#f59e0b" delay={0.15} />
                 </>
               )}
            </div>

            {/* Overall Accuracy Pie Chart */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="lg:col-span-4 row-span-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 shadow-lg flex flex-col"
            >
               <div className="flex items-center gap-2 mb-2 shrink-0">
                 <Target size={16} className="text-primary" />
                 <h2 className="font-bold text-sm">Overall Accuracy Breakdown</h2>
               </div>
               <div className="flex-1 min-h-0 relative">
                 {overview?.totalAnswers === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No answers yet</div>
                 ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius="60%"
                           outerRadius="80%"
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                         >
                           <Cell key="cell-correct" fill={CORRECT_COLOR} />
                           <Cell key="cell-incorrect" fill={INCORRECT_COLOR} />
                         </Pie>
                         <Tooltip content={<CustomTooltip />} />
                         <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 )}
                 {overview?.totalAnswers && overview?.totalAnswers > 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                       <span className="text-2xl font-black">{overview.accuracyPercent}%</span>
                       <span className="text-[10px] text-muted-foreground">Correct</span>
                    </div>
                 ) : null}
               </div>
            </motion.div>

            {/* Player Performance (Bar Chart) */}
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.25 }}
               className="lg:col-span-8 row-span-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 shadow-lg flex flex-col"
            >
               <div className="flex items-center gap-2 mb-2 shrink-0">
                 <Users size={16} className="text-primary" />
                 <h2 className="font-bold text-sm">Player Performance</h2>
                 <span className="ml-auto text-[10px] text-muted-foreground">{players.length} players</span>
               </div>
               <div className="flex-1 min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={players} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                     <XAxis dataKey="playerName" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                     <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                     <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                     <Bar dataKey="correct" name="Correct" fill={CORRECT_COLOR} radius={[3, 3, 0, 0]} stackId="a" />
                     <Bar dataKey="incorrect" name="Incorrect" fill={INCORRECT_COLOR} radius={[3, 3, 0, 0]} stackId="a" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="lg:col-span-8 row-span-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm flex flex-col shadow-lg overflow-hidden"
            >
               <div className="flex items-center gap-2 p-3 border-b border-border/30 shrink-0 bg-muted/10">
                 <TrendingUp size={16} className="text-primary" />
                 <h2 className="font-bold text-sm">Leaderboard</h2>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-xs">
                   <thead className="sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border/20">
                     <tr>
                       <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-12">#</th>
                       <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Player</th>
                       <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Accuracy</th>
                       <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Points</th>
                     </tr>
                   </thead>
                   <tbody>
                     {players.map((p, i) => (
                       <tr key={p.playerName} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                         <td className="px-3 py-2">
                           <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-muted text-muted-foreground"}`}>
                             {i + 1}
                           </span>
                         </td>
                         <td className="px-3 py-2 font-semibold">{p.playerName}</td>
                         <td className="px-3 py-2 text-right">
                           <span className={`font-bold ${p.accuracyPercent >= 60 ? "text-green-400" : p.accuracyPercent >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                             {p.accuracyPercent}%
                           </span>
                         </td>
                         <td className="px-3 py-2 text-right font-black text-primary">{p.totalPoints.toLocaleString()}</td>
                       </tr>
                     ))}
                     {players.length === 0 && (
                        <tr>
                           <td colSpan={4} className="text-center py-6 text-muted-foreground">No players found for this period.</td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </motion.div>

            {/* Question Difficulty */}
            <motion.div
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.35 }}
               className="lg:col-span-4 row-span-7 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 shadow-lg flex flex-col"
            >
               <div className="flex flex-col gap-1 mb-3 shrink-0">
                 <div className="flex items-center gap-2">
                   <HelpCircle size={16} className="text-primary" />
                   <h2 className="font-bold text-sm">Question Difficulty</h2>
                 </div>
                 <span className="text-[10px] text-muted-foreground">Top 10 (Low correct% = needs improvement)</span>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                 {questions.map((q, i) => (
                   <motion.div
                     key={q.questionId}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.4 + i * 0.05 }}
                     className="flex flex-col gap-1.5"
                   >
                     <div className="flex justify-between items-start gap-2">
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-medium truncate" title={q.stem}>{q.stem || `Question #${q.questionId}`}</p>
                         <p className="text-[10px] text-muted-foreground">{q.stack} · {q.topic}</p>
                       </div>
                       <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap">
                         {q.totalAttempts} att.
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                         <div
                           className="h-full rounded-full transition-all"
                           style={{
                             width: `${q.correctPercent}%`,
                             background: q.correctPercent >= 60 ? CORRECT_COLOR : q.correctPercent >= 30 ? "#f59e0b" : INCORRECT_COLOR,
                           }}
                         />
                       </div>
                       <span className="text-[10px] font-bold w-8 text-right">{q.correctPercent}%</span>
                     </div>
                   </motion.div>
                 ))}
                 {questions.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs text-center">
                       No questions answered in this period.
                    </div>
                 )}
               </div>
            </motion.div>
            
         </div>
      )}
    </div>
  );
}
