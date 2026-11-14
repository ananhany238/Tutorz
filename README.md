# Tutorz

Tutorz is a web app that helps private tutors and small teaching centers manage their classes. Tutors organize groups and students, take attendance in seconds with a QR code, share class materials, and give parents and students a private view of their own attendance history.

**Live demo:** https://tutorz-yuzx.vercel.app
**API health check:** https://tutorz-two.vercel.app/api/health

**Demo accounts**

| Role | Email | Password |
|---|---|---|
| Tutor | demo.tutor@example.com | DemoTutor2026 |
| Student / parent | demo.parent@example.com | DemoParent2026 |

## Features

- Secure authentication with JWT and hashed passwords (bcrypt)
- Strong password rules, enforced on both the client and the server
- Two roles with separate permissions: **tutor** and **student / parent**
- Tutors manage groups and students (full CRUD)
- **QR check-in:** the tutor starts a session, students scan a QR code that rotates every 30 seconds, and attendance is recorded automatically as present or late. When the session is closed, everyone who did not scan is marked absent.
- Manual attendance sheet for exceptions
- **Class materials:** tutors share links (notes, videos, files) with each group, and the students and parents of that group can open them
- Parents and students sign up with a private per-student link code and see only that student's attendance, rate and materials
- Responsive interface that works on phones

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Security | Helmet, rate limiting, role-based access control, password strength rules |
| Hosting | Vercel (frontend and serverless API), MongoDB Atlas |

## How the QR check-in works

1. The tutor starts a check-in session. The server stores a random secret for that session.
2. The QR code contains a link with the session id and a short-lived token, computed as an HMAC of the secret and the current 30-second time window.
3. The browser asks the server for a fresh token every few seconds, so the QR code keeps changing.
4. When a student scans it, the server verifies the token (current or previous window), checks that the student belongs to that group, and records `present` or `late` depending on how long the session has been open.
5. Closing the session marks all remaining students as `absent`.

A screenshot of the QR code stops working after about a minute, and a scan only counts for the logged-in student's own account.

## Getting started

### Prerequisites

- Node.js 20 or later
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
git clone https://github.com/ananhany238/tutorz.git
cd tutorz

# Backend
cd server
npm install
cp .env.example .env     # then edit the values
npm run dev

# Frontend (in a second terminal)
cd client
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5000` and the app on `http://localhost:5173`.

### Environment variables

**server/.env**

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `CLIENT_URL` | Frontend origin allowed by CORS, without a trailing slash |

**client/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the API, for example `http://localhost:5000/api` |

## Deployment

The app runs as two Vercel projects created from the same repository:

- **API:** root directory `server`. Express runs as a serverless function through `server/api/index.js`. It needs the `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL` variables.
- **Frontend:** root directory `client`, built with Vite. It needs `VITE_API_URL`.

The database is a free MongoDB Atlas cluster.

## API overview

All routes except register and login require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create a tutor, or a student / parent account with a link code |
| POST | `/api/auth/login` | public | Log in and receive a token |
| GET | `/api/auth/me` | any | Current user |
| GET, POST | `/api/groups` | tutor | List and create groups |
| GET, PUT, DELETE | `/api/groups/:id` | tutor | Read, update and delete a group |
| GET, POST | `/api/students` | tutor | List (filter with `?group=`) and create students |
| PUT, DELETE | `/api/students/:id` | tutor | Update and delete a student |
| POST | `/api/students/:id/link-code` | tutor | Generate a new sign-up code for a student |
| GET, PUT | `/api/attendance` | tutor | Read and edit attendance for a group and date |
| POST | `/api/attendance/checkin/start` | tutor | Open a QR check-in session |
| GET | `/api/attendance/checkin/:id/token` | tutor | Current QR token |
| POST | `/api/attendance/checkin/:id/close` | tutor | Close the session and mark absences |
| GET, POST | `/api/materials` | tutor | List (filter with `?group=`) and add class materials |
| DELETE | `/api/materials/:id` | tutor | Remove a material |
| GET | `/api/family/me` | family | Student profile, summary and attendance history |
| GET | `/api/family/materials` | family | Materials shared with the student's group |
| POST | `/api/family/checkin` | family | Check in using a QR link |

## Project structure

```
tutorz/
├── client/              React app (pages, components, auth context)
└── server/
    ├── api/             Serverless entry point for Vercel
    └── src/
        ├── models/      Mongoose schemas
        ├── routes/      Express routers
        ├── middleware/  Authentication and role checks
        └── utils/       Link codes, check-in tokens, password rules
```

## Roadmap

- Password recovery by email
- Validation of check-in date and time (for example, only allow check-in on the day of the session)
- File uploads for class materials (currently links)
- Payments tracking per student
- Notifications to parents when a student is absent
- Location check for QR check-in
- Automated tests
- A shared rate-limit store, so limits work across serverless instances

## Author

Built by Anan Hany - https://github.com/ananhany238