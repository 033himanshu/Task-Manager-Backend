import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import {User} from '../../models/user.model.js'
import { ProjectMember } from '../../models/projectMember.model.js'
import {UserRolesEnum} from '../../utils/constants.js'


const createNewProject = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    const createdBy = req._id
    const existingProject = await Project.find({name, createdBy})
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
    return res.status(200).json(new ApiResponse(200, {}, "Project Details updated"))
})


const addMemberToProject = asyncHandler(async (req,res)=>{
    const {email, projectId, role} = req.body

    const user = await User.find({email})
    if(!user)
        throw new ApiError(404, "Member not exists")

    const projectMember = await ProjectMember.find({user:user._id, project: projectId})
    if(projectMember)
        throw new ApiError(409, `Member Already exist in Project`)
    await ProjectMember.create({user: user._id, project: projectId, role})
    return res.status(201).json(new ApiResponse(201, {}, "Member Added in Project"))
})

const updateMemberRole = asyncHandler(async (req, res)=>{
    const {userId, projectId, role} = req.body

    const user = await User.findById(userId)
    if(!user)
        throw new ApiError(404, "Member not exists")

    const projectMember = await ProjectMember.find({user:user._id, project: projectId})
    if(!projectMember)
        throw new ApiError(404, `Member not exists in Project`)
    projectMember.role = role
    await projectMember.save()
    return res.status(200).json(new ApiResponse(200, {}, "Member Role updated"))
})

const removeMember = asyncHandler(async (req, res)=>{
    const {userId, projectId} = req.body

    const user = await User.findById(userId)
    if(!user)
        throw new ApiError(404, "Member not exists")

    await ProjectMember.findOneAndDelete({user:user._id, project: projectId})

    return res.status(204).json(new ApiResponse(204, {}, "Member Removed"))
})

const projectDetails =asyncHandler(async (req, res)=>{
    const {projectId} = req.body

    const projectMembers = await ProjectMember.aggregate([
        {
            $match : {project: projectId}
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
                board: 1,
            }
        }
    ])
    // TODO : 
    return res.status(200).json(new ApiResponse(200, {projectMembers}, "Project Details Fetched"))
})

const deleteProject = asyncHandler(async (req, res)=>{
    
    return res.status(501).json(501, {}, "Not Implemented yet, Sorry for incovinience")
})






export {
    createNewProject,
    updateProjectDetails,
    addMemberToProject,
    updateMemberRole,
    removeMember,
    projectDetails,
    deleteProject,
}