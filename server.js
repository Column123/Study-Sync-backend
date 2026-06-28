import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import refreshRouter from './router/authentication_routes/refresh.js';
import loginRouter from './router/authentication_routes/logIn.js';
import registerRouter from './router/authentication_routes/register.js';
import logoutRouter from './router/authentication_routes/logout.js';


import doubtRouter from './router/doubts_routes/doubts.js'
import roadmapRouter from './router/roadmap_routes/roadmap.js';

import accountRouter from './router/accounts_routes/accounts.js';

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

const port = process.env.PORT || 5000;

// THIRD-PARTY MIDDLEWARE
// app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/',(req, res)=>{
  res.send("hello world");
});

//AUTHENTICATION ROUTING
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/refresh', refreshRouter);


//ACCOUNTS ROUTING
app.use('/profile', accountRouter);

// app.use('/allquestion', allQuestionRoute);
app.use('/doubts', doubtRouter );


// ROADMAP ROUTING
app.use('/roadmap', roadmapRouter);


app.get('/test', (req, res) => {
    res.send(req.user);
})

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`)
}); 

