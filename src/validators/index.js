import { body } from "express-validator";
import {
  AvailableUserRoles,
  UserRolesEnum
} from "../utils/constants.js";


const emailValidation = body("email")
.notEmpty().withMessage("Email is required")
.isEmail().withMessage("Email is invalid")

const newPasswordValidator = body("password")
.isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
.matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
.matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
.matches(/\d/).withMessage('Password must contain at least one number')
.matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')

const newUsernameValidator = body("username")
.notEmpty().withMessage("Username is required")
.isLowercase().withMessage("Username must be lowercase")
.isLength({ min: 3 }).withMessage("Username must be at lease 3 characters long")

const fullnameValidator = body("fullName")
.notEmpty().withMessage("Full name is required")

const roleValidator = body("role").notEmpty().withMessage("Role is required")
.isIn(AvailableUserRoles).withMessage("Role is invalid")
.not().isIn([UserRolesEnum.ADMIN]).withMessage("Change To Admin Role is Not Allowed")

const userRegisterValidator = () => {
  return [
    emailValidation,
    newUsernameValidator,
    newPasswordValidator,
    fullnameValidator,
  ];
};
const userUpdateProfileValidator = () => {
  return [
    emailValidation,
    newUsernameValidator,
    fullnameValidator,
  ];
}
const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),
    body("username").optional(),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userUpdateCurrentPasswordValidator = () => {
  return [
    newPasswordValidator,
  ];
};

const userForgotPasswordValidator = () => {
  return [
    emailValidation,
  ];
};

const userResetForgottenPasswordValidator = () => {
  return [newPasswordValidator];
};

const createProjectValidator = () => {
  return [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").optional(),
  ];
};
const boardValidator = () =>{
  return [
    body('name').notEmpty().withMessage("Name is required"),
    body('description').optional(),
  ]
}

const addMemberToProjectValidator = () => {
  return [
    emailValidation,
    roleValidator,
  ];
};
const updateMemberRoleValidator = () => {
  return [
    roleValidator,
  ]
}
const assignedToValidator = body("assignedTo").notEmpty().withMessage("Assigned to is required")
const createTaskValidator = () => {
  return [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").optional(),
    // assignedToValidator,
    body("boardId").notEmpty().withMessage("Board is required"),
  ];
};
const updateTaskValidator = () => {
  return [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").optional(),
    body("boardId").notEmpty().withMessage("Board is required"),
  ];
};
const createSubTaskValidator = () => {
  return [
    body('title').notEmpty().withMessage('Title is required')
  ]
}
const updateTaskMemberValidator = () =>{
  return [
    // assignedToValidator
  ]
}


const notesValidator = () => {
  return [body("content").notEmpty().withMessage("Content is required")];
};

export {
  addMemberToProjectValidator,
  updateMemberRoleValidator,
  createProjectValidator,
  boardValidator,
  createTaskValidator,
  updateTaskValidator,
  createSubTaskValidator,
  updateTaskMemberValidator,
  notesValidator,
  userUpdateCurrentPasswordValidator,
  userForgotPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  userResetForgottenPasswordValidator,
  userUpdateProfileValidator,
};


