import { SubTask } from "../models/subTask.model.js"
import { ApiError } from "./api-error.js"
import { Task } from "../models/task.model.js"
import {CloudinaryFolderEnum} from "./constants.js"
import { destroyFolderOnCloudinary } from "./cloudinary.js"
import { ProjectMember } from "../models/projectMember.model.js"
import {Note} from "../models/note.model.js"

export const deleteAllSubTask = async (subTasks) => { 
    try{
        await SubTask.deleteMany({_id : {$in: subTasks}})
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Subtasks unsuccessfull,\n${error}`)
    }
    console.log("All Subtasks deleted")
}   


export const deleteAllTasks = async (tasks) => {
    try{
        await Promise.all(tasks.map(async task => {
            console.log(task.title)
            console.log(task.subTasks)
            try {
                const folder = `${CloudinaryFolderEnum.ATTACHMENTS}/${task._id}`
                console.log(folder)
                await destroyFolderOnCloudinary(folder)
            } catch (error) {
                throw new ApiError(501, `Folder deletion Failed on Cloudinary, ${error}`)
            }
            return await deleteAllSubTask(task.subTasks)
        }))
    }catch(error){
        throw new ApiError(501, `Deletion Of Many SubTasks unsuccessfull,\n${error}`)
    }
    console.log("Subtasks Deleted for all Tasks")
    const taskIds = tasks.map(task => task._id)
    try{
        await Task.deleteMany({_id : {$in: taskIds}})
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Tasks unsuccessfull,\n${error}`)
    }
    console.log("All Tasks deleted")
}

export const deleteAllBoards = async (boards) => {
    try{
        await Promise.all(boards.map(async board => {
            return await deleteAllTasks(board.tasks)
        }))
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Tasks Boards unsuccessfull,\n${error}`)
    }
    console.log("Tasks Deleted for all Boards")
    const boardIds = boards.map(board => board._id)
    try{
        await Board.deleteMany({_id : {$in: boardIds}})
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Boards unsuccessfull,\n${error}`)
    }
    console.log("All Boards deleted")
}

export const deleteAllProjectMembers = async (projectId) => {
    try{
        await ProjectMember.deleteMany({project : projectId})
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Project Member unsuccessfull,\n${error}`)
    }

}

export const deleteAllNotes = async  (projectId) => {
    try{
        await Note.deleteMany({project : projectId})
    }catch(error){
        throw new ApiError(501, `Deletion Of Many Project Member unsuccessfull,\n${error}`)
    }
}

// export const deleteAllProjects = async (projects) => {

// }

// export const changeAssignedMemberToAdmin = async (task)