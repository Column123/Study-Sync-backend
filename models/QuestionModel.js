
const QuestionModel = (title,question,category, user_ref, createdBy) => ({
    title,
    question,
    category,
    user_ref,
    response:0,
    createdBy,
    createdAt: new Date()
})

export default QuestionModel