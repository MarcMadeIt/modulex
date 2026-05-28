# Server

Express 5 + TypeScript REST API backed by MongoDB.

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start with hot reload via tsx      |
| `npm run build`   | Compile TypeScript to `dist/`      |
| `npm start`       | Run compiled build                 |
| `npm run typecheck` | Type-check without emitting     |
| `npm run seed`    | Seed the database with sample data |

## Environment variables

Copy `.env.example` to `.env` and fill in all values.

| Variable          | Description                                      |
|-------------------|--------------------------------------------------|
| `MONGODB_URI`     | MongoDB connection string                        |
| `PORT`            | Port the server listens on (default: `3000`)     |
| `JWT_SECRET`      | Secret used to sign JWT tokens                   |
| `CLIENT_URL`      | Frontend origin for CORS and email links (default: `http://localhost:5173`) |
| `SMTP_HOST`       | SMTP server hostname                             |
| `SMTP_PORT`       | SMTP port (default: `587`)                       |
| `SMTP_USER`       | SMTP login username                              |
| `SMTP_PASS`       | SMTP login password                              |
| `MAIL_FROM_NAME`  | Display name for outgoing emails                 |
| `MAIL_FROM_EMAIL` | From address for outgoing emails                 |

## API overview

Interactive docs are served at `GET /docs` (Swagger UI) when the server is running.

### Auth — `/auth`

| Method | Path          | Description                          |
|--------|---------------|--------------------------------------|
| POST   | `/auth/signup`| Set password (activates account)     |
| POST   | `/auth/login` | Login, sets httpOnly JWT cookie      |
| GET    | `/auth/me`    | Return current authenticated user    |
| POST   | `/auth/logout`| Clear auth cookie                    |

### Courses — `/courses` (client)

| Method | Path                                       | Description                         |
|--------|--------------------------------------------|-------------------------------------|
| GET    | `/courses`                                 | Courses assigned to current user    |
| GET    | `/courses/:id`                             | Course detail with progress         |
| GET    | `/courses/:id/modules`                     | Modules in order                    |
| GET    | `/courses/:id/modules/:moduleId`           | Module with resolved materials      |
| POST   | `/courses/:id/modules/:moduleId/complete`  | Mark module complete (idempotent)   |

### Admin — `/admin` (admin role required)

**Customers**

| Method | Path                                  | Description                                              |
|--------|---------------------------------------|----------------------------------------------------------|
| GET    | `/admin/customers`                    | All customers with course counts                        |
| GET    | `/admin/customers/:id`                | Single customer                                          |
| DELETE | `/admin/customers/:id`                | Delete customer and all related data                    |
| POST   | `/admin/leads`                        | Create lead and send survey email                       |
| GET    | `/admin/customers/:id/courses`        | Assigned courses with progress (`completedModules`, `totalModules`, `percentage`) |
| DELETE | `/admin/customers/:id/courses/:courseId` | Remove a course assignment                           |
| POST   | `/admin/customers/:id/resend-courses` | Resend registration email                               |

**Courses**

| Method | Path                                        | Description                     |
|--------|---------------------------------------------|---------------------------------|
| GET    | `/admin/courses`                            | All courses with module counts  |
| POST   | `/admin/courses`                            | Create course (with modules)    |
| PUT    | `/admin/courses/:id`                        | Update title/description        |
| DELETE | `/admin/courses/:id`                        | Delete course and cascade       |
| GET    | `/admin/courses/:id/customers`              | Customers assigned to course    |
| GET    | `/admin/courses/:id/modules`                | Modules in order                |
| POST   | `/admin/courses/:id/modules`                | Add module                      |
| PUT    | `/admin/courses/:id/modules/:moduleId`      | Update module                   |
| DELETE | `/admin/courses/:id/modules/:moduleId`      | Delete module                   |

**Assignment**

| Method | Path                    | Description                        |
|--------|-------------------------|------------------------------------|
| POST   | `/admin/assign-course`  | Grant a customer access to a course|

**Content library**

| Method | Path                          | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/admin/content`              | List content items                       |
| GET    | `/admin/content/:id`          | Single content item                      |
| POST   | `/admin/content`              | Create content item                      |
| POST   | `/admin/content/bulk`         | Bulk upsert (matched on title)           |
| PUT    | `/admin/content/:id`          | Update content item                      |
| DELETE | `/admin/content/:id`          | Delete content item                      |
| POST   | `/admin/content/resync-modules` | Backfill `contentId` on existing modules |

## Data models

| Model          | Purpose                                                      |
|----------------|--------------------------------------------------------------|
| `User`         | Both admins and clients; has `status` lifecycle field        |
| `Course`       | Top-level course with title and description                  |
| `Module`       | Ordered module inside a course; contains inline materials    |
| `Content`      | Reusable content library; referenced by modules via `contentId` |
| `UserCourse`   | Enrollment record — which customer has which course          |
| `UserProgress` | Tracks completed module IDs per user per course              |
| `SurveyResponse` | Survey answers submitted by a customer                    |

### Customer status lifecycle

```
pending_survey → pending_approval → pending_activation → active
```

- `pending_survey` — lead created, survey email sent
- `pending_approval` — survey submitted, awaiting course assignment
- `pending_activation` — courses assigned, registration email sent
- `active` — password set, customer can access courses

## Authentication

JWT is issued on login and stored in an `httpOnly` cookie (`token`). All `/admin` routes require the `admin` role. All `/courses` routes require any authenticated user.
