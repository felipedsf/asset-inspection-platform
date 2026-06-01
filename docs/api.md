# API Documentation - Asset Inspection Platform

All requests must use the base URL `/api` and expect JSON payloads unless otherwise specified.
Protected routes require a JWT token passed in the header: `Authorization: Bearer <token>`.

---

## 1. Authentication

### POST `/auth/login`
Authenticates user and returns JWT.

- **Request Body:**
  ```json
  {
    "email": "inspector@platform.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 2,
      "name": "John Inspector",
      "email": "inspector@platform.com",
      "role": "inspector"
    }
  }
  ```

### GET `/auth/me`
Retrieves current user profile based on JWT token.

- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "id": 2,
    "name": "John Inspector",
    "email": "inspector@platform.com",
    "role": "inspector"
  }
  ```

---

## 2. Assets

### GET `/assets`
Lists all assets.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Wind Turbine Alpha",
      "code": "WT-001",
      "type": "turbine",
      "status": "active"
    }
  ]
  ```

### GET `/assets/search`
Search assets by name or code.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `q` (search text)
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Wind Turbine Alpha",
      "code": "WT-001",
      "type": "turbine",
      "status": "active"
    }
  ]
  ```

### POST `/assets` (Admin Only)
Creates a new asset.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Solar Array Beta",
    "code": "SA-002",
    "type": "solar",
    "status": "active"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 4,
    "name": "Solar Array Beta",
    "code": "SA-002",
    "type": "solar",
    "status": "active"
  }
  ```

### PUT `/assets/:id` (Admin Only)
Updates an asset.
- **Response (200 OK):** Updated asset object.

### DELETE `/assets/:id` (Admin Only)
Deletes an asset.
- **Response (200 OK):** `{ "message": "Asset deleted successfully" }`

---

## 3. Inspections

### GET `/inspections`
Lists all inspections.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params (Optional):** `status`, `asset_id`
- **Response (200 OK):** Array of inspections.

### GET `/inspections/:id`
Retrieves inspection details, including the asset details and the inspector's name.
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "asset_id": 1,
    "inspector_id": 2,
    "date": "2026-06-01T10:00:00.000Z",
    "status": "pending",
    "findings": "Blades show minor erosion at tips.",
    "recommendations": "Schedule resurfacing in 6 months.",
    "attachments": ["photo_blade1.jpg"],
    "asset_name": "Wind Turbine Alpha",
    "asset_code": "WT-001",
    "inspector_name": "John Inspector"
  }
  ```

### POST `/inspections`
Creates a new inspection. Status defaults to `draft`.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "asset_id": 1,
    "findings": "Initial check...",
    "recommendations": ""
  }
  ```
- **Response (201 Created):** Created inspection object.

### PUT `/inspections/:id`
Updates findings, recommendations, or status of an inspection.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "findings": "Updated findings...",
    "recommendations": "Updated recommendations...",
    "status": "approved" // (Admins only can approve)
  }
  ```
- **Response (200 OK):** Updated inspection object.

### POST `/inspections/:id/attachments`
Uploads a supporting file to an inspection.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** `multipart/form-data` containing the file in `file` field.
- **Response (200 OK):**
  ```json
  {
    "filename": "1654060800000-blade.jpg",
    "attachments": ["1654060800000-blade.jpg"]
  }
  ```

---

## 4. Reports

### GET `/reports/summary`
Retrieves system-wide inspection and asset metrics.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "totalAssets": 10,
    "totalInspections": 25,
    "inspectionsByStatus": {
      "draft": 5,
      "pending": 12,
      "approved": 8
    },
    "criticalAssets": 2
  }
  ```
