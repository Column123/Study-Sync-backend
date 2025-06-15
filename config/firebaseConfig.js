import firebaseAdmin from "firebase-admin";
import fs from "fs";
const firebaseServiceAccount = JSON.parse(
    fs.readFileSync("./config/firebase/firebaseAdminConfig.json", "utf-8")
  );

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
});

const db = firebaseAdmin.firestore();
const User = db.collection("users");
const Question = db.collection("questions");
const LikeRef = db.collection("like_iser");

export { User, Question, LikeRef };