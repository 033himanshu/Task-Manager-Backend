import express from "express"
import {
    verifyEmail,
    resendEmailVerification,
    updateAvatar,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    // deleteAccount,
    deleteAvatar,
    me,
    getUserByPrefix,
} from './user.controller.js'

import {userUpdateProfileValidator, userUpdateCurrentPasswordValidator, userForgotPasswordValidator} from "../../validators/index.js"
import  {validate} from "../../middlewares/validator.middleware.js"


import multer from "multer"
const upload = multer({ dest: 'uploads/' })



import { verifyJWT } from "../../middlewares/authorize.js"
const router = express.Router()

router.get('/verify/:email-:token', verifyEmail)
router.post('/reset-password/', userUpdateCurrentPasswordValidator(), validate, resetPassword)
router.post('/forgot-password', userForgotPasswordValidator(), validate, forgotPassword)
//secured routes
router.use(verifyJWT)
router.post('/resend-email', resendEmailVerification)
router.post('/me', me)
router.post('/update-profile', userUpdateProfileValidator(), validate, updateProfile)
router.post('/update-avatar', upload.single('avatar'), updateAvatar)
router.post('/delete-avatar', deleteAvatar)
router.post('/update-password', userUpdateCurrentPasswordValidator(), validate, updatePassword)
// router.post('/delete-account', deleteAccount) 
// intensionaly removed delete account functionality, because didn't implementated a case that what happened to user's created projects
router.get('/get-user-with-prefix', getUserByPrefix)

export default router