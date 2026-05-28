import { useState } from "react"
import { useDispatch } from "react-redux"
import { login } from "@/store/authSlice"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      
      localStorage.setItem('token', data.token)
      dispatch(login({ 
        role: data.role === 'ADMIN' ? 'Admin' : 'SME', 
        userName: data.userId 
      }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden">
      {/* Background Noise & Gradients */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] dark:opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 dark:bg-primary/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/15 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-8 sm:p-12 rounded-3xl bg-card border border-border/50 shadow-2xl backdrop-blur-xl mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center shrink-0">
              <Logo className="w-16 h-16 drop-shadow-md dark:drop-shadow-lg" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[40px] font-extrabold text-foreground tracking-[0.15em] uppercase leading-none pb-1">
                QWIZLY
              </h1>
              <p className="text-[12px] text-muted-foreground font-medium leading-none mt-1 self-end">
                Part of <span className="font-bold text-foreground">Accenture L&TT</span>
              </p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight text-center">
            Sign in to your account
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-xl">{error}</div>}
          
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="User ID" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-bold rounded-xl"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate('/register')} className="text-primary hover:underline">
            Register here
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase text-center mt-12">
          Sign in to access your dashboard
        </p>
      </motion.div>
    </div>
  )
}
