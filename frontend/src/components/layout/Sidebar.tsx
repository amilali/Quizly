import { Link, useLocation } from "react-router-dom"
import { FileQuestion, ClipboardCheck, Database, LogOut } from "lucide-react"
import { ThemeToggle } from "../ThemeToggle"
import { Logo } from "../Logo"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { UserAvatar } from "../UserAvatar"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/store/authSlice"
import type { RootState } from "@/store"

export default function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { role, userName } = useSelector((state: RootState) => state.auth)
  
  const navItems = [
    {
      title: "My Questions",
      href: "/my-questions",
      icon: FileQuestion,
    },
    {
      title: "My Pending Reviews",
      href: "/pending-reviews",
      icon: ClipboardCheck,
    },
    {
      title: "Question Bank Management",
      href: "/question-bank",
      icon: Database,
      adminOnly: true,
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-72 bg-background border-r border-border/40 flex flex-col z-20 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <div className="px-6 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 flex items-center justify-center shrink-0">
            <Logo className="w-12 h-12 drop-shadow-md dark:drop-shadow-lg" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 tracking-tighter leading-none pb-1">
              Qwizly
            </h1>
            <p className="text-[9px] text-muted-foreground font-bold tracking-[0.02em] uppercase leading-none mt-0.5 ml-0.5">
              Part of Accenture LT&T
            </p>
          </div>
        </motion.div>
      </div>
      
      <div className="border-b border-border/20" />
      
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 py-6 space-y-2 relative z-10"
      >
        {navItems
          .filter(item => !item.adminOnly || role === 'Admin')
          .map((item) => {
          const isActive = location.pathname.includes(item.href)
          
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                to={item.href}
                className={cn(
                  "group flex items-center gap-4 px-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative",
                  isActive 
                    ? "text-primary bg-primary/10 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="w-12 flex items-center justify-center shrink-0 relative z-10">
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "group-hover:text-primary/70")} />
                </div>
                <span className="relative z-10">{item.title}</span>
                {item.adminOnly && (
                  <span className="relative z-10 ml-auto text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Admin</span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
      
      <div className="flex flex-col border-t border-border/20 relative z-10 bg-transparent">
        <div className="px-6 pt-6 pb-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <UserAvatar name={userName || "Amil Ali"} role={role === 'Admin' ? "Administrator" : "SME Expert"} avatarSize="md" />
          </motion.div>
        </div>
        
        <div className="px-4 pb-6 pt-2 flex items-center justify-between">
          <button 
            onClick={() => dispatch(logout())}
            className="flex items-center gap-4 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 px-2 py-3 rounded-xl transition-colors cursor-pointer group flex-1"
          >
            <div className="w-12 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold tracking-wide">Logout</span>
          </button>
          <div className="pr-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
