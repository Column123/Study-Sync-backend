import express from "express";
import roadmapController from "../../controllers/roadmap/roadmapController.js";
import verifyJWT from "../../middleware/verifyJWT.js";

const router = express.Router();

router.route('/')
    .get(verifyJWT,roadmapController.getUserRoadmaps)

router.route('/:roadmapId')
    .get(verifyJWT,roadmapController.getRoadmap)
    .patch(verifyJWT,roadmapController.updateRoadmapProgress);

router.route('/save')
    .post(verifyJWT,roadmapController.saveRoadmap);


router.route('/create')
    .post(verifyJWT,roadmapController.createRoadmap);
    
export default router;