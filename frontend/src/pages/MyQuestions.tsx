import { useState, useRef } from "react"
import ExcelWorker from "@/workers/excelWorker?worker"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { addQuestion, addQuestionsBulk, updateQuestion, deleteQuestion } from "@/store/questionsSlice"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, UploadCloud, Edit3, ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react"

export default function MyQuestions() {
  const dispatch = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const questions = useSelector((state: RootState) => state.questions.list)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [editFormData, setEditFormData] = useState<any>(null)
  
  // Add Question States
  const [addMode, setAddMode] = useState<"select" | "single" | "bulk">("select")
  const [newQuestionData, setNewQuestionData] = useState({ stem: "", stack: "", topic: "", difficulty: "Medium", options: ["", "", "", ""], correctOption: 0 })
  const [isUploading, setIsUploading] = useState(false)

  const handleCreateSingle = (status: "Draft" | "Under Review") => {
    const newQ = {
      id: String(Date.now()),
      ...newQuestionData,
      status
    };
    dispatch(addQuestion(newQ));
    setIsAddModalOpen(false);
    setTimeout(() => {
      setAddMode("select");
      setNewQuestionData({ stem: "", stack: "", topic: "", difficulty: "Medium", options: ["", "", "", ""], correctOption: 0 });
    }, 300);
  }

  const handleBulkUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const worker = new ExcelWorker();
      
      worker.onmessage = (e) => {
        const { success, parsedQuestions, error } = e.data;
        if (success && parsedQuestions.length > 0) {
          dispatch(addQuestionsBulk(parsedQuestions));
        } else if (!success) {
          console.error("Error parsing file:", error);
        }
        
        worker.terminate();
        setIsUploading(false);
        setIsAddModalOpen(false);
        setTimeout(() => setAddMode("select"), 300);
      };

      worker.onerror = (err) => {
        console.error("Worker error:", err);
        worker.terminate();
        setIsUploading(false);
      };

      worker.postMessage({ data });
    } catch (error) {
      console.error("Failed to parse file:", error);
      setIsUploading(false);
    }
  }

  const handleSaveChanges = (status: "Draft" | "Under Review") => {
    if (!editFormData) return;
    dispatch(updateQuestion({ ...editFormData, status }));
    setEditFormData(null);
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Draft": return <Badge className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 backdrop-blur-md">Draft</Badge>
      case "Ready for Review": return <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.1)] dark:shadow-[0_0_10px_rgba(59,130,246,0.2)]">Ready for Review</Badge>
      case "Under Review": return <Badge className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(234,179,8,0.1)] dark:shadow-[0_0_10px_rgba(234,179,8,0.2)]">Under Review</Badge>
      case "Approved": return <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/30 hover:bg-green-200 dark:hover:bg-green-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(34,197,94,0.1)] dark:shadow-[0_0_10px_rgba(34,197,94,0.2)]">Approved</Badge>
      case "Rejected": return <Badge className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 hover:bg-red-200 dark:hover:bg-red-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.1)] dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]">Rejected</Badge>
      default: return <Badge>{status}</Badge>
    }
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm dark:drop-shadow-md">My Questions</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">Manage and track the questions you've created.</p>
        </motion.div>
        
        <Dialog open={isAddModalOpen} onOpenChange={(val) => { setIsAddModalOpen(val); if(!val) setTimeout(() => setAddMode("select"), 300); }}>
          <DialogTrigger className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-300 rounded-xl px-6 py-6 font-bold tracking-wide inline-flex items-center justify-center whitespace-nowrap">
            <Plus className="mr-2 h-5 w-5" /> <span className="hidden sm:inline">Add Question</span>
          </DialogTrigger>
          <DialogContent className={`${addMode === 'single' ? 'sm:max-w-2xl' : 'sm:max-w-md'} bg-background/95 backdrop-blur-3xl border border-border/50 shadow-2xl rounded-3xl ${addMode === 'single' ? 'p-8 max-h-[90vh] overflow-y-auto custom-scrollbar' : ''}`}>
            
            {addMode === "select" && (
              <>
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-bold text-foreground">Create New MCQ</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Choose your preferred method of question entry.</p>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button onClick={() => setAddMode("single")} variant="outline" className="h-32 flex flex-col gap-3 rounded-xl border-border/50 bg-black/5 dark:bg-white/[0.02] hover:bg-primary/5 hover:border-primary/50 transition-all group">
                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-center">
                      <div className="font-bold text-foreground">Add from UI</div>
                      <div className="text-xs text-muted-foreground mt-1">Create a single MCQ</div>
                    </div>
                  </Button>
                  <Button onClick={() => setAddMode("bulk")} variant="outline" className="h-32 flex flex-col gap-3 rounded-xl border-border/50 bg-black/5 dark:bg-white/[0.02] hover:bg-primary/5 hover:border-primary/50 transition-all group">
                    <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-center">
                      <div className="font-bold text-foreground">Bulk Upload</div>
                      <div className="text-xs text-muted-foreground mt-1">Upload CSV or XLSX</div>
                    </div>
                  </Button>
                </div>
              </>
            )}

            {addMode === "bulk" && (
              <>
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full" onClick={() => setAddMode("select")}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    Bulk Upload
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Upload a CSV or XLSX file containing multiple questions.</p>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border/50 rounded-2xl bg-black/5 dark:bg-white/[0.02] mt-4">
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  ) : (
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                  )}
                  <p className="text-sm font-medium mb-1">{isUploading ? 'Parsing and importing data...' : 'Drag & drop your file here'}</p>
                  <p className="text-xs text-muted-foreground mb-6">Supported formats: .csv, .xlsx</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBulkUpload(e.target.files[0]);
                      }
                      e.target.value = ''; // Reset input
                    }}
                  />
                  <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 px-8">
                    {isUploading ? 'Uploading...' : 'Browse Files'}
                  </Button>
                </div>
              </>
            )}

            {addMode === "single" && (
              <>
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full -ml-2" onClick={() => setAddMode("select")}>
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    Create Question
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-medium ml-8">Fill out the stem, topics, and options below.</p>
                </DialogHeader>
                
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Question Stem</label>
                    <textarea 
                      value={newQuestionData.stem}
                      onChange={(e) => setNewQuestionData({ ...newQuestionData, stem: e.target.value })}
                      placeholder="E.g., What is the purpose of Spring Boot Starters?"
                      className="w-full min-h-[120px] rounded-2xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-4 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none custom-scrollbar"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Tech Stack</label>
                      <input 
                        value={newQuestionData.stack}
                        onChange={(e) => setNewQuestionData({ ...newQuestionData, stack: e.target.value })}
                        placeholder="E.g., Spring Boot"
                        className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Topic</label>
                      <input 
                        value={newQuestionData.topic}
                        onChange={(e) => setNewQuestionData({ ...newQuestionData, topic: e.target.value })}
                        placeholder="E.g., Spring Boot Introduction"
                        className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Difficulty</label>
                    <select 
                      value={newQuestionData.difficulty}
                      onChange={(e) => setNewQuestionData({ ...newQuestionData, difficulty: e.target.value })}
                      className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none"
                    >
                      <option value="Easy" className="bg-background text-foreground">Easy</option>
                      <option value="Medium" className="bg-background text-foreground">Medium</option>
                      <option value="Hard" className="bg-background text-foreground">Hard</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Answer Options</label>
                    {newQuestionData.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div 
                          onClick={() => setNewQuestionData({ ...newQuestionData, correctOption: i })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${newQuestionData.correctOption === i ? 'border-primary bg-primary/10' : 'border-border group-hover:border-primary/50'}`}
                        >
                          {newQuestionData.correctOption === i && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <input 
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...newQuestionData.options];
                            newOptions[i] = e.target.value;
                            setNewQuestionData({ ...newQuestionData, options: newOptions });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)} text...`}
                          className={`flex-1 rounded-xl border bg-black/5 dark:bg-white/[0.02] px-5 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 ${newQuestionData.correctOption === i ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border/30">
                  <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold py-6 px-6">Cancel</Button>
                  <Button variant="secondary" onClick={() => handleCreateSingle("Draft")} disabled={!newQuestionData.stem} className="rounded-xl font-bold py-6 px-8 transition-all">Save as Draft</Button>
                  <Button onClick={() => handleCreateSingle("Under Review")} disabled={!newQuestionData.stem} className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 py-6 px-8 shadow-md hover:shadow-lg transition-all">Save & Review</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Question Dialog */}
        <Dialog open={editFormData !== null} onOpenChange={(open) => !open && setEditFormData(null)}>
          <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-3xl border border-border/50 shadow-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-extrabold text-foreground tracking-tight">Edit Question</DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">Update the stem, topics, and options below.</p>
            </DialogHeader>
            {editFormData && (
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Question Stem</label>
                  <textarea 
                    value={editFormData.stem}
                    onChange={(e) => setEditFormData({ ...editFormData, stem: e.target.value })}
                    placeholder="E.g., What is the purpose of Spring Boot Starters?"
                    className="w-full min-h-[120px] rounded-2xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-4 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none custom-scrollbar"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Tech Stack</label>
                    <input 
                      value={editFormData.stack}
                      onChange={(e) => setEditFormData({ ...editFormData, stack: e.target.value })}
                      placeholder="E.g., Spring Boot"
                      className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Topic</label>
                    <input 
                      value={editFormData.topic}
                      onChange={(e) => setEditFormData({ ...editFormData, topic: e.target.value })}
                      placeholder="E.g., Spring Boot Introduction"
                      className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Difficulty</label>
                  <select 
                    value={editFormData.difficulty}
                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-foreground shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none"
                  >
                    <option value="Easy" className="bg-background text-foreground">Easy</option>
                    <option value="Medium" className="bg-background text-foreground">Medium</option>
                    <option value="Hard" className="bg-background text-foreground">Hard</option>
                  </select>
                </div>
                
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Answer Options</label>
                  {editFormData.options?.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div 
                        onClick={() => setEditFormData({ ...editFormData, correctOption: i })}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${editFormData.correctOption === i ? 'border-primary bg-primary/10' : 'border-border group-hover:border-primary/50'}`}
                      >
                        {editFormData.correctOption === i && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <input 
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...editFormData.options];
                          newOptions[i] = e.target.value;
                          setEditFormData({ ...editFormData, options: newOptions });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)} text...`}
                        className={`flex-1 rounded-xl border bg-black/5 dark:bg-white/[0.02] px-5 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 ${editFormData.correctOption === i ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-border/30">
              <Button 
                variant="ghost" 
                onClick={() => {
                  dispatch(deleteQuestion(editFormData.id));
                  setEditFormData(null);
                }} 
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl font-bold py-6 px-6"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setEditFormData(null)} className="rounded-xl font-bold py-6 px-6">Cancel</Button>
                <Button variant="secondary" onClick={() => handleSaveChanges("Draft")} className="rounded-xl font-bold py-6 px-8 transition-all">Save as Draft</Button>
                <Button onClick={() => handleSaveChanges("Under Review")} className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 py-6 px-8 shadow-md hover:shadow-lg transition-all">Save & Review</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          
          <div ref={parentRef} className="overflow-y-auto max-h-[55vh] w-full custom-scrollbar relative">
            <Table>
              <TableHeader className="bg-card/95 dark:bg-black/90 sticky top-0 z-20 backdrop-blur-xl shadow-sm border-b border-border/50">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="w-[35%] min-w-[250px] text-muted-foreground font-bold uppercase tracking-wider text-xs pl-6">Question Stem</TableHead>
                  <TableHead className="hidden lg:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">Tech Stack</TableHead>
                  <TableHead className="hidden xl:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">Topic</TableHead>
                  <TableHead className="hidden md:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">Difficulty</TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground font-bold uppercase tracking-wider text-xs pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {rowVirtualizer.getVirtualItems().length > 0 && (
                <TableRow className="border-0 hover:bg-transparent h-0">
                  <TableCell colSpan={6} className="p-0 border-0" style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} />
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
                    <TableCell className="hidden lg:table-cell py-5 text-foreground/80">{q.stack}</TableCell>
                    <TableCell className="hidden xl:table-cell py-5 text-foreground/80">{q.topic}</TableCell>
                    <TableCell className="hidden md:table-cell py-5 font-medium">{q.difficulty}</TableCell>
                    <TableCell className="py-5">{getStatusBadge(q.status)}</TableCell>
                    <TableCell className="text-right py-5 pr-6">
                      {(q.status === "Draft" || q.status === "Rejected") ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditFormData({ 
                            ...q, 
                            options: q.options || ["", "", "", ""], 
                            correctOption: q.correctOption ?? 0 
                          })}
                          className="text-primary hover:text-primary hover:bg-primary/10 transition-all rounded-lg inline-flex items-center"
                        >
                          <Edit3 className="w-4 h-4 mr-2" /> <span>Edit</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm font-semibold tracking-wide flex items-center justify-end pr-2">
                          Locked
                        </span>
                      )}
                    </TableCell>
                  </motion.tr>
                )})}
              </AnimatePresence>
              {rowVirtualizer.getVirtualItems().length > 0 && (
                <TableRow className="border-0 hover:bg-transparent h-0">
                  <TableCell colSpan={6} className="p-0 border-0" style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} />
                </TableRow>
              )}
              {filteredQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-muted-foreground font-medium border-0">
                    No questions match this filter.
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
    </div>
  )
}
