import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "./components/layout/Sidebar"
import MyQuestions from "./pages/MyQuestions"
import PendingReviews from "./pages/PendingReviews"
import QuestionBank from "./pages/QuestionBank"
import QuizGame from "./pages/QuizGame"
import PublicGameJoin from "./pages/PublicGameJoin"
import QuizEventDashboard from "./pages/QuizEventDashboard"
import QuizEventDetail from "./pages/QuizEventDetail"
import Analytics from "./pages/Analytics"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeProvider } from "./components/theme-provider"
import { useSelector } from "react-redux"
import type { RootState } from "./store"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <ThemeProvider defaultTheme="dark">
      <Router>
        <Routes>
          {/* ── Public route — no login required ── */}
          <Route path="/play" element={<PublicGameJoin />} />

          {/* ── Auth-gated routes ── */}
          <Route path="*" element={
            !isAuthenticated ? (
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Login />} />
              </Routes>
            ) : (
              <div className="flex h-screen w-full bg-background text-foreground overflow-hidden selection:bg-primary/30 relative">
                {/* Accenture Brand Noise Gradient Background */}
                <div
                  className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] dark:opacity-[0.07] mix-blend-overlay"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/15 dark:bg-primary/20 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/15 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-[#d946ef]/5 dark:bg-[#d946ef]/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10 w-full custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="min-h-full max-w-7xl mx-auto w-full"
                    >
                      <Routes>
                        <Route path="/" element={<Navigate to="/my-questions" replace />} />
                        <Route path="/my-questions" element={<MyQuestions />} />
                        <Route path="/pending-reviews" element={<PendingReviews />} />
                        <Route path="/question-bank" element={<QuestionBank />} />
                        <Route path="/events" element={<QuizEventDashboard />} />
                        <Route path="/events/:eventId" element={<QuizEventDetail />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/quiz-game" element={<QuizGame />} />
                      </Routes>
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            )
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
