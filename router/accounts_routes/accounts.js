import express from "express";
import {getUserAccount, updateUserAccount} from '../../controllers/accounts/accountsController.js';
import verifyJWT from "../../middleware/verifyJWT.js";

const router = express.Router();

router.route('/:username')
    .get(getUserAccount)
    .patch(verifyJWT, updateUserAccount);

export default router;