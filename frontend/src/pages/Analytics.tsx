import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useTheme } from "@/components/theme-provider";

export default function Analytics() {
  const role = useSelector((state: RootState) => state.auth.role);

  if (role !== "Admin" && role !== "SME") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-3xl font-bold mb-4 text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view analytics.</p>
      </div>
    );
  }

  const { theme } = useTheme();

  // Resolve system theme to either "dark" or "light"
  const actualTheme = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  // Uses the relative path which will be proxied by Vercel/Nginx to the Grafana instance
  // theme dynamically matches the Quizly UI
  // kiosk completely hides all Grafana UI elements (sidebar, topbar, dashboard header)
  const grafanaUrl = `/grafana/d/user_analytics/quizly-user-analytics?orgId=1&theme=${actualTheme}&kiosk`;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Player <span className="text-primary">Analytics</span></h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Real-time metrics on player performance, accuracy, and engagement.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 w-full min-h-[600px] sm:min-h-[800px] flex flex-col rounded-xl border border-border/50 overflow-hidden bg-card/50 shadow-xl"
      >
        <iframe 
          src={grafanaUrl} 
          className="w-full flex-1 border-none"
          title="Grafana Analytics Dashboard"
          allowFullScreen
        />
      </motion.div>
    </div>
  );
}
