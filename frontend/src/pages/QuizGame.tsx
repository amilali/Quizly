import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { useGameSocket } from "@/hooks/useGameSocket"
import { Button } from "@/components/ui/button"
import {
  Gamepad2, Trophy, Users, Play, ChevronRight, Check, X,
  Clock, Star, Crown, Zap, ArrowRight, Loader2, Copy, CheckCheck
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardEntry { playerName: string; score: number }
interface GameQuestion {
  questionId: number
  stem: string
  options: string[]
  questionIndex: number
  totalQuestions: number
  timeLimitMs: number
  stack?: string
  topic?: string
  difficulty?: string
}

// ─── Option Colours (Kahoot palette) ─────────────────────────────────────────
const OPTION_STYLES = [
  { bg: "bg-[#E21B3C]", hover: "hover:bg-[#c41834]", icon: "▲", label: "A" },
  { bg: "bg-[#1368CE]", hover: "hover:bg-[#1057ae]", icon: "●", label: "B" },
  { bg: "bg-[#26890C]", hover: "hover:bg-[#1e6b09]", icon: "◆", label: "C" },
  { bg: "bg-[#FFA602]", hover: "hover:bg-[#e09502]", icon: "■", label: "D" },
]

type Phase = "home" | "lobby_host" | "lobby_player" | "question" | "answer_reveal" | "leaderboard" | "final"

export default function QuizGame() {
  const { userName } = useSelector((state: RootState) => state.auth)

  // ─── Game state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("home")
  const [pin, setPin] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState(userName || "")
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; pointsAwarded: number; correctOption: number; totalScore: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [correctOption, setCorrectOption] = useState<number | null>(null)
  const [pinCopied, setPinCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Create game form
  const [createForm, setCreateForm] = useState({ stack: "", topic: "", questionCount: 10 })
  const [joinPin, setJoinPin] = useState("")

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── WebSocket ───────────────────────────────────────────────────────────
  const handleGameMessage = useCallback((data: any) => {
    switch (data.type) {
      case "PLAYER_JOINED":
        setPlayers(data.players || [])
        break
      case "STARTED":
        setPhase("question")
        break
      case "QUESTION":
        setCurrentQuestion(data)
        setSelectedOption(null)
        setAnswerResult(null)
        setCorrectOption(null)
        setTimeLeft(Math.floor((data.timeLimitMs ?? 30000) / 1000))
        setPhase("question")
        break
      case "SHOW_ANSWER":
        setCorrectOption(data.correctOption)
        setPhase("answer_reveal")
        clearTimer()
        break
      case "LEADERBOARD":
        setLeaderboard(data.leaderboard || [])
        break
      case "ENDED":
        setPhase("final")
        break
    }
  }, [])

  const handlePersonalMessage = useCallback((data: any) => {
    if (data.type === "ANSWER_RESULT") {
      setAnswerResult(data)
    }
  }, [])

  const { sendAnswer } = useGameSocket({
    pin,
    playerName,
    onMessage: handleGameMessage,
    onPersonalMessage: handlePersonalMessage,
  })

  // ─── Timer ───────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => {
    if (phase === "question" && currentQuestion) {
      clearTimer()
      setTimeLeft(Math.floor((currentQuestion.timeLimitMs ?? 30000) / 1000))
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearTimer(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return clearTimer
  }, [phase, currentQuestion])

  // ─── API helpers ─────────────────────────────────────────────────────────
  const token = () => localStorage.getItem("token")

  const handleCreateGame = async () => {
    setIsLoading(true); setError("")
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, hostId: userName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create game")
      setPin(data.pin)
      setIsHost(true)
      setPlayers([])   // start empty — only /play joiners appear via PLAYER_JOINED events
      setPhase("lobby_host")
    } catch (e: any) { setError(e.message) }
    finally { setIsLoading(false) }
  }

  const handleJoinGame = async () => {
    if (!joinPin || !playerName) { setError("Enter PIN and your name"); return }
    setIsLoading(true); setError("")
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: joinPin, playerName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to join game")
      setPin(joinPin)
      setIsHost(false)
      setPhase("lobby_player")
    } catch (e: any) { setError(e.message) }
    finally { setIsLoading(false) }
  }

  const handleStartGame = async () => {
    if (!pin) return
    await fetch("/api/game/start", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
  }

  const handleShowAnswer = async () => {
    await fetch("/api/game/show-answer", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
  }

  const handleNextQuestion = async () => {
    setPhase("leaderboard")
    await fetch("/api/game/next", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
  }

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !currentQuestion) return
    setSelectedOption(idx)
    sendAnswer(currentQuestion.questionId, idx)
  }

  const handleCopyPin = () => {
    if (!pin) return
    navigator.clipboard.writeText(pin)
    setPinCopied(true)
    setTimeout(() => setPinCopied(false), 2000)
  }

  const handlePlayAgain = () => {
    setPhase("home"); setPin(null); setPlayers([]); setLeaderboard([])
    setCurrentQuestion(null); setSelectedOption(null); setAnswerResult(null)
    setCorrectOption(null); setError("")
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Quiz Game</h2>
        <p className="text-muted-foreground mt-2 font-medium">Live multiplayer Kahoot-style quiz from your question bank.</p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── HOME ── */}
        {phase === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid md:grid-cols-2 gap-6 max-w-3xl">

            {/* Create Game */}
            <div className="p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl space-y-5 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-2xl"><Gamepad2 className="w-6 h-6 text-primary" /></div>
                <div><div className="font-bold text-lg text-foreground">Host a Game</div><div className="text-xs text-muted-foreground">Create a live quiz session</div></div>
              </div>
              <div className="space-y-3">
                <input value={createForm.stack} onChange={e => setCreateForm(f => ({ ...f, stack: e.target.value }))} placeholder="Tech Stack (optional, e.g. Spring Boot)" className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))} placeholder="Topic (optional)" className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Questions</label>
                  <input type="number" min={1} max={30} value={createForm.questionCount} onChange={e => setCreateForm(f => ({ ...f, questionCount: parseInt(e.target.value) || 10 }))} className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleCreateGame} disabled={isLoading} className="w-full rounded-xl py-5 font-bold text-white bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />} Create Game
              </Button>
            </div>

            {/* Join a Game — link to public /play page */}
            <div className="p-8 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl space-y-5 shadow-xl flex flex-col items-center justify-center text-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-2xl"><Users className="w-6 h-6 text-purple-500" /></div>
                <div>
                  <div className="font-bold text-lg text-foreground">Join a Game</div>
                  <div className="text-xs text-muted-foreground">Players join from their devices</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
                Share this link with players — no account needed
              </p>
              <a
                href="/play"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                Open Player Join Page
              </a>
              <p className="text-xs text-muted-foreground/60 font-mono">/play</p>
            </div>
          </motion.div>
        )}

        {/* ── HOST LOBBY ── */}
        {phase === "lobby_host" && (
          <motion.div key="lobby_host" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-6">
            <div className="p-8 rounded-3xl border border-primary/30 bg-primary/5 backdrop-blur-xl text-center space-y-3 shadow-2xl">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Game PIN</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-6xl font-black tracking-[0.2em] text-primary font-mono">{pin}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyPin} className="rounded-xl">
                  {pinCopied ? <CheckCheck className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this PIN with players</p>
            </div>
            <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Players Waiting ({players.length})</span>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px]">
                <AnimatePresence>
                  {players.map(p => (
                    <motion.div key={p} initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                      {p}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {players.length === 0 && <p className="text-muted-foreground text-sm italic">Waiting for players to join...</p>}
              </div>
            </div>
            <Button onClick={handleStartGame} disabled={players.length < 1} className="w-full rounded-xl py-6 font-bold text-white bg-green-600 hover:bg-green-700 text-lg shadow-lg shadow-green-500/20">
              <Play className="w-5 h-5 mr-2" /> Start Game ({players.length} player{players.length !== 1 ? "s" : ""})
            </Button>
          </motion.div>
        )}

        {/* ── PLAYER LOBBY ── */}
        {phase === "lobby_player" && (
          <motion.div key="lobby_player" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md space-y-6 text-center">
            <div className="p-10 rounded-3xl border border-purple-500/30 bg-purple-500/5 backdrop-blur-xl space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
              <p className="font-bold text-xl text-foreground">You're in! 🎉</p>
              <p className="text-muted-foreground text-sm">Playing as <strong className="text-foreground">{playerName}</strong></p>
              <div className="bg-black/10 dark:bg-white/5 rounded-2xl px-6 py-3 font-mono text-2xl font-black text-purple-400 tracking-[0.3em]">{pin}</div>
              <p className="text-xs text-muted-foreground animate-pulse">Waiting for host to start the game...</p>
            </div>
          </motion.div>
        )}

        {/* ── QUESTION ── */}
        {phase === "question" && currentQuestion && (
          <motion.div key={`q-${currentQuestion.questionIndex}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-5 max-w-4xl">
            {/* Progress + Timer */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Q {currentQuestion.questionIndex + 1} / {currentQuestion.totalQuestions}
              </span>
              <div className="flex-1 h-2 bg-border/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / (currentQuestion.timeLimitMs / 1000)) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
              <div className={`flex items-center gap-1.5 font-black text-lg min-w-[60px] justify-end ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
                <Clock className="w-4 h-4" /> {timeLeft}s
              </div>
            </div>

            {/* Question stem */}
            <div className="p-8 rounded-3xl bg-card/70 backdrop-blur-xl border border-border/50 shadow-xl">
              <div className="flex gap-2 mb-3">
                {currentQuestion.stack && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{currentQuestion.stack}</span>}
                {currentQuestion.topic && <span className="px-2 py-0.5 rounded-full bg-border text-muted-foreground text-xs font-bold">{currentQuestion.topic}</span>}
                {currentQuestion.difficulty && <span className="px-2 py-0.5 rounded-full bg-border text-muted-foreground text-xs font-bold">{currentQuestion.difficulty}</span>}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">{currentQuestion.stem}</p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt, idx) => {
                const style = OPTION_STYLES[idx]
                const isSelected = selectedOption === idx
                const hasAnswered = selectedOption !== null
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={hasAnswered || timeLeft === 0}
                    whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                    className={`relative p-6 rounded-2xl text-white font-bold text-left flex items-center gap-4 transition-all shadow-lg ${style.bg} ${!hasAnswered && timeLeft > 0 ? style.hover + " cursor-pointer" : ""} ${isSelected ? "ring-4 ring-white/50 scale-105" : ""} ${hasAnswered && !isSelected ? "opacity-60" : ""}`}
                  >
                    <span className="text-2xl shrink-0">{style.icon}</span>
                    <span className="text-base leading-snug">{opt}</span>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto shrink-0">
                        <Check className="w-6 h-6" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {selectedOption !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-muted-foreground text-sm font-medium">
                ✓ Answer submitted — waiting for results...
              </motion.div>
            )}

            {/* Host controls */}
            {isHost && (
              <div className="flex gap-3 justify-end">
                <Button onClick={handleShowAnswer} variant="outline" className="rounded-xl font-bold">
                  Reveal Answer
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ANSWER REVEAL ── */}
        {phase === "answer_reveal" && currentQuestion && correctOption !== null && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 max-w-4xl">
            <div className="text-center">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                {answerResult?.isCorrect
                  ? <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-green-500/20 text-green-500 border border-green-500/40 font-black text-2xl shadow-lg shadow-green-500/20">
                    <Zap className="w-6 h-6" /> Correct! +{answerResult.pointsAwarded} pts
                  </div>
                  : <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 font-black text-2xl shadow-lg shadow-red-500/20">
                    <X className="w-6 h-6" /> Incorrect
                  </div>
                }
              </motion.div>
            </div>

            <div className="p-6 rounded-3xl bg-card/70 backdrop-blur-xl border border-border/50">
              <p className="text-lg font-bold text-foreground mb-4">{currentQuestion.stem}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  const style = OPTION_STYLES[idx]
                  const isCorrect = idx === correctOption
                  const isMyAnswer = selectedOption === idx
                  return (
                    <div key={idx} className={`p-5 rounded-2xl flex items-center gap-4 font-bold text-white transition-all ${style.bg} ${!isCorrect ? "opacity-40" : "ring-4 ring-white/60 scale-[1.02] shadow-xl"}`}>
                      <span className="text-xl">{style.icon}</span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <Check className="w-5 h-5 shrink-0" />}
                      {isMyAnswer && !isCorrect && <X className="w-5 h-5 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mini Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="p-6 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-yellow-500" /><span className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Top Players</span></div>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, i) => (
                    <div key={entry.playerName} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? "bg-yellow-500 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-border text-muted-foreground"}`}>{i + 1}</span>
                      <span className="flex-1 font-medium text-sm text-foreground">{entry.playerName}</span>
                      <span className="font-black text-primary">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isHost && (
              <Button onClick={handleNextQuestion} className="w-full rounded-xl py-6 font-bold bg-primary text-white text-lg">
                <ChevronRight className="w-5 h-5 mr-2" /> Next Question
              </Button>
            )}
          </motion.div>
        )}

        {/* ── BETWEEN-QUESTION LEADERBOARD ── */}
        {phase === "leaderboard" && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl space-y-4 mx-auto text-center">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h3 className="text-2xl font-extrabold text-foreground">Leaderboard</h3>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry, i) => (
                <motion.div key={entry.playerName} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${i === 0 ? "border-yellow-500/40 bg-yellow-500/10" : "border-border/50 bg-card/50"} backdrop-blur-xl`}>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? "bg-yellow-500 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-border text-muted-foreground"}`}>
                    {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="flex-1 font-bold text-foreground text-left">{entry.playerName}</span>
                  <span className="font-black text-primary text-lg">{entry.score.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground animate-pulse">Loading next question...</div>
          </motion.div>
        )}

        {/* ── FINAL LEADERBOARD ── */}
        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl space-y-6 mx-auto text-center">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="text-6xl mb-2">🏆</div>
              <h3 className="text-3xl font-extrabold text-foreground">Game Over!</h3>
              <p className="text-muted-foreground mt-1">Final standings</p>
            </motion.div>

            {/* Podium for top 3 */}
            {leaderboard.length >= 1 && (
              <div className="flex items-end justify-center gap-3 h-36">
                {leaderboard.length >= 2 && (
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center text-xl font-black text-gray-400 mb-2">2</div>
                    <div className="bg-gray-400/20 border border-gray-400/30 rounded-t-xl w-24 h-20 flex flex-col items-center justify-end pb-2">
                      <span className="text-xs font-bold text-foreground truncate px-1 max-w-full">{leaderboard[1]?.playerName}</span>
                      <span className="text-sm font-black text-gray-400">{leaderboard[1]?.score.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                  <div className="text-3xl mb-1">👑</div>
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-xl font-black text-yellow-500 mb-2">1</div>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-t-xl w-28 h-28 flex flex-col items-center justify-end pb-2">
                    <span className="text-xs font-bold text-foreground truncate px-1 max-w-full">{leaderboard[0]?.playerName}</span>
                    <span className="text-sm font-black text-yellow-500">{leaderboard[0]?.score.toLocaleString()}</span>
                  </div>
                </motion.div>
                {leaderboard.length >= 3 && (
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center text-lg font-black text-amber-700 mb-2">3</div>
                    <div className="bg-amber-700/20 border border-amber-700/30 rounded-t-xl w-20 h-14 flex flex-col items-center justify-end pb-2">
                      <span className="text-xs font-bold text-foreground truncate px-1 max-w-full">{leaderboard[2]?.playerName}</span>
                      <span className="text-sm font-black text-amber-700">{leaderboard[2]?.score.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Full list */}
            {leaderboard.length > 3 && (
              <div className="space-y-2">
                {leaderboard.slice(3).map((entry, i) => (
                  <div key={entry.playerName} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl">
                    <span className="w-7 h-7 rounded-full bg-border text-muted-foreground flex items-center justify-center text-xs font-black">{i + 4}</span>
                    <span className="flex-1 font-bold text-foreground text-left">{entry.playerName}</span>
                    <span className="font-black text-primary">{entry.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {isHost && (
              <Button onClick={handlePlayAgain} className="w-full rounded-xl py-6 font-bold bg-primary text-white text-lg">
                <Star className="w-5 h-5 mr-2" /> Play Again
              </Button>
            )}
            {!isHost && (
              <p className="text-muted-foreground text-sm">Thanks for playing! 🎉</p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
