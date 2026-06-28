import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../config/firebaseConfig.js";
import dotenv from "dotenv";
dotenv.config();

const authenticate = async (req, res) => {
    const { email, username, password } = req.body;
    if ((!email && !username) || !password) {
        return res.status(400).json({ message : "Invalid details" });     //Invalid details
    }
    try {
        const savedUser = !username ? await User.where("email", "==", email).get() : await User.where("username", "==", username).get();
        if (savedUser.empty) {
            return res.status(404).json({message : "User not found"});
        }
        const passwordMatch = await bcrypt.compare(password, savedUser.docs[0].data().password);
        if (!passwordMatch) {
            return res.sendStatus(401).json({ message: "incorrect password" });            // password is incorrect
        }

        const accessToken = jwt.sign(
            {
                "username": savedUser.docs[0].data().username,
                "id": savedUser.docs[0].id
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "10m" }
        );

        const refreshToken = jwt.sign(
            { "username": savedUser.docs[0].data().username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const userRef = await savedUser.docs[0].ref.update({ refreshToken: refreshToken });

        res.cookie('jwt', refreshToken, { httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 7 * 1000 * 60 * 60 * 24 });
        
        return res.status(200).json({ accessToken: accessToken, username: savedUser.docs[0].data().username });
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
}

export default authenticate;