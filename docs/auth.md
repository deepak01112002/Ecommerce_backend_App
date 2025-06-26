# Authentication API Documentation

## Signup (User/Admin Registration)

**Endpoint:** `POST /api/auth/signup`

Registers a new user or admin.

### Request Body
```
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword",
  "role": "user" // or "admin" (optional, defaults to user)
}
```

### Success Response
- **Status:** 201 Created
```
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "<jwt_token>"
}
```

### Error Responses
- **400 Bad Request** (validation or duplicate email)
- **500 Server Error**

---

## Login (User/Admin)

**Endpoint:** `POST /api/auth/login`

Logs in a user or admin and returns a JWT token.

### Request Body
```
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

### Success Response
- **Status:** 200 OK
```
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "<jwt_token>"
}
```

### Error Responses
- **400 Bad Request** (invalid credentials or validation)
- **500 Server Error**

---

## Get Current User Profile

**Endpoint:** `GET /api/auth/profile`

**Headers:**
- `Authorization: Bearer <jwt_token>`

### Success Response
- **Status:** 200 OK
```
{
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Error Responses
- **401 Unauthorized** (missing or invalid token)

---

## Update Current User Profile

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
- `Authorization: Bearer <jwt_token>`

### Request Body (any or all fields)
```
{
  "name": "New Name",
  "email": "newemail@example.com",
  "password": "newpassword"
}
```

### Success Response
- **Status:** 200 OK
```
{
  "message": "Profile updated successfully",
  "user": {
    "id": "...",
    "name": "New Name",
    "email": "newemail@example.com",
    "role": "user"
  }
}
```

### Error Responses
- **400 Bad Request** (validation or email in use)
- **401 Unauthorized** (missing or invalid token)
- **500 Server Error**

---

## Notes
- Use the `role` field as `admin` to register an admin account. Default is `user`.
- The returned JWT token should be sent in the `Authorization` header as `Bearer <token>` for protected routes.
- Passwords must be at least 6 characters. 