import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Users, Layers, ArrowRight } from "lucide-react"
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">SME Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign Subject Matter Experts to Tech Stacks</p>
      </div>

      <div className="bg-card hover:bg-card/90 backdrop-blur-xl border border-border/50 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> New Assignment</h2>
        <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-end relative z-10">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /> Select SME</label>
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
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5"><Layers className="w-4 h-4 text-muted-foreground" /> Select Tech Stack</label>
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
                    <h3 className="font-bold text-lg text-foreground">{mapping.enterpriseId}</h3>
                    <p className="text-sm font-medium text-primary flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {mapping.stack.name}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(mapping.id)}
                  title="Remove Assignment"
                  className="w-10 h-10 rounded-full bg-secondary hover:bg-red-500/20 text-muted-foreground hover:text-red-400 flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteModal.open}
        title="Remove Assignment"
        description="Are you sure you want to remove this SME from the selected tech stack?"
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, mappingId: null })}
      />
    </div>
  )
}
