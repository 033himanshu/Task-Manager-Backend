import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import {Board} from '../../models/board.model.js'
import { ProjectMember } from '../../models/projectMember.model.js'
import { Task } from '../../models/task.model.js'
import {CloudinaryFolderEnum} from '../../utils/constants.js'
import {uploadOnCloudinary, destroyOnCloudinary} from '../../utils/cloudinary.js'
import { SubTask } from '../../models/subTask.model.js'


const createTask = asyncHandler(async (req, res)=>{
    const {title, description, assignedTo, projectId} = req.body
    const member = await ProjectMember.findOne({project: projectId, user:  assignedTo})
    if(!member)
        throw new ApiError(404, "Member Not found in Project Member")
    const task = await Task.create({title, description, assignedTo, assignedTo: req._id})
    await req.board.tasks.push(task._id)
    await req.board.save()
    return res.status(201).json(new ApiResponse(201, {task}, "Task Created"))
})
const updateTask = asyncHandler(async (req, res)=>{
    const {title, description} = req.body
    req.task.title = title
    req.task.description = description
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, {}, "Task Updated"))
})
const taskDetails = asyncHandler(async (req, res)=>{
    return res.status(200).json(new ApiResponse(200, {...req.task}, "Task Details"))
})

const addAttachments = asyncHandler(async (req, res)=>{
    const {taskId} = req.body
    const files = req.files
    if(!files || files.length===0)
        throw new ApiError(400, "No file uploaded")
    
    files.forEach(async (file) =>{
        const folder = `/${CloudinaryFolderEnum.ATTACHMENTS}/${taskId}`
        const cloudinaryResponse = await uploadOnCloudinary(file.path, folder)
        console.log(cloudinaryResponse)
        req.task.attachments.push({
            url : cloudinaryResponse.secure_url,
            mimetype: cloudinaryResponse.mimetype,
            size : cloudinaryResponse.size
        })
    })
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, {...req.task}, "Files added"))
})
const deleteAttachment = asyncHandler(async (req, res)=>{
    const {attachmentIndex} = req.body
    if(attachmentIndex<0 || attachmentIndex>=req.task.attachments.length)
        throw new ApiError(400, "Invalid Attachment Index")

    const folder = `/${CloudinaryFolderEnum.ATTACHMENTS}/${taskId}`
    const attachmentUrl = req.task.attachments[attachmentIndex]
    const cloudinaryResponse = await destroyOnCloudinary(attachmentUrl, folder)
    console.log(cloudinaryResponse)
    if(cloudinaryResponse.result === 'ok')
        req.task.attachments.splice(attachmentIndex, 1)
    await req.task.save()
    res.status(200).json(new ApiResponse(200, {}, "Attachment Deleted"))
})


const updateAssignedMember = asyncHandler(async (req, res)=>{
    const {projectId, assignedTo} = req.body
    const member = await ProjectMember.findOne({project: projectId, user:  assignedTo})
    if(!member)
        throw new ApiError(404, "Member Not found in Project Member")
    req.task.assignedTo = assignedTo
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, {}, "Assinged Member updated"))
})

const changeBoardAndPosition = asyncHandler(async (req, res)=>{
    const {taskId, boardId, newBoardId, newIndex} = req.body

    let newBoard = undefined
    if(newBoardId === boardId)
        newBoard = req.board
    else
        newBoard = await Board.findById(newBoardId)

    if(!newBoard)
        throw new ApiError(404, "New Board Doesn't exists")
    if(newIndex<0 || newIndex > newBoard.tasks.length)
        throw new ApiError(400, "Invalid Index")

    let boardLength = req.board.tasks.length
    req.board.tasks = req.board.tasks.filter(id => id !== taskId)
    if(req.board.tasks.length === boardLength){
        throw new ApiError(404, "Task not belongs to this board")
    }
    newBoard.tasks.splice(newIndex, 0, taskId)
    await newBoard.save()
    await req.board.save()
    return res.status(200).json(200, {}, "Board and Position Changed")
})
const deleteTask = asyncHandler(async (req, res)=>{
    await Task.findByIdAndDelete(req.taskId)
    // TODO: delete all Subtasks
    // TODO: remove task from board
    return res.status(204).json(new ApiResponse(204, {}, "Task Deleted"))
})
const createSubTask = asyncHandler (async (req, res)=>{
    const {title} = req.body
    const createdBy = req._id
    const subTask = await SubTask.create({title, createdBy})
    req.task.subTasks.push(subTask._id)
    await req.task.save()
    return res.status(201).json(new ApiResponse(201, {subTask}, "SubTask Created"))
})
const updateSubTask = asyncHandler(async (req, res)=>{
    const {title, isCompleted} = req.body
    req.subTask.title = title
    req.subTask.isCompleted = isCompleted
    await req.subTask.save()
    return res.status(200).json(new ApiResponse(200, {}, "subTask Updated"))
})
const subTaskDetails = asyncHandler(async (req, res)=>{
    return res.status(200).json(new ApiResponse(200, {...req.subTask}, "SubTask Details"))
})

const updateSubTaskPosition = asyncHandler(async (req, res)=>{
    const {newIndex, subTaskId} = req.body
    if(newIndex<0 || newIndex>=req.task.subTasks.length)
        throw new ApiError(400, "Invalid Index")

    req.task.subTasks = req.tasks.subTasks.filter(id => id!==subTaskId)
    req.task.subTasks.splice(newIndex, 0, subTaskId)
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, {}, "Update SubTaskPosition"))
})
const deleteSubTask = asyncHandler(async (req, res)=>{
    const {subTaskId} = req.body
    await SubTask.findByIdAndDelete(subTaskId)
    req.task.subTasks = req.tasks.subTasks.filter(id => id!==subTaskId)
    await req.task.save()
    return res.status(204).json(new ApiResponse(204, {}, "SubTask deleted"))
})
export {
    createTask,
    updateTask,
    taskDetails,
    addAttachments,
    deleteAttachment,
    updateAssignedMember,
    changeBoardAndPosition,
    deleteTask,
    createSubTask,
    updateSubTask,
    subTaskDetails,
    updateSubTaskPosition,
    deleteSubTask,
}