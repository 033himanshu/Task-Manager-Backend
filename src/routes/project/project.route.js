import express from "express"
const router = express.Router()

import {
    createNewProject,
    updateProjectDetails,
    addMemberToProject,
    updateMemberRole,
    removeMember,
    projectDetails,
    deleteProject,
} from './project.controller.js'

import {
    createProjectValidator,
    addMemberToProjectValidator,
    updateMemberRoleValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'

import {verifyJWT, verifyProjectAdmin} from '../../middlewares/authorize.js'
router.use(verifyJWT)

router.post('/create-new-project', createProjectValidator(), validate, createNewProject)
router.use(verifyProjectAdmin)
router.patch('/update-project-details', createProjectValidator(), validate, updateProjectDetails)
router.post('/add-member-to-project', addMemberToProjectValidator(), validate, addMemberToProject)
router.patch('/update-member-role', updateMemberRoleValidator(), validate, updateMemberRole)
router.delete('/remove-member', removeMember)
router.delete('/delete-project', deleteProject)
router.get('/project-details', projectDetails)


export default router