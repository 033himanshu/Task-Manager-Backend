import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config({
    path : './.env'
})
import healthCheckRouter from './routes/healthcheck/healthcheck.route.js'
import authRouter from './routes/auth/auth.route.js'
import userRouter from './routes/user/user.route.js'
import projectRouter from './routes/project/project.route.js'
import taskRouter from './routes/task/task.route.js'
import boardRouter from './routes/board/board.route.js'
import noteRouter from './routes/note/note.route.js'

const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS)?.split(',').map(or => or.trim())
console.log(allowedOrigins)

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.use((req,res,next)=>{
    console.log("Request come")
    if(req.body && typeof req.body === 'object'){
        for(const key in req.body){
            if(typeof req.body[key] === 'string'){
                req.body[key] = req.body[key].trim()
            }
        }
    }
    next()
})

const baseUrl = process.env.BASE_URL

app.get(`${baseUrl}`, (req, res)=>{
    res.status(200).json({
        message : 'welcome to task manager'
    })
})

app.use(`${baseUrl}auth`, authRouter)
app.use(`${baseUrl}board`, boardRouter)
app.use(`${baseUrl}healthcheck`, healthCheckRouter)
app.use(`${baseUrl}note`, noteRouter)
app.use(`${baseUrl}project`, projectRouter)
app.use(`${baseUrl}task`, taskRouter)
app.use(`${baseUrl}user`, userRouter)

app.use((err, req, res, next)=> {
    return res.status(typeof(err.statusCode)===Number ? err.statusCode : 501).json({data : {message:err.message, success : false, status : err.statusCode}})
})

export default app