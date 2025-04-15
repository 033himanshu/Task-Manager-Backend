import mongoose, { Schema } from 'mongoose'
import crypto from "crypto"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {resetPasswordMainGenContent, emailVerificationMailgenContent, sendMail} from "../utils/mail.js"
const userSchema = new mongoose.Schema({
    avatar : {
        type : String,
        default : 'https://avatar.iran.liara.run/public/18',
    },
    username : {
        type: String,
        required : true,
        unique : true,
        trim : true,
        lowercase: true,
        index : true,
    },
    fullName : {
        required: true,
        type : String,
        trim : true,
    },
    email : {
        type : String,
        trim : true,
        unique: true,
        index: true,
    },
    password : {
        type : String,
        required : [true, "Password is required"]
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordTokenExpiresTime: {
        type: Date,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationExpiry: {
        type: Date,
    },
}, {timestamps: true})


const port = process.env.port
const base_url = process.env.BASE_URL

userSchema.pre('save', async function(next){  
    if(this.avatar===undefined){
        this.avatar = 'https://avatar.iran.liara.run/public/18'
    }
    if(this.isModified('email')){
        //send verification mail
        const {unHashedToken, hashedToken, tokenExpiry} = this.generateTemporaryToken()
        this.isEmailVerified = false
        this.emailVerificationToken = hashedToken
        this.emailVerificationExpiry = tokenExpiry
        await sendMail({
            options : emailVerificationMailgenContent(
                this.username, 
                `http://localhost:${port}${base_url}user/verify/${this.email}-${unHashedToken}`
            ),
            email : this.email,
            subject : 'Email Verification For Task manager'
            }
        )
        console.log("EMail sent")
    }

    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10)
    }
    next()
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compareSync(password, this.password);
}
userSchema.methods.sendResetPasswordToken = async function(){
    const {unHashedToken, hashedToken, tokenExpiry} = this.generateTemporaryToken()
    this.resetPasswordToken = hashedToken
    this.resetPasswordTokenExpiresTime = tokenExpiry
    await sendMail({
        options : resetPasswordMainGenContent(
            this.username, 
            `http://localhost:${port}${base_url}user/reset-password/${this.email}-${unHashedToken}`
        ),
        email : this.email,
        subject : 'Reset Password Verification mail'
        }
    )
    console.log("EMail sent")
    await this.save()
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        }, 
        process.env.JWT_REFRESH_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE_TIME }
    )
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            role : this.role,
        }, 
        process.env.JWT_ACCESS_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE_TIME }
    )
}

userSchema.methods.generateTemporaryToken = function(){
    const unHashedToken = crypto.randomBytes(20).toString('hex')
    const hashedToken = crypto.createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000; 
    return {unHashedToken, hashedToken, tokenExpiry}
}

userSchema.methods.isTokenMatch = function(unHashedToken, hashedToken){
    const newHashedToken = crypto.createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

    return newHashedToken === hashedToken
}

export const User = mongoose.model("User", userSchema)
