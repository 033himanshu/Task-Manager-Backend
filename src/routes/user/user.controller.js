import {User} from "../../models/user.model.js"
import { asyncHandler } from "../../utils/async-handler.js"
import {ApiError} from "../../utils/api-error.js"

import { destroyOnCloudinary, replaceOnCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js"
import { ApiResponse } from "../../utils/api-response.js"

import {CloudinaryFolderEnum} from '../../utils/constants.js'


//controllers
const verifyEmail = asyncHandler(async (req, res) =>{
    let {email, token } = req.params
    const user = await User.findOne({email})

    if(!user)
        throw new ApiError(400, "Invalid Attempt")
    
    if(user.isEmailVerified)
        throw new ApiError(422, "User Already Verified")
    if(user.emailVerificationExpiry<Date.now() ){
        user.emailVerificationToken = undefined
        user.emailVerificationExpiry = undefined
        throw new ApiError(422, "Verification Link Expired, Click on Resend Verification Link")
    }
    if(!user.isTokenMatch(token, user.emailVerificationToken))
        throw new ApiError(400, "Invalid Token")

    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    user.isEmailVerified = true
    await user.save()
    return res.status(200).json( new ApiResponse(200, {}, "Verification Successfull"))
})

const me = asyncHandler(async (req, res)=>{
    const user = await User.findById(req._id)
    if(!user)
        throw new ApiError(422, "User not exists")

    return res.status(200).json(new ApiResponse(200, {
        avatar : user.avatar,
        username: user.username,
        fullName:user.fullName,
        email : user.email,
        isEmailVerified:  user.isEmailVerified,
    }, "User profile fetched"))
})

const resendEmailVerification = asyncHandler(async (req, res)=>{
    // finding user
    const user = await User.findById(req._id)
    if(!user)
        throw new ApiError(422, "User not exist")
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    user.markModified("email")
    user.save()
    return res.status(200).json(new ApiResponse(200, {}, "Email Re-Registered"))
})

const updateProfile = asyncHandler (async (req, res)=>{

    let {email, fullName, username, } = req.body

    // check whether email Already exists in db
    const user = await User.findById(req._id)
    const errors = []
    if(user.email !== email){
        if(await User.findOne({email})){
            errors.push("EmailId already in use")
        }
    }
    if(user.username !== username){
        if(await User.findOne({username})){
            errors.push("Username already in use")
        }
    }
    if(errors){
        throw new ApiError(409, "Data Already exists", errors)
    }

    user.email = email
    user.fullName = fullName
    user.username = username
    await user.save()
    return res.status(200).json( new ApiResponse(200, {}, "User Profile Updated"))
})

const updatePassword = asyncHandler (async (req, res)=>{
    let {currentPassword, newPassword} = req.body
    const user = await User.findById(req._id)
    if(!await user.isPasswordCorrect(currentPassword))
        throw new ApiError(400, "Current Password is Wrong")
       
    user.password = newPassword
    await user.save()
    return res.status(200).json(new ApiResponse(200, {}, "Password Updated"))
})


const forgotPassword = asyncHandler (async (req, res)=>{
    const {email} = req.body
    const user = await User.findOne({email})
    if(!user)
        throw new ApiError(404, "User not found")
    user.sendResetPasswordToken()
    return res.status(200).json(new ApiResponse(200, {}, "Reset Password Link sent to your mail"))
})

const resetPassword = asyncHandler (async (req, res)=>{
    const {email, token } = req.params
    const {password} = req.body
    const user = await User.findOne({email})
    if(!user)
        throw new ApiError(400, "Invalid Attempt")
    if(user.resetPasswordTokenExpiresTime<Date.now()){
        throw new ApiError(400, "Verification Link Expired..")
    }
    if(!user.isTokenMatch(token, user.resetPasswordToken))
        throw new ApiError(400, "Invalid Token")

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordTokenExpiresTime = undefined
    await user.save()
    return res.status(200).json(new ApiResponse(200, {}, "Password Updated"))
})

const deleteAccount =  asyncHandler (async (req, res)=>{
    let {password} = req.body
    const user = await User.findById(req._id)
    if(!user)
        throw new ApiError(400, "User Not Exists")
    if(!await user.isPasswordCorrect(password))
        throw new ApiError(400, "Wrong Password")
    await User.findByIdAndDelete(req._id)
    res.cookie("accessToken", "", {maxAge : 0}).cookie("refreshToken", "", {maxAge : 0})
    return res.status(204).json(new ApiResponse(204, {}, "Account Deleted Successfully"))
})

const updateAvatar = asyncHandler (async(req, res)=>{
    const user = await User.findById(req._id)
    if(!user)
        throw new ApiError(400, "User not exists")
    const folder = `/${CloudinaryFolderEnum.AVATAR}/${user._id}`
    if(!user.avatar){
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path, folder)
        user.avatar = cloudinaryResponse.secure_url
        await user.save()
    }else{
        await replaceOnCloudinary(user.avatar, req.file.path, folder)
    }
    // console.log(cloudinaryResponse)
    return res.status(200).json(new ApiResponse(200, {}, "Profile Picture Updated"))
})

const deleteAvatar = asyncHandler (async(req, res)=>{
    const user = await User.findById(req._id)
    const folder = `${CloudinaryFolderEnum.AVATAR}/${user._id}`
    if(!user)
        throw new ApiError(400, "User not exists")
    if(user.avatar){
        const cloudinaryResponse = await destroyOnCloudinary(user.avatar, folder)
        console.log(cloudinaryResponse)
        if(cloudinaryResponse.result === 'ok')
            user.profilePicture = undefined
        await user.save()
    }
    // else{
    //     throw new ApiError(400, "Profile Image Doesn't exists")
    // }
    // console.log(cloudinaryResponse)
    return res.status(200).json(new ApiResponse(200, {}, "Profile Picture Deleted"))
})


export {
    verifyEmail,
    resendEmailVerification,
    updateAvatar,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    deleteAccount,
    deleteAvatar,
    me,
}


