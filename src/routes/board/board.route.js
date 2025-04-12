import express from "express"
const router = express.Router()

import {
    addNewBoard,
    changeBoardPosition,
    deleteBoard,
    changeBoardDescription,
    changeBoardName,
    boardDetails,
} from './board.controller.js'

// import {
//     createProjectValidator,
//     changeProjectNameValidator,
//     addMemberToProjectValidator,
//     changeMemberRoleValidator,
// } from '../../validators/index.js'
// import  {validate} from '../../middlewares/validator.middleware.js'



import {verifyJWT, verifyProjectAdmin} from '../../middlewares/authorize.js'
router.use(verifyJWT)
router.use(verifyProjectAdmin)

router.post('/add-new-board', addNewBoard)
router.patch('/change-board-position', changeBoardPosition)
router.delete('/delete-board', deleteBoard)
router.patch('/change-board-name', changeBoardName)
router.board('/change-board-description', changeBoardDescription)
router.get('/get-board', boardDetails)



export default router