📬 **Postman Documentation for all endpoints:** (https://documenter.getpostman.com/view/16110894/2sB2cbbeeG#418bf884-2700-47b0-8d41-cb14edc24df7)
I’ve tried to cover a wide range of edge cases, ensuring strong security and proper access restrictions.

### ✨ Some Key Features:

👤 **User & Project Management**
- A user can create a project and will automatically get 3 default stages (which I’ve termed *boards*) — `To Do`, `In Progress`, and `Done`.
- Users can add custom boards, delete existing ones, and even rearrange their order (e.g., moving `To Do` to the end).
  
👥 **Project Collaboration**
- Users can add members to a project.  
  Once added, the invited member receives an email with options to **accept** or **decline** the request.

🧹 **Automatic Cleanup**
- When a task, board, or project is deleted, all its dependent data (like subtasks, attachments, etc.) is automatically removed—no manual cleanup needed!

🔐 **Authorization & Access Control**
- All functionalities are protected with role-based access:
  - For example, only the `project_admin` or `admin` can create new boards.
  - Regular project members cannot perform restricted actions like deleting boards or managing members.
