import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Users, Layers, ArrowRight, X } from "lucide-react"
import DeleteConfirmModal from "../components/DeleteConfirmModal"

interface User {
  userId: string;
  role: string;
}

interface Stack {
  id: number;
  name: string;
}

interface SmeStackMapping {
  id: number;
  enterpriseId: string;
  stack: Stack;
}

export default function SmeAssignment() {
  const [smes, setSmes] = useState<User[]>([])
  const [stacks, setStacks] = useState<Stack[]>([])
  const [mappings, setMappings] = useState<SmeStackMapping[]>([])
  
  const [selectedSme, setSelectedSme] = useState("")
  const [selectedStack, setSelectedStack] = useState("")
  
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; mappingId: number | null }>({
    open: false, mappingId: null
  })

  // Modals for creating SME and Stack
  const [addSmeModal, setAddSmeModal] = useState(false)
  const [newSmeId, setNewSmeId] = useState("")
  const [newSmePassword, setNewSmePassword] = useState("")

  const [addStackModal, setAddStackModal] = useState(false)
  const [newStackName, setNewStackName] = useState("")
  
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchSmes()
    fetchStacks()
    fetchMappings()
  }, [])

  const fetchSmes = async () => {
    try {
      const res = await fetch("/api/users/smes", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setSmes(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStacks = async () => {
    try {
      const res = await fetch("/api/stacks", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setStacks(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMappings = async () => {
    try {
      const res = await fetch("/api/sme-mappings", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setMappings(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSme || !selectedStack) return
    
    try {
      const res = await fetch("/api/sme-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ enterpriseId: selectedSme, stackId: Number(selectedStack) })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMappings([...mappings, data])
        setSelectedSme("")
        setSelectedStack("")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddSme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSmeId || !newSmePassword) return
    
    try {
      const res = await fetch("/api/users/smes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: newSmeId, password: newSmePassword })
      })
      
      if (res.ok) {
        const data = await res.json()
        setSmes([...smes, data])
        setSelectedSme(data.userId)
        setAddSmeModal(false)
        setNewSmeId("")
        setNewSmePassword("")
      } else {
        alert("Could not create SME. Might already exist.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddStack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStackName) return
    
    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newStackName })
      })
      
      if (res.ok) {
        const data = await res.json()
        setStacks([...stacks, data])
        setSelectedStack(String(data.id))
        setAddStackModal(false)
        setNewStackName("")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = (id: number) => {
    setDeleteModal({ open: true, mappingId: id })
  }

  const confirmDelete = async () => {
    const id = deleteModal.mappingId
    setDeleteModal({ open: false, mappingId: null })
    if (!id) return
    
    try {
      const res = await fetch(`/api/sme-mappings/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setMappings(mappings.filter(m => m.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">SME Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign Subject Matter Experts to Tech Stacks</p>
      </div>

      <div className="bg-card hover:bg-card/90 backdrop-blur-xl border border-border/50 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> New Assignment</h2>
        <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-end relative z-10">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-1.5">
               <label className="text-sm font-medium flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /> Select SME</label>
               <button type="button" onClick={() => setAddSmeModal(true)} className="p-1 hover:bg-muted rounded-md text-primary transition-colors flex items-center gap-1 text-xs font-semibold">
                  <Plus className="w-3 h-3" /> Add SME
               </button>
            </div>
            <select
              required
              value={selectedSme}
              onChange={(e) => setSelectedSme(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
            >
              <option value="" disabled>Choose an SME...</option>
              {smes.map(sme => (
                <option key={sme.userId} value={sme.userId}>{sme.userId}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-1.5">
               <label className="text-sm font-medium flex items-center gap-1.5"><Layers className="w-4 h-4 text-muted-foreground" /> Select Tech Stack</label>
               <button type="button" onClick={() => setAddStackModal(true)} className="p-1 hover:bg-muted rounded-md text-primary transition-colors flex items-center gap-1 text-xs font-semibold">
                  <Plus className="w-3 h-3" /> Add Stack
               </button>
            </div>
            <select
              required
              value={selectedStack}
              onChange={(e) => setSelectedStack(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
            >
              <option value="" disabled>Choose a Tech Stack...</option>
              {stacks.map(stack => (
                <option key={stack.id} value={stack.id}>{stack.name}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 w-full md:w-auto"
          >
            Assign <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Current Assignments</h2>
        
        {mappings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center bg-card border border-border/50 rounded-[24px]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">No Assignments Yet</h3>
            <p className="text-muted-foreground text-sm">Use the form above to assign an SME to a tech stack.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappings.map((mapping) => (
              <motion.div
                key={mapping.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-card border border-border/50 rounded-[20px] p-5 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                    {mapping.enterpriseId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{mapping.enterpriseId}</h3>
                    <p className="text-sm font-semibold text-primary mt-0.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {mapping.stack.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(mapping.id)}
                  className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, mappingId: null })}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? The SME will no longer be mapped to this tech stack."
      />

      {/* Add SME Modal */}
      <AnimatePresence>
        {addSmeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setAddSmeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-1">Add New SME</h2>
              <p className="text-sm text-muted-foreground mb-6">Create a new Subject Matter Expert account.</p>
              
              <form onSubmit={handleAddSme} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Enterprise ID / Username</label>
                  <input
                    type="text"
                    required
                    value={newSmeId}
                    onChange={(e) => setNewSmeId(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. john.doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newSmePassword}
                    onChange={(e) => setNewSmePassword(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddSmeModal(false)}
                    className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Create SME
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Tech Stack Modal */}
      <AnimatePresence>
        {addStackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setAddStackModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-1">Add Tech Stack</h2>
              <p className="text-sm text-muted-foreground mb-6">Define a new technology stack.</p>
              
              <form onSubmit={handleAddStack} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stack Name</label>
                  <input
                    type="text"
                    required
                    value={newStackName}
                    onChange={(e) => setNewStackName(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. React Native, AWS, MongoDB..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddStackModal(false)}
                    className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Create Stack
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
