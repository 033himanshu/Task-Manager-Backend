import {asyncHandler} from '../../utils/async-handler.js'
import {ApiResponse} from '../../utils/api-response.js'
import {ApiError} from '../../utils/api-error.js'
import { Project } from '../../models/project.model.js'
import { Board } from '../../models/board.model.js'
import mongoose from "mongoose"
import { deleteAllTasks } from '../../utils/deletionHandling.js'

const findBoardWithName = async (projectId, name) => {
    
   try {
     return await Project.aggregate([
         {
             $match: { _id: new mongoose.Types.ObjectId(projectId) } 
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
   } catch (error) {
        throw new ApiError(501, `Something went wrong while searching for board with particular name`)
   }
}

const getBoardsAllTasksDetails = async (boardId) => {
    return await Board.aggregate([
        {
            $match: { _id:new mongoose.Types.ObjectId(boardId) } 
        },
        {
            $unwind : "$tasks"
        },
        {
            $lookup: {
                from: "tasks",
                localField: "tasks",
                foreignField: "_id",
                as: "taskDetails"
            }
        },
      {
        $unwind : "$taskDetails"
      },
      {
        $project: {
          title : "$taskDetails.title",
          description : "$taskDetails.description",
          assignedTo : "$taskDetails.assignedTo",
          assignedBy : "$taskDetails.assignedBy",
          subTasks : "$taskDetails.subTasks",
          _id : "$taskDetails._id",
        }
      }
    ])
}

const addBoard = asyncHandler(async (req, res)=>{
    const {name, description, projectId} = req.body
    const createdBy = req._id
    const result = await findBoardWithName(projectId, name)
    console.log(result)
    if(result.length!==0 && result[0].boardMatch){
        throw new ApiError(409, "Board already exists with same name")
    }
    
    const board = await Board.create({name, description, createdBy})
    req.project.boards.push(board._id)
    await req.project.save()
    return res.status(201).json(new ApiResponse(201, req.project.toObject(), "New Board Created"))
})


const updateBoardDetails = asyncHandler(async (req, res)=>{
    const {name, description, projectId, boardId} = req.body

    if(req.board.name !== name){
        const result = await findBoardWithName(projectId, name)
        if(result.length!==0 && result[0].boardMatch){
            throw new ApiError(409, "Can't Update, Board already exists with same name")
        }
    }
    req.board.name = name
    req.board.description = description
    await req.board.save()
    return res.status(201).json(new ApiResponse(201, req.board.toObject(), "Board Updated"))
})

const updateBoardPosition = asyncHandler(async (req, res) => {
    const { boardId, newIndex } = req.body;
    const castedBoardId = new mongoose.Types.ObjectId(boardId);
    let boardArray = req.project.boards;

    if (newIndex < 0 || newIndex >= boardArray.length)
        throw new ApiError(400, "Invalid Index");

    const currentIndex = boardArray.findIndex(bId => castedBoardId.equals(bId));

    if (currentIndex === newIndex)
        return res.status(200).json(new ApiResponse(200, {}, "Board already at desired position"));

    boardArray.splice(currentIndex, 1);
    boardArray.splice(newIndex, 0, castedBoardId);

    await req.project.save();

    return res.status(200).json(new ApiResponse(200, req.project.toObject(), "Board Position Updated"));
})



const deleteBoard = asyncHandler(async (req, res)=>{
    const {boardId} = req.body
    const castedBoardId = new mongoose.Types.ObjectId(boardId)
    const tasks = await getBoardsAllTasksDetails(boardId)
    await deleteAllTasks(tasks)
    req.project.board = req.project.board.filter(id => !(new mongoose.Types.ObjectId(id).equals(castedBoardId)))
    await req.board.deleteOne()
    await req.project.save()
    return res.status(204).json(new ApiResponse(204, {}, "Board deleted successfully"))
})



const boardDetails = asyncHandler(async (req, res)=>{
    return res.status(200).json(new ApiResponse(200, req.board.toObject(), "Board Details Fetched Successfully"))
})

export {
    addBoard,
    updateBoardPosition,
    updateBoardDetails,
    deleteBoard,
    boardDetails,
}