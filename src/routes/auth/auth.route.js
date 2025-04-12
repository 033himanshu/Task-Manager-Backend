import express from "express"

import {
    register,
    login,
    logout,
    refreshAccessToken,
} from "./auth.controller.js"

import {userRegisterValidator, userLoginValidator} from "../../validators/index.js"
import  {validate} from "../../middlewares/validator.middleware.js"


const router = express.Router()
import { verifyJWT } from "../../middlewares/authorize.js"

router.route('/register').post(userRegisterValidator(), validate, register)
router.post('/login', userLoginValidator(), validate, login)
router.post('/refresh-access-token', refreshAccessToken)
//secured routes
router.use(verifyJWT)
router.post('/logout', logout)


export default router