import mongoose, { Schema } from "mongoose"
// import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants";
const taskSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
        trim : true,
    },
    description : {
        type : String,
    },
    assignedTo : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    attachments: {
        type: [
          {
            url: String,
            mimetype: String,
            size: Number,
          },
        ],
        default: [],
    },
    subTasks : {
        type : [
            {
                type : Schema.Types.ObjectId,
                ref : "SubTask",
            }
        ],
        default : []
    },
}, {timestamps: true});

export const Task = mongoose.model("Task", taskSchema)
