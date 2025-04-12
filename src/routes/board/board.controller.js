import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import { Board } from '../../models/board.model.js'

const findBoardWithName = async (projectId, name) => {
    return await Project.aggregate([
        {
            $match: { _id: projectId } 
        },
        {
            $lookup: {
                from: "boards",
                localField: "board",
                foreignField: "_id",
                as: "boardDetails"
            }
        },
        {
            $project: {
                boardMatch: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: "$boardDetails",
                                as: "b",
                                cond: { $eq: ["$$b.name", name] }
                            }
                        }
                    },0]
                }
            }
        }
    ])
}

const addBoard = asyncHandler(async (req, res)=>{
    const {name, description, projectId} = req.body
    const createdBy = req._id
    const result = await findBoardWithName(projectId, name)
    if(result[0]?.boardMatch){
        throw new ApiError(409, "Board already exists with same name")
    }
    const board = await Board.create({name, description, createdBy}).select("_id")
    req.project.board.push(board._id)
    await req.project.save()
    return res.status(201).json(new ApiResponse(201, {...board}, "New Board Created"))
})


const updateBoardDetails = asyncHandler(async (req, res)=>{
    const {name, description, projectId, boardId} = req.body

    if(req.board.name != name){
        const result = await findBoardWithName(projectId, name)
        if(result[0]?.boardMatch){
            throw new ApiError(409, "Can't Update, Board already exists with same name")
        }
    }
    req.board.name = name
    req.board.description = description
    await req.board.save()
    return res.status(201).json(new ApiResponse(201, {...board}, "Board Updated"))
})

const updateBoardPosition = asyncHandler(async (req, res)=>{
    const {boardId, projectId, newIndex} = req.body
    let boardLength = req.project.board.length
    if(newIndex<0 || newIndex>=boardLength)
        throw new ApiError(400, "Invalid Index")

    req.project.board = req.project.board.filter(bId => bId !== boardId)
    req.project.board.splice(newIndex, 0, boardId);
    await req.project.save()
    return res.status(200).json(new ApiResponse(200, {}, "Board Position Updated"))
})

const deleteBoard = asyncHandler(async (req, res)=>{
    return res.status(501).json(501, {}, "Not Implemented yet, Sorry for incovinience")
})
const boardDetails = asyncHandler(async (req, res)=>{
    return res.status(200).json(new ApiResponse(200, {...req.board}, "Board Details Fetched Successfully"))
})

export {
    addBoard,
    updateBoardPosition,
    updateBoardDetails,
    deleteBoard,
    boardDetails,
}