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
    allProjects,
    acceptRequest,
    rejectRequest,
} from './project.controller.js'

import {
    createProjectValidator,
    addMemberToProjectValidator,
    updateMemberRoleValidator,
} from '../../validators/index.js'
import  {validate} from '../../middlewares/validator.middleware.js'

import {verifyJWT, verifyProjectAdmin, verifyProjectMember, verifyAdmin, isUserVerified} from '../../middlewares/authorize.js'
router.get('/accept/:projectMemberId-:token', acceptRequest)
router.get('/reject/:projectMemberId-:token', rejectRequest)
router.use(verifyJWT)
router.use(isUserVerified)
router.post('/create-new-project', createProjectValidator(), validate, createNewProject)
router.get('/all-projects', allProjects)
router.use(verifyProjectMember)
router.get('/project-details', projectDetails)
router.use(verifyProjectAdmin)
router.patch('/update-project-details', createProjectValidator(), validate, updateProjectDetails)
router.post('/add-member-to-project', verifyAdmin, addMemberToProjectValidator(), validate, addMemberToProject)
router.patch('/update-member-role', verifyAdmin, updateMemberRoleValidator(), validate, updateMemberRole)
router.delete('/remove-member', verifyAdmin, removeMember)
router.delete('/delete-project', deleteProject)


export default router