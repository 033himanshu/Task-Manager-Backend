import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import { Board } from '../../models/board.model.js'

const addNewBoard = asyncHandler(async (req, res)=>{
    const {name, description, projectId} = req.body
    const createdBy = req._id
    const result = await Project.aggregate([
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
    if(result[0]?.boardMatch){
        throw new ApiError(409, "Board already exists with same name")
    }
    const board = await Board.create({name, description, createdBy}).select("_id")
    req.project.board.push(board._id)
    await req.project.save()
    return res.status(201).json(new ApiResponse(201, {}, "New Board Created"))
})

const changeBoardPosition = asyncHandler(async (req, res)=>{
    
})
const changeBoardName = asyncHandler(async (req, res)=>{
    
})
const changeBoardDescription = asyncHandler(async (req, res)=>{
    
})
const deleteBoard = asyncHandler(async (req, res)=>{
    
})
const boardDetails = asyncHandler(async (req, res)=>{
    
})

export {
    addNewBoard,
    changeBoardPosition,
    changeBoardName,
    changeBoardDescription,
    deleteBoard,
    boardDetails,
}