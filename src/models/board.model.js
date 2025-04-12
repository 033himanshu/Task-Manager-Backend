import mongoose, { Schema } from 'mongoose'

const boardSchema = new mongoose.Schema({
    name : {
        type: String,
        required : true,
    },
    descrpition: {
        type: String,
        required : true,
    },
    tasks : {
        type : [
            {
                type : Schema.Types.ObjectId,
                ref : "Task",
            }
        ],
        default : [],
    },
    createdBy : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required: true,
    },
},{timestamps:true})

export const Board = mongoose.model('Board', boardSchema)
