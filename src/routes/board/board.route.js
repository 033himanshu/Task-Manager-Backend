import express from "express"
const router = express.Router()

import {
    addBoard,
    updateBoardPosition,
    deleteBoard,
    updateBoardDetails,
    boardDetails,
} from './board.controller.js'

import {
    boardValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'



import {verifyJWT, verifyProjectAdmin, verifyBoardExist, verifyProjectMember, isUserVerified} from '../../middlewares/authorize.js'
router.use(verifyJWT)
router.use(isUserVerified)
router.use(verifyProjectMember)
router.post('/add-board', verifyProjectAdmin, boardValidator(), validate, addBoard)
//verify board exists
router.use(verifyBoardExist)
router.post('/get-board', boardDetails)
router.use(verifyProjectAdmin)
router.patch('/update-board-position', updateBoardPosition)
router.delete('/delete-board', deleteBoard)
router.patch('/update-board-details', boardValidator(), validate, updateBoardDetails)



export default router