import re

with open("src/pages/MyQuestions.tsx", "r") as f:
    content = f.read()

# 1. Add intendedStatus state variables for ADD and EDIT
state_vars = """
  const [intendedSingleStatus, setIntendedSingleStatus] = useState<"Draft" | "Under Review" | "Ready for Review">("Draft")
  const [intendedEditStatus, setIntendedEditStatus] = useState<"Draft" | "Under Review" | "Ready for Review">("Ready for Review")
"""
content = content.replace("const [conflictError, setConflictError] = useState<any>(null)", "const [conflictError, setConflictError] = useState<any>(null)\n" + state_vars)

# 2. Update handleCreateSingle to store status
handle_create = """  const handleCreateSingle = async (status: "Draft" | "Under Review" | "Ready for Review") => {
    setIntendedSingleStatus(status);
    const newQ = {
      ...newQuestionData,
      status,
      creatorId: userName || ""
    };
    try {
      await dispatch(createQuestion({ question: newQ })).unwrap();
      setConflictError(null);
      setIsAddModalOpen(false);
      setTimeout(() => {
        setAddMode("select");
        setNewQuestionData({ stem: "", stack: "", topic: "", difficulty: "Medium", options: ["", "", "", ""], correctOption: 0 });
      }, 300);
    } catch (err: any) {
      if (err?.duplicate) {
        setConflictError({ type: 'single', details: err });
      } else {
        console.error("Failed to create question:", err);
      }
    }
  }"""
content = re.sub(r'const handleCreateSingle = \(status:.*?\).*?\}\s*\} catch \(err: any\) \{.*?\}\s*\}', handle_create, content, flags=re.DOTALL)


# 3. Update handleOverrideSingle to use intendedSingleStatus
override_single = """  const handleOverrideSingle = async () => {
    const newQ = {
      ...newQuestionData,
      status: intendedSingleStatus,
      creatorId: userName || ""
    };"""
content = re.sub(r'const handleOverrideSingle = async \(\) => \{\s*const newQ = \{\s*\.\.\.newQuestionData,\s*status: "Draft",\s*creatorId: userName \|\| ""\s*\};', override_single, content)

# 4. Create handleEditWithDuplicateCheck and replace the old button logic
handle_edit_check = """  const handleEditWithDuplicateCheck = async (status: "Draft" | "Under Review" | "Ready for Review") => {
    if (!editFormData) return;
    setIntendedEditStatus(status);
    setIsCheckingDuplicate(true);
    try {
      const result = await checkDuplicateAi(editFormData);
      if (result.duplicate) {
        setDuplicateCheckResult(result);
      } else {
        handleSaveChanges(status);
      }
    } catch (err) {
      console.error("Duplicate check failed", err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }"""
content = re.sub(r'const handleSaveAndReviewWithDuplicateCheck = async \(\) => \{.*?finally \{\s*setIsCheckingDuplicate\(false\);\s*\}\s*\}', handle_edit_check, content, flags=re.DOTALL)

# 5. Update Edit buttons to use handleEditWithDuplicateCheck
edit_buttons = """                  <Button variant="ghost" onClick={handleManualDuplicateCheck} disabled={isCheckingDuplicate} className="rounded-xl font-bold py-6 px-5 border border-border/50 text-muted-foreground hover:text-foreground w-full sm:w-auto bg-black/5 dark:bg-white/[0.02] hover:bg-black/10 dark:hover:bg-white/10">
                    {isCheckingDuplicate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Duplicate Check"}
                  </Button>
                  <Button variant="secondary" onClick={() => handleEditWithDuplicateCheck("Draft")} disabled={isCheckingDuplicate} className="rounded-xl font-bold py-6 px-6 transition-all w-full sm:w-auto border border-border/50 shadow-sm">
                    {isCheckingDuplicate && intendedEditStatus === "Draft" ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking...</> : "Save as Draft"}
                  </Button>
                  <Button onClick={() => handleEditWithDuplicateCheck("Ready for Review")} disabled={isCheckingDuplicate} className="relative overflow-hidden rounded-xl font-bold bg-primary text-white hover:bg-primary/90 py-6 px-7 shadow-[0_4px_20px_rgba(var(--primary),0.25)] hover:shadow-[0_4px_25px_rgba(var(--primary),0.4)] transition-all flex items-center justify-center w-full sm:w-auto group border border-primary/20">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite_linear]" />
                    <span className="relative z-10 flex items-center drop-shadow-md">
                      {isCheckingDuplicate && intendedEditStatus === "Ready for Review" ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking...</> : "Save & Send for Review"}
                    </span>
                  </Button>"""

content = re.sub(r'<Button variant="ghost" onClick=\{handleManualDuplicateCheck\}.*?</span>\s*</Button>', edit_buttons, content, flags=re.DOTALL)

# 6. Update Edit modal Force Save Anyway button to use intendedEditStatus
content = content.replace('onClick={() => handleSaveChanges("Ready for Review")}', 'onClick={() => handleSaveChanges(intendedEditStatus)}')

with open("src/pages/MyQuestions.tsx", "w") as f:
    f.write(content)
