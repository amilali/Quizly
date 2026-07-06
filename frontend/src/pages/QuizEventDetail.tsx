import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"

import { ArrowLeft, Edit, Trash2, Plus, Copy, CheckCheck, Check, MonitorPlay } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import EventQuestionEditor, { type EventQuestion } from "../components/EventQuestionEditor"
import DeleteConfirmModal from "../components/DeleteConfirmModal"

interface QuizEvent {
  id: number
  name: string
  status: string
  timeLimitSeconds: number
  createdAt: string
  pin: string | null
  questions: EventQuestion[]
}

export default function QuizEventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  
  const [event, setEvent] = useState<QuizEvent | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<EventQuestion | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sessionActive, setSessionActive] = useState(() => localStorage.getItem(`session_active_${eventId}`) === 'true')
  
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; questionId: number | null }>({
    open: false, questionId: null
  })
  const [editEventName, setEditEventName] = useState("")
  
  // Auto-pull modal
  const [showAutoPull, setShowAutoPull] = useState(false)
  const [apStack, setApStack] = useState("")
  const [apTopic, setApTopic] = useState("")
  const [apCount, setApCount] = useState(10)
  const [approvedQuestions, setApprovedQuestions] = useState<any[]>([])

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    if (showAutoPull) {
      fetch("/api/questions", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const approved = Array.isArray(data) ? data.filter((q: any) => q.status === "Approved") : [];
        setApprovedQuestions(approved);
      })
      .catch(console.error);
    }
  }, [showAutoPull, token])


  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
        setEditEventName(data.name)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateEventName = async () => {
    if (!event) return
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: editEventName, timeLimitSeconds: event.timeLimitSeconds })
      })
      if (res.ok) {
        setIsEditingEvent(false)
        fetchEvent()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveQuestion = async (q: EventQuestion) => {
    try {
      const method = q.id ? "PUT" : "POST"
      const url = q.id ? `/api/events/${eventId}/questions/${q.id}` : `/api/events/${eventId}/questions`
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(q)
      })
      if (res.ok) {
        setEditingQuestion(null)
        setIsAddingNew(false)
        fetchEvent()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    setDeleteModal({ open: true, questionId })
  }

  const confirmDeleteQuestion = async () => {
    const questionId = deleteModal.questionId
    setDeleteModal({ open: false, questionId: null })
    if (!questionId) return
    try {
      await fetch(`/api/events/${eventId}/questions/${questionId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      fetchEvent()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAutoPull = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/events/${eventId}/questions/auto-pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stack: apStack, topic: apTopic, questionCount: apCount })
      })
      if (res.ok) {
        setShowAutoPull(false)
        fetchEvent()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) fetchEvent()
      else alert("Cannot publish event. Please ensure it has questions.")
    } catch (e) {
      console.error(e)
    }
  }

  const handleUnpublish = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/unpublish`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to unpublish event")
      localStorage.removeItem(`session_active_${eventId}`)
      setSessionActive(false)
      fetchEvent()
    } catch (e: any) {
      console.error(e.message)
    }
  }

  const handleStartSession = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/start-session`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to start session")
      localStorage.setItem(`session_active_${eventId}`, 'true')
      setSessionActive(true)
      navigate("/quiz-game", { state: { pin: event?.pin, host: true } })
    } catch (e: any) {
      console.error(e.message)
    }
  }

  const handleStopSession = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/stop-session`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to stop session")
      localStorage.removeItem(`session_active_${eventId}`)
      setSessionActive(false)
    } catch (e: any) {
      console.error(e.message)
    }
  }

  const copyLink = () => {
    if (event?.pin) {
      navigator.clipboard.writeText(`${window.location.origin}/play?pin=${event.pin}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!event) return <div className="p-8 text-center text-muted-foreground">Loading event...</div>

  // If editor is open, render it full screen
  if (editingQuestion || isAddingNew) {
    return (
      <EventQuestionEditor
        question={editingQuestion || undefined}
        defaultTimeLimit={event.timeLimitSeconds}
        onSave={handleSaveQuestion}
        onCancel={() => { setEditingQuestion(null); setIsAddingNew(false) }}
      />
    )
  }

  const shareableUrl = `${window.location.origin}/play?pin=${event.pin}`

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[100dvh] p-4 md:p-6 overflow-hidden">
      <button onClick={() => navigate("/events")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 shrink-0">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className={`relative shrink-0 rounded-[32px] shadow-2xl border border-white/20 mb-6 overflow-hidden ${event.status === 'Published' ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}>
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl">
              <MonitorPlay className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                {isEditingEvent ? (
                  <input 
                    type="text" 
                    value={editEventName} 
                    onChange={e => setEditEventName(e.target.value)}
                    className="text-4xl md:text-5xl font-black bg-black/20 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/50 w-full max-w-sm tracking-tight"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">{event.name}</h1>
                )}
                <span className={`px-4 py-1.5 backdrop-blur-md rounded-full text-sm font-bold shadow-lg flex items-center gap-2 border bg-white/20 text-white border-white/30`}>
                  <div className={`w-2 h-2 rounded-full ${event.status === 'Published' ? 'bg-emerald-300 animate-pulse' : 'bg-white'}`} />
                  {event.status}
                </span>
              </div>
            </div>
          </div>
          
          {isEditingEvent ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditingEvent(false)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/20 flex items-center gap-2">Cancel</button>
              <button onClick={handleUpdateEventName} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"><Check className="w-5 h-5"/> Save</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingEvent(true)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/20 flex items-center gap-2 shadow-sm">
              <Edit className="w-5 h-5" /> Edit Event
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 flex-1 overflow-hidden pb-4">
        
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {event.status !== 'Published' && (
            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-lg shadow-black/5 shrink-0">
              <h2 className="text-xl font-bold mb-2">Question Bank</h2>
              <p className="text-sm text-muted-foreground mb-4">Automatically pull approved questions from the SME bank.</p>
              <button
                onClick={() => setShowAutoPull(true)}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm"
              >
                Auto-pull from Bank
              </button>
            </div>
          )}

          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-lg shadow-black/5">
            <h2 className="text-xl font-bold mb-4">Publish</h2>
            
            {event.status === "Draft" ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Publishing generates a join code and QR code so participants can join.</p>
                <button
                  onClick={handlePublish}
                  disabled={event.questions.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish Event
                </button>
                {event.questions.length === 0 && (
                  <p className="text-sm text-red-400 text-center">Add questions before publishing.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-1.5">JOIN CODE</p>
                    <div className="text-2xl font-mono font-bold tracking-widest bg-background/50 border border-border/50 p-2 rounded-xl text-center shadow-inner h-[80px] flex items-center justify-center">
                      {event.pin}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-1.5 text-center">QR CODE</p>
                    <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-sm h-[80px]">
                      <QRCodeSVG value={shareableUrl} size={64} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-1.5">SHAREABLE URL</p>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={shareableUrl} className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground outline-none" />
                    <button onClick={copyLink} className="p-2 border border-border/50 rounded-lg hover:bg-white/5 transition-colors">
                      {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border/50">
                  {sessionActive ? (
                    <>
                      <button
                        onClick={() => navigate("/quiz-game", { state: { pin: event.pin, host: true } })}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                      >
                        Go to Lobby
                      </button>
                      <button
                        onClick={handleStopSession}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/20"
                      >
                        Stop Session
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartSession}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                      >
                        Start Session
                      </button>
                      <button
                        onClick={handleUnpublish}
                        className="px-4 border border-border/50 hover:bg-white/5 font-medium text-sm py-2.5 rounded-xl transition-all"
                      >
                        Unpublish
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Questions List */}
        <div className="lg:col-span-8 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Questions <span className="text-sm font-normal text-muted-foreground">({event.questions.length})</span>
            </h2>
            <div className="flex gap-3">
              {event.status !== 'Published' && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              )}
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar"
            style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)", paddingTop: '20px' }}
          >
            {event.questions.length === 0 ? (
              <div className="bg-card/50 border border-border/50 border-dashed rounded-2xl p-12 text-center shadow-sm">
                <div className="text-6xl font-bold text-red-500 mb-4">?</div>
                <h3 className="text-2xl font-bold mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Add your first question to get started. You can pull from the SME bank or create one manually.
                </p>
                <button onClick={() => setIsAddingNew(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-primary/20">
                  Add your first question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {event.questions.map((q, index) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-xl p-5 shadow-sm flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{q.stem}</h4>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md">Single Select</span>
                      <span className="text-muted-foreground flex items-center gap-1">⏱️ {q.timeLimitSeconds}s</span>
                      <span className="text-muted-foreground">4 options</span>
                    </div>
                  </div>
                  {event.status === 'Draft' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditingQuestion(q)} className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => q.id && handleDeleteQuestion(q.id)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-pull Modal */}
      {showAutoPull && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Auto-pull from Bank</h2>
            <p className="text-sm text-muted-foreground mb-6">Select a stack and topic to pull approved questions automatically.</p>
            <form onSubmit={handleAutoPull} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tech Stack</label>
                <input 
                  type="text" 
                  list="approved-stacks"
                  value={apStack} 
                  onChange={e => {
                    setApStack(e.target.value);
                    setApTopic(""); // Reset topic when stack changes
                  }} 
                  placeholder="e.g. React" 
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                />
                <datalist id="approved-stacks">
                  {Array.from(new Set(approvedQuestions.map(q => q.stack).filter(Boolean))).map(stack => (
                    <option key={stack} value={stack} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <input 
                  type="text" 
                  list="approved-topics"
                  value={apTopic} 
                  onChange={e => setApTopic(e.target.value)} 
                  placeholder="e.g. Hooks" 
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" 
                />
                <datalist id="approved-topics">
                  {Array.from(new Set(
                    approvedQuestions
                      .filter(q => !apStack || q.stack === apStack)
                      .map(q => q.topic)
                      .filter(Boolean)
                  )).map(topic => (
                    <option key={topic} value={topic} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Question Count</label>
                <input type="number" min="1" max="50" required value={apCount} onChange={e => setApCount(Number(e.target.value))} className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAutoPull(false)} className="flex-1 bg-secondary py-2 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium shadow-lg shadow-primary/20">Pull Questions</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DeleteConfirmModal
        open={deleteModal.open}
        title="Delete Question"
        description="Are you sure you want to remove this question from the event? This action cannot be undone."
        confirmLabel="Delete Question"
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteModal({ open: false, questionId: null })}
      />
    </div>
  )
}
