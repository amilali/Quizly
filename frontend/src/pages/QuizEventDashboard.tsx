import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, MonitorPlay, Calendar, Clock, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import DeleteConfirmModal from "../components/DeleteConfirmModal"


interface QuizEvent {
  id: number
  name: string
  status: string
  timeLimitSeconds: number
  createdAt: string
  pin: string | null
}

export default function QuizEventDashboard() {
  const [events, setEvents] = useState<QuizEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newEventName, setNewEventName] = useState("")
  const [newTimeLimit, setNewTimeLimit] = useState(30)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; eventId: number | null }>({
    open: false, eventId: null
  })
  
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newEventName, timeLimitSeconds: newTimeLimit })
      })
      if (res.ok) {
        const data = await res.json()
        setEvents([data, ...events])
        setShowModal(false)
        setNewEventName("")
        navigate(`/events/${data.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = (id: number) => {
    setDeleteModal({ open: true, eventId: id })
  }

  const confirmDelete = async () => {
    const id = deleteModal.eventId
    setDeleteModal({ open: false, eventId: null })
    if (!id) return
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setEvents(events.filter(e => e.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your quiz events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card hover:bg-card/90 backdrop-blur-xl border border-border/50 rounded-[24px] overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 flex flex-col"
          >
            {/* Vibrant Gradient Header */}
            <div className={`absolute top-0 left-0 right-0 h-40 opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100 ${event.status === 'Published' ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`} style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}></div>

            <div className="p-6 pt-8 flex-1 flex flex-col relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl shadow-black/10">
                  <MonitorPlay className="w-7 h-7" />
                </div>
                <div className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-md bg-white/20 text-white border border-white/30">
                  <div className={`w-2 h-2 rounded-full ${event.status === 'Published' ? 'bg-emerald-300 animate-pulse' : 'bg-white'}`}></div>
                  {event.status}
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-foreground mb-3 group-hover:text-primary transition-colors tracking-tight">{event.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mb-8 gap-5 font-semibold">
                 <span className="flex items-center gap-2"><Calendar className="w-4 h-4 opacity-70" /> {new Date(event.createdAt).toLocaleDateString()}</span>
                 <span className="flex items-center gap-2"><Clock className="w-4 h-4 opacity-70" /> {event.timeLimitSeconds}s limit</span>
              </div>
              
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="flex-1 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  Manage Event <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  title="Delete Event"
                  className="px-5 bg-secondary hover:bg-red-500 text-muted-foreground hover:text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {events.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <MonitorPlay className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No Events Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Create your first quiz event to start hosting live interactive assessments.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary/20 hover:bg-primary/30 text-primary px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create your first Event
            </button>
          </motion.div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g., React Midterm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Default Time Limit (seconds)</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="120"
                  value={newTimeLimit}
                  onChange={(e) => setNewTimeLimit(Number(e.target.value))}
                  className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <DeleteConfirmModal
        open={deleteModal.open}
        title="Delete Event"
        description="Are you sure you want to delete this event and all its questions? This action cannot be undone."
        confirmLabel="Delete Event"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, eventId: null })}
      />
    </div>
  )
}
