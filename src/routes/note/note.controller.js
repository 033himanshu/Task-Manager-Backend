import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import {Note} from '../../models/note.model.js'


const addNote = asyncHandler(async (req, res)=>{
    const {projectId, content} = req.body
    const createdBy = req._id
    const note = await Note.create({project: projectId, createdBy, content})
    return res.status(201).json(new ApiResponse(201, {...note}, "Board Updated"))
})

const updateNote = asyncHandler(async (req, res)=>{
    const {content, noteId} = req.body
    const note = await Note.findById(noteId)
    if(!note)
        throw new ApiError(404, "Note not exists")
    note.content = content
    await note.save()
    return res.status(200).json(new ApiResponse(201, {}, "Note Updated"))
})

const deleteNote = asyncHandler(async (req, res)=>{
    const {noteId} = req.body
    await Note.findByIdAndDelete(noteId)
    return res.status(204).json(new ApiResponse(201, {}, "Note Deleted"))
})

export {
    addNote,
    updateNote,
    deleteNote,
}