import express from "express";
import verifyJWT from "./middleware/verifyJWT.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import refreshRouter from './router/authentication_routes/refresh.js'
import loginRouter from './router/authentication_routes/logIn.js'
import registerRouter from './router/authentication_routes/register.js'
import logoutRouter from './router/authentication_routes/logout.js'

import doubtRouter from './router/doubts_routes/doubts.js'

dotenv.config();
const app = express();



const port = process.env.PORT || 5000;

// THIRD-PARTY MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(cookieParser());


//AUTHENTICATION ROUTING
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/refresh', refreshRouter);


app.use(verifyJWT);
app.use('/doubts', doubtRouter );

app.get('/test', (req, res) => {
    res.send(req.user);
})

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`)
}); 

