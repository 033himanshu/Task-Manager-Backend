import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import {Project} from "../models/project.model.js"
import { ProjectMember } from "../models/projectMember.model.js"
import { UserRolesEnum } from "../utils/constants.js"
import { Task } from "../models/task.model.js"
import { SubTask } from "../models/subTask.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req?.headers?.authorization?.split(' ')[1]
    if(!token)
        throw new ApiError(401, "User Not Authorized")
    
    try {
        const data = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET)
        req._id = data._id
        next()
    } catch (error) {
        throw new ApiError(401, error ?? "User Not Authorized")
    }
})


export const verifyProjectAdmin = asyncHandler(async (req, res, next)=>{
    if(projectMember.role === UserRolesEnum.PROJECT_ADMIN || projectMember.role === UserRolesEnum.ADMIN) {
        next()
    }
    else
        throw new ApiError(403, "Not Authorized to Perform Action")
})
export const verifyProjectMember = asyncHandler(async (req, res, next)=>{
    const {projectId} = req.body
    const existingProject = await Project.findId(projectId)
    if(!existingProject){
        throw new ApiError(404, "Project Not exists")
    }
    const projectMember = await ProjectMember.find({user: req._id, project: projectId})
    if(projectMember) {
        req.project = existingProject
        req.role = projectMember.role
        next()
    }
    else
        throw new ApiError(403, "Not Authorized to Perform Action")
})

export const verifyBoardExist = asyncHandler( async (req, res, next)=>{
    const {boardId} = req.body
    const board = await Board.findById(boardId)
    if(!board){
        req.board = board
        throw new ApiError(400, "Board Not exists")
    }
    next()
})

export const verifyTaskExist = asyncHandler ( async (req, res, next)=>{
    const {taskId} = req.body
    const task = await Task.findById(taskId)
    if(!task)
        throw new ApiError(404, "Task Not Found")
    req.task = task
    next()
})

export const verifySubTaskExist = asyncHandler ( async (req, res, next)=>{
    const {subTaskId} = req.body
    const subTask = await SubTask.findById(taskId)
    if(!subTask)
        throw new ApiError(404, "SubTask Not Found")
    req.subTask = subTask
    next()
})

export const verifyAssignedTaskMember = asyncHandler (async (req, res, next)=>{
    if(req.role === UserRolesEnum.PROJECT_ADMIN || projectMember.role === UserRolesEnum.ADMIN || req.task.assignedTo === req._id) {
        next()
    }
    else
        throw new ApiError(403, "Not Authorized to Perform Action")
})