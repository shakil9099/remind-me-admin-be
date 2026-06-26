# Remind Me Admin Backend

Express + TypeScript backend for the Remind Me admin panel.

## Requirements

- Node.js 22 or newer
- npm
- MongoDB connection used by `remind-me-backend`

## Installation

```bash
cd remind-me-admin-be
npm install
```

## Environment Variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Available variables:

```env
PORT=4001
# Optional: if omitted, admin backend reads MONGODB_URI from ../remind-me-backend/.env
# MONGODB_URI=mongodb://127.0.0.1:27017/remind-me
ADMIN_USERNAME=admin
ADMIN_DEFAULT_PASSWORD=Admin@123
JWT_SECRET=replace-with-at-least-32-random-characters
ADMIN_FE_ORIGIN=http://localhost:3001
ADMIN_DATA_FILE=./data/admin-auth.json
```

Important details:

- `MONGODB_URI`: if not set here, this service reads it from `../remind-me-backend/.env`.
- `JWT_SECRET`: set a strong random value for any shared/dev deployment.
- `ADMIN_FE_ORIGIN`: must match the frontend origin for CORS.
- `ADMIN_DATA_FILE`: stores the admin password hash and first-login state.

## Default Admin Login

Initial credentials:

```text
username: admin
password: Admin@123
```

On first login, the admin must change the default password. The new password is stored as a bcrypt hash in `ADMIN_DATA_FILE`.

To reset the admin password in local development, stop the server and delete:

```bash
rm -rf data
```

The next startup/login will recreate the default admin record.

## Run Locally

Development mode:

```bash
npm run dev
```

Production-style local run:

```bash
npm run build
npm run start
```

Default URL:

```text
http://localhost:4001
```

Health check:

```bash
curl http://localhost:4001/health
```

## API Overview

Auth:

- `POST /api/auth/login`
- `POST /api/auth/change-password`
- `GET /api/auth/me`

Users:

- `GET /api/users?page=1&limit=10`
- `GET /api/users/:id`

Analytics:

- `GET /api/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `GET /api/analytics/users/:id?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Analytics returns daily series for:

- users joined
- upcoming reminders
- not completed tasks
- completed tasks

## Validation

```bash
npm run typecheck
npm run build
```

## Notes

- This service is separate from `remind-me-backend`, but reads the same MongoDB data.
- It does not create app users or reminders; it only reads analytics/users and manages admin authentication.
- Keep `.env`, `data/`, `dist/`, and `node_modules/` out of git.
