import express from "express";
import createAccount from "../../controllers/auth/createAccount.js";
const router = express.Router();

router.route('/')
    .post(createAccount);

export default router;