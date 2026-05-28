import { useState } from "react"
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
import { Plus, UploadCloud, Edit3, ChevronLeft, ChevronRight } from "lucide-react"

const mockQuestions = [
  { id: "1001", stem: "Alex is building a microservices-based system using Spring Boot...", stack: "Spring Boot", topic: "Spring Boot Introduction", difficulty: "Medium", status: "Ready for Review" },
  { id: "1002", stem: "John has multiple instances of a service running dynamically...", stack: "Spring Cloud", topic: "Spring Cloud OpenFeign", difficulty: "Medium", status: "Approved" },
  { id: "1003", stem: "What is the purpose of Spring Boot Starters?", stack: "Spring Boot", topic: "Spring Boot Starters", difficulty: "Easy", status: "Under Review" },
  { id: "1004", stem: "Does the @SpringBootApplication annotation combine internally?", stack: "Spring Boot", topic: "SpringBootApplication annotation", difficulty: "Medium", status: "Rejected" },
  { id: "1005", stem: "Which component is used for client-side load balancing in Spring Cloud?", stack: "Spring Cloud", topic: "Spring Cloud LoadBalancer", difficulty: "Medium", status: "Draft" }
]

export default function MyQuestions() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("All")

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
    ? mockQuestions 
    : mockQuestions.filter(q => q.status === activeTab)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm dark:drop-shadow-md">My Questions</h2>
          <p className="text-muted-foreground mt-2 font-medium">Manage and track the questions you've created.</p>
        </motion.div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-300 rounded-xl px-6 py-6 font-bold tracking-wide" />
          }>
            <Plus className="mr-2 h-5 w-5" /> Add Question
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Create New MCQ</DialogTitle>
              <p className="text-sm text-muted-foreground">Choose your preferred method of question entry.</p>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-6">
              <Button variant="outline" className="h-32 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-primary/10 hover:border-primary/50 transition-all rounded-xl group" onClick={() => console.log("Open UI Form")}>
                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-center">
                  <span className="block font-bold text-foreground">Add from UI</span>
                  <span className="text-xs text-muted-foreground font-normal mt-1 block">Create a single MCQ</span>
                </div>
              </Button>
              <Button variant="outline" className="h-32 flex flex-col items-center justify-center gap-3 bg-card border-border hover:bg-primary/10 hover:border-primary/50 transition-all rounded-xl group" onClick={() => console.log("Open Bulk Upload")}>
                <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-center">
                  <span className="block font-bold text-foreground">Bulk Upload</span>
                  <span className="text-xs text-muted-foreground font-normal mt-1 block">Upload CSV or XLSX</span>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="All" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-transparent p-0 flex flex-wrap gap-2 h-auto">
          {["All", "Draft", "Ready for Review", "Under Review", "Approved", "Rejected"].map(tab => {
            const count = tab === "All" ? mockQuestions.length : mockQuestions.filter(q => q.status === tab).length;
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
          
          <Table>
            <TableHeader className="bg-black/5 dark:bg-black/40">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[350px] text-muted-foreground font-bold uppercase tracking-wider text-xs">Question Stem</TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Tech Stack</TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Topic</TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Difficulty</TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold uppercase tracking-wider text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredQuestions.map((q, i) => (
                  <motion.tr 
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="border-border/50 hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <TableCell className="font-medium truncate max-w-[350px] block py-5 text-foreground" title={q.stem}>{q.stem}</TableCell>
                    <TableCell className="py-5 text-foreground/80">{q.stack}</TableCell>
                    <TableCell className="py-5 text-foreground/80">{q.topic}</TableCell>
                    <TableCell className="py-5 font-medium">{q.difficulty}</TableCell>
                    <TableCell className="py-5">{getStatusBadge(q.status)}</TableCell>
                    <TableCell className="text-right py-5">
                      {(q.status === "Draft" || q.status === "Rejected") && (
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                          <Edit3 className="w-4 h-4 mr-2" /> Edit
                        </Button>
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
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-black/5 dark:bg-black/20 text-sm text-muted-foreground">
            <div className="font-medium">
              Showing <span className="text-foreground">1</span> to <span className="text-foreground">{filteredQuestions.length}</span> of <span className="text-foreground">{filteredQuestions.length}</span> questions
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="border-border/50 bg-transparent text-muted-foreground rounded-lg">
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 rounded-lg font-bold">1</Button>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">2</Button>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-transparent border-border/50 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">3</Button>
              </div>
              <Button variant="outline" size="sm" className="border-border/50 bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </Tabs>
    </div>
  )
}
