import express from "express";
import resfreshAccessToken from "../../controllers/auth/refreshAccessToken.js";
const router = express.Router();

router.route('/')
    .get(resfreshAccessToken);

export default router;