/**
 * @type {{ADMIN: "admin", PROJECT_ADMIN: "project_admin", MEMBER: "member"} as const}
 */
export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);


// export const TaskStatusEnum = {
//   TODO: "todo",
//   IN_PROGRESS: "in_progress",
//   DONE: "done",
// };

// export const AvailableTaskStatuses = Object.values(TaskStatusEnum);


export const CloudinaryFolderEnum = {
    AVATAR: 'avatar',
    ATTACHMENTS : 'attachments',
    MAIN : 'task-manager',
}