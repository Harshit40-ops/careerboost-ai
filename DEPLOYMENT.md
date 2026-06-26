# 🚀 Deploy CareerBoost AI (free, permanent public link)

Frontend → **Vercel**, Backend → **Render**. End result: a link like
`https://careerboost-harshit.vercel.app` that anyone can use.

You need a **GitHub** account, a **Vercel** account, and a **Render** account
(all free, sign in with GitHub). Total time: ~15 minutes.

---

## Step 0 — Push the project to GitHub

The code isn't a git repo yet. In the project root run:

```powershell
cd "c:\Users\intel\Desktop\carrer boost AI"
git init
git add .
git commit -m "CareerBoost AI"
```

Then create an empty repo on github.com (e.g. `careerboost-ai`) and push:

```powershell
git remote add origin https://github.com/<your-username>/careerboost-ai.git
git branch -M main
git push -u origin main
```

> Your secret keys are safe — `.env` is git-ignored, so the Groq key is **not**
> pushed. You'll set keys in the Render/Vercel dashboards instead.

---

## Step 1 — Deploy the backend on Render

1. Go to **https://dashboard.render.com** → **New** → **Blueprint**.
2. Connect your GitHub repo. Render detects [`render.yaml`](render.yaml).
3. Click **Apply**. It creates the `careerboost-backend` web service.
4. Open the service → **Environment** → add these (others are preset):
   - `OPENAI_API_KEY` = your Groq key (`gsk_...`)
   - `CORS_ORIGINS` = leave empty for now (we set it in Step 3)
5. Wait for the build to finish. Copy the backend URL, e.g.
   `https://careerboost-backend.onrender.com`. Open it — you should see
   `{"status":"ok",...}`.

---

## Step 2 — Deploy the frontend on Vercel

1. Go to **https://vercel.com** → **Add New** → **Project** → import the same repo.
2. **Root Directory**: click *Edit* and choose **`frontend`**.
3. Framework preset: **Vite** (auto-detected). Build is automatic.
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = your Render backend URL from Step 1
     (e.g. `https://careerboost-backend.onrender.com`)
5. Click **Deploy**. After ~1 min you get your link, e.g.
   `https://careerboost-ai.vercel.app`. **This is the link to share!**

---

## Step 3 — Connect them (CORS)

1. Back in **Render** → backend service → **Environment**.
2. Set `CORS_ORIGINS` = your Vercel URL (no trailing slash), e.g.
   `https://careerboost-ai.vercel.app`
3. Save — Render redeploys automatically. Done. 🎉

Open your Vercel link and the whole app works for anyone, anywhere.

---

## Good to know (free-tier notes)

- **Cold start:** Render's free backend sleeps after ~15 min idle. The first
  request then takes ~30–50s to wake up; after that it's fast. (Refreshing once
  is enough.)
- **Database:** the app uses SQLite on the server's disk, which **resets on each
  backend redeploy/restart** on the free tier. For permanent user data, add a
  free Postgres later and set `DATABASE_URL` — the code already reads it from the
  environment.
- **API key safety:** the Groq key lives only on the backend (Render env var). It
  is never exposed to the browser.
- **Embeddings:** deployment uses the TF-IDF fallback for Layer 2 (torch is too
  heavy for the free tier). Scoring still works great.
- **Custom domain:** in Vercel you can attach a custom domain (e.g.
  `careerboost.in`) for free if you own one.

---

Designed and made by **Harshit Sharma**.
