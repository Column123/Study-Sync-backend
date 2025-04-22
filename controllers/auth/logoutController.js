import jwt from 'jsonwebtoken';
import {User} from '../../config/firebaseConfig.js';

const logoutController = async (req, res) => {
    const cookie = req.cookies;
    if(!cookie?.jwt) {
        return res.sendStatus(204);
    }
    const refreshToken = cookie.jwt;
    try {
        const savedUser = await User.where("refreshToken", "==", refreshToken).get();
        const userRef = savedUser.docs[0].ref.update({ refreshToken: "" });
        res.clearCookie('jwt', { httpOnly: true, secure: false, sameSite: 'None' });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export default logoutController;
