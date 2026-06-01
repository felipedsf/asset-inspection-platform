# Asset Inspection Platform

A simplified industrial asset inspection platform designed for training engineering teams in code reading, debugging, test-driven development, and prompt engineering.

The repository contains four distinct modules:
- **Module 1**: Fully implemented features (Login, User Management, and Asset CRUD) with complete tests.
- **Module 2**: Existing code with five hidden bugs (performance, memory, security, concurrency, and business logic) that you must audit and correct.
- **Module 3**: Documentation-only specifications for a new **Work Orders** feature request.
- **Module 4**: High-level business requirement for an **Operational Dashboard**.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express, SQLite (`sqlite3` driver), Jest + Supertest (Testing)
- **Frontend:** React, Vite, Vanilla CSS (Premium Dark Theme)
- **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)
- **Docker** and **Docker Compose** (optional, for container runs)

---

## 💻 Run Locally (Without Docker)

You can run the frontend and backend servers separately on your machine.

### 1. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize and seed the SQLite database:
   ```bash
   npm run seed
   ```
   *This creates `database.sqlite` and populates initial user roles, assets, and inspections.*
4. Start the development server (runs on port `5000`):
   ```bash
   npm run dev
   ```

### 2. Set Up the Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server (runs on port `5173`):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 🐳 Run with Docker Compose

To spin up the entire stack using Docker in one command:

1. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
2. Once the containers are running:
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:5000`

*Note: The backend container automatically seeds the database on startup.*

---

## 🧪 Running Tests

To run the automated test suite on the backend (uses an isolated test database):

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run tests:
   ```bash
   npm run test
   ```

---

## 🔐 Credentials for Login

The database is seeded with two roles. You can log in using these credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@platform.com` | `admin123` |
| **Inspector** | `inspector@platform.com` | `inspector123` |
| **Inspector (Maria)** | `maria@platform.com` | `inspector123` |

---

## 📂 Challenges and Guides

Go to the [/challenges](file:///Users/felipefaria/devel/be_ready/asset-inspection-platform/challenges) directory to view instructions for locating and fixing the bugs:
- **Challenge 1 (N+1 Query):** Read [bug-01.md](file:///Users/felipefaria/devel/be_ready/asset-inspection-platform/challenges/bug-01.md).
- **Challenge 2 (Memory Leak):** Read [bug-02.md](file:///Users/felipefaria/devel/be_ready/asset-inspection-platform/challenges/bug-02.md).
- **Hidden Challenges (Other 3 bugs):** Read [hidden.md](file:///Users/felipefaria/devel/be_ready/asset-inspection-platform/challenges/hidden.md).

For design details and API documentation, refer to the [/docs](file:///Users/felipefaria/devel/be_ready/asset-inspection-platform/docs) folder.
