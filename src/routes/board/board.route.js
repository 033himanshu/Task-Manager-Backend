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
    addBoardValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'



import {verifyJWT, verifyProjectAdmin, verifyBoardExist} from '../../middlewares/authorize.js'
router.use(verifyJWT)
router.use(verifyProjectAdmin)

router.post('/add-board', addBoardValidator(), validate, addBoard)

router.use(verifyBoardExist)
router.patch('/update-board-position', updateBoardPosition)
router.delete('/delete-board', deleteBoard)
router.patch('/update-board-details', addBoardValidator(), validate, updateBoardDetails)
router.get('/get-board', boardDetails)



export default router