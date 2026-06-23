import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FileQuestion, ClipboardCheck, Database, LogOut, MonitorPlay, BarChart3 } from "lucide-react"
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
  const [isCollapsed, setIsCollapsed] = useState(true)
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
    },
    {
      title: "Live Assessment",
      href: "/events",
      icon: MonitorPlay,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      restrictedRoles: ["Admin", "SME"],
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
      initial={{ x: -300, width: 288 }}
      animate={{ x: 0, width: isCollapsed ? 88 : 288 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsCollapsed(false)}
      onHoverEnd={() => setIsCollapsed(true)}
      className="bg-background border-r border-border/40 flex flex-col z-20 relative shrink-0 h-[100dvh]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <div className="px-4 py-8 relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <div className="w-14 flex items-center justify-center shrink-0">
              <Logo className="w-10 h-10 drop-shadow-md dark:drop-shadow-lg" />
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: "auto" }} 
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-col justify-center overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-[28px] font-extrabold text-foreground tracking-[0.15em] uppercase leading-none pb-1">
                  QWIZLY
                </h1>
                <p className="text-[9px] text-muted-foreground font-medium leading-none mt-1 self-start">
                  Part of <span className="font-bold text-foreground">Accenture L&TT</span>
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      
      <div className="border-b border-border/20" />
      
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 px-4 py-6 space-y-2 relative z-10"
      >
        {navItems
          .filter(item => (!item.adminOnly || role === 'Admin') && (!item.restrictedRoles || item.restrictedRoles.includes(role || "")))
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
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }} 
                    animate={{ opacity: 1, width: "auto" }} 
                    className="relative z-10 flex flex-1 items-center overflow-hidden whitespace-nowrap"
                  >
                    <span>{item.title}</span>
                    {item.adminOnly && (
                      <span className="ml-auto text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Admin</span>
                    )}
                  </motion.div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
      
      <div className="flex flex-col border-t border-border/20 relative z-10 bg-transparent shrink-0">
        <div className="px-4 pt-6 pb-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className={cn("flex", isCollapsed ? "justify-center" : "justify-start px-2")}>
            <UserAvatar name={userName || "Amil Ali"} role={role === 'Admin' ? "Administrator" : "SME Expert"} avatarSize="md" hideDetails={isCollapsed} />
          </motion.div>
        </div>
        
        <div className={cn("px-4 pb-6 pt-2 flex items-center gap-2", isCollapsed ? "flex-col" : "justify-between")}>
          <button 
            onClick={() => dispatch(logout())}
            className={cn("flex items-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-colors cursor-pointer group", isCollapsed ? "p-3 justify-center" : "gap-4 px-2 py-3 flex-1")}
          >
            <div className="flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            {!isCollapsed && <span className="text-sm font-bold tracking-wide overflow-hidden whitespace-nowrap">Logout</span>}
          </button>
          <div className={cn(isCollapsed ? "mt-2" : "pr-2")}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
