# HTTP status codes


### ✅ **Success Codes**

| Status Code | Name                  | Purpose                                                                 |
|-------------|-----------------------|-------------------------------------------------------------------------|
| **200**     | OK                    | Standard success response for GET/PUT/POST when no new resource is created |
| **201**     | Created               | When a new resource is created (e.g., project, task, user)              |
| **202**     | Accepted              | Request has been accepted for processing, but not yet completed (e.g., async email sending) |
| **204**     | No Content            | Used for successful DELETE or when no response body is needed          |

---

### 🔁 **Redirection (Rarely Used in APIs)**

| Status Code | Name                  | Purpose                                                                 |
|-------------|-----------------------|-------------------------------------------------------------------------|
| **304**     | Not Modified          | Use with caching; no need to resend unchanged data                     |

---

### ❌ **Client Errors**

| Status Code | Name                  | Purpose                                                                 |
|-------------|-----------------------|-------------------------------------------------------------------------|
| **400**     | Bad Request           | Malformed input, missing required fields, or validation errors         |
| **401**     | Unauthorized          | Missing/invalid authentication (e.g., JWT token)                       |
| **403**     | Forbidden             | Authenticated, but not allowed to perform the action (e.g., not project admin) |
| **404**     | Not Found             | Resource does not exist (project/task/user not found)                  |
| **409**     | Conflict              | Conflict with existing resource (e.g., duplicate email or username)    |
| **422**     | Unprocessable Entity  | Validation succeeded but request cannot be processed (e.g., semantically incorrect data) |

---

### 🛠 **Server Errors**

| Status Code | Name                  | Purpose                                                                 |
|-------------|-----------------------|-------------------------------------------------------------------------|
| **500**     | Internal Server Error | Something went wrong on the server (unexpected errors, DB crashes)     |
| **502**     | Bad Gateway           | Gateway or proxy server error (e.g., if you use Nginx and backend is down) |
| **503**     | Service Unavailable   | Server is temporarily down (e.g., maintenance)                         |
| **504**     | Gateway Timeout       | Server didn’t respond in time (common in slow external service calls)  |

---

### 🧩 Recommended Usage per Feature

| Feature              | Status Codes Used                                    |
|----------------------|------------------------------------------------------|
| User registration    | `201 Created`, `400 Bad Request`, `409 Conflict`     |
| Login/Auth           | `200 OK`, `400`, `401`, `403`                        |
| Project/Task CRUD    | `201`, `200`, `204`, `404`, `403`                    |
| Adding members       | `200`, `201`, `409`, `403`                           |
| Stage updates        | `200`, `403`, `404`                                  |
| Email invites        | `202 Accepted`, `500`                                |
