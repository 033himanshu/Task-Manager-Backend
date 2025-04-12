import mongoose from "mongoose"

const connectDB = async () => {
   mongoose
   .connect(process.env.MONGODB_URL)
   .then(() => console.log('Database connection Successfull🎉'))
   .catch((error) =>{
        console.error('Database Connection Failed🔥\n', error)
        process.exit(1)
   })
}
export default connectDB