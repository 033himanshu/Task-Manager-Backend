import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import {Board} from '../../models/board.model.js'
import { ProjectMember } from '../../models/projectMember.model.js'
import { Task } from '../../models/task.model.js'
import {CloudinaryFolderEnum} from '../../utils/constants.js'
import {uploadOnCloudinary, destroyOnCloudinary, destroyFolderOnCloudinary} from '../../utils/cloudinary.js'
import { SubTask } from '../../models/subTask.model.js'
import mongoose from "mongoose"
import { deleteAllSubTask } from '../../utils/deletionHandling.js'

const createTask = asyncHandler(async (req, res)=>{
    const {title, description, assignedTo, projectId} = req.body
    if(assignedTo){
        const member = await ProjectMember.findOne({project: projectId, user:  assignedTo})
        if(!member)
            throw new ApiError(404, "Member Not found in Project Member")
    }
    const task = await Task.create({title, description, assignedTo, assignedBy: req._id})
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
    return res.status(200).json(new ApiResponse(200, req.task.toObject(), "Task Details"))
})

const addAttachments = asyncHandler(async (req, res)=>{
    const {taskId} = req.body
    const files = req.files
    if(!files || files.length===0)
        throw new ApiError(400, "No file uploaded")
    
    const folder = `/${CloudinaryFolderEnum.ATTACHMENTS}/${taskId}`;

    const attachments = await Promise.all(
        files.map(async (file) => {
            const cloudinaryResponse = await uploadOnCloudinary(file.path, folder);
            return {
                url: cloudinaryResponse.secure_url,
                mimetype: cloudinaryResponse.format,
                size: cloudinaryResponse.bytes,
            };
        })
    );

    req.task.attachments.push(...attachments);
    await req.task.save();

    return res.status(200).json(new ApiResponse(200, req.task.toObject(), "Files added"));

})
const deleteAttachment = asyncHandler(async (req, res)=>{
    const {attachmentId, taskId} = req.body
    const castedId = new mongoose.Types.ObjectId(attachmentId)
    const folder = `${CloudinaryFolderEnum.ATTACHMENTS}/${taskId}`
    const attachmentIndex = req.task.attachments.findIndex(id => (new mongoose.Types.ObjectId(id)).equals(castedId))
    if(attachmentIndex===-1)
        throw new ApiError(404, "Attachment doesn't exist")
    
    const attachmentUrl = req.task.attachments[attachmentIndex].url

    const cloudinaryResponse = await destroyOnCloudinary(attachmentUrl, folder)
    console.log(cloudinaryResponse)
    if(cloudinaryResponse.result === 'ok')
        req.task.attachments.splice(attachmentIndex, 1)
    await req.task.save()
    res.status(200).json(new ApiResponse(200, req.task.toObject(), "Attachment Deleted"))
})


const updateAssignedMember = asyncHandler(async (req, res)=>{
    const {projectId, assignedTo} = req.body
    if(assignedTo){
        const member = await ProjectMember.findOne({project: projectId, user:  assignedTo})
        if(!member)
            throw new ApiError(404, "Member Not found in Project Member")
    }
    req.task.assignedTo = assignedTo
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, {}, "Assinged Member updated"))
})

const changeBoardAndPosition = asyncHandler(async (req, res) => {
    const { taskId, boardId, newBoardId, newIndex } = req.body;

    const castedTaskId = new mongoose.Types.ObjectId(taskId);
    let newBoard;
    if (newBoardId === boardId) {
        newBoard = req.board;
    } else {
        newBoard = await Board.findById(newBoardId);
    }

    if (!newBoard) {
        throw new ApiError(404, "New Board doesn't exist");
    }

    if (newIndex < 0 || newIndex > newBoard.tasks.length) {
        throw new ApiError(400, "Invalid Index");
    }

    const initialLength = req.board.tasks.length;
    req.board.tasks = req.board.tasks.filter(id => !(new mongoose.Types.ObjectId(id)).equals(castedTaskId));

    if (req.board.tasks.length === initialLength) {
        throw new ApiError(404, "Task does not belong to the current board");
    }

    newBoard.tasks.splice(newIndex, 0, castedTaskId);

    await req.board.save();
    if (newBoardId !== boardId) {
        await newBoard.save();
    }

    return res.status(200).json(new ApiResponse(200, req.board.ObjectId(), "Board and Position Changed"));
});

const deleteTask = asyncHandler(async (req, res)=>{
    try {
        const folder = `${CloudinaryFolderEnum.ATTACHMENTS}/${req.body.taskId}`
        console.log(folder)
        await destroyFolderOnCloudinary(folder)
    } catch (error) {
        throw new ApiError(501, "Folder deletion Failed on Cloudinary")
    }
    await deleteAllSubTask(req.task.subTasks)
    req.board.tasks = req.board.tasks.filter(id => !(new mongoose.Types.ObjectId(id)).equals(req.task._id))
    await req.task.deleteOne()
    await req.board.save()
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
    return res.status(200).json(new ApiResponse(200, req.subTask.toObject(), "SubTask Details"))
})

const updateSubTaskPosition = asyncHandler(async (req, res)=>{
    const {newIndex, subTaskId} = req.body
    const castedSubTaskId = new mongoose.Types.ObjectId(subTaskId)
    if(newIndex<0 || newIndex>=req.task.subTasks.length)
        throw new ApiError(400, "Invalid Index")

    req.task.subTasks = req.task.subTasks.filter(id => !(new mongoose.Types.ObjectId(id).equals(castedSubTaskId)))
    req.task.subTasks.splice(newIndex, 0, castedSubTaskId)
    await req.task.save()
    return res.status(200).json(new ApiResponse(200, req.task.toObject(), "Update SubTaskPosition"))
})
const deleteSubTask = asyncHandler(async (req, res)=>{
    const {subTaskId} = req.body
    await req.subTask.deleteOne()
    req.task.subTasks = req.task.subTasks.filter(id => !(new mongoose.Types.ObjectId(id).equals(new mongoose.Types.ObjectId(subTaskId))))
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