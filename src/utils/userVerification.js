import { User } from "../models/user.model.js"
import { ApiError } from "./api-error.js"

export const isUserExist = async (userId) => {
    const user = await User.findById(userId)
    if(!user)
        throw new ApiError(404, "User Not Found")
    if(!user.isEmailVerified)
        throw new ApiError(422, "Email not Verified")
    return user
}