# Task Arena

Task Arena is a full-stack gamified productivity web app built with Next.js App Router, TypeScript, MongoDB, Mongoose, Tailwind CSS, Framer Motion, Zustand, Zod, JWT cookies, and bcrypt.

## Features

- Register, login, logout, protected dashboard, and profile
- MongoDB models for users, tasks, rewards, badges, and activity logs
- Dark futuristic game dashboard with HUD, third-person character, task crates, and keyboard movement
- WASD/arrow movement, E interaction, C quick-create, Delete/Backspace removal, drag-and-drop crate moves
- Task creation, editing, deletion, moving, filtering, sorting, timers, overdue checks, and completion
- Reward points, deadline bonuses, streaks, levels, reward animation, and badge unlocks
- Admin user activity view with user stats, tasks, and recent activity
- Responsive mobile fallback with touch movement controls

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
cp .env.example .env.local
```

3. Fill in:

```env
MONGODB_URI=mongodb://localhost:27017/task-arena
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_TIMEZONE=Asia/Kolkata
```

4. Run the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` landing page
- `/register`
- `/login`
- `/dashboard/game`
- `/dashboard/tasks`
- `/dashboard/history`
- `/dashboard/rewards`
- `/dashboard/profile`
- `/admin/users`
- `/admin/users/[id]`

## API

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Tasks:
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/[id]`
- `PATCH /api/tasks/[id]`
- `DELETE /api/tasks/[id]`
- `PATCH /api/tasks/[id]/move`
- `PATCH /api/tasks/[id]/complete`
- `PATCH /api/tasks/[id]/start`
- `PATCH /api/tasks/check-overdue`

Rewards:
- `GET /api/rewards`
- `POST /api/rewards/claim`

History:
- `GET /api/history`

Admin:
- `GET /api/admin/users`
- `GET /api/admin/users/[id]`
- `GET /api/admin/users/[id]/tasks`
- `GET /api/admin/users/[id]/activity`

## Production Notes

- Use a managed MongoDB deployment such as Atlas for production.
- Set a long random `JWT_SECRET`.
- Run behind HTTPS so auth cookies use secure transport.
- The admin routes currently require authentication. Add role-based access control before exposing this to multiple real users.

## Deploying To Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.

2. Create a MongoDB Atlas database for production. Do not use `mongodb://localhost...` on Vercel.

3. In MongoDB Atlas, allow Vercel to connect. For quick testing, add this Network Access rule:

```txt
0.0.0.0/0
```

For a stricter production setup, use the official Vercel/MongoDB Atlas integration or a more controlled network policy.

4. In Vercel, import the repository as a new project.

5. Add these environment variables in Vercel Project Settings:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/task-arena?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
APP_TIMEZONE=Asia/Kolkata
```

6. Use the default Vercel build settings:

```txt
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

7. Deploy.

After deployment, open the production URL and register a new account. If registration fails, re-check `MONGODB_URI`, `JWT_SECRET`, and MongoDB Atlas network access.
