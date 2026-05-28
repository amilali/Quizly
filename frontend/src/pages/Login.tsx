import { useDispatch } from "react-redux"
import { login } from "@/store/authSlice"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { ShieldAlert, UserCheck } from "lucide-react"

export default function Login() {
  const dispatch = useDispatch()

  const handleLogin = (role: 'SME' | 'Admin') => {
    dispatch(login({ 
      role, 
      userName: role === 'SME' ? 'Amil Ali' : 'Admin User' 
    }));
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
        <div className="flex flex-col items-center mb-10">
          <Logo className="w-16 h-16 drop-shadow-lg mb-4" />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 tracking-tighter text-center">
            Welcome to Qwizly
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-2 text-center">
            Select your role to access the dashboard
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => handleLogin('SME')}
            variant="outline"
            className="w-full h-16 text-lg font-bold rounded-2xl border-2 border-border/50 bg-black/5 dark:bg-white/[0.02] hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all group flex items-center justify-start px-6 gap-4"
          >
            <UserCheck className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-left flex-1">
              <div className="leading-tight">Login as SME</div>
              <div className="text-xs text-muted-foreground group-hover:text-primary/70 font-normal mt-0.5">Content Creator Access</div>
            </div>
          </Button>

          <Button 
            onClick={() => handleLogin('Admin')}
            variant="outline"
            className="w-full h-16 text-lg font-bold rounded-2xl border-2 border-border/50 bg-black/5 dark:bg-white/[0.02] hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all group flex items-center justify-start px-6 gap-4"
          >
            <ShieldAlert className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-left flex-1">
              <div className="leading-tight">Login as Admin</div>
              <div className="text-xs text-muted-foreground group-hover:text-primary/70 font-normal mt-0.5">Full System Access</div>
            </div>
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase text-center mt-12">
          Part of Accenture LT&T
        </p>
      </motion.div>
    </div>
  )
}
