import express from "express";
import verifyJWT from "../../middleware/verifyJWT.js";
import doubtsController from "../../controllers/doubts/doubtsController.js";
import doubtsControllerPublic from "../../controllers/doubts/doubtsControllerPublic.js";
const router = express.Router();

router.route('/')
    .post(verifyJWT,doubtsController.postQuestion)
    .get(verifyJWT,doubtsController.getALLQuestions)

router.route('/category')
    .get(doubtsControllerPublic.getCategories)

router.route('/userQuestions')
    .get(verifyJWT,doubtsController.getUserQuestions)

router.route('/answer/:questionId')
    .get(verifyJWT,doubtsController.getAnswers)

router.route('/like/:questionId/:answerId')
    .post(verifyJWT,doubtsController.likeAnswer)

router.route('/dislike/:questionId/:answerId')
    .post(verifyJWT,doubtsController.dislikeAnswer)

export default router;