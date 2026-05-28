import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Check, X, FileText, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { updateQuestion } from "@/store/questionsSlice"
import { UserAvatar } from "@/components/UserAvatar"

export default function PendingReviews() {
  const dispatch = useDispatch()
  const allQuestions = useSelector((state: RootState) => state.questions.list)
  const pendingReviews = allQuestions.filter(q => q.status === "Under Review")
  const approvedCount = allQuestions.filter(q => q.status === "Approved").length
  const rejectedCount = allQuestions.filter(q => q.status === "Rejected").length
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm dark:drop-shadow-md">My Pending Reviews</h2>
        <p className="text-muted-foreground mt-2 font-medium">Evaluate questions submitted by your peers.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex gap-6 mb-8 bg-card/40 p-4 rounded-2xl border border-border/50 backdrop-blur-xl w-max shadow-lg"
      >
        <div className="flex items-center gap-3 pr-6 border-r border-border/50">
          <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-2xl text-foreground">{pendingReviews.length}</div>
            <div className="text-yellow-600 dark:text-yellow-500/80 text-xs font-bold uppercase tracking-wider">Pending</div>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-6 border-r border-border/50">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-500">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-2xl text-foreground">{approvedCount}</div>
            <div className="text-green-600 dark:text-green-500/80 text-xs font-bold uppercase tracking-wider">Approved</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-2xl text-foreground">{rejectedCount}</div>
            <div className="text-red-600 dark:text-red-500/80 text-xs font-bold uppercase tracking-wider">Rejected</div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {pendingReviews.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card/30 rounded-3xl border border-border/50">
            No questions are currently under review.
          </div>
        ) : pendingReviews.map((review) => (
          <motion.div 
            key={review.id} 
            variants={cardVariants}
            className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-2xl shadow-xl flex flex-col gap-6 relative overflow-hidden group"
          >
            {/* Animated background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%]" />
            
            <Badge className="absolute top-8 right-8 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30 px-3 py-1 font-semibold tracking-wide backdrop-blur-md">
              {review.status}
            </Badge>
            
            <div className="flex justify-between text-sm items-center">
              <div className="flex flex-col gap-1">
                <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Author</div>
                <UserAvatar name="John Doe" role="SME Expert" avatarSize="sm" />
              </div>
              <div className="text-right pr-28">
                <div className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-0.5">Topic</div>
                <div className="text-foreground/80 font-medium">{review.topic}</div>
              </div>
            </div>

            <div className="bg-black/5 dark:bg-black/30 p-5 rounded-2xl border border-border/50 relative mt-2">
              <FileText className="absolute top-5 right-5 text-muted-foreground w-12 h-12 opacity-30" />
              <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-2">Question Stem</div>
              <p className="font-medium text-lg text-foreground leading-relaxed pr-12">{review.stem}</p>
            </div>

            <Dialog>
              <DialogTrigger render={
                <Button variant="outline" className="w-full bg-transparent border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all rounded-xl py-6 font-bold text-sm tracking-widest uppercase">
                  View Full Details
                </Button>
              } />
              <DialogContent className="sm:max-w-2xl bg-card border-border/50 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Question Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="bg-black/5 dark:bg-black/30 p-5 rounded-2xl border border-border/50 relative">
                    <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-2">Question Stem</div>
                    <p className="font-medium text-lg text-foreground leading-relaxed">{review.stem}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-2">Options</div>
                    {review.options && review.options.length > 0 ? (
                      review.options.map((option, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-xl border flex items-center gap-4 transition-colors ${index === review.correctOption ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400" : "bg-card border-border/50 text-foreground/80"}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === review.correctOption ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="font-medium text-base">{option}</span>
                          {index === review.correctOption && <Check className="w-5 h-5 ml-auto text-green-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No options provided.</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="pt-6 border-t border-border/50 flex items-center gap-4 mt-2">
              <input 
                type="text" 
                placeholder="Mandatory feedback..." 
                className="flex-1 rounded-xl border border-border bg-black/5 dark:bg-black/40 px-5 py-4 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
              <Button onClick={() => dispatch(updateQuestion({...review, status: "Approved"}))} className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all rounded-xl w-32 py-6 font-bold">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button onClick={() => dispatch(updateQuestion({...review, status: "Rejected"}))} className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all rounded-xl w-32 py-6 font-bold">
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
