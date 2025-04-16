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
                $match : {_id : new mongoose.Types.ObjectId(projectId)}
            },
            {
                $facet: {
                    members :   [
                        {
                            $lookup : {
                                from : "projectmembers",
                                localField : "_id",
                                foreignField : "project",
                                as : "projectMembers"
                            },
                        },
                        {
                            $unwind : "$projectMembers"
                        },
                        {
                            $project : {
                                role : "$projectMembers.role",
                                user : "$projectMembers.user",
                                _id : 0
                            }
                        },
                        {
                            $lookup : {
                                from : "users",
                                localField : "user",
                                foreignField : "_id",
                                as : "userDetails"
                            }
                        },
                        {
                            $unwind : "$userDetails",
                        },
                        {
                            $project : {
                                  role : 1,
                                _id : "$userDetails._id",
                                  username: "$userDetails.username",
                                  email : "$userDetails.email",
                                  fullName: "$userDetails.username",
                                  avatar : "$userDetails.avatar",
                            }
                        },
                      ],
                          notes :  [
                        {
                            // geting projectMEmbers
                            $lookup : {
                                from : "notes",
                                localField : "_id",
                                foreignField : "project",
                                as : "notes"
                            },
                        },
                        {
                            $unwind : "$notes"
                        },
                        {
                            $project : {
                                content : "$notes.content",
                                createdBy : "$notes.createdBy",
                                _id : "$notes._id"
                            }
                        },
                      ],
                      board : [
                        {
                          $unwind : "$board"
                        },
                        {
                           $lookup : {
                              from : "boards",
                              localField : "board",
                              foreignField : "_id",
                              as : "boardDetails"
                            },
                        },
                        {
                           $unwind : "$boardDetails"
                        },
                      {
                        $lookup: {
                          from: "tasks",
                          localField: "boardDetails.tasks",
                          foreignField: "_id",
                          as: "tasks"
                        }
                      },
                      {
                        $unwind: {
                          path: "$tasks",
                          preserveNullAndEmptyArrays: true
                        }
                      },
                      {
                        $lookup: {
                          from: "subtasks",
                          localField: "tasks.subTasks",
                          foreignField: "_id",
                          as: "tasks.subTasks"
                        }
                      },
                      {
                        $group: {
                          _id: "$_id",
                          name: { $first: "$name" },
                          description: { $first: "$description" },
                          createdBy: { $first: "$createdBy" },
                          tasks: {
                            $push: {
                              _id: "$tasks._id",
                              title: "$tasks.title",
                              description: "$tasks.description",
                              assignedTo: "$tasks.assignedTo",
                              assignedBy: "$tasks.assignedBy",
                              attachments: "$tasks.attachments",
                              subTasks: "$tasks.subTasks"
                            }
                          }
                        }
                      }
                    ]
                },
            },
            {
              $project: {
                members: "$members",
                notes: "$notes",
                boards: "$board"
              },
              }
        ])
    } catch (error) {
        throw new ApiError(501, `Error while get All Details of Project, ${error}`)
    }
}
const getBoardsWithTaskDetails = async (projectId) => {
    try {
        return await Project.aggregate([
            {
                $match : {_id : new mongoose.Types.ObjectId(projectId)}
            },
            {
                $lookup: {
                  from: "boards",
                  localField: "board",
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

    const projectDetails = await getAllDetailsOfProject(projectId)
    return res.status(200).json(new ApiResponse(200, projectDetails, "Project Details Fetched"))
})

const deleteProject = asyncHandler(async (req, res)=>{
    const projectId = req.body.projectId
    const boardDetails = await getBoardsWithTaskDetails(projectId)
    if(boardDetails.length!==0 && boardDetails[0]?.boards){
        console.log(boardDetails[0].boards)
        await deleteAllBoards(boardDetails[0].boards)
    }
    await deleteAllNotes(projectId)
    await deleteAllProjectMembers(projectId)
    await req.project.deleteOne()

    return res.status(201).json(new ApiResponse(204, boardDetails[0].boards, "Project Deleted"))
})

const allProjects = asyncHandler(async (req, res)=>{
    const projects = await getAllProjectsDetails(req._id)
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