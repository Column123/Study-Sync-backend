import { db, User, Question, userProfiles } from '../../config/firebaseConfig.js';
import QuestionModel from '../../models/QuestionModel.js';
import callGemini from '../../utils/AI/gemini.js';
import callCohere from '../../utils/AI/cohere.js';
import AnswerModel from '../../models/AnswerModel.js';
import { FieldValue } from 'firebase-admin/firestore';
import LikedUserModel from '../../models/LikedUserModel.js';
import DisLikedUserModel from '../../models/DisLikedUserModel.js';
import Categories  from '../../models/Categories.js';




const getALLQuestions = async (req, res) => {
    try {

        const allowedFilters = {
            category:true,
            createdBy:true,
        }

        let query = Question;

        Object.entries(req.query).forEach(([key, value])=>{
            if(allowedFilters[key] && value){
                query = query.where(key, "==", value.trim());
            }
        });
        const questions = await query.get();
        const allQuestions = await Promise.all(
            questions.docs.map(async (doc) => {
                const data = doc.data();

                const answerSnapshot = await Question
                    .doc(doc.id)
                    .collection("answers")
                    .get();

                const answers = await Promise.all(
                    answerSnapshot.docs.map(async (ans) => {
                        const answerData = ans.data();
                        const likeRef = Question
                            .doc(doc.id)
                            .collection("answers")
                            .doc(ans.id)
                            .collection("likes")
                            .doc(req.user.id);

                        const dislikeRef = Question
                            .doc(doc.id)
                            .collection("answers")
                            .doc(ans.id)
                            .collection("dislikes")
                            .doc(req.user.id);

                        const likeSnapshot = await likeRef.get();
                        const dislikeSnapshot = await dislikeRef.get();
                        return {
                            answerId: ans.id,
                            ...answerData,
                            likedByCurrentUser: likeSnapshot.exists,
                            dislikedByCurrentUser: dislikeSnapshot.exists
                        }
                    })
                )
                return {
                    questionId: doc.id,
                    title: data.title,
                    question: data.question,
                    category: data.category,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt.toDate(),
                    response: data.response,
                    userId: data.user_ref.id,
                    answers: answers,
                };
            })
        );
        return res.status(200).json(allQuestions);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}





const postQuestion = async (req, res) => {
    try {
        const userId = req.user.id;
        const userProfileRef = userProfiles.doc(userId);
        const { title, question } = req.body;
        if (!title) {
            return res.status(400).json({ message: "no title given" })
        }
        if (!question) {
            return res.status(400).json({ message: 'no question given' });
        }

        const [geminiResult, cohereText] = await Promise.all([
            callGemini(title, question, Categories),
            callCohere(title, question) 
        ]);

        const geminiAnswerText = geminiResult ? geminiResult.answer : "Gemini failed to generate an answer.";
        const categoryPickedByGemini = geminiResult ? geminiResult.assignedCategory : "Other";

        const finalCohereText = cohereText ? cohereText : "Cohere failed to generate an answer.";

        const geminiAnswer = AnswerModel(geminiAnswerText, "gemini");
        const cohereAnswer = AnswerModel(finalCohereText, "cohere");

        const currentUser = User.doc(req.user.id);
        const newQuestion = QuestionModel(title, question, categoryPickedByGemini, currentUser, req.user.username);

        const batch = db.batch();

        batch.update(userProfileRef,{
            questionsAsked: FieldValue.increment(1)
        });
        
        const newQuestionRef = Question.doc();
        const geminiAnswerRef = newQuestionRef.collection("answers").doc();
        const cohereAnswerRef = newQuestionRef.collection("answers").doc();

        batch.set(newQuestionRef, newQuestion);
        batch.set(geminiAnswerRef, geminiAnswer);
        batch.set(cohereAnswerRef, cohereAnswer);   

        await batch.commit();

        return res.status(201).json({
            message: "Question and answers saved successfully."
        });

    } catch (err) {
        console.error("Error in postQuestion:", err);
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
        const likeRef = answerRef.collection("likes").doc(req.user.id);
        const dislikeRef = answerRef.collection("dislikes").doc(req.user.id);

        await db.runTransaction(async (transaction) => {
            const answerSnapshot = await transaction.get(answerRef);
            const likeSnapshot = await transaction.get(likeRef);
            const dislikeSnapshot = await transaction.get(dislikeRef);
            if (!answerSnapshot.exists) {
                throw new Error("Answer not found");
            }

            if (likeSnapshot.exists) {
                transaction.delete(likeRef);
                transaction.update(answerRef, {
                    likes: FieldValue.increment(-1)
                });
                transaction.update(questionRef, {
                    response: FieldValue.increment(-1)
                });
                return;
            }
            else {
                if (dislikeSnapshot.exists) {
                    transaction.delete(dislikeRef);
                    transaction.update(answerRef, {
                        dislikes: FieldValue.increment(-1)
                    });
                }
                else {
                    transaction.update(questionRef, {
                        response: FieldValue.increment(1)
                    });
                }
                const likeUser = LikedUserModel();
                transaction.set(likeRef, likeUser);
                transaction.update(answerRef, {
                    likes: FieldValue.increment(1)
                });

            }

        });

        return res.status(200).json({
            message: "Vote updated successfully"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Something went wrong"
        });

    }
};

const dislikeAnswer = async (req, res) => {
    try {
        const { questionId, answerId } = req.params;
        if (!questionId || !answerId)
            return res.sendStatus(400);

        const questionRef = Question.doc(questionId);
        const answerRef = questionRef.collection("answers").doc(answerId);
        const dislikeRef = answerRef.collection("dislikes").doc(req.user.id);
        const likeRef = answerRef.collection("likes").doc(req.user.id);


        await db.runTransaction(async (transaction) => {
            const answerSnapshot = await transaction.get(answerRef);
            if (!answerSnapshot.exists)
                throw new Error("Answer Not Found");

            const dislikeSnapShot = await transaction.get(dislikeRef);
            const likeSnapshot = await transaction.get(likeRef);
            if (dislikeSnapShot.exists) {
                transaction.delete(dislikeRef);
                transaction.update(answerRef, {
                    dislikes: FieldValue.increment(-1)
                });
                transaction.update(questionRef, {
                    response: FieldValue.increment(-1)
                });
            }
            else {
                if (likeSnapshot.exists) {
                    transaction.delete(likeRef);
                    transaction.update(answerRef, {
                        likes: FieldValue.increment(-1)
                    });
                }
                else {
                    transaction.update(questionRef, {
                        response: FieldValue.increment(1)
                    });
                }
                const DisLikedUser = DisLikedUserModel();
                transaction.set(dislikeRef, DisLikedUser);
                transaction.update(answerRef, {
                    dislikes: FieldValue.increment(1)
                });
            }
        })
        return res.status(200).json({
            message: "vote updated successfully"
        })
    }
    catch (err) {
        console.log("Error ", err);
        return res.status(500).json({
            message: "Something went wrong"
        });
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
        if (!questionId) {
            return res.sendStatus(400);
        }
        const questionRef = Question.doc(questionId);
        const questionSnapshot = await questionRef.get();
        if (!questionSnapshot.exists) {
            return res.sendStatus(404);
        }
        const answerRef = questionRef.collection("answers");
        const answersSnapshot = await answerRef.orderBy("likes", "desc").get();

        const allAnswers = await Promise.all(answersSnapshot.docs.map(async (docs) => {
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





export default { postQuestion, getALLQuestions, getUserQuestions, getAnswers, likeAnswer, dislikeAnswer };