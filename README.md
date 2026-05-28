# Modulex

A course management platform for academies. Admins manage customers and assign courses; customers complete modules at their own pace.

## Structure

```
modulex/
├── client/   # Vue 3 frontend
└── server/   # Express + TypeScript API
```

## Tech stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Vue 3, Vue Router, Vite           |
| Backend  | Express 5, TypeScript, tsx        |
| Database | MongoDB via Mongoose              |
| Auth     | JWT in httpOnly cookies           |
| Email    | Nodemailer (SMTP)                 |

## Getting started

Both apps run independently — open two terminals.

**Server**

```bash
cd server
cp .env.example .env   # fill in the values
npm install
npm run dev            # http://localhost:3000
```

**Client**

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

See [server/README.md](server/README.md) for environment variables, API routes, and seed data.

## User flow

1. Admin creates a lead by email → survey email sent
2. Customer fills in the survey
3. Admin assigns courses → registration email sent
4. Customer sets a password and accesses their courses
5. Customer completes modules; admin can track progress per course
