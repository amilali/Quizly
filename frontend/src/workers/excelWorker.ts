import { read, utils } from "xlsx";

self.onmessage = async (e: MessageEvent) => {
  try {
    const { data } = e.data; // This is the ArrayBuffer of the file
    const workbook = read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json<any>(worksheet);

    const parsedQuestions = jsonData.map((row: any) => {
      const correctStr = row["Correct Answer"]?.toString().trim().toUpperCase() || "A";
      let correctOption = 0;
      if (correctStr === "B") correctOption = 1;
      else if (correctStr === "C") correctOption = 2;
      else if (correctStr === "D") correctOption = 3;

      return {
        // No id — let the DB generate it. Sending a fake id causes JPA to try UPDATE instead of INSERT
        stem: row["Question"] || "",
        stack: row["Technology Stack"] || "",
        topic: row["Topic"] || "",
        difficulty: row["Difficulty"] || "Medium",
        status: "Draft" as const,
        options: [
          row["Option A"]?.toString() || "",
          row["Option B"]?.toString() || "",
          row["Option C"]?.toString() || "",
          row["Option D"]?.toString() || ""
        ],
        correctOption
      };
    });

    self.postMessage({ success: true, parsedQuestions });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
