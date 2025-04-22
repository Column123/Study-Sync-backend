import jwt from 'jsonwebtoken';
import {User} from '../../config/firebaseConfig.js'; 

const refreshAccessToken = async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.jwt) {
        return res.sendStatus(401); // Unauthorized
    }
    const refreshToken = cookie.jwt;
    
    try {
        const savedUser = await User.where('refreshToken', '==', refreshToken).get();
        if (savedUser.empty) {
            return res.sendStatus(403); // Forbidden, User Dosen't Exist
        }
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decode) => {
                if (err) {
                    return res.sendStatus(401);
                }
                
                const accessToken = jwt.sign(
                    {
                         'username': decode.username,
                        "id" : savedUser.docs[0].id
                     },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '10m' }
                );
                return res.status(200).json({ 'accessToken': accessToken });
            }
        );
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export default refreshAccessToken;