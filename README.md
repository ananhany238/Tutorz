# Tutorz

Tutorz is a web app that helps private tutors and small teaching centers manage their classes. Tutors organize groups and students, take attendance in seconds with a QR code, and give parents and students a private view of their own attendance history.

**Live demo:** [add the Vercel link here]
**API:** [add the Render link here]/api/health

> The backend runs on a free hosting plan, so the first request after a period of inactivity can take up to a minute while the server wakes up.

**Demo accounts**

| Role | Email | Password |
|---|---|---|
| Tutor | [demo tutor email] | [password] |
| Student / parent | [demo family email] | [password] |

## Features

- Secure authentication with JWT and hashed passwords (bcrypt)
- Two roles with separate permissions: **tutor** and **student / parent**
- Tutors manage groups and students (full CRUD)
- **QR check-in:** the tutor starts a session, students scan a QR code that rotates every 30 seconds, and attendance is recorded automatically as present or late. When the session is closed, everyone who did not scan is marked absent.
- Manual attendance sheet for exceptions
- Parents and students sign up with a private per-student link code and see only that student's attendance and rate
- Responsive interface that works on phones

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens, bcryptjs |
| Security | Helmet, rate limiting, role-based access control |

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
| GET | `/api/family/me` | family | Student profile, summary and attendance history |
| POST | `/api/family/checkin` | family | Check in using a QR link |

## Project structure

```
tutorz/
├── client/              React app (pages, components, auth context)
└── server/
    └── src/
        ├── models/      Mongoose schemas
        ├── routes/      Express routers
        ├── middleware/  Authentication and role checks
        └── utils/       Link codes and check-in tokens
```

## Roadmap

- Payments tracking per student
- Notifications to parents when a student is absent
- Location check for QR check-in
- Automated tests

## Author

Built by anan hany - [GitHub profile link]
