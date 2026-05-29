import { read, utils } from "xlsx";

self.onmessage = async (e: MessageEvent) => {
  try {
    const { data } = e.data; // This is the ArrayBuffer of the file
    const workbook = read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json<any>(worksheet);

    // Helper to find a value in row using a regex key match
    const getValueByRegex = (row: any, pattern: RegExp, defaultValue: string = ""): string => {
      const matchedKey = Object.keys(row).find(key => pattern.test(key));
      return matchedKey ? row[matchedKey]?.toString().trim() : defaultValue;
    };

    const parsedQuestions = jsonData.map((row: any) => {
      // Key matching regex patterns
      const qIdRegex = /id|question\s*id|q_id/i;
      const stemRegex = /question\s*stem|stem|question\s*text|question/i;
      const stackRegex = /technology\s*stack|stack|technology|tech/i;
      const topicRegex = /topic|subject|area/i;
      const diffRegex = /difficulty|diff|level/i;
      const correctRegex = /correct\s*answer|correct\s*option|correct\s*opt|answer|correct/i;

      const optARegex = /option\s*a|opt\s*a|choice\s*a/i;
      const optBRegex = /option\s*b|opt\s*b|choice\s*b/i;
      const optCRegex = /option\s*c|opt\s*c|choice\s*c/i;
      const optDRegex = /option\s*d|opt\s*d|choice\s*d/i;

      // Extract values dynamically using regex matches
      const stem = getValueByRegex(row, stemRegex);
      const stack = getValueByRegex(row, stackRegex);
      const topic = getValueByRegex(row, topicRegex);
      const difficulty = getValueByRegex(row, diffRegex, "Medium");
      const id = getValueByRegex(row, qIdRegex, String(Date.now() + Math.random()));

      const correctStr = getValueByRegex(row, correctRegex, "A").toUpperCase();
      let correctOption = 0;
      if (correctStr === "B" || correctStr === "1") correctOption = 1;
      else if (correctStr === "C" || correctStr === "2") correctOption = 2;
      else if (correctStr === "D" || correctStr === "3") correctOption = 3;

      const optionA = getValueByRegex(row, optARegex);
      const optionB = getValueByRegex(row, optBRegex);
      const optionC = getValueByRegex(row, optCRegex);
      const optionD = getValueByRegex(row, optDRegex);

      return {
        id,
        stem,
        stack,
        topic,
        difficulty,
        status: "Draft" as const,
        options: [optionA, optionB, optionC, optionD],
        correctOption
      };
    });

    self.postMessage({ success: true, parsedQuestions });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
