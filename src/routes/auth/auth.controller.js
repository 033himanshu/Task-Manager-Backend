import {User} from '../../models/user.model.js'
import { asyncHandler } from "../../utils/async-handler.js"
import {ApiError} from "../../utils/api-error.js"
import {ApiResponse} from '../../utils/api-response.js'
import jwt from 'jsonwebtoken'

const cookieOptions = {
    httpOnly : true,
    secure : true,
}


const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken = refreshToken
        await user.save()
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating token")
    }
}



const register = asyncHandler(async (req, res)=>{
    let {email, fullName, username, password } = req.body

    // check whether email Already exists in db
    const existingUser = await User.aggregate([
        {
            $match : {
                $or : [{email}, {username}]
            },
        }
    ])
    if(existingUser.length!==0){
        throw new ApiError(409, "Username or email already Exists")
    }

    //create user
    let user = await User.create({email, fullName, username, password })
    //send success
    return res.status(201).json(new ApiResponse(201, {id: user._id}, "User Registered Successfully"))
})

const login = asyncHandler(async (req, res)=>{
    let {email, password, username} = req.body
    console.log({email, password, username} )
    //email password should not be empty
    if((!email && !username) || !password)
        throw new ApiError(400, '(username or email) and password are required')

    // finding user
    const user = await User.findOne({$or : [{email}, {username}]})
    if(!user || !(await user.isPasswordCorrect(password)))
        throw new ApiError(404, "Wrong Credentials")

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    res.cookie("accessToken", accessToken, cookieOptions).cookie("refreshToken", refreshToken, cookieOptions)
    return res.status(200).json(new ApiResponse(200, {id:user._id, accessToken, refreshToken}, "Login Successfull"))
})

const logout = asyncHandler(async (req, res)=>{
    res.cookie("accessToken", "", {maxAge : 0}).cookie("refreshToken", "", {maxAge : 0})
    const user = await User.findById(req._id)
    if(user){
        user.refreshToken = undefined
        await user.save()
        return res.status(200).json(new ApiResponse(200, {}, "Logout Successfull"))
    }else
        throw new ApiError(404, "User not found")
})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req?.headers?.authorization?.split(' ')[1]
    console.log(token)
    if(!token)
        throw new ApiError(401, "Token not found")

    try {
        const data = jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET)           
        const user = await User.findById(data._id)
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
        res.cookie("accessToken", accessToken, cookieOptions).cookie("refreshToken", refreshToken, cookieOptions)
        return res.status(200).json( new ApiResponse(200, {id:user._id, accessToken, refreshToken}, "Token Refreshed"))
    } catch (error) {
        throw new ApiError(401, "User Not Authorized")
    }
})


export {
    register,
    login,
    logout,
    refreshAccessToken,
}


