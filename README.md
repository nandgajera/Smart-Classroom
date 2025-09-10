# Smart Classroom & Timetable Scheduler

An intelligent web-based system that generates optimized, clash-free timetables for UG/PG courses with classroom and faculty constraints.

## Tech Stack
- Backend: Node.js (Express) + MongoDB (Mongoose)
- Frontend: React + Tailwind CSS
- Auth: JWT
- Scheduling: Constraint Satisfaction / Heuristic Search

## Getting Started

1. Install dependencies
```
npm run install:all
```

2. Create `.env` in `server/`
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/smart_classroom
JWT_SECRET=change_me
```

3. Run in dev
```
npm run dev
```

## High-level Features
- Authentication & Roles (Admin, Faculty)
- Data Input UI (classrooms, faculty, subjects, constraints)
- Scheduler Engine
- Conflict detection & suggestions
- Approval workflow

## API Overview
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/timetables/generate`
- `GET /api/timetables/:id`
- CRUD for faculties, classrooms, subjects, batches

## License
MIT

