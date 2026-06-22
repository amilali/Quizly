import re

with open("src/pages/MyQuestions.tsx", "r") as f:
    content = f.read()

# 1. Update questionsSlice thunks API payload formats in the file
content = content.replace("dispatch(createQuestion(newQ))", "dispatch(createQuestion({ question: newQ }))")
content = content.replace("dispatch(createQuestionsBulk(questionsWithCreator))", "dispatch(createQuestionsBulk({ questions: questionsWithCreator }))")
content = content.replace("dispatch(createQuestion(questionToSave))", "dispatch(createQuestion({ question: questionToSave }))")

# 2. Add handleOverride functions
overrides = """
  const handleOverrideSingle = async () => {
    const newQ = {
      ...newQuestionData,
      status: "Draft",
      creatorId: userName || ""
    };
    try {
      await dispatch(createQuestion({ question: newQ, override: true })).unwrap();
      setIsAddModalOpen(false);
      setConflictError(null);
      setTimeout(() => {
        setAddMode("select");
        setNewQuestionData({ stem: "", stack: "", topic: "", difficulty: "Medium", options: ["", "", "", ""], correctOption: 0 });
      }, 300);
    } catch (err) {
      console.error("Failed to override single question", err);
    }
  }

  const handleOverrideBulk = async () => {
    if (!conflictError?.details?.duplicates) return;
    const questionsToOverride = conflictError.details.duplicates.map((dup: any) => dup.originalQuestion);
    try {
      await dispatch(createQuestionsBulk({ questions: questionsToOverride, override: true })).unwrap();
      setIsAddModalOpen(false);
      setConflictError(null);
      setTimeout(() => setAddMode("select"), 300);
    } catch (err) {
      console.error("Failed to override bulk duplicates", err);
    }
  }

  const handleOverrideAi = async () => {
    if (!conflictError?.details?.discardedDuplicates) return;
    const questionsToOverride = conflictError.details.discardedDuplicates.map((dup: any) => dup.originalQuestion);
    try {
      await dispatch(createQuestionsBulk({ questions: questionsToOverride, override: true })).unwrap();
      setIsAddModalOpen(false);
      setConflictError(null);
      setTimeout(() => setAddMode("select"), 300);
    } catch (err) {
      console.error("Failed to override AI duplicates", err);
    }
  }
"""
content = content.replace("const handleManualDuplicateCheck = async () => {", overrides + "\n  const handleManualDuplicateCheck = async () => {")

# 3. Add conflictError state
state_vars = """
  const [conflictError, setConflictError] = useState<any>(null)
"""
content = content.replace("const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null)", "const [duplicateCheckResult, setDuplicateCheckResult] = useState<any>(null)\n" + state_vars)

# 4. Update catch blocks to set conflictError
single_catch = """    } catch (err: any) {
      if (err?.duplicate) {
        setConflictError({ type: 'single', details: err });
      } else {
        console.error("Failed to create question:", err);
      }
    }"""
content = re.sub(r'\} catch \(err\) \{\s*console\.error\("Failed to create question:", err\);\s*\}', single_catch, content)

bulk_catch = """          } catch (err: any) {
            if (err?.duplicates) {
              setConflictError({ type: 'bulk', details: err });
            } else {
              console.error("Bulk upload failed:", err);
            }
          }"""
content = content.replace("""        if (success && parsedQuestions.length > 0) {
          const questionsWithCreator = parsedQuestions.map((q: any) => ({
            ...q,
            creatorId: userName || ""
          }));
          dispatch(createQuestionsBulk({ questions: questionsWithCreator }));
        }""", """        if (success && parsedQuestions.length > 0) {
          const questionsWithCreator = parsedQuestions.map((q: any) => ({
            ...q,
            creatorId: userName || ""
          }));
          try {
            await dispatch(createQuestionsBulk({ questions: questionsWithCreator })).unwrap();
            setIsAddModalOpen(false);
            setConflictError(null);
            setTimeout(() => setAddMode("select"), 300);
          } catch (err: any) {
            if (err?.duplicates) {
              setConflictError({ type: 'bulk', details: err });
            } else {
              console.error("Bulk upload failed:", err);
            }
          }
        }""")

ai_catch = """    } catch (err: any) {
      if (err?.error && err?.discardedDuplicates) {
        setConflictError({ type: 'ai_error', details: err });
      } else {
        console.error("AI Generation failed", err);
      }
    }"""
content = re.sub(r'\} catch \(err\) \{\s*console\.error\("AI Generation failed", err\);\s*\}', ai_catch, content)

# Also update ai try block to handle 201 with discardedDuplicates
ai_try = """    try {
      const result = await dispatch(generateQuestionsAi(aiFormData)).unwrap();
      if (result.discardedDuplicates) {
        setConflictError({ type: 'ai', details: result });
      } else {
        setIsAddModalOpen(false);
        setTimeout(() => setAddMode("select"), 300);
      }"""
content = re.sub(r'try \{\s*await dispatch\(generateQuestionsAi\(aiFormData\)\)\.unwrap\(\);\s*setIsAddModalOpen\(false\);\s*setTimeout\(\(\) => setAddMode\("select"\), 300\);', ai_try, content)


# 5. Add UI error blocks with the override buttons next to the title
ai_ui = """                {conflictError?.type === 'ai' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 p-5 rounded-2xl text-yellow-700 dark:text-yellow-400 mb-4 shadow-sm max-h-60 overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-bold flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> Partial Generation Completed</h3>
                      <Button onClick={handleOverrideAi} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl shadow-sm h-8 px-4 text-xs shrink-0 whitespace-nowrap">
                        Force Save Discarded
                      </Button>
                    </div>
                    <p className="text-sm mb-4">We saved {conflictError.details.saved?.length} unique questions, but {conflictError.details.discardedDuplicates?.length} questions were discarded because they were too similar to existing ones.</p>
                    <details className="group mt-2">
                      <summary className="text-sm font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center outline-none hover:text-yellow-900 dark:hover:text-yellow-300 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
                        View Discarded Questions ({conflictError.details.discardedDuplicates?.length})
                      </summary>
                      <div className="space-y-3 mt-3">
                        {conflictError.details.discardedDuplicates?.map((dup: any, i: number) => (
                          <div key={i} className="bg-background/80 p-4 rounded-xl text-sm border border-yellow-500/20 shadow-inner">
                            <p className="font-semibold mb-2">Discarded Generated Question:</p>
                            <p className="text-foreground/80 italic mb-2">"{dup.generatedStem}"</p>
                            <p className="font-semibold mb-2 text-yellow-800 dark:text-yellow-300">Conflicts With:</p>
                            <ul className="list-disc pl-5">
                              {dup.conflicts?.map((c: any) => (
                                <li key={c.questionId} className="text-yellow-800/80 dark:text-yellow-300/80">ID {c.questionId} ({c.similarityPercentage}% match): {c.stem}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
                {conflictError?.type === 'ai_error' && (
                  <div className="bg-red-500/10 border border-red-500/50 p-5 rounded-2xl text-red-700 dark:text-red-400 mb-4 shadow-sm max-h-60 overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-bold flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> Generation Failed</h3>
                      <Button onClick={handleOverrideAi} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm h-8 px-4 text-xs shrink-0 whitespace-nowrap">
                        Force Save Discarded
                      </Button>
                    </div>
                    <p className="text-sm mb-4">{conflictError.details.error}</p>
                    <details className="group mt-2">
                      <summary className="text-sm font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center outline-none hover:text-red-900 dark:hover:text-red-300 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
                        View Discarded Questions ({conflictError.details.discardedDuplicates?.length})
                      </summary>
                      <div className="space-y-3 mt-3">
                        {conflictError.details.discardedDuplicates?.map((dup: any, i: number) => (
                          <div key={i} className="bg-background/80 p-4 rounded-xl text-sm border border-red-500/20 shadow-inner">
                            <p className="font-semibold mb-2">Discarded Generated Question:</p>
                            <p className="text-foreground/80 italic mb-2">"{dup.generatedStem}"</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}"""
content = content.replace("                </DialogHeader>\n                <div className=\"grid gap-6 mt-4\">", "                </DialogHeader>\n" + ai_ui + "\n                <div className=\"grid gap-6 mt-4\">")

bulk_ui = """                {conflictError?.type === 'bulk' && (
                  <div className="bg-red-500/10 border border-red-500/50 p-5 rounded-2xl text-red-700 dark:text-red-400 mb-4 shadow-sm max-h-60 overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-bold flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> Upload Rejected (Duplicates Found)</h3>
                      <Button onClick={handleOverrideBulk} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm h-8 px-4 text-xs shrink-0 whitespace-nowrap">
                        Force Save Rejected Duplicates
                      </Button>
                    </div>
                    <p className="text-sm mb-4">We found {conflictError.details.duplicates?.length} questions in your upload that are too similar (&gt;30%) to existing questions. The batch was not saved.</p>
                    <details className="group mt-2">
                      <summary className="text-sm font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center outline-none hover:text-red-900 dark:hover:text-red-300 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
                        View Conflicting Questions ({conflictError.details.duplicates?.length})
                      </summary>
                      <div className="space-y-3 mt-3">
                        {conflictError.details.duplicates?.map((dup: any, i: number) => (
                          <div key={i} className="bg-background/80 p-4 rounded-xl text-sm border border-red-500/20 shadow-inner">
                            <p className="font-semibold mb-2">Your Uploaded Question:</p>
                            <p className="text-foreground/80 italic mb-2">"{dup.question}"</p>
                            <p className="font-semibold mb-2 text-red-800 dark:text-red-300">Conflicts With:</p>
                            <ul className="list-disc pl-5">
                              {dup.conflicts?.map((c: any) => (
                                <li key={c.questionId} className="text-red-800/80 dark:text-red-300/80">ID {c.questionId} ({c.similarityPercentage}% match): {c.stem}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}"""
content = content.replace("                </DialogHeader>\n                <div className=\"flex flex-col items-center", "                </DialogHeader>\n" + bulk_ui + "\n                <div className=\"flex flex-col items-center")

single_ui = """                {conflictError?.type === 'single' && (
                  <div className="bg-red-500/10 border border-red-500/50 p-5 rounded-2xl text-red-700 dark:text-red-400 mb-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-bold flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> Duplicate Detected</h3>
                      <Button onClick={handleOverrideSingle} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm h-8 px-4 text-xs shrink-0 whitespace-nowrap">
                        Force Save Anyway
                      </Button>
                    </div>
                    <p className="text-sm mb-4">Your question is too similar to an existing question in the bank and cannot be saved.</p>
                    <details className="group mt-2">
                      <summary className="text-sm font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center outline-none hover:text-red-900 dark:hover:text-red-300 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
                        View Conflicts ({conflictError.details.similarQuestions?.length})
                      </summary>
                      <div className="space-y-3 mt-3">
                        {conflictError.details.similarQuestions?.map((sq: any) => (
                          <div key={sq.questionId} className="bg-background/80 p-4 rounded-xl text-sm border border-red-500/20 shadow-inner">
                            <strong className="text-red-800 dark:text-red-300">Question ID {sq.questionId} - {sq.similarityPercentage}% similar</strong>
                            <p className="mt-2 text-foreground/80">{sq.stem}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}"""
content = content.replace("                </DialogHeader>\n                <div className=\"grid gap-6\">", "                </DialogHeader>\n" + single_ui + "\n                <div className=\"grid gap-6\">")

edit_ui = """                {duplicateCheckResult && duplicateCheckResult.duplicate && (
                  <div className="bg-red-500/10 border border-red-500/50 p-5 rounded-2xl text-red-700 dark:text-red-400 mb-2 shadow-sm">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-bold flex items-center text-lg"><AlertTriangle className="w-5 h-5 mr-2 shrink-0" /> Duplicate Found</h3>
                      <Button onClick={() => handleSaveChanges("Ready for Review")} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm h-8 px-4 text-xs shrink-0 whitespace-nowrap">
                        Force Save Anyway
                      </Button>
                    </div>
                    <p className="text-sm mb-4">A similarity match was detected with an existing question in the question bank for the same technology stack and topic based on question stem and option.</p>
                    <details className="group mt-2">
                      <summary className="text-sm font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center outline-none hover:text-red-900 dark:hover:text-red-300 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" />
                        View Conflicts ({duplicateCheckResult.similarQuestions.length})
                      </summary>
                      <div className="space-y-3 mt-3">
                        {duplicateCheckResult.similarQuestions.map((sq: any) => (
                          <div key={sq.questionId} className="bg-background/80 p-4 rounded-xl text-sm border border-red-500/20 shadow-inner">
                            <strong className="text-red-800 dark:text-red-300">Question ID {sq.questionId} - {sq.similarityPercentage}% similar</strong>
                            <p className="mt-2 text-foreground/80">{sq.stem}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}"""
content = re.sub(r'\{duplicateCheckResult && duplicateCheckResult\.duplicate && \([\s\S]*?\}\)\}', edit_ui, content)


with open("src/pages/MyQuestions.tsx", "w") as f:
    f.write(content)
