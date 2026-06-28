import bcrypt from "bcrypt";
import { User, userProfiles,db } from "../../config/firebaseConfig.js";
import UserModel from "../../models/UserModel.js";
import UserProfileModel from "../../models/UserProfileModel.js";

const createAccount = async (req, res) => {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
        return res.status(400).json({ message : "Invalid details" });                        // invalid details
    }
    try {
        const [emailSnapshot, usernameSnapshot] = await Promise.all([
            User.where("email", "==", email).get(),
            User.where("username", "==", username).get()
        ])
        if (!emailSnapshot.empty) {
            return res.status(400).json({ message: "email already exist" });
        }
        if (!usernameSnapshot.empty) {
            return res.status(400).json({ message: "username already exist" });
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newUser = UserModel(name, username, email, encryptedPassword);
        const batch = db.batch();
        const newUserRef = User.doc();
        const sharedID = newUserRef.id;
        batch.set(newUserRef, newUser);
        const userProfileRef  = userProfiles.doc(sharedID);
        const userProfileData = UserProfileModel({
            username:username,
        });
        batch.set(userProfileRef, userProfileData);
        await batch.commit();
        return res.status(201).json({ message: "user registered" });

    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export default createAccount;