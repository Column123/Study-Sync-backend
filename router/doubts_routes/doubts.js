import express from "express";
import doubtsController from "../../controllers/doubts/doubtsController.js";
const router = express.Router();

router.route('/')
    .post(doubtsController.postQuestion)
    .get(doubtsController.getALLQuestions)

router.route('/userQuestions')
    .get(doubtsController.getUserQuestions)

router.route('/answer/:questionId')
    .get(doubtsController.getAnswers)

router.route('/like/:questionId/:answerId')
    .post(doubtsController.likeAnswer)
    .delete(doubtsController.cancelLike)

export default router;