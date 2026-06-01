# Feature Request #001: Work Orders (Ordens de Serviço - OS)

## Objective
This document outlines the requirements for a new core feature: **Work Orders (Ordens de Serviço)**. This module is currently not implemented in the codebase. As part of Module 3, the student must plan, design, and implement the database schema, backend APIs, frontend interfaces, and unit tests for this feature using AI assistance.

---

## Business Requirements

1. **Work Order Creation**:
   - Any authenticated user can create a Work Order (OS).
   - An OS must be linked to a specific physical Asset.
   - An OS must include:
     - **Title**: A short description of the issue or task.
     - **Description**: Detailed scope of work.
     - **Priority**: Must be one of `low` (baixa), `medium` (média), or `high` (alta).
     - **Responsible User (Assignee)**: A reference to a user (inspector or admin) who will perform the work.
     - **Status**: Defaults to `open` (aberta) upon creation.

2. **Work Order Lifecycle & States**:
   - **`open`**: The OS is registered but work has not started.
   - **`in_progress`**: The assigned user has accepted/started the task.
   - **`completed`**: The work is finished. Requires filling in a resolution report (findings/actions taken) and completion date.

3. **Status Transitions**:
   - An OS can go from `open` to `in_progress`.
   - An OS can go from `in_progress` to `completed`.
   - An OS can be cancelled from either `open` or `in_progress` status.
   - Once `completed`, an OS is locked and cannot be edited.

---

## Technical Tasks to Implement (Guideline for Students)

### 1. Database Schema
Create a new database table `work_orders` in SQLite:
- `id` (INTEGER, Primary Key)
- `asset_id` (INTEGER, Foreign Key to `assets.id`)
- `assignee_id` (INTEGER, Foreign Key to `users.id`)
- `title` (TEXT)
- `description` (TEXT)
- `priority` (TEXT: low, medium, high)
- `status` (TEXT: open, in_progress, completed, cancelled)
- `resolution` (TEXT, nullable)
- `created_at` (DATETIME)
- `completed_at` (DATETIME, nullable)

### 2. Backend REST API
Expose endpoints in `/api/work-orders`:
- `GET /api/work-orders` - List all work orders (filter by status, assignee, asset, or priority).
- `GET /api/work-orders/:id` - Detailed view of a work order.
- `POST /api/work-orders` - Create a work order (validate asset exists, assignee exists, priority is valid).
- `PUT /api/work-orders/:id` - Update status, assignee, priority, or fill resolution details when completing.
- `DELETE /api/work-orders/:id` - Delete an open/cancelled work order (Admins only).

### 3. Frontend UI
Build a user-friendly UI:
- **Work Orders Dashboard/List**: Filterable table/grid showing active work orders with colored priority badges.
- **Create OS Modal/Form**: Select an asset, assign to a user, set priority, write scope.
- **Details & Action Page**: View OS progress, transition status (e.g. "Start Work", "Complete OS" with a resolution input).

### 4. Tests
- Create a test suite `backend/tests/work_orders.test.js` validating authentication, request body parameters, and workflow transitions.
