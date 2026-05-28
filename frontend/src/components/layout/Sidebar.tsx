import { Link, useLocation } from "react-router-dom"
import { FileQuestion, ClipboardCheck, Database } from "lucide-react"
import { ThemeToggle } from "../ThemeToggle"
import { Logo } from "../Logo"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function Sidebar() {
  const location = useLocation()
  
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
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-72 bg-background border-r border-border/40 flex flex-col z-20 relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <div className="p-8 border-b border-border/20 relative z-10">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <Logo className="w-12 h-12 shrink-0 drop-shadow-md dark:drop-shadow-lg" />
          <div className="flex flex-col justify-center">
            <h1 className="text-[32px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 tracking-tighter leading-none pb-1">
              Qwizly
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase leading-none mt-0.5">
              Part of Accenture LT&T
            </p>
          </div>
        </motion.div>
      </div>
      
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 p-6 space-y-3 relative z-10"
      >
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.href)
          
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                to={item.href}
                className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative",
                  isActive 
                    ? "text-primary bg-primary/10" 
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
                <item.icon className={cn("h-5 w-5 relative z-10 transition-colors", isActive ? "text-primary" : "group-hover:text-primary/70")} />
                <span className="relative z-10">{item.title}</span>
                {item.adminOnly && (
                  <span className="relative z-10 ml-auto text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Admin</span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
      
      <div className="p-6 border-t border-border/20 relative z-10 bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer group">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">John Doe</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide">SME Expert</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </motion.aside>
  )
}
