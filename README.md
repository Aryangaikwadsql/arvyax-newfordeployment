# AI-Assisted Journal System

## Local Setup (Previous)
1. `cd backend && npm install`
2. copy `.env.example` to `.env` (GROQ_API_KEY)
3. `npm start` (localhost:3001)
4. Open `frontend/index.html`

## Vercel Deployment (New)
1. **Vercel CLI**: `npm i -g vercel`
2. **Login**: `vercel login`
3. **Deploy**: `vercel` (root dir)
4. **Env Vars** (dashboard):
   - `GROQ_API_KEY`: your key
   - `DATABASE_URL`: Create Vercel Postgres → connection string
   - KV vars: Create Vercel KV → REST API URL/token
5. **Migrate DB**: `cd backend && npx prisma db push`
6. Live URL: https://your-project.vercel.app (frontend + /api)

**Notes**:
- SQLite → Postgres (free tier).
- Cache: Vercel KV.
- Serverless API: backend/api/journal/route.js
- Static frontend with SPA routing.

## Test
curl -X POST $VERCEL_URL/api/journal -d '{\"userId\":\"123\",\"ambience\":\"forest\",\"text\":\"Test\"}'

Your app is now hosted on Vercel!

