
const QuestionModel = (question, user_ref, createdBy) => ({
    question,
    user_ref,
    response:0,
    createdBy,
    createdAt: new Date()
})

export default QuestionModel