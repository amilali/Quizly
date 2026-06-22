import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Circle } from "lucide-react"

export interface EventQuestion {
  id?: number
  stem: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  timeLimitSeconds: number
}

interface Props {
  question?: EventQuestion
  defaultTimeLimit: number
  onSave: (q: EventQuestion) => void
  onCancel: () => void
}

export default function EventQuestionEditor({ question, defaultTimeLimit, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<EventQuestion>({
    stem: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    timeLimitSeconds: defaultTimeLimit
  })

  useEffect(() => {
    if (question) {
      setFormData(question)
    }
  }, [question])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleOptionChange = (field: keyof EventQuestion, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-background w-full max-w-6xl rounded-2xl shadow-2xl border border-border/50 relative max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-8 py-6 border-b border-border/50 shrink-0 bg-background rounded-t-2xl z-10">
          <div>
            <h1 className="text-3xl font-bold">{question ? "Edit Question" : "Add Question"}</h1>
            <p className="text-muted-foreground mt-1">Configure the question and write the prompt and answers.</p>
          </div>
          <button onClick={onCancel} className="mt-4 md:mt-0 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors">
            Close
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar p-6 md:p-8 flex-1">
          <form id="question-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Settings */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0 h-fit">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">⏱️</span> Time Limit
              </h3>
              <p className="text-sm text-muted-foreground mb-4">How long participants have to answer, in seconds.</p>
              <label className="block text-sm font-medium mb-2">Seconds (5-120)</label>
              <input
                type="number"
                min="5"
                max="120"
                required
                value={formData.timeLimitSeconds}
                onChange={(e) => setFormData({ ...formData, timeLimitSeconds: Number(e.target.value) })}
                className="w-full bg-background/50 border border-border/50 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold mb-2">Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                <li>Keep the question short — under 120 characters works best.</li>
                <li>Every question has exactly four answer options.</li>
                <li>Pick one correct answer.</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Editor */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-lg">Question</h3>
              <textarea
                required
                value={formData.stem}
                onChange={(e) => setFormData({ ...formData, stem: e.target.value })}
                placeholder="Enter your question..."
                className="w-full h-32 bg-background/50 border border-border/50 rounded-xl p-4 focus:ring-2 focus:ring-primary/50 outline-none resize-none text-lg"
              />
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-lg">Answers</h3>
              <p className="text-sm text-muted-foreground mb-6">Pick exactly one correct answer.</p>
              
              <div className="space-y-4">
                {[
                  { id: 'A', bg: 'bg-[#E21B3C]', field: 'optionA' },
                  { id: 'B', bg: 'bg-[#1368CE]', field: 'optionB' },
                  { id: 'C', bg: 'bg-[#26890C]', field: 'optionC' },
                  { id: 'D', bg: 'bg-[#FFA602]', field: 'optionD' },
                ].map((opt) => (
                  <div key={opt.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all ${formData.correctAnswer === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-border'}`}>
                    <div className="flex flex-1 items-center gap-3">
                      <div className={`${opt.bg} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}>
                        {opt.id}
                      </div>
                      <input
                        type="text"
                        required
                        value={formData[opt.field as keyof EventQuestion] as string}
                        onChange={(e) => handleOptionChange(opt.field as keyof EventQuestion, e.target.value)}
                        placeholder={`Answer ${opt.id}`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm sm:text-base outline-none min-w-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correctAnswer: opt.id })}
                      className={`flex items-center justify-center sm:justify-start gap-2 shrink-0 px-3 py-1.5 sm:py-0 rounded-lg sm:rounded-none border-t sm:border-t-0 border-border/50 transition-colors ${formData.correctAnswer === opt.id ? "bg-primary/10 sm:bg-transparent" : "hover:bg-black/5 dark:hover:bg-white/5 sm:hover:bg-transparent"}`}
                    >
                      {formData.correctAnswer === opt.id ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${formData.correctAnswer === opt.id ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>
                        Mark as correct
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="flex justify-end gap-4 px-6 md:px-8 py-4 border-t border-border/50 bg-background shrink-0 rounded-b-2xl z-10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="question-form"
            className="px-8 py-2.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", boxShadow: "0 8px 24px rgba(124,58,237,0.25)" }}
          >
            {question ? "Save Changes" : "Save Question"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
