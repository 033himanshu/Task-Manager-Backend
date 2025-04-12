import express from "express"
import {
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
} from './user.controller.js'

import {userUpdateProfileValidator, userUpdateCurrentPasswordValidator} from "../../validators/index.js"
import  {validate} from "../../middlewares/validator.middleware.js"


import multer from "multer"
const upload = multer({ dest: 'uploads/' })



import { verifyJWT } from "../../middlewares/authorize.js"
const router = express.Router()

router.get('/verify/:email-:token', verifyEmail)
//secured routes
router.use(verifyJWT)
router.post('/resend-email', resendEmailVerification)
router.get('/me', me)
router.post('/update-profile', userUpdateProfileValidator(), validate, updateProfile)
router.post('/update-avatar', upload.single('avatar'), updateAvatar)
router.post('/delete-avatar', deleteAvatar)
router.post('/update-password', userUpdateCurrentPasswordValidator(), validate, updatePassword)
router.post('/forgot-password', userForgotPasswordValidator(), validate, forgotPassword)
router.post('/reset-password/:email-:token', resetPassword)
router.post('/delete-account', deleteAccount)


export default router