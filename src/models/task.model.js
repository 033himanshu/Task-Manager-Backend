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
        ref : 'ProjectMember',
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "ProjectMember",
        required: true,
    },
    attachments: {
        type: [
          {
            url: {type: String},
            mimetype: {type : String},
            size: {type: Number},
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
