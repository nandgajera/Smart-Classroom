# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with React client (client/) and Node/Express/MongoDB server (server/)
- Dev workflow orchestrated via root npm scripts
- Authentication via JWT; scheduling via a constraint-satisfaction backtracking algorithm

Environment
- Node >= 16, npm >= 8
- **MongoDB required**: Install MongoDB Community Edition and ensure it's running on port 27017
  - Windows: Download from https://www.mongodb.com/try/download/community
  - Start MongoDB: `net start MongoDB` (as admin) or run `mongod` directly
- Server env file required: server/.env (see server/.env.example)
  - PORT=4000, MONGO_URI=mongodb://localhost:27017/smart_classroom, JWT_SECRET, NODE_ENV, CLIENT_URL
- Default ports: client 3000, server 4000

Common commands
- Install all deps
  - npm run install:all
- Run both client and server in dev (concurrently)
  - npm run dev
- Start server only
  - npm run start
- Client dev only
  - npm run client:dev
- Client production build
  - npm run client:build
- Run tests (server then client)
  - npm test
- Server tests (Jest)
  - npm run test:server
  - Run a single server test by name
    - npm run test:server -- -t "<test name regex>"
  - Run a single server test file
    - npm run test:server -- path\to\file.test.js
- Client tests (CRA/Jest)
  - npm run test:client
  - Run a single client test by name
    - npm run test:client -- -t "<test name regex>"
  - Run a single client test file
    - npm run test:client -- src\\path\\to\\Component.test.js
- Seed data with default users and sample data
  - npm run seed
  - Creates default login accounts:
    - Admin: admin@test.com / admin123
    - HOD: hod@cse.com / hod123  
    - Faculty: faculty1@cse.com / faculty123

Build and run notes
- Ensure MongoDB is running and server/.env is configured before npm run dev
- Client -> Server API path
  - Server mounts API at /api/* (e.g., /api/timetables/generate)
  - Client code currently calls endpoints like /timetables/generate
  - To fix API calls in development:
    - Configure Axios baseURL in client code: axios.defaults.baseURL = 'http://localhost:4000/api'
    - Or use full URLs in client API calls: 'http://localhost:4000/api/timetables/generate'
    - CRA proxy had webpack config issues, so manual configuration is recommended

High-level architecture
- Backend (server/)
  - Entry: src/server.js
    - Express app with helmet, CORS, rate limiting
    - Connects to MongoDB (Mongoose)
    - Routes mounted under /api/*
    - Authentication middleware (authenticate) applied to protected routes
    - Global error handler middleware
  - Routes: src/routes/
    - auth.js, users.js, faculty.js, classrooms.js, subjects.js, batches.js, timetables.js
    - timetables.js
      - POST /api/timetables/generate: generates and persists a timetable
      - GET /api/timetables: paginated list (excludes schedule)
      - GET /api/timetables/:id: full timetable with populated refs
      - PATCH /api/timetables/:id/status: lifecycle transitions
      - DELETE /api/timetables/:id: soft-delete (isActive=false)
      - GET /api/timetables/:id/conflicts: compute/update conflicts
  - Middleware: src/middleware/
    - auth.js: authenticate (JWT) and authorize(role...)
    - errorHandler.js: centralized error responses
  - Models: src/models/
    - Timetable.js: stores generated schedule, constraints, conflicts, stats; provides conflict detection and active queries
    - Subject.js, Faculty.js, Classroom.js, Batch.js, User.js: domain entities with indices and helpers
  - Scheduling engine: src/algorithms/TimetableScheduler.js
    - Generates a time grid across working days/hours
    - Expands required sessions per batch/subject
    - Heuristically orders sessions (labs first, longer, larger cohorts)
    - Backtracking assignment of (time, room, faculty) with constraints:
      - No clashes across faculty/classroom/batch
      - Room capacity/type/facilities
      - Faculty availability; batch daily limits; lunch break avoidance
    - Computes basic score and stats; returns schedule + conflicts summary
- Frontend (client/)
  - React app with React Router (src/App.js)
  - Query client (react-query) for data fetching; react-hot-toast for notifications
  - Auth context (src/contexts/AuthContext.js) provides user and ProtectedRoute gating
  - Role-based access control: AdminRoute component restricts management features to Admin/HOD
  - Layout and pages:
    - Login, Dashboard, TimetableGenerator, TimetableView, DataManagement
    - Management pages (Admin/HOD only): FacultyManagement, ClassroomManagement, SubjectManagement
  - Navigation dynamically shows management options for Admin/HOD users
  - Timetable generation flow (src/pages/TimetableGenerator.js)
    - Submits name/academicYear/semester/department/algorithm
    - Expects POST to /timetables/generate; ensure API base path configured as noted above

Testing
- Server uses Jest and Supertest (see server/package.json)
  - Place tests under server with .test.js naming; run via npm run test:server
- Client uses CRA’s Jest configuration
  - Place tests under client/src with .test.js/.test.jsx

API quick reference
- Authentication: POST /api/auth/register, POST /api/auth/login (see README)
- Timetables: POST /api/timetables/generate, GET /api/timetables/:id
- CRUD: faculties, classrooms, subjects, batches under /api/*

Management Features (Admin/HOD Only)
- Faculty Management: /management/faculty
  - Add/edit faculty with user accounts, specialization, workload limits
  - Role-based access control, department filtering
- Classroom Management: /management/classrooms  
  - Configure rooms with capacity, type, facilities, location
  - Support for multiple classroom types (lecture halls, labs, seminar rooms, etc.)
- Subject Management: /management/subjects
  - Define courses with scheduling requirements, prerequisites
  - Specify classroom and faculty requirements per subject
  - Configure session frequency, duration, academic year

Example: generate a timetable (replace {{JWT_TOKEN}})
- $env:JWT_TOKEN = "{{JWT_TOKEN}}"
- curl -X POST http://localhost:4000/api/timetables/generate ^
    -H "Authorization: Bearer $env:JWT_TOKEN" ^
    -H "Content-Type: application/json" ^
    -d '{
      "name": "CS - Fall",
      "academicYear": "2024-2025",
      "semester": 1,
      "department": "CSE",
      "constraints": { "workingDays": ["monday","tuesday","wednesday","thursday","friday"] }
    }'

Notes for future updates
- If adding linting, prefer npm scripts (e.g., server:lint, client:lint) and align with CRA/ESLint
- Keep client/server API base path consistent (/api prefix) to avoid dev/prod mismatches

