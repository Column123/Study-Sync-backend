import { User, Question } from '../../config/firebaseConfig.js';
import QuestionModel from '../../models/QuestionModel.js';
import callGemini from '../../utils/AI/gemini.js';
import callCohere from '../../utils/AI/cohere.js';
import AnswerModel from '../../models/AnswerModel.js';
import { FieldValue } from 'firebase-admin/firestore';
import LikedUserModel from '../../models/LikedUserModel.js';

const postQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.sendStatus(400);
        }
        const [geminiResponse, cohereResponse] = await Promise.all([callGemini(question), callCohere(question)]);

        const geminiAnswer = AnswerModel(geminiResponse, "gemini");
        const cohereAnswer = AnswerModel(cohereResponse, "cohere");

        const currentUser = User.doc(req.user.id);
        const newQuestion = QuestionModel(question, currentUser, req.user.username);
        const result = await Question.add(newQuestion);                     // add question to database


        const questionRef = Question.doc(result.id);

        await Promise.all([
            questionRef.collection("answers").add(geminiAnswer),
            questionRef.collection("answers").add(cohereAnswer)
        ])

        return res.sendStatus(201);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const getALLQuestions = async (req, res) => {
    try {
        const questions = await Question.get();
        const allQuestions = questions.docs.map((docs) => {
            return {
                "questionId": docs.id,
                "created_user_id": docs.data().user_ref.id,
                "question": docs.data().question,
                "response": docs.data().response,
                "createdAt": docs.data().createdAt.toDate(),
                "createdBy": docs.data().createdBy
            }
        })
        return res.status(200).json(allQuestions);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const getUserQuestions = async (req, res) => {
    try {
        const userRef = User.doc(req.user.id);
        const userQuestions = await Question.where("user_ref", "==", userRef).get();
        const allUserQuestions = userQuestions.docs.map((docs) => {
            return {
                "questionId": docs.id,
                "question": docs.data().question,
                "response": docs.data().response,
                "createdAt": docs.data().createdAt.toDate()
            }
        })
        return res.status(200).json(allUserQuestions);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const getAnswers = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        if(!questionId){
            return res.sendStatus(400);
        }
        const questionRef = Question.doc(questionId);
        const questionSnapshot = await questionRef.get();
        if (!questionSnapshot.exists) {
            return res.sendStatus(404);
        }
        const answerRef = questionRef.collection("answers");
        const answersSnapshot  = await answerRef.orderBy("likes", "desc").get();
        
        const allAnswers = await Promise.all(answersSnapshot.docs.map(async(docs) => {
            const liked_users = await docs.ref.collection("liked_users").doc(req.user.id).get();
            return {
                "answerId": docs.id,
                "ai_model": docs.data().ai_model,
                "answer": docs.data().answer,
                "total_likes": docs.data().likes,
                "current_user_liked": liked_users.exists
            }
        }));
        return res.status(200).json(allAnswers);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const likeAnswer = async (req, res) => {
    try {
        const { questionId, answerId } = req.params;
        if (!questionId || !answerId) {
            return res.sendStatus(400);
        }

        const questionRef = Question.doc(questionId);
        const answerRef = questionRef.collection("answers").doc(answerId);
        const likeRef = answerRef.collection("liked_users").doc(req.user.id);

        const [questionSnapshot, answerSnapshot] = await Promise.all([
            questionRef.get(),
            answerRef.get()
        ]);

        if (!questionSnapshot.exists || !answerSnapshot.exists) {
            return res.sendStatus(404);
        }
        const alreadyLiked = await likeRef.get();
        if (alreadyLiked.exists) {
            return res.status(200).json({ message: "Already liked" });
        }

        await Promise.all([
            questionRef.update({ response: FieldValue.increment(1) }),
            answerRef.update({ likes: FieldValue.increment(1) }),
            
            likeRef.set(LikedUserModel(req.user.id))
        ])
        
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const cancelLike = async (req, res) => {
    try {
        const { questionId, answerId } = req.params;
        if (!questionId || !answerId) {
            return res.sendStatus(400);
        }
        const questionRef = Question.doc(questionId);
        const answerRef = questionRef.collection("answers").doc(answerId);
        const likeRef = answerRef.collection("liked_users").doc(req.user.id);

        const [questionSnapshot, answerSnapshot] = await Promise.all([
            questionRef.get(),
            answerRef.get()
        ]);

        if (!questionSnapshot.exists || !answerSnapshot.exists) {
            return res.sendStatus(404);
        }
        const Liked = await likeRef.get();
        if(Liked.exists){
            await Promise.all([
                questionRef.update({ response: FieldValue.increment(-1) }),
                answerRef.update({ likes: FieldValue.increment(-1) }),
                likeRef.delete()
            ])
            return res.sendStatus(201);
        }
        return res.sendStatus(200);
    }
    catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export default { postQuestion, getALLQuestions, getUserQuestions, getAnswers, likeAnswer, cancelLike };