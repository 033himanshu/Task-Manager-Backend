import mongoose, { Schema } from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
    },
    boards : {
        type : [
            {
              type: Schema.Types.ObjectId,
              ref: 'Board',
            },
        ],
        default : []
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {timestamps: true});

export const Project = mongoose.model("Project", projectSchema)
