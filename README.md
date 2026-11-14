# Quiz and Assessment Portal

React + Vite + Tailwind (client) · Express + MongoDB + JWT (server) · Gemini AI (optional; local fallback question bank otherwise).

## Run on Windows (PowerShell)
1. Install Node.js LTS and MongoDB Community (or create a free MongoDB Atlas cluster and use its connection string).
2. Backend:
```
cd quiz-assessment-portal\server
copy .env.example .env      # then edit .env: set JWT_SECRET (long random text), MONGODB_URI, GEMINI_API_KEY
npm install
npm run dev
```
3. Frontend (new terminal):
```
cd quiz-assessment-portal\client
npm install
npm run dev
```
4. Open http://localhost:5173 (API health: http://localhost:5000/api/health)

Gemini key: https://aistudio.google.com/apikey . If the model name is rejected, change `GEMINI_MODEL` in `.env`. Without a key, quizzes use the fallback bank and the tutor shows an "unavailable" message.

## API
POST /api/auth/register · /login · /logout, GET /api/auth/me
POST /api/quizzes/generate, GET /api/quizzes
POST /api/attempts/start, GET /api/attempts, GET /api/attempts/:id, POST /api/attempts/:id/submit, GET /api/attempts/:id/results
GET /api/dashboard/stats · POST /api/tutor/chat

## Deploy
Deploy this repository to Vercel from the repository root. The root `vercel.json` builds the Vite client and Express server as services, routes `/api/*` to the server, and sends client-side routes to the SPA entrypoint. Configure `JWT_SECRET` and a reachable production `MONGODB_URI` (for example, MongoDB Atlas) in the Vercel project environment; `GEMINI_API_KEY` is optional. Do not use the local MongoDB or in-memory fallback in production. Redeploy after changing environment variables.

## Not done yet
Analytics page, profile/password page, tutor history saving, history search/filters, automated tests, SPA rewrite config for Vercel.
