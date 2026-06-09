import { useState, useRef, useEffect } from "react"
import ExcelWorker from "@/workers/excelWorker?worker"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/store"
import { createQuestion, createQuestionsBulk, editQuestion, deleteQuestion, fetchQuestions } from "@/store/questionsSlice"
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, UploadCloud, Edit3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, Loader2, Filter } from "lucide-react"

export default function MyQuestions() {
  const dispatch = useDispatch<AppDispatch>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questions = useSelector((state: RootState) => state.questions.list)
  const isLoading = useSelector((state: RootState) => state.questions.isLoading)
  const { userName } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(fetchQuestions())
  }, [dispatch])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [techStackFilter, setTechStackFilter] = useState("All")
  const [topicFilter, setTopicFilter] = useState("All")
  const [difficultyFilter, setDifficultyFilter] = useState("All")

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, techStackFilter, topicFilter, difficultyFilter])

  const uniqueTechStacks = Array.from(new Set(questions.map(q => q.stack).filter(Boolean)));
  const uniqueTopics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));
  const uniqueDifficulties = ["Easy", "Medium", "Hard"];
  const [editFormData, setEditFormData] = useState<any>(null)
  
  // Add Question States
  const [addMode, setAddMode] = useState<"select" | "single" | "bulk">("select")
  const [newQuestionData, setNewQuestionData] = useState({ stem: "", stack: "", topic: "", difficulty: "Medium", options: ["", "", "", ""], correctOption: 0 })
  const [isUploading, setIsUploading] = useState(false)

  const handleCreateSingle = (status: "Draft" | "Under Review") => {
    const newQ = {
      ...newQuestionData,
      status,
      creatorId: userName || ""
    };
    dispatch(createQuestion(newQ));
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
          const questionsWithCreator = parsedQuestions.map((q: any) => ({
            ...q,
            creatorId: userName || ""
          }));
          dispatch(createQuestionsBulk(questionsWithCreator));
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
    dispatch(editQuestion({ ...editFormData, status }) as any);
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

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/30 rounded-full px-3 shadow-sm hover:bg-green-200 dark:hover:bg-green-500/30 transition-all">Easy</Badge>;
      case "Medium": return <Badge className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30 rounded-full px-3 shadow-sm hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-all">Medium</Badge>;
      case "Hard": return <Badge className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-full px-3 shadow-sm hover:bg-red-200 dark:hover:bg-red-500/30 transition-all">Hard</Badge>;
      default: return <Badge className="rounded-full px-3 transition-all">{difficulty}</Badge>;
    }
  }

  let filteredQuestions = questions;
  if (activeTab !== "All") filteredQuestions = filteredQuestions.filter(q => q.status === activeTab);
  if (techStackFilter !== "All") filteredQuestions = filteredQuestions.filter(q => q.stack === techStackFilter);
  if (topicFilter !== "All") filteredQuestions = filteredQuestions.filter(q => q.topic === topicFilter);
  if (difficultyFilter !== "All") filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficultyFilter);

  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

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
        <div className="flex flex-col gap-4 mb-6">
          <TabsList className="bg-transparent p-0 flex flex-wrap gap-2 h-auto justify-start">
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
        </div>
        
        <motion.div 
          layout
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative"
        >
          
          <div className="overflow-auto max-h-[55vh] w-full custom-scrollbar relative">
            <Table wrapperClassName="overflow-visible">
              <TableHeader className="bg-card/95 dark:bg-black/90 sticky top-0 z-20 backdrop-blur-xl shadow-sm border-b border-border/50">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="w-[35%] min-w-[250px] text-muted-foreground font-bold uppercase tracking-wider text-xs pl-6">Question Stem</TableHead>
                  <TableHead className="hidden lg:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-1">
                      Tech Stack
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-4 w-4 hover:bg-black/5 dark:hover:bg-white/10 rounded-full inline-flex items-center justify-center">
                          <Filter className={`h-2.5 w-2.5 ${techStackFilter !== "All" ? "text-primary" : ""}`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl border-border/50">
                          <DropdownMenuRadioGroup value={techStackFilter} onValueChange={setTechStackFilter}>
                            <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                            {uniqueTechStacks.map(stack => (
                              <DropdownMenuRadioItem key={stack} value={stack}>{stack}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-1">
                      Topic
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-4 w-4 hover:bg-black/5 dark:hover:bg-white/10 rounded-full inline-flex items-center justify-center">
                          <Filter className={`h-2.5 w-2.5 ${topicFilter !== "All" ? "text-primary" : ""}`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl border-border/50">
                          <DropdownMenuRadioGroup value={topicFilter} onValueChange={setTopicFilter}>
                            <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                            {uniqueTopics.map(topic => (
                              <DropdownMenuRadioItem key={topic} value={topic}>{topic}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-1">
                      Difficulty
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-4 w-4 hover:bg-black/5 dark:hover:bg-white/10 rounded-full inline-flex items-center justify-center">
                          <Filter className={`h-2.5 w-2.5 ${difficultyFilter !== "All" ? "text-primary" : ""}`} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 rounded-xl border-border/50">
                          <DropdownMenuRadioGroup value={difficultyFilter} onValueChange={setDifficultyFilter}>
                            <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                            {uniqueDifficulties.map(diff => (
                              <DropdownMenuRadioItem key={diff} value={diff}>{diff}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground font-bold uppercase tracking-wider text-xs pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={`shimmer-${idx}`} className="border-border/50 animate-pulse">
                      <TableCell className="py-5 pl-6">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2"></div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-5">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-24"></div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell py-5">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-32"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-5">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-16"></div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="h-6 bg-black/10 dark:bg-white/10 rounded-full w-24"></div>
                      </TableCell>
                      <TableCell className="text-right py-5 pr-6">
                        <div className="h-8 bg-black/10 dark:bg-white/10 rounded-lg w-16 ml-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    <AnimatePresence mode="popLayout">
                      {paginatedQuestions.map((q) => (
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
                          <TableCell className="hidden md:table-cell py-5 font-medium">{getDifficultyBadge(q.difficulty)}</TableCell>
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
                      ))}
                    </AnimatePresence>
                    {filteredQuestions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-40 text-muted-foreground font-medium border-0">
                          No questions match this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-black/5 dark:bg-black/20 text-sm text-muted-foreground">
            <div className="font-medium">
              Showing <span className="text-foreground">{totalQuestions > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalQuestions)}</span> of <span className="text-foreground">{totalQuestions}</span> questions
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-transparent border border-border/50 rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size} className="bg-background text-foreground">
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-xs font-semibold px-2">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </Tabs>
    </div>
  )
}
