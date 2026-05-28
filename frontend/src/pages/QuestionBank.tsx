import { useState, useRef } from "react"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { updateQuestion, assignReviewer } from "@/store/questionsSlice"
import type { Question } from "@/store/questionsSlice"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Edit3, UserPlus } from "lucide-react"

// Mock list of SMEs (usually fetched from an API)
const MOCK_SMES = [
  "bhola.gaurav",
  "swati.nikam",
  "divya.madhnasekar",
  "indugu.hariprasad",
  "admin.user"
];

export default function QuestionBank() {
  const dispatch = useDispatch()
  const parentRef = useRef<HTMLDivElement>(null)
  
  const questions = useSelector((state: RootState) => state.questions.list)
  const { role } = useSelector((state: RootState) => state.auth)
  
  const [activeTab, setActiveTab] = useState("All")
  const [editFormData, setEditFormData] = useState<any>(null)
  const [assignData, setAssignData] = useState<{question: Question | null, selectedReviewer: string}>({
    question: null,
    selectedReviewer: ""
  })

  // Security check - Only Admins should view this component
  if (role !== "Admin") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied: Admin Privileges Required</div>
  }

  const filteredQuestions = activeTab === "All" 
    ? questions 
    : questions.filter(q => q.status === activeTab)

  const rowVirtualizer = useVirtualizer({
    count: filteredQuestions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73,
    overscan: 5,
  })

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Draft": return <Badge className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">Draft</Badge>
      case "Ready for Review": return <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">Ready for Review</Badge>
      case "Under Review": return <Badge className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30">Under Review</Badge>
      case "Approved": return <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/30">Approved</Badge>
      case "Rejected": return <Badge className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">Rejected</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const handleAssignReviewer = () => {
    if (assignData.question && assignData.selectedReviewer) {
      dispatch(assignReviewer({
        id: assignData.question.id,
        reviewerId: assignData.selectedReviewer
      }));
      setAssignData({ question: null, selectedReviewer: "" });
    }
  }

  const handleSaveChanges = (status: string) => {
    if (!editFormData) return;
    dispatch(updateQuestion({ ...editFormData, status }));
    setEditFormData(null);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm dark:drop-shadow-md">Question Bank Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">Global view and reviewer assignment for all enterprise questions.</p>
        </motion.div>
      </div>

      <Tabs defaultValue="All" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-transparent p-0 flex flex-wrap gap-2 h-auto">
          {["All", "Draft", "Ready for Review", "Under Review", "Approved", "Rejected"].map(tab => {
            const count = tab === "All" ? questions.length : questions.filter(q => q.status === tab).length;
            return (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none text-muted-foreground py-2 px-4 font-semibold transition-all duration-300 border border-transparent data-[state=active]:border-primary/20"
              >
                {tab} <span className="ml-2 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
        
        <motion.div 
          layout
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative"
        >
          <div ref={parentRef} className="overflow-y-auto max-h-[60vh] w-full custom-scrollbar relative">
            <Table>
              <TableHeader className="bg-card/95 dark:bg-black/90 sticky top-0 z-20 backdrop-blur-xl shadow-sm border-b border-border/50">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="w-[35%] min-w-[250px] text-muted-foreground font-bold uppercase tracking-wider text-xs pl-6">Question</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Creator</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Reviewer</TableHead>
                  <TableHead className="text-right text-muted-foreground font-bold uppercase tracking-wider text-xs pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {rowVirtualizer.getVirtualItems().length > 0 && (
                <TableRow className="border-0 hover:bg-transparent h-0">
                  <TableCell colSpan={5} className="p-0 border-0" style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} />
                </TableRow>
              )}
              <AnimatePresence mode="popLayout">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const q = filteredQuestions[virtualRow.index];
                  return (
                  <motion.tr 
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="border-border/50 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors group align-middle"
                  >
                    <TableCell className="font-medium py-5 text-foreground pl-6">
                      <div className="whitespace-normal break-words leading-relaxed pr-4 text-sm">{q.stem}</div>
                    </TableCell>
                    <TableCell className="py-5 text-foreground/80 font-medium text-sm">{q.creatorId || "-"}</TableCell>
                    <TableCell className="py-5">{getStatusBadge(q.status)}</TableCell>
                    <TableCell className="py-5 text-foreground/80 text-sm">{q.reviewerId || "-"}</TableCell>
                    <TableCell className="text-right py-5 pr-6 space-x-2 whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditFormData({ ...q, options: q.options || ["", "", "", ""], correctOption: q.correctOption ?? 0 })}
                        className="text-primary hover:text-primary hover:bg-primary/10 transition-all rounded-lg"
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      
                      {q.status === "Ready for Review" && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setAssignData({ question: q, selectedReviewer: "" })}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-lg"
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Assign Reviewer
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                )})}
              </AnimatePresence>
              {rowVirtualizer.getVirtualItems().length > 0 && (
                <TableRow className="border-0 hover:bg-transparent h-0">
                  <TableCell colSpan={5} className="p-0 border-0" style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} />
                </TableRow>
              )}
              {filteredQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-40 text-muted-foreground font-medium border-0">
                    No questions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-black/5 dark:bg-black/20 text-sm text-muted-foreground">
            <div className="font-medium">
              Showing <span className="text-foreground">{filteredQuestions.length}</span> questions (Virtualized)
            </div>
          </div>
        </motion.div>
      </Tabs>

      {/* Assign Reviewer Modal */}
      <Dialog open={assignData.question !== null} onOpenChange={(open) => !open && setAssignData({ question: null, selectedReviewer: "" })}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border border-border/50 shadow-2xl rounded-3xl p-8">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">Assign Reviewer</DialogTitle>
          </DialogHeader>
          
          {assignData.question && (
            <div className="space-y-6">
              <div className="text-sm font-medium space-y-1 text-center bg-black/5 dark:bg-white/[0.02] p-4 rounded-xl border border-border/50">
                <p><span className="text-muted-foreground">Technology Stack:</span> {assignData.question.stack}</p>
                <p><span className="text-muted-foreground">Topic:</span> {assignData.question.topic}</p>
                <p><span className="text-muted-foreground">Creator Enterprise ID:</span> {assignData.question.creatorId}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">SELECT REVIEWER ENTERPRISE ID</label>
                <select 
                  value={assignData.selectedReviewer}
                  onChange={(e) => setAssignData({ ...assignData, selectedReviewer: e.target.value })}
                  className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-background text-muted-foreground">Choose reviewer mapped for {assignData.question.stack}</option>
                  {MOCK_SMES.filter(sme => sme !== assignData.question?.creatorId).map(sme => (
                    <option key={sme} value={sme} className="bg-background text-foreground">{sme}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-2 pl-1">Reviewer list is populated from reviewer enterprise IDs mapped to the selected technology stack.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setAssignData({ question: null, selectedReviewer: "" })} className="rounded-xl font-bold px-6">Cancel</Button>
                <Button 
                  onClick={handleAssignReviewer} 
                  disabled={!assignData.selectedReviewer}
                  className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 px-8 shadow-md"
                >
                  Assign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form Modal (simplified version just allowing status edit for admin) */}
      <Dialog open={editFormData !== null} onOpenChange={(open) => !open && setEditFormData(null)}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-3xl border border-border/50 shadow-2xl rounded-3xl p-8">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">Admin Edit</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Status</label>
                <select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none"
                >
                  <option value="Draft" className="bg-background text-foreground">Draft</option>
                  <option value="Ready for Review" className="bg-background text-foreground">Ready for Review</option>
                  <option value="Under Review" className="bg-background text-foreground">Under Review</option>
                  <option value="Approved" className="bg-background text-foreground">Approved</option>
                  <option value="Rejected" className="bg-background text-foreground">Rejected</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setEditFormData(null)} className="rounded-xl font-bold px-6">Cancel</Button>
                <Button onClick={() => handleSaveChanges(editFormData.status)} className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 px-8 shadow-md">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
