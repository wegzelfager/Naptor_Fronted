# Naptor Backend API Documentation

Welcome to the **Naptor API Documentation**. This document provides detailed information on all available endpoints, request/response formats, authentication, validation rules, and error handling.

---

## 📌 Overview

- **Base URL**: `http://localhost:5000` (or configured `PORT`)
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Tokens in the `Authorization` header for protected endpoints.
- **Refresh Strategy**: Refresh tokens stored in HTTP-Only Cookies or transmitted in request payloads.

---

## 🔑 Authentication & Authorization

Protected endpoints require a valid Access Token passed in the HTTP Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Response Status Codes Summary
| Code | Status | Meaning |
| :--- | :--- | :--- |
| `200` | `OK` | Request succeeded. |
| `201` | `Created` | Resource successfully created. |
| `400` | `Bad Request` | Validation failure or malformed payload. |
| `401` | `Unauthorized` | Missing, invalid, or expired JWT token. |
| `404` | `Not Found` | Requested resource does not exist or user unauthorized. |
| `409` | `Conflict` | Resource conflict (e.g., email already registered). |
| `422` | `Unprocessable Entity` | Model validation error. |
| `500` | `Internal Server Error` | Unexpected server error. |

---

## 📑 API Endpoints Index

1. [System Health](#1-system-health)
   - `GET /health` - Server health check
2. [Authentication Module](#2-authentication-module)
   - `POST /api/auth/register` - User registration
   - `POST /api/auth/login` - User login
   - `POST /api/auth/refresh` - Refresh access token
3. [Monitor Module](#3-monitor-module)
   - `POST /api/monitors/monitors` - Create uptime monitor
   - `PATCH /api/monitors/:id/status` - Update monitor status

---

## 1. System Health

### `GET /health`
Verifies server health and checks access token authentication.

- **Authentication**: Required (`Bearer <accessToken>`)
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```

#### Response Example
- **`200 OK`**:
  ```text
  Server is up and running smoothly!
  ```

- **`401 Unauthorized`**:
  ```json
  {
    "status": "error",
    "message": "Not authorized to access this route"
  }
  ```

---

## 2. Authentication Module

Base Path: `/api/auth`

### A. Register User
`POST /api/auth/register`

Registers a new user account in the system.

- **Authentication**: Public
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Minimum 3 characters |
| `email` | `string` | Yes | Must be a valid email format |
| `password` | `string` | Yes | Minimum 6 characters |

#### Responses
- **`200 OK`**:
  ```json
  {
    "status": "success",
    "message": "User registered successfully. Please log in."
  }
  ```

- **`400 Bad Request`** (Validation Error):
  ```json
  {
    "status": "fail",
    "message": "Validation Error",
    "errors": [
      {
        "field": "body.email",
        "message": "invalid email type"
      }
    ]
  }
  ```

- **`409 Conflict`** (Email exists):
  ```json
  {
    "status": "error",
    "message": " already exists. Please use a different value."
  }
  ```

---

### B. User Login
`POST /api/auth/login`

Authenticates user credentials, sets HTTP-Only `refreshToken` cookie, and returns `accessToken`.

- **Authentication**: Public
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Yes | Must be a valid email format |
| `password` | `string` | Yes | Minimum 6 characters |

#### Responses
- **`200 OK`**:
  - **Set-Cookie Header**: `refreshToken=<JWT_REFRESH_TOKEN>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
  - **Response Body**:
    ```json
    {
      "status": "success",
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

- **`400 Bad Request / 401 Unauthorized`**:
  ```json
  {
    "status": "error",
    "message": "Invalid email or password"
  }
  ```

---

### C. Refresh Access Token
`POST /api/auth/refresh`

Obtains a new Access Token using an existing Refresh Token provided via cookie or request body.

- **Authentication**: Public (Requires refresh token)
- **Cookies**: `refreshToken=<JWT_REFRESH_TOKEN>`
- **Request Body** *(Optional if cookie is present)*:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Responses
- **`200 OK`**:
  ```json
  {
    "status": "success",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

- **`401 Unauthorized`**:
  ```json
  {
    "status": "error",
    "message": "Refresh token is required"
  }
  ```

---

## 3. Monitor Module

Base Path: `/api/monitors`

### A. Create Monitor
`POST /api/monitors/monitors`

Creates a new website or API monitor and immediately triggers an initial availability check (ping).

- **Authentication**: Required (`Bearer <accessToken>`)
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```

#### Request Body
```json
{
  "name": "My Service API",
  "url": "https://api.example.com/health",
  "type": "API",
  "interval": 60,
  "timeout": 5000
}
```

#### Validation Rules
| Field | Type | Required | Default | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | - | 3 to 50 characters, trimmed |
| `url` | `string` | Yes | - | Valid URL format, trimmed |
| `type` | `string` | No | `"WEBSITE"` | Enum: `["WEBSITE", "API"]` |
| `interval` | `number` | No | `60` | 10 to 86400 seconds (24 hours) |
| `timeout` | `number` | No | `5000` | 1000ms to 30000ms (1 - 30 seconds) |

#### Responses
- **`201 Created`**:
  ```json
  {
    "status": "success",
    "message": "Monitor created successfully",
    "monitor": {
      "_id": "64f1ab23c4e5f67890123456",
      "userId": "64f1a999c4e5f67890123000",
      "name": "My Service API",
      "url": "https://api.example.com/health",
      "type": "API",
      "interval": 60,
      "timeout": 5000,
      "status": "PENDING",
      "createdAt": "2026-07-30T16:00:00.000Z",
      "updatedAt": "2026-07-30T16:00:00.000Z"
    }
  }
  ```

- **`400 Bad Request`** (Validation Error):
  ```json
  {
    "status": "fail",
    "message": "Validation Error",
    "errors": [
      {
        "field": "body.url",
        "message": "invalid url type"
      }
    ]
  }
  ```

- **`401 Unauthorized`**:
  ```json
  {
    "status": "error",
    "message": "Not authorized to access this route"
  }
  ```

---

### B. Update Monitor Status
`PATCH /api/monitors/:id/status`

Updates the operational status of a monitor owned by the authenticated user. Setting status to `PAUSED` or `PENDING` automatically clears active alert locks.

- **Authentication**: Required (`Bearer <accessToken>`)
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```

#### Path Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | 24-character hexadecimal MongoDB ObjectId |

#### Request Body
```json
{
  "status": "PAUSED"
}
```

#### Validation Rules
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `id` (Param) | `string` | Yes | 24-char hex MongoDB ObjectId |
| `status` (Body) | `string` | Yes | Enum: `["PAUSED", "PENDING", "UP", "DOWN"]` |

#### Responses
- **`200 OK`**:
  ```json
  {
    "success": true,
    "message": "Monitor status updated to PAUSED successfully",
    "data": {
      "_id": "64f1ab23c4e5f67890123456",
      "userId": "64f1a999c4e5f67890123000",
      "name": "My Service API",
      "url": "https://api.example.com/health",
      "type": "API",
      "interval": 60,
      "timeout": 5000,
      "status": "PAUSED",
      "updatedAt": "2026-07-30T16:05:00.000Z"
    }
  }
  ```

- **`400 Bad Request`**:
  ```json
  {
    "status": "fail",
    "message": "Validation Error",
    "errors": [
      {
        "field": "body.status",
        "message": "Status must be either PAUSED, PENDING, UP, or DOWN"
      }
    ]
  }
  ```

- **`404 Not Found`**:
  ```json
  {
    "status": "error",
    "message": "Monitor not found or you do not have permission to modify it"
  }
  ```

- **`500 Internal Server Error`**:
  ```json
  {
    "status": "error",
    "message": "Internal Server Error",
    "error": "Database connection error"
  }
  ```

---

## 🛠️ Error Response Format

All validation errors adhere to the following schema:

```json
{
  "status": "fail",
  "message": "Validation Error",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

Operational & server errors adhere to:

```json
{
  "status": "error",
  "message": "Detailed error message"
}
```
