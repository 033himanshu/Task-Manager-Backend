import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import {User} from '../../models/user.model.js'
import { ProjectMember } from '../../models/projectMember.model.js'
import {ProjectMemberStatusEnum, UserRolesEnum} from '../../utils/constants.js'
import mongoose from "mongoose"
import { deleteAllBoards, deleteAllNotes, deleteAllProjectMembers } from '../../utils/deletionHandling.js'
import { Task } from '../../models/task.model.js'
import { Board } from '../../models/board.model.js'
import {TaskStatusEnum} from '../../utils/constants.js'
import { isTokenMatch } from '../../utils/temporaryToken.js'
import { isUserExist } from '../../utils/userVerification.js'


const getAllProjectsDetails = async (userId)=>{
    try {
        return await ProjectMember.aggregate([
            {
              $match:{
                user: new mongoose.Types.ObjectId(userId)
              }
            },
            {
              $lookup:{
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project_details"
              }
            },
            {
              $unwind : "$project_details"
            },
                {
              $lookup:{
                from: "projectmembers",
                localField: "project",
                foreignField: "project",
                as: "members"
              },
            },
            {
              $project : {
                _id : "$project_details._id",
                name : "$project_details.name",
                description : "$project_details.description",
                role : 1,
                createdAt: 1,
                memberCnt :{ $size : "$members" }
              }           
            },
          ])

    } catch (error) {
        throw new ApiError(501, `Error while get All Project Details, ${error}`)
    }
}

const getAllDetailsOfProject = async (projectId) => {
  try {
    return await Project.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(projectId) }
      },
      {
        $facet: {
          projectDetails : [
            {
              $match: { _id: new mongoose.Types.ObjectId(projectId) }
            },
            {
              $project : {
                name : 1,
                description: 1,
              },
            }
          ],
          members: [
            {
              $lookup: {
                from: "projectmembers",
                localField: "_id",
                foreignField: "project",
                as: "projectMembers"
              }
            },
            { $unwind: "$projectMembers" },
            {
              $lookup: {
                from: "users",
                localField: "projectMembers.user",
                foreignField: "_id",
                as: "userDetails"
              }
            },
            { $unwind: "$userDetails" },
            {
              $project: {
                _id: "$userDetails._id",
                username: "$userDetails.username",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar",
                role: "$projectMembers.role"
              }
            }
          ],
          notes: [
            {
              $lookup: {
                from: "notes",
                localField: "_id",
                foreignField: "project",
                as: "notes"
              }
            },
            { $unwind: "$notes" },
            {
              $project: {
                _id: "$notes._id",
                content: "$notes.content",
                createdBy: "$notes.createdBy"
              }
            }
          ],
          boardDetails: [
            { $unwind: "$boards" },
            {
              $lookup: {
                from: "boards",
                localField: "boards",
                foreignField: "_id",
                as: "boardDetails"
              }
            },
            { $unwind: "$boardDetails" },
            {
              $lookup: {
                from: "tasks",
                localField: "boardDetails.tasks",
                foreignField: "_id",
                as: "taskDetails"
              }
            },
            { $unwind: { path: "$taskDetails", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "subtasks",
                localField: "taskDetails.subTasks",
                foreignField: "_id",
                as: "taskDetails.subTasks"
              }
            },
            {
              $group: {
                _id: "$boardDetails._id",
                name: { $first: "$boardDetails.name" },
                description: { $first: "$boardDetails.description" },
                createdBy: { $first: "$boardDetails.createdBy" },
                tasks: {
                  $push: {
                    _id: "$taskDetails._id",
                    title: "$taskDetails.title",
                    description: "$taskDetails.description",
                    assignedTo: "$taskDetails.assignedTo",
                    assignedBy: "$taskDetails.assignedBy",
                    attachments: "$taskDetails.attachments",
                    subTasks: {
                      $map: {
                        input: "$taskDetails.subTasks",
                        as: "st",
                        in: "$$st._id"  // Only include IDs
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      },
      {
        $project: {
          name: { $first: "$projectDetails.name" },
          description: {$first : "$projectDetails.description"},
          members: "$members",
          notes: "$notes",
          boards: "$boardDetails",
        }
      }
    ]);
  } catch (error) {
    throw new ApiError(501, `Error while get All Details of Project, ${error}`);
  }
};

const getBoardsWithTaskDetails = async (projectId) => {
    try {
        return await Project.aggregate([
            {
                $match : {_id : new mongoose.Types.ObjectId(projectId)}
            },
            {
                $lookup: {
                  from: "boards",
                  localField: "boards",
                  foreignField: "_id",
                  as: "boards"
                }
              },
              {
                $unwind: "$boards"
              },
              {
                $lookup: {
                  from: "tasks",
                  localField: "boards.tasks",
                  foreignField: "_id",
                  as: "boards.tasks"
                }
              },
              {
                $project: {
                  _id: 1,
                  boards: {
                    _id: "$boards._id",
                    name: "$boards.name",
                    tasks: {
                      $map: {
                        input: "$boards.tasks",
                        as: "task",
                        in: {
                          _id: "$$task._id",
                          subTasks: "$$task.subTasks"
                        }
                      }
                    }
                  }
                }
              },
              {
                $group: {
                  _id: "$_id",
                  boards: { $push: "$boards" }
                }
              }
            ])
    } catch (error) {
        throw new ApiError(501, `Error while get All Details of Project, ${error}`)
    }
}


const createNewProject = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    const createdBy = req._id
    const existingProject = await Project.findOne({name, createdBy})
    if(existingProject){
        throw new ApiError(409, "Project already Exists with same name")
    }

    const todoBoard = await Board.create({name : TaskStatusEnum.TODO, description: TaskStatusEnum.TODO, createdBy})
    const inProgressBoard = await Board.create({name : TaskStatusEnum.IN_PROGRESS, description: TaskStatusEnum.IN_PROGRESS, createdBy})
    const completedBoard = await Board.create({name:TaskStatusEnum.DONE, description: TaskStatusEnum.DONE, createdBy})
    const boards = [todoBoard._id, inProgressBoard._id, completedBoard._id]
    const project = await Project.create({name, description,createdBy, boards}) 
    await ProjectMember.create({user: createdBy, project: project._id, role: UserRolesEnum.ADMIN, status : ProjectMemberStatusEnum.ACCEPTED})
    
    return res.status(201).json(new ApiResponse(201, {projectId: project._id}, "Project Created"))
})

const updateProjectDetails = asyncHandler(async (req, res)=>{
  console.log("Updating project details")
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
    console.log(req.project.toObject())
    return res.status(200).json(new ApiResponse(200, req.project.toObject(), "Project Details updated"))
})


const addMemberToProject = asyncHandler(async (req,res)=>{
    const {userId, projectId, role} = req.body

    let user = undefined
    try{
      user = await isUserExist(userId)
    }catch(error){
      throw error
    }

    let projectMember = await ProjectMember.findOne({user:user._id, project: projectId})
    if(projectMember.status === ProjectMemberStatusEnum.ACCEPTED)
        throw new ApiError(409, `Member Already exist in Project`)
    else if(projectMember.status === ProjectMemberStatusEnum.PENDING){
        if(projectMember.tokenExpiry < Date.now())
            await projectMember.deleteOne()
        throw new ApiError(409, `Already Requested, Request is Pending`)
    }
    console.log(req.project.name, user)
    projectMember = await ProjectMember.create({user: user._id, project: projectId, role })
    await projectMember.SendJoinProjectRequestMail(req.project.name, user)
    return res.status(201).json(new ApiResponse(201, projectMember.toObject(), "Member Added in Project"))
})

const acceptRequest = asyncHandler (async (req, res)=>{
  let {projectMemberId, token } = req.params
  const member = await ProjectMember.findById(projectMemberId)

  if(!member)
      throw new ApiError(400, "Invalid Request")
  
  if(member.status !== ProjectMemberStatusEnum.PENDING)
      throw new ApiError(422, "User Already Reacted")
  if(member.tokenExpiry<Date.now() ){
      member.requestToken = undefined
      user.tokenExpiry = undefined
      throw new ApiError(422, "Request Link Expired")
  }
  if(!isTokenMatch(token, member.requestToken))
      throw new ApiError(400, "Invalid Token")

  member.requestToken = undefined
  member.tokenExpiry = undefined
  member.status = ProjectMemberStatusEnum.ACCEPTED
  await member.save()
  return res.status(200).json( new ApiResponse(200, {}, "Request Accepted..."))
})
const rejectRequest = asyncHandler (async (req, res)=>{
  let {projectMemberId, token } = req.params
  const member = await ProjectMember.findById(projectMemberId)

  if(!member)
      throw new ApiError(400, "Invalid Request")
  
  if(member.status !== ProjectMemberStatusEnum.PENDING)
      throw new ApiError(422, "User Already Accepted")
  if(member.tokenExpiry<Date.now() ){
      member.requestToken = undefined
      user.tokenExpiry = undefined
      throw new ApiError(422, "Request Link Expired")
  }
  if(!isTokenMatch(token, member.requestToken))
      throw new ApiError(400, "Invalid Token")

  // member.requestToken = undefined
  // member.tokenExpiry = undefined
  // member.status = ProjectMemberStatusEnum.ACCEPTED
  await member.deleteOne()
  return res.status(200).json( new ApiResponse(200, {}, "Request Rejected..."))
})

const updateMemberRole = asyncHandler(async (req, res)=>{
    const {userId, projectId, role} = req.body

    if((new mongoose.Types.ObjectId(userId)).equals(req.project.createdBy))
        throw new ApiError(400, "Can't Update Admin's Role")
    let user  = undefined
    try{
      user = await isUserExist(userId)
    }catch(error){
      throw error
    }
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
    const assignedTasks = await Task.find({assignedTo : userId})
    // if(assignedTask){
    //     throw new ApiError(422, "Member Assigned to some task, can't removed")
    // }
    await Promise.all(assignedTasks.map(async task => {
        task.assignedTo = undefined
        return await task.save()
    } ))
    await ProjectMember.findOneAndDelete({user:user._id, project: projectId})
    return res.status(204).json(new ApiResponse(204, {}, "Member Removed"))
})

const projectDetails =asyncHandler(async (req, res)=>{
    // const {projectId} = req.body

    // const projectDetails = await getAllDetailsOfProject(projectId)
    // return res.status(200).json(new ApiResponse(200, projectDetails[0], "Project Details Fetched"))
    return res.status(200).json(new ApiResponse(200, req.project.toObject(), "Project Details Fetched"))
})

const deleteProject = asyncHandler(async (req, res)=>{
    const projectId = req.body.projectId
    const boardDetails = await getBoardsWithTaskDetails(projectId)
    console.log('board Details: ',boardDetails) 
    if(boardDetails.length!==0 && boardDetails[0]?.boards){
        console.log(boardDetails[0].boards)
        await deleteAllBoards(boardDetails[0].boards)
    }
    await deleteAllNotes(projectId)
    await deleteAllProjectMembers(projectId)
    await req.project.deleteOne()

    return res.status(201).json(new ApiResponse(204,{}, "Project Deleted"))
})

const allProjects = asyncHandler(async (req, res)=>{
    const projects = await getAllProjectsDetails(req._id)
    console.log(projects)
    return res.status(200).json(new ApiResponse(200, {projects}, "All Projects"))
})

export {
    createNewProject,
    updateProjectDetails,
    addMemberToProject,
    acceptRequest,
    rejectRequest,
    updateMemberRole,
    removeMember,
    projectDetails,
    deleteProject,
    allProjects,
}