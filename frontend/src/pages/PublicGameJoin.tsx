import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameSocket } from "@/hooks/useGameSocket"
import { Check, X, Clock, Trophy, Crown, Zap, AlertCircle } from "lucide-react"
import { Logo } from "@/components/Logo"

// Kahoot palette
const OPTIONS = [
  { bg: "#E21B3C", dark: "#b01530", shape: "▲", letter: "A" },
  { bg: "#1368CE", dark: "#0f54a8", shape: "●", letter: "B" },
  { bg: "#26890C", dark: "#1d6a09", shape: "◆", letter: "C" },
  { bg: "#FFA602", dark: "#d98c00", shape: "■", letter: "D" },
]

interface GameQuestion {
  questionId: number; stem: string; options: string[]
  questionIndex: number; totalQuestions: number; timeLimitMs: number
  stack?: string; topic?: string; difficulty?: string
}
interface LeaderboardEntry { playerName: string; score: number }
type Phase = "join" | "waiting" | "question" | "answer_reveal" | "final"

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }

export default function PublicGameJoin() {
  const [pin, setPin] = useState("")
  const [nickname, setNickname] = useState("")
  const [phase, setPhase] = useState<Phase>("join")
  const [joinedPin, setJoinedPin] = useState<string | null>(null)
  const [joinedName, setJoinedName] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [question, setQuestion] = useState<GameQuestion | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [correctOption, setCorrectOption] = useState<number | null>(null)
  const [result, setResult] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const myEntry = leaderboard.find(e => e.playerName === joinedName)
  const myRank = leaderboard.findIndex(e => e.playerName === joinedName) + 1

  const onMessage = useCallback((data: any) => {
    if (data.type === "PLAYER_JOINED") setPlayerCount(data.players?.length ?? data.playerCount ?? 0)
    if (data.type === "STARTED") setPhase("waiting")
    if (data.type === "QUESTION") {
      setQuestion(data); setSelected(null); setTimedOut(false); setResult(null); setCorrectOption(null)
      setTimeLeft(Math.floor((data.timeLimitMs ?? 30000) / 1000)); setPhase("question")
    }
    if (data.type === "SHOW_ANSWER") {
      setCorrectOption(data.correctOption); setPhase("answer_reveal")
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    if (data.type === "LEADERBOARD") setLeaderboard(data.leaderboard || [])
    if (data.type === "ENDED") setPhase("final")
  }, [])

  const onPersonal = useCallback((data: any) => {
    if (data.type === "ANSWER_RESULT") setResult(data)
  }, [])

  const { sendAnswer } = useGameSocket({ pin: joinedPin, playerName: joinedName, onMessage, onPersonalMessage: onPersonal })

  useEffect(() => {
    if (phase !== "question" || !question) return
    if (timerRef.current) clearInterval(timerRef.current)
    const secs = Math.floor((question.timeLimitMs ?? 30000) / 1000)
    setTimeLeft(secs)
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current!); timerRef.current = null; setTimedOut(true); return 0 }
        return p - 1
      })
    }, 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [phase, question])

  const handleJoin = async () => {
    if (!pin.trim() || !nickname.trim()) { setError("Please fill in both fields"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/game/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: pin.trim(), playerName: nickname.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Game not found")
      if (data.playerCount !== undefined) setPlayerCount(data.playerCount)
      setJoinedPin(pin.trim()); setJoinedName(nickname.trim()); setPhase("waiting")
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const pick = (idx: number) => {
    if (selected !== null || !question || timedOut) return
    setSelected(idx); sendAnswer(question.questionId, idx)
  }

  const reset = () => {
    setPhase("join"); setJoinedPin(null); setJoinedName(null); setLeaderboard([])
    setQuestion(null); setPin(""); setNickname(""); setError("")
    setSelected(null); setResult(null); setCorrectOption(null); setTimedOut(false)
  }

  const pct = question ? Math.max(0, (timeLeft / (question.timeLimitMs / 1000)) * 100) : 0
  const urgent = timeLeft > 0 && timeLeft <= 5

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden"
      style={{
        background: "linear-gradient(135deg, #fafafa 0%, #f3f0ff 50%, #fafafa 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* Grain texture overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Fixed Quizly logo — top left on all phases */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 py-3 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Logo className="w-9 h-9 drop-shadow-sm" />
          <div className="flex flex-col leading-none">
            <span className="text-[18px] font-extrabold text-gray-900 tracking-[0.15em] uppercase leading-tight">QWIZLY</span>
            <span className="text-[9px] text-gray-400 font-medium">Part of <span className="font-bold text-gray-600">Accenture L&TT</span></span>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-14 w-full shrink-0" />

      <AnimatePresence mode="wait">

        {/* ════════════════════════ JOIN ════════════════════════ */}
        {phase === "join" && (
          <motion.div key="join" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={spring} className="w-full max-w-[400px] mx-auto px-5 py-12">

            {/* Hero text */}
            <div className="mb-8">
              <h1 className="text-4xl font-black text-gray-900 leading-[1.05] tracking-tight">Join the<br /><span className="text-violet-600">game.</span></h1>
              <p className="text-gray-400 text-sm mt-2 font-medium">No account needed — just enter the PIN</p>
            </div>


            <div className="space-y-3">
              {/* PIN input */}
              <div className="relative">
                <input
                  id="pin-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError("") }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  placeholder="Game PIN"
                  className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 text-center text-3xl font-black font-mono tracking-[0.45em] text-gray-900 placeholder-gray-200 transition-all focus:outline-none focus:border-violet-500 shadow-sm"
                  style={{ height: 72, letterSpacing: pin ? "0.45em" : undefined }}
                />
              </div>

              {/* Nickname input */}
              <input
                id="nickname-input"
                type="text"
                maxLength={24}
                value={nickname}
                onChange={e => { setNickname(e.target.value); setError("") }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Your nickname"
                className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-4 text-base font-semibold text-gray-900 placeholder-gray-300 transition-all focus:outline-none focus:border-violet-500 shadow-sm"
                style={{ height: 58 }}
              />

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                id="join-btn"
                onClick={handleJoin}
                disabled={loading || !pin || !nickname}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl font-black text-white text-base flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ height: 58, background: loading || !pin || !nickname ? "#8b5cf6" : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", boxShadow: "0 8px 32px rgba(124,58,237,0.25)" }}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Joining...</>
                  : <>Enter game →</>
                }
              </motion.button>
            </div>

            {/* Decorative dots */}
            <div className="flex items-center justify-center gap-1.5 mt-10">
              {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-200" />)}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════ WAITING ════════════════════════ */}
        {phase === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring} className="w-full max-w-[360px] mx-auto px-5 py-12 text-center">
            <div className="bg-white rounded-[28px] shadow-xl shadow-gray-200/80 border border-gray-100 p-8">
              {/* Pulse ring */}
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-violet-200 animate-ping opacity-50" />
                <div className="absolute inset-1 rounded-full border-2 border-violet-300 animate-ping opacity-30" style={{ animationDelay: "0.3s" }} />
                <div className="relative w-20 h-20 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center text-3xl">🎮</div>
              </div>

              <p className="text-2xl font-black text-gray-900">You're in!</p>
              <p className="text-gray-400 text-sm mt-1">Playing as <span className="text-violet-600 font-bold">{joinedName}</span></p>

              {/* PIN display */}
              <div className="mt-5 rounded-2xl bg-violet-50 border border-violet-100 py-4 px-6">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Game PIN</p>
                <p className="font-black text-2xl text-violet-700 tracking-[0.4em] font-mono">{joinedPin}</p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {playerCount} player{playerCount !== 1 ? "s" : ""} in lobby
              </div>

              <p className="mt-3 text-xs text-gray-300 font-medium animate-pulse">Waiting for host to start the game…</p>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════ QUESTION ════════════════════════ */}
        {phase === "question" && question && (
          <motion.div key={`q-${question.questionIndex}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={spring} className="w-full max-w-2xl mx-auto px-3 sm:px-5 py-4 flex flex-col gap-3">

            {/* Timer row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{question.questionIndex + 1} / {question.totalQuestions}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#f0ebff" }}>
                <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "linear" }} style={{ background: urgent ? "#ef4444" : "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
              </div>
              <div className={`flex items-center gap-1 font-black text-sm min-w-[44px] justify-end ${urgent ? "text-red-500 animate-pulse" : "text-gray-600"}`}>
                <Clock className="w-3.5 h-3.5 shrink-0" /> {timeLeft}s
              </div>
            </div>

            {/* Time-up banner */}
            <AnimatePresence>
              {timedOut && selected === null && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-orange-700 font-bold text-sm">Time's up! +0 points this round</p>
                    <p className="text-orange-400 text-xs">Revealing the answer shortly…</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question card */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg shadow-gray-100 p-5 sm:p-7">
              <p className="text-gray-900 font-bold text-lg sm:text-xl leading-snug">{question.stem}</p>
            </div>

            {/* Answer grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options.map((opt, idx) => {
                const o = OPTIONS[idx]
                const picked = selected === idx
                const locked = selected !== null || timedOut
                return (
                  <motion.button
                    key={idx}
                    onClick={() => pick(idx)}
                    disabled={locked}
                    whileTap={!locked ? { scale: 0.97 } : {}}
                    whileHover={!locked ? { scale: 1.01 } : {}}
                    className="relative text-left flex items-center gap-4 rounded-2xl p-4 sm:p-5 font-bold text-white transition-all select-none overflow-hidden"
                    style={{
                      background: picked ? o.bg : locked ? o.bg + "80" : o.bg,
                      boxShadow: picked ? `0 8px 24px ${o.bg}50` : "none",
                      outline: picked ? "3px solid rgba(255,255,255,0.6)" : "none",
                      outlineOffset: picked ? "2px" : "0",
                    }}
                  >
                    {/* Shape badge */}
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 font-black" style={{ background: "rgba(0,0,0,0.15)" }}>
                      {o.shape}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-snug">{opt}</span>
                    <AnimatePresence>
                      {picked && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                          <Check className="w-5 h-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>

            {/* Submitted notice */}
            <AnimatePresence>
              {selected !== null && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-400 text-xs font-medium">
                  Answer locked in — waiting for results…
                </motion.p>
              )}
            </AnimatePresence>

            {/* Score */}
            {myEntry && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 text-sm shadow-sm">
                  <span className="text-gray-400 font-medium">Score</span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span className="text-violet-600 font-black">{myEntry.score.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════ ANSWER REVEAL ════════════════════════ */}
        {phase === "answer_reveal" && question && correctOption !== null && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="w-full max-w-2xl mx-auto px-3 sm:px-5 py-4 flex flex-col gap-3">

            {/* Result banner */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="flex justify-center">
              {timedOut && selected === null
                ? <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 font-black text-base shadow-sm">
                    <AlertCircle className="w-5 h-5" /> Time's up — +0 pts
                  </div>
                : result?.isCorrect
                  ? <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-base shadow-sm">
                      <Zap className="w-5 h-5 fill-current" /> Correct! +{result.pointsAwarded.toLocaleString()} pts
                    </div>
                  : <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-black text-base shadow-sm">
                      <X className="w-5 h-5" /> Incorrect — +0 pts
                    </div>
              }
            </motion.div>

            {/* Question + revealed options */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg p-5 sm:p-6">
              <p className="text-gray-700 font-bold text-base sm:text-lg mb-4 leading-snug">{question.stem}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {question.options.map((opt, idx) => {
                  const o = OPTIONS[idx]
                  const isRight = idx === correctOption
                  const isMine = selected === idx
                  return (
                    <div key={idx} className="relative flex items-center gap-3 rounded-2xl p-4 font-bold text-white transition-all" style={{ background: o.bg, opacity: isRight ? 1 : 0.3, outline: isRight ? "3px solid rgba(255,255,255,0.6)" : "none", outlineOffset: isRight ? "2px" : "0", transform: isRight ? "scale(1.02)" : "scale(1)" }}>
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 font-black" style={{ background: "rgba(0,0,0,0.15)" }}>{o.shape}</span>
                      <span className="flex-1 text-sm leading-snug">{opt}</span>
                      {isRight && <Check className="w-4 h-4 shrink-0" />}
                      {isMine && !isRight && <X className="w-4 h-4 shrink-0 opacity-80" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Leaderboard snapshot */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Standings</span>
                </div>
                <div className="space-y-2.5">
                  {leaderboard.slice(0, 5).map((e, i) => {
                    const me = e.playerName === joinedName
                    const medals = ["🥇", "🥈", "🥉"]
                    return (
                      <div key={e.playerName} className="flex items-center gap-3">
                        <span className="w-6 text-center text-base shrink-0">{medals[i] ?? <span className="text-xs font-bold text-gray-300">{i + 1}</span>}</span>
                        <span className={`flex-1 text-sm font-semibold truncate ${me ? "text-violet-700" : "text-gray-700"}`}>{e.playerName}</span>
                        <span className={`font-black text-sm shrink-0 ${me ? "text-violet-600" : "text-gray-800"}`}>{e.score.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-center text-gray-300 text-xs font-medium animate-pulse">Next question in a moment…</p>
          </motion.div>
        )}

        {/* ════════════════════════ FINAL ════════════════════════ */}
        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="w-full max-w-md mx-auto px-5 py-10 flex flex-col gap-5">

            {/* Header */}
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }} className="text-6xl mb-3">🏆</motion.div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Game Over!</h2>
              <p className="text-gray-400 text-sm font-medium mt-1">Final results are in</p>
            </div>

            {/* Podium */}
            {leaderboard.length >= 1 && (
              <div className="flex items-end justify-center gap-2">
                {/* 2nd */}
                {leaderboard[1] && (
                  <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center font-black text-gray-500 text-lg mb-2">2</div>
                    <div className="bg-gray-100 border border-gray-200 rounded-t-2xl w-22 flex flex-col items-center justify-end p-2" style={{ height: 80, width: 88 }}>
                      <p className="text-xs font-bold text-gray-600 truncate w-full text-center">{leaderboard[1].playerName}</p>
                      <p className="text-xs font-black text-gray-500">{leaderboard[1].score.toLocaleString()}</p>
                    </div>
                  </motion.div>
                )}
                {/* 1st */}
                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                  <Crown className="w-5 h-5 text-amber-500 mb-1" />
                  <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center font-black text-amber-600 text-xl mb-2">1</div>
                  <div className="bg-amber-50 border border-amber-200 rounded-t-2xl flex flex-col items-center justify-end p-2" style={{ height: 108, width: 104 }}>
                    <p className="text-xs font-bold text-gray-700 truncate w-full text-center">{leaderboard[0].playerName}</p>
                    <p className="text-xs font-black text-amber-600">{leaderboard[0].score.toLocaleString()}</p>
                  </div>
                </motion.div>
                {/* 3rd */}
                {leaderboard[2] && (
                  <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full border-2 border-orange-300 bg-orange-50 flex items-center justify-center font-black text-orange-600 mb-2">3</div>
                    <div className="bg-orange-50 border border-orange-200 rounded-t-2xl flex flex-col items-center justify-end p-2" style={{ height: 60, width: 80 }}>
                      <p className="text-xs font-bold text-gray-600 truncate w-full text-center">{leaderboard[2].playerName}</p>
                      <p className="text-xs font-black text-orange-500">{leaderboard[2].score.toLocaleString()}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* My card */}
            {myEntry && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-violet-50 border border-violet-200 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-violet-400 text-xs font-bold uppercase tracking-wider">Your result</p>
                  <p className="text-violet-700 font-black text-xl mt-0.5">{myRank > 0 ? `#${myRank} — ` : ""}{myEntry.score.toLocaleString()} pts</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-black text-violet-600">{myRank > 0 ? myRank : "–"}</div>
              </motion.div>
            )}

            {/* Full list */}
            {leaderboard.length > 3 && (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {leaderboard.slice(3).map((e, i) => {
                  const me = e.playerName === joinedName
                  return (
                    <div key={e.playerName} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${me ? "border-violet-200 bg-violet-50" : "border-gray-100 bg-white"}`}>
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 shrink-0">{i + 4}</span>
                      <span className={`flex-1 text-sm font-semibold truncate ${me ? "text-violet-700" : "text-gray-700"}`}>{e.playerName}</span>
                      <span className={`font-black text-sm shrink-0 ${me ? "text-violet-600" : "text-gray-600"}`}>{e.score.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <motion.button whileTap={{ scale: 0.98 }} onClick={reset} className="w-full rounded-2xl font-black text-white text-base transition-all" style={{ height: 56, background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", boxShadow: "0 8px 32px rgba(124,58,237,0.25)" }}>
              Play Again →
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
