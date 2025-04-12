import express from "express"
const router = express.Router()

import {
    createNewProject,
    changeProjectName,
    changeDescription,
    addMemberToProject,
    changeMemberRole,
    removeMember,
    projectDetails,
    deleteProject,
} from './project.controller.js'

import {
    createProjectValidator,
    changeProjectNameValidator,
    addMemberToProjectValidator,
    changeMemberRoleValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'


import {verifyJWT, verifyProjectAdmin} from '../../middlewares/authorize.js'
router.use(verifyJWT)

router.post('/create-new-project', createProjectValidator(), validate, createNewProject)
router.use(verifyProjectAdmin)
router.patch('/change-project-name', changeProjectNameValidator(), validate, changeProjectName)
router.patch('/change-description', changeDescription)
router.post('/add-member-to-project', addMemberToProjectValidator(), validate, addMemberToProject)
router.patch('/change-member-role', changeMemberRoleValidator(), validate, changeMemberRole)
router.delete('/remove-member', removeMember)
router.delete('/delete-project', deleteProject)
router.get('/project-details', projectDetails)


export default router