import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Brain, Paperclip, Mic, ArrowUp, Sparkles, User, Lightbulb, X, Image as ImageIcon, FileText, Plug, GitBranch, Database, FolderTree, Check, FileSpreadsheet, Plus, Store, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  isNew?: boolean;
}

// Typing effect component that reveals markdown content character by character
function TypingMarkdown({ content, onComplete }: { content: string; onComplete?: () => void }) {
  const [displayedLength, setDisplayedLength] = useState(0)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (displayedLength >= content.length) {
      setIsDone(true)
      onComplete?.()
      return
    }

    const char = content[displayedLength]
    // Speed: fast for spaces/punctuation, slightly slower for regular chars
    const delay = char === ' ' ? 2 : char === '\n' ? 10 : 18

    const timer = setTimeout(() => {
      setDisplayedLength(prev => prev + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [displayedLength, content, onComplete])

  const visibleText = content.slice(0, displayedLength)

  return (
    <div className="ai-markdown-content">
      <ReactMarkdown>{visibleText}</ReactMarkdown>
      {!isDone && <span className="inline-block w-[2px] h-[1.1em] bg-primary/70 animate-pulse ml-0.5 align-middle" />}
    </div>
  )
}

export default function AiSensei() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"search" | "think">("search")
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("aiSenseiMessages")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((m: ChatMessage) => ({ ...m, isNew: false }))
      } catch (e) {
        return []
      }
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const token = localStorage.getItem("token")
  const userName = localStorage.getItem("userName") || ""

  const quickPrompts = [
    "What is the latest news in tech?",
    "Explain quantum computing simply",
    "How to prepare for a system design interview"
  ]

  const placeholderPhrases = [
    "Generate a quiz for Quizly...",
    "Search the Web...",
    "Ask a coding question...",
    "Summarize this document...",
    "Create an exam paper..."
  ]

  const [placeholder, setPlaceholder] = useState("")
  const [phIndex, setPhIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentPhrase = placeholderPhrases[phIndex]
    let timer: ReturnType<typeof setTimeout>

    if (!isDeleting && charIndex === currentPhrase.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000)
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false)
      setPhIndex((prev) => (prev + 1) % placeholderPhrases.length)
      // Small pause before typing next word
      timer = setTimeout(() => {}, 500)
    } else {
      timer = setTimeout(() => {
        setCharIndex((prev) => prev + (isDeleting ? -1 : 1))
      }, isDeleting ? 30 : 60)
    }

    setPlaceholder(currentPhrase.substring(0, charIndex) + (charIndex === currentPhrase.length ? "" : "|"))

    return () => clearTimeout(timer)
  }, [charIndex, isDeleting, phIndex])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    localStorage.setItem("aiSenseiMessages", JSON.stringify(messages))
  }, [messages])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (attachedFile && attachedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(attachedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [attachedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAttachedFile(file)
    }
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFile(e.dataTransfer.files[0])
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files[0]) {
      setAttachedFile(e.clipboardData.files[0])
    }
  }

  const renderAttachmentHUD = () => {
    if (!attachedFile) return null
    return (
      <div className="absolute bottom-full mb-3 left-0 bg-card border border-border/50 rounded-xl p-2 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 z-50">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-secondary shrink-0 relative">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex flex-col max-w-[200px]">
          <span className="text-sm font-medium text-foreground truncate">{attachedFile.name}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {attachedFile.type.split('/')[1] || 'File'} • {(attachedFile.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <button 
          type="button" 
          onClick={removeAttachment}
          className="ml-2 p-1.5 hover:bg-secondary/80 rounded-full text-muted-foreground hover:text-foreground transition-colors absolute -top-2 -right-2 bg-card border border-border/50 shadow-sm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  const availableMcpServers = [
    { id: "local-fs", name: "Local File System", icon: FolderTree },
    { id: "github", name: "GitHub Repository", icon: GitBranch },
    { id: "postgres", name: "PostgreSQL Database", icon: Database },
    { id: "excel", name: "Microsoft Excel", icon: FileSpreadsheet }
  ]
  
  const [activeMcpServers, setActiveMcpServers] = useState<string[]>([])
  const [showMcpMenu, setShowMcpMenu] = useState(false)

  const toggleMcpServer = (id: string) => {
    setActiveMcpServers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const clearChat = () => {
    setMessages([])
    setAttachedFile(null)
    setPreviewUrl(null)
    localStorage.removeItem("aiSenseiMessages")
  }

  const renderMcpMenu = () => {
    return (
      <AnimatePresence>
        {showMcpMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-3 left-0 bg-card border border-border/50 rounded-xl p-2 shadow-xl flex flex-col gap-1 z-50 min-w-[220px]"
          >
            <div className="px-2 py-1.5 border-b border-border/40 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">MCP Connections</span>
            </div>
            {availableMcpServers.map(server => {
              const isActive = activeMcpServers.includes(server.id)
              return (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => toggleMcpServer(server.id)}
                  className="flex items-center justify-between px-2 py-2 hover:bg-secondary rounded-lg transition-colors group text-left"
                >
                  <div className="flex items-center gap-2">
                    <server.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className={cn("text-sm", isActive ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground")}>
                      {server.name}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary" />}
                </button>
              )
            })}
            
            <div className="border-t border-border/40 mt-1 pt-1 space-y-0.5">
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-secondary rounded-lg transition-colors text-left text-muted-foreground hover:text-foreground"
              >
                <Store className="w-4 h-4" />
                <span className="text-sm font-medium">Browse Marketplace</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 w-full hover:bg-secondary rounded-lg transition-colors text-left text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Custom Server</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault()
    
    const textToSend = customQuery || query
    if (!textToSend.trim() || isLoading) return

    const displayContent = attachedFile 
      ? `${textToSend}\n📎 ${attachedFile.name}`
      : textToSend

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent
    }

    setMessages(prev => [...prev, userMessage])
    setQuery("")
    setIsLoading(true)

    try {
      let res: Response

      if (attachedFile) {
        // Send as multipart/form-data with file
        const formData = new FormData()
        formData.append("message", textToSend)
        formData.append("mode", mode)
        activeMcpServers.forEach(server => formData.append("mcpServers", server))
        formData.append("file", attachedFile)

        res = await fetch("/api/sensei/chat-with-file", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        })
        removeAttachment()
      } else {
        // Send as JSON
        res = await fetch("/api/sensei/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ message: textToSend, mode, mcpServers: activeMcpServers })
        })
      }

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.response || "No response received.",
          isNew: true
        }])
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Sorry, I encountered an error connecting to my servers."
        }])
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Sorry, a network error occurred."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="flex flex-col max-w-4xl mx-auto w-full relative" 
      style={{ height: 'calc(100dvh - 4rem)' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPaste={handlePaste}
    >
      
      {messages.length === 0 ? (
        <div className="flex flex-col flex-1 items-center justify-center w-full max-w-3xl mx-auto overflow-hidden">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: "spring" }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 text-center mb-4 leading-tight">
            Good afternoon{userName ? `, ${userName}` : ""}! What can I help you with?
          </h1>
          {/* <p className="text-muted-foreground max-w-xl text-center mb-10 text-lg">
            I am AI Sensei, your intelligent assistant. I can search the web, write code, or just chat.
          </p> */}
          
          <div className="w-full relative z-10">
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap justify-center gap-3 mb-6"
              >
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(undefined, prompt)}
                    className="bg-card hover:bg-secondary border border-border/50 text-foreground text-sm px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Lightbulb className="w-4 h-4 text-primary/70" />
                    {prompt}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="liquid-glow-wrapper rounded-3xl relative">
              {renderAttachmentHUD()}
              <form 
                onSubmit={handleSubmit}
                className="w-full bg-card backdrop-blur-xl p-3 transition-all flex flex-col gap-3 relative"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-none outline-none px-3 py-2 text-lg text-foreground placeholder:text-muted-foreground/60"
                />
                
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "p-2 hover:bg-secondary rounded-full transition-colors",
                        attachedFile ? "text-primary bg-primary/10" : "text-muted-foreground"
                      )}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setShowMcpMenu(!showMcpMenu)}
                        className={cn(
                          "p-2 hover:bg-secondary rounded-full transition-colors",
                          activeMcpServers.length > 0 || showMcpMenu ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                      >
                        <Plug className="w-5 h-5" />
                      </button>
                      {renderMcpMenu()}
                    </div>
                    
                    <div className="flex items-center bg-secondary/50 rounded-full p-1 border border-border/50">
                      <button 
                        type="button"
                        onClick={() => setMode("search")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                          mode === "search" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Globe className="w-4 h-4" /> Search
                      </button>
                      <button 
                        type="button"
                        onClick={() => setMode("think")}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                          mode === "think" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Brain className="w-4 h-4" /> Think
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      type="submit" 
                      disabled={!query.trim() || isLoading}
                      className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 w-full max-w-4xl mx-auto min-h-0">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto w-full scrollbar-none pb-4 pt-4 min-h-0">
            <div className="space-y-6">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "px-5 py-3.5 rounded-[20px] max-w-[85%] leading-relaxed text-[15px]",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border border-border/50 shadow-sm rounded-tl-sm text-foreground"
                  )}>
                    {msg.role === "ai" ? (
                      msg.isNew ? (
                        <TypingMarkdown 
                          content={msg.content} 
                          onComplete={() => {
                            setMessages(prev => prev.map(m => 
                              m.id === msg.id ? { ...m, isNew: false } : m
                            ))
                          }}
                        />
                      ) : (
                        <div className="ai-markdown-content">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1 text-muted-foreground">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="px-5 py-4 rounded-[20px] bg-card border border-border/50 shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75" />
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
                    </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="shrink-0 w-full pb-2 transition-all duration-500 z-10">
            <div className="w-full flex flex-col items-center">
              <div className="liquid-glow-wrapper rounded-3xl w-full relative">
                {renderAttachmentHUD()}
                <form 
                  onSubmit={handleSubmit}
                  className="w-full bg-card backdrop-blur-xl p-3 transition-all flex flex-col gap-3 relative"
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the web..."
                    className="w-full bg-transparent border-none outline-none px-3 py-2 text-lg text-foreground placeholder:text-muted-foreground/60"
                  />
                  
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "p-2 hover:bg-secondary rounded-full transition-colors",
                          attachedFile ? "text-primary bg-primary/10" : "text-muted-foreground"
                        )}
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      
                      <div className="relative">
                        <button 
                          type="button" 
                          onClick={() => setShowMcpMenu(!showMcpMenu)}
                          className={cn(
                            "p-2 hover:bg-secondary rounded-full transition-colors",
                            activeMcpServers.length > 0 || showMcpMenu ? "text-primary bg-primary/10" : "text-muted-foreground"
                          )}
                        >
                          <Plug className="w-5 h-5" />
                        </button>
                        {renderMcpMenu()}
                      </div>
                      
                      <div className="flex items-center bg-secondary/50 rounded-full p-1 border border-border/50">
                        <button 
                          type="button"
                          onClick={() => setMode("search")}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                            mode === "search" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Globe className="w-4 h-4" /> Search
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMode("think")}
                          className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                            mode === "think" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Brain className="w-4 h-4" /> Think
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={clearChat}
                        title="Clear Chat"
                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors hidden sm:flex"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button type="button" className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors">
                        <Mic className="w-5 h-5" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={!query.trim() || isLoading}
                        className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for attachments */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
