import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import {User} from '../../models/user.model.js'
import { ProjectMember } from '../../models/projectMember.model.js'
import {UserRolesEnum} from '../../utils/constants.js'
import mongoose from "mongoose"
import { deleteAllBoards, deleteAllNotes, deleteAllProjectMembers } from '../../utils/deletionHandling.js'
import { Task } from '../../models/task.model.js'

const createNewProject = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    const createdBy = req._id
    const existingProject = await Project.findOne({name, createdBy})
    if(existingProject){
        throw new ApiError(409, "Project already Exists with same name")
    }
    const project = await Project.create({name, description,createdBy})
    await ProjectMember.create({user: createdBy, project: project._id, role: UserRolesEnum.ADMIN})
    
    return res.status(201).json(new ApiResponse(201, {projectId: project._id}, "Project Created"))
})

const updateProjectDetails = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    const createdBy = req._id
    if(req.project.name !== name){
        const existingProject = await Project.findOne({createdBy, name})
        if(existingProject){
            throw new ApiError(409, "Can not create, Project already Exists with same name")
        }
    }
    req.project.name = name
    req.project.description = description
    await req.project.save()
    return res.status(200).json(new ApiResponse(200, req.project.toObject(), "Project Details updated"))
})


const addMemberToProject = asyncHandler(async (req,res)=>{
    const {email, projectId, role} = req.body

    const user = await User.findOne({email})
    if(!user)
        throw new ApiError(404, "Member not exists")

    let projectMember = await ProjectMember.findOne({user:user._id, project: projectId})
    if(projectMember)
        throw new ApiError(409, `Member Already exist in Project`)
    projectMember = await ProjectMember.create({user: user._id, project: projectId, role})
    return res.status(201).json(new ApiResponse(201, projectMember.toObject(), "Member Added in Project"))
})

const updateMemberRole = asyncHandler(async (req, res)=>{
    const {userId, projectId, role} = req.body

    if((new mongoose.Types.ObjectId(userId)).equals(req.project.createdBy))
        throw new ApiError(400, "Can't Update Admin's Role")
    const user = await User.findById(userId)
    if(!user)
        throw new ApiError(404, "Member not exists")
    
    const projectMember = await ProjectMember.findOne({user:user._id, project: projectId})
    if(!projectMember)
        throw new ApiError(404, `Member not exists in Project`)
    projectMember.role = role
    await projectMember.save()
    return res.status(200).json(new ApiResponse(200, projectMember.toObject(), "Member Role updated"))
})

const removeMember = asyncHandler(async (req, res)=>{
    const {userId, projectId} = req.body

    if((new mongoose.Types.ObjectId(userId)).equals(req.project.createdBy))
        throw new ApiError(400, "Can't Delete Admin of Project")
    const assignedTask = await Task.findOne({assignedTo : userId})
    if(assignedTask){
        throw new ApiError(422, "Member Assigned to some task, can't removed")
    }
    await ProjectMember.findOneAndDelete({user:user._id, project: projectId})
    return res.status(204).json(new ApiResponse(204, {}, "Member Removed"))
})

const projectDetails =asyncHandler(async (req, res)=>{
    const {projectId} = req.body

    const projectMembers = await ProjectMember.aggregate([
        {
            $match : {project: new mongoose.Types.ObjectId(projectId)}
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
            }
        },
        {
            $unwind : "$userDetails"
        },
        {
            $project : {
                fullName : "$userDetails.fullName",
                email : "$userDetails.email",
                avatar : "$userDetails.avatar",
                role : 1,
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, {...(req.project.toObject()), projectMembers}, "Project Details Fetched"))
})

const deleteProject = asyncHandler(async (req, res)=>{
    await deleteAllBoards()
    await deleteAllNotes()
    await deleteAllProjectMembers()
    await req.project.deleteOne()
    return res.status(501).json(501, {}, "Project Deleted")
})

const allProjects = asyncHandler(async (req, res)=>{
    const createdBy  = req._id
    const projects = await Project.find({})
    return res.status(200).json(new ApiResponse(200, projects, "All Projects"))
})




export {
    createNewProject,
    updateProjectDetails,
    addMemberToProject,
    updateMemberRole,
    removeMember,
    projectDetails,
    deleteProject,
    allProjects,
}