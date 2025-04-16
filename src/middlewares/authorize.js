import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import {Project} from "../models/project.model.js"
import {Board} from "../models/board.model.js"
import { ProjectMember } from "../models/projectMember.model.js"
import { UserRolesEnum } from "../utils/constants.js"
import { Task } from "../models/task.model.js"
import { SubTask } from "../models/subTask.model.js"
import mongoose from "mongoose"

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

export const verifyAdmin = asyncHandler( async (req, res, next)=>{
    if(req.role !== UserRolesEnum.ADMIN){
        throw new ApiError(403, "Only Admin can remove member")
    }
    next()
})
export const verifyProjectAdmin = asyncHandler(async (req, res, next)=>{
    if(req.role === UserRolesEnum.PROJECT_ADMIN || req.role === UserRolesEnum.ADMIN) {
        next()
    }
    else
        throw new ApiError(403, "Not Authorized to Perform Action")
})
export const verifyProjectMember = asyncHandler(async (req, res, next)=>{
    const {projectId} = req.body
    const existingProject = await Project.findById(projectId)
    if(!existingProject){
        throw new ApiError(404, "Project Not exists")
    }
    const projectMember = await ProjectMember.findOne({user: req._id, project: projectId})
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
        throw new ApiError(400, "Board Not exists")
    }
    req.board = board
    next()
})

export const verifyTaskExist = asyncHandler ( async (req, res, next)=>{
    const {taskId} = req.body
    const castedTaskId = new mongoose.Types.ObjectId(taskId)
    const taskIndex = req.board.tasks.findIndex(tId => castedTaskId.equals(tId))
    if(taskIndex===-1)
        throw new ApiError(400, "task not exist in board")
    const task = await Task.findById(taskId)
    if(!task)
        throw new ApiError(404, "Task Not Found")
    req.task = task
    next()
})

export const verifySubTaskExist = asyncHandler ( async (req, res, next)=>{
    const {subTaskId} = req.body
    const castedSubTaskId = new mongoose.Types.ObjectId(subTaskId)
    const subTaskIndex = req.task.subTasks.findIndex(tId => castedSubTaskId.equals(tId))
    if(subTaskIndex===-1)
        throw new ApiError(400, "SubTask not exist in task")
    const subTask = await SubTask.findById(subTaskId)
    if(!subTask)
        throw new ApiError(404, "SubTask Not Found")
    req.subTask = subTask
    next()
})

export const verifyAssignedTaskMember = asyncHandler (async (req, res, next)=>{
    console.log(req.role)
    if(req.role === UserRolesEnum.PROJECT_ADMIN || req.role === UserRolesEnum.ADMIN || req.task.assignedTo === req._id) {
        next()
    }
    else
        throw new ApiError(403, "Not Authorized to Perform Action")
})