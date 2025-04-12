import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import {Project} from "../models/project.model.js"
import { ProjectMember } from "../models/projectMember.model.js"
import { UserRolesEnum } from "../utils/constants.js"

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
    const {projectId} = req.body
    const existingProject = await Project.findId(projectId)
    if(!existingProject){
        throw new ApiError(404, "Project Not exists")
    }
    const projectMember = await ProjectMember.find({user: req._id, project: projectId})
    if(projectMember && projectMember.role === UserRolesEnum.ADMIN) {
        req.project = existingProject
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