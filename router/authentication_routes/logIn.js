import express from "express";
import authenticate from "../../controllers/auth/authenticate.js";
const router = express.Router();    

router.route('/')
    .post(authenticate);

export default router;