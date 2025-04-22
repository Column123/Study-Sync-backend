import bcrypt from "bcrypt";
import {User} from "../../config/firebaseConfig.js";
import UserModel from "../../models/UserModel.js";

const createAccount = async(req, res)=>{
    const {name, username, email, password} = req.body;
    if(!name || !username || !email || !password){
        return res.sendStatus(400);                        // invalid details
    }
    try{
        const emailSnapshot = await User.where("email", "==", email).get();
        const usernameSnapshot = await User.where("username", "==", username).get();
        if(!emailSnapshot.empty || !usernameSnapshot.empty){
            return res.sendStatus(400);
        }
        const encryptedPassword = await bcrypt.hash(password,10);
        const newUser = UserModel(name, username, email, encryptedPassword);
        const result = await User.add(newUser);
        return res.sendStatus(200);
        
    }
    catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export default createAccount;