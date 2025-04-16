import mongoose, { Schema } from 'mongoose'
import { AvailableUserRoles, UserRolesEnum, AvailableProjectMemberStatus, ProjectMemberStatusEnum } from "../utils/constants.js";
import { generateTemporaryToken } from '../utils/temporaryToken.js';
import { ApiError } from '../utils/api-error.js';
import { joinProjectRequestGenContent, sendMail } from '../utils/mail.js';

const projectMemberSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    role: {
        type: String,
        enum: AvailableUserRoles,
        default: UserRolesEnum.MEMBER,
    },
    status : {
        type : String,
        enum : AvailableProjectMemberStatus,
        default : ProjectMemberStatusEnum.PENDING
    },
    requestToken : {
        type : String,
    },
    tokenExpiry : {
        type : Date,
    }
}, {timestamps: true});

const port = process.env.port
const base_url = process.env.BASE_URL

projectMemberSchema.methods.SendJoinProjectRequestMail = async function(projectName, user){
    try {
        const {unHashedToken, hashedToken, tokenExpiry} = generateTemporaryToken()
        this.requestToken = hashedToken
        this.tokenExpiry = tokenExpiry
        await sendMail({
            options : joinProjectRequestGenContent(
                user.username, 
                projectName,
                this.role,
                `http://localhost:${port}${base_url}project/accept/${this._id}-${unHashedToken}`,
                `http://localhost:${port}${base_url}project/reject/${this._id}-${unHashedToken}`,
            ),
            email : user.email,
            subject : `Request To Join Project`
            }
        )
        console.log("EMail sent")
        await this.save()
    } catch (error) {
        throw new ApiError(501, `Error : sending join project request mail, ${error}`)
    }   
}

export const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema)

