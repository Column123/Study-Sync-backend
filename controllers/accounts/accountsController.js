import { User, userProfiles } from "../../config/firebaseConfig.js";
import UserProfileModel from "../../models/UserProfileModel.js";

const getUserAccount = async (req, res) => {
    const username = req.params.username;
    if (!username)
        return res.status(400).json({ message: "Invalid details" });
    try {
        const [userSnapshot, userProfileSnapshot] = await Promise.all([
            User.where("username", "==", username).get(),
            userProfiles.where("username", "==", username).get()
        ])
        if (userSnapshot.empty) {
            return res.status(404).json({ message: "User not found" });
        }
        const profileData = userProfileSnapshot.empty ? {} : userProfileSnapshot.docs[0].data();
        const user = {
            username: userSnapshot.docs[0].data().username,
            userId: userSnapshot.docs[0].id,
            email: userSnapshot.docs[0].data().email,
            name: userSnapshot.docs[0].data().name,
            createdAt: userSnapshot.docs[0].data().createdAt,
            ...profileData
        }
        return res.status(200).json(user);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

const updateUserAccount = async (req, res) => {
    const userId = req.user.id;
    const username = req.params.username;
    try {
        if (!username)
            return res.status(400).json({ message: "Invalid details" });
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "No update data provided" });
        }
        const userProfileRefID = userProfiles.doc(userId);
        const updatedFields = {
            bio: req.body.bio,
            currentEducationLevel: req.body.currentEducationLevel,
            currentInstitution: req.body.currentInstitution,
            major: req.body.major,
            githubUrl: req.body.githubUrl,
            linkedinUrl: req.body.linkedinUrl,
            website: req.body.website,
        };

        Object.keys(updatedFields).forEach(key => {
            if (updatedFields[key] === undefined) {
                delete updatedFields[key];
            }
        });
        const result = await userProfileRefID.update(updatedFields);
        return res.status(200).json({ message: "user profile updated" });
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

export { getUserAccount, updateUserAccount };