import firebaseAdmin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
// const firebaseServiceAccount = JSON.parse(
//     fs.readFileSync("./config/firebase/firebaseAdminConfig.json", "utf-8")
//   );
const firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
});

const db = firebaseAdmin.firestore();
const User = db.collection("users");
const Question = db.collection("questions");
const userProfiles = db.collection('userProfiles');
const Roadmaps = db.collection('roadmaps');

export { db, User, Question, userProfiles, Roadmaps };
