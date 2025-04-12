import dotenv from 'dotenv'
dotenv.config({
    path : './.env'
})

import connectDB from './db/index.js'


import app from './app.js'


const port = process.env.PORT ?? 3000

connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log(`server is listening on pert ${port}`)
    })
})