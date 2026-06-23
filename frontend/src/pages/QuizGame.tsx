import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { useGameSocket } from "@/hooks/useGameSocket"
import { Button } from "@/components/ui/button"
import {
  MonitorPlay, Trophy, Users, Play, ChevronRight, Check, X,
  Clock, Crown, Zap,
  Database, FileQuestion, ClipboardCheck, ArrowLeft, Star, Loader2
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

// ─── Constants & Helpers ────────────────────────────────────────────────────────
const EMOJIS = [
  "🦊", "🐼", "🦁", "🐯", "🐨", "🐸", "🐰", "🐙", "🐵", "🦄", 
  "🦉", "🐧", "🦖", "🦋", "🐞", "🐢", "🐬", "🦍", "🐕", "🐈", 
  "🤖", "👾", "🧱", "🧩", "👽", "👷", "👻", "🤠", "😎", "🤓", 
  "🐱", "🐶", "🐭", "🐹", "🐻", "🐮", "🐷", "🐒", "🐔", "🐦", 
  "🐤", "🐺", "🐗", "🐴", "🐝", "🐛", "🐌", "🦀", "🐠", "🐡", 
  "🦈", "🐊", "🐅", "🐆", "🦓", "🐘", "🦏", "🐪", "🦒", "🦘"
]
const getEmoji = (name: string) => {
  const parts = name.split(" ");
  if (EMOJIS.includes(parts[0])) return parts[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return EMOJIS[Math.abs(hash) % EMOJIS.length];
}
const getDisplayName = (name: string) => {
  const parts = name.split(" ");
  if (EMOJIS.includes(parts[0])) return parts.slice(1).join(" ");
  return name;
}

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

type Phase = "home" | "lobby_host" | "lobby_player" | "question" | "answer_reveal" | "leaderboard" | "final" | "starting_countdown"

export default function QuizGame() {
  const { userName } = useSelector((state: RootState) => state.auth)
  const location = useLocation()
  const navigate = useNavigate()

  // ─── Game state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("home")
  const [isHost, setIsHost] = useState(false)
  const [pin, setPin] = useState<string | null>(null)
  const [players, setPlayers] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  
  // Countdown State
  const [countdownValue, setCountdownValue] = useState<number>(3)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; pointsAwarded: number; correctOption: number; totalScore: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [correctOption, setCorrectOption] = useState<number | null>(null)
  const [answerStats, setAnswerStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Create game form
  const [createForm, setCreateForm] = useState({ stack: "", topic: "", questionCount: 10, timeLimitSeconds: 30 })
  const [, setPinCopied] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── WebSocket ───────────────────────────────────────────────────────────
  const handleGameMessage = useCallback((data: any) => {
    switch (data.type) {
      case "PLAYER_JOINED":
        setPlayers(data.players || [])
        break
      case "STARTED":
        setPhase("starting_countdown")
        setCountdownValue(3)
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
        if (data.answerStats) setAnswerStats(data.answerStats)
        setPhase("answer_reveal")
        clearTimer()
        break
      case "LEADERBOARD":
        setLeaderboard(data.leaderboard || [])
        break
      case "ENDED":
        setPhase("final")
        // Clean up any session active flags so the dashboard resets
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('session_active_')) {
            localStorage.removeItem(key)
          }
        })
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
    playerName: null,
    onMessage: handleGameMessage,
    onPersonalMessage: handlePersonalMessage,
  })

  // ─── Timer ───────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => {
    if (location.state?.pin && location.state?.host) {
      setPin(location.state.pin)
      setIsHost(true)
      setPhase("lobby_host")
      // Clear state to avoid re-triggering if component unmounts/remounts
      window.history.replaceState({}, '')
    } else {
      navigate("/events", { replace: true })
    }
  }, [location.state, navigate])

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

  // ─── Countdown Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "starting_countdown") {
      if (countdownValue > 0) {
        const timer = setTimeout(() => setCountdownValue(prev => prev - 1), 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [phase, countdownValue])

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
      {/* ── HEADER ── */}
      {phase === "home" && (
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Live Assessment</h1>
          <p className="text-muted-foreground mt-2 font-medium">Host real-time interactive assessments from your question bank.</p>
        </header>
      )}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── STARTING COUNTDOWN ── */}
        {phase === "starting_countdown" && (
          <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 bg-background/95 backdrop-blur-md">
            <motion.div 
              key={countdownValue} 
              initial={{ opacity: 0, scale: 0.5, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-[15rem] md:text-[20rem] font-black text-primary tracking-tighter drop-shadow-2xl"
            >
              {countdownValue > 0 ? countdownValue : "GO!"}
            </motion.div>
          </motion.div>
        )}

        {/* ── HOME ── */}
        {phase === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl">
            {/* Create Game */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl space-y-0">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="p-8 sm:p-10 relative z-10 space-y-8">
                <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]"><MonitorPlay className="w-6 h-6 text-primary" /></div>
                  <div><div className="font-bold text-2xl text-foreground tracking-tight">Assessment Configuration</div><div className="text-sm text-muted-foreground mt-1">Configure parameters for your live session</div></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Database className="w-3 h-3"/> Tech Stack</label>
                    <input value={createForm.stack} onChange={e => setCreateForm(f => ({ ...f, stack: e.target.value }))} placeholder="Optional (e.g. Spring Boot)" className="w-full rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FileQuestion className="w-3 h-3"/> Topic</label>
                    <input value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))} placeholder="Optional" className="w-full rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ClipboardCheck className="w-3 h-3"/> Question Count</label>
                    <input type="number" min={1} max={50} value={createForm.questionCount} onChange={e => setCreateForm(f => ({ ...f, questionCount: parseInt(e.target.value) || 10 }))} className="w-full rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Clock className="w-3 h-3"/> Time Per Question</label>
                    <select value={createForm.timeLimitSeconds} onChange={e => setCreateForm(f => ({ ...f, timeLimitSeconds: parseInt(e.target.value) || 30 }))} className="w-full rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none text-foreground [&>option]:text-black">
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="45">45 seconds</option>
                      <option value="60">60 seconds</option>
                      <option value="90">90 seconds</option>
                    </select>
                  </div>
                </div>
                
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 font-medium flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" /> {error}
                  </motion.div>
                )}
                
                <Button onClick={handleCreateGame} disabled={isLoading} className="w-full rounded-xl py-6 text-base font-bold bg-primary hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] active:scale-[0.98]">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />} Initialize Assessment Session
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── HOST LOBBY ── */}
        {phase === "lobby_host" && (
          <motion.div key="lobby_host" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl mx-auto flex flex-col h-full">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:items-center justify-between gap-4 mb-4 md:mb-6 shrink-0">
              <div>
                <button onClick={() => navigate("/events")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3 md:mb-4">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <h1 className="text-3xl md:text-4xl font-black text-foreground">{location.state?.eventName || "Live Assessment"}</h1>
                <p className="text-muted-foreground mt-1 font-medium text-sm md:text-base">Lobby — waiting for participants</p>
              </div>
              <div className="bg-[#e6f4ea] text-[#137333] font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-[#137333] rounded-full animate-pulse" />
                {players.length} participant{players.length !== 1 && 's'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0">
              
              {/* Left Column */}
              <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                
                {/* JOIN CODE */}
                <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5 text-center shadow-sm shrink-0">
                  <p className="text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase">Join Code</p>
                  <div 
                    onClick={handleCopyPin}
                    className="bg-primary/10 text-primary font-mono font-black text-4xl tracking-widest py-2 px-2 rounded w-full mb-2 flex justify-center items-center cursor-pointer hover:bg-primary/20 transition-colors select-all"
                  >
                    {pin}
                  </div>
                  <p className="text-xs text-muted-foreground">Go to <span className="font-semibold text-foreground">{window.location.origin}/join</span></p>
                </div>

                {/* SCAN TO JOIN */}
                <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-5 text-center shadow-sm shrink-0 flex flex-col items-center">
                  <p className="text-xs font-bold text-muted-foreground tracking-wider mb-2 uppercase w-full">Scan to Join</p>
                  <div className="flex justify-center mb-2 bg-white p-2 rounded-xl">
                    <QRCodeSVG value={`${window.location.origin}/play?pin=${pin}`} size={120} />
                  </div>
                  <p className="text-[10px] text-muted-foreground break-all px-2 w-full">{`${window.location.origin}/play?pin=${pin}`}</p>
                </div>

                {/* START BUTTON */}
                <button 
                  onClick={handleStartGame} 
                  disabled={players.length < 1} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-3 md:py-4 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                  Start Quiz
                </button>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-8 h-full min-h-[300px]">
                <div className="bg-card border border-border/50 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col h-full">
                  <p className="text-sm font-bold text-muted-foreground tracking-wider mb-4 uppercase shrink-0">Participants ({players.length})</p>
                  <div className="flex flex-wrap gap-3 overflow-y-auto content-start flex-1 custom-scrollbar pr-2">
                    <AnimatePresence>
                      {players.map(p => (
                        <motion.div key={p} initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm border border-border/50 flex items-center gap-2 shadow-sm h-fit">
                          <span className="text-base md:text-lg">{getEmoji(p)}</span>
                          {getDisplayName(p)}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {players.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-50 my-auto">
                        <Users className="w-10 h-10 md:w-12 md:h-12 mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground italic text-base md:text-lg">Waiting for participants...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                    disabled={isHost || hasAnswered || timeLeft === 0}
                    whileHover={!isHost && !hasAnswered ? { scale: 1.02 } : {}}
                    whileTap={!isHost && !hasAnswered ? { scale: 0.98 } : {}}
                    className={`relative p-6 rounded-2xl text-white font-bold text-left flex items-center gap-4 transition-all shadow-lg ${style.bg} ${!isHost && !hasAnswered && timeLeft > 0 ? style.hover + " cursor-pointer" : isHost ? "cursor-default" : ""} ${isSelected ? "ring-4 ring-white/50 scale-105" : ""} ${hasAnswered && !isSelected ? "opacity-60" : ""}`}
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
                {isHost ? (
                  // Host sees the stats for each option
                  currentQuestion.options.map((opt, idx) => {
                    const style = OPTION_STYLES[idx]
                    const isCorrect = idx === correctOption
                    const count = answerStats[idx] || 0
                    return (
                      <div key={idx} className={`p-4 rounded-2xl flex items-center gap-4 font-bold text-white transition-all ${style.bg} ${!isCorrect ? "opacity-40" : "ring-4 ring-white/60 scale-[1.02] shadow-xl"}`}>
                        <div className="flex flex-col items-center justify-center min-w-[50px] pr-4 border-r border-white/20">
                          <span className="text-3xl">{count}</span>
                          <span className="text-xs opacity-80 uppercase tracking-widest mt-1">Votes</span>
                        </div>
                        <span className="text-xl">{style.icon}</span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <Check className="w-6 h-6 shrink-0" />}
                      </div>
                    )
                  })
                ) : (
                  // Players see their own answer and the correct answer
                  currentQuestion.options.map((opt, idx) => {
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
                  })
                )}
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
              <div className="flex items-end justify-center gap-3 pt-6 pb-4">
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
            {leaderboard.length > 0 && (
              <div className="space-y-2 pt-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.playerName} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl">
                    <span className="w-7 h-7 rounded-full bg-border text-muted-foreground flex items-center justify-center text-xs font-black">{i + 1}</span>
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
