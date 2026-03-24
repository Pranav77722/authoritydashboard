# Authority Dashboard

Authority operations dashboard for CityFix. This UI supports issue management, worker assignment, and email notifications to workers using EmailJS.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create or update `.env` in this folder using `.env.example`.

3. Add Firebase configuration values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

4. Add EmailJS values for worker task notifications:

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

5. Start development server:

```bash
npm run dev
```

## EmailJS Template Params

The task assignment action sends the following params to your EmailJS template:

- `to_email`
- `to_name`
- `worker_email`
- `worker_name`
- `issue_id`
- `issue_description`
- `priority`
- `assigned_at`

Use these variables in your EmailJS template body and subject.

## Task Assignment Behavior

When authority assigns a task:

1. Issue is updated to `in_progress` with assigned worker details.
2. An audit record is written to `updates` collection.
3. Worker in-app notification is written to `notifications` collection.
4. Citizen receives in-app notification.
5. Email is sent to worker if EmailJS env vars are configured.

## Deploy To Vercel (Authority Dashboard Only)

This folder includes `vercel.json` configured for Vite build output and SPA route rewrites.

### Option A: Vercel Dashboard (recommended)

1. Push code to GitHub.
2. In Vercel, click **Add New Project** and import the repository.
3. Set **Root Directory** to `authority-dashboard`.
4. Keep build settings:
	- Build Command: `npm run build`
	- Output Directory: `dist`
5. Add these Environment Variables in Vercel Project Settings:
	- `VITE_FIREBASE_API_KEY`
	- `VITE_FIREBASE_AUTH_DOMAIN`
	- `VITE_FIREBASE_PROJECT_ID`
	- `VITE_FIREBASE_STORAGE_BUCKET`
	- `VITE_FIREBASE_MESSAGING_SENDER_ID`
	- `VITE_FIREBASE_APP_ID`
	- `VITE_EMAILJS_SERVICE_ID`
	- `VITE_EMAILJS_TEMPLATE_ID`
	- `VITE_EMAILJS_PUBLIC_KEY`
	- `VITE_EMAILJS_DEFAULT_TO_EMAIL`
6. Deploy.

### Option B: Vercel CLI

```bash
cd authority-dashboard
npm i -g vercel
vercel
vercel --prod
```

When prompted, confirm the current folder (`authority-dashboard`) as the deploy root.
