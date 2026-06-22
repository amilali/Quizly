import re

with open("../backend/src/main/java/com/quizly/backend/service/AiService.java", "r") as f:
    content = f.read()

init_method = """
    @jakarta.annotation.PostConstruct
    public void initVectorStore() {
        System.out.println("Initializing vector store from DB...");
        List<Question> allQuestions = questionRepository.findAll();
        for (Question q : allQuestions) {
            syncQuestionToVectorStore(q);
        }
        System.out.println("Loaded " + allQuestions.size() + " questions into vector store.");
    }

    public AiService(ChatModel chatModel, VectorStore vectorStore, QuestionRepository questionRepository) {
"""

content = content.replace("    public AiService(ChatModel chatModel, VectorStore vectorStore, QuestionRepository questionRepository) {", init_method)

with open("../backend/src/main/java/com/quizly/backend/service/AiService.java", "w") as f:
    f.write(content)
