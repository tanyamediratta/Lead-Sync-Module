Lead Sync Module

This project is a full-stack lead management module designed to demonstrate how marketing leads from multiple ad platforms can be integrated into a single CRM system.

It automatically fetches leads from mock Meta and Google Ads APIs, ensures deduplication at the database level, and provides a clean React dashboard to monitor both leads and sync logs.

The project simulates a real-world scenario where companies run ads on multiple platforms and need to consolidate data into one reliable system.

🚀 Tech Stack
Backend (API & Database)

Node.js + Express → REST APIs

PostgreSQL (Render) → cloud database

Prisma ORM → schema, queries, and migrations

Axios → fetching mock data

Nodemon → hot reload during dev

Frontend (Dashboard)

React (Vite) → fast dev/build setup

Tailwind CSS → modern UI styling

Axios → API calls

Vercel → deployment

Deployment

Backend: Render (always-live REST API)

Frontend: Vercel (public React dashboard)

✨ Features
🔗 Backend APIs

POST /api/sync/all → Fetch and import leads from Meta and Google simultaneously.

GET /api/leads → Returns paginated, filterable list of leads (filter by META / GOOGLE).

GET /api/logs → Returns recent sync logs, showing how many leads were fetched and how many were actually imported.

Deduplication logic

Enforced at the database level with a unique constraint on (source, email)

Same lead synced again will be fetched but not imported

📊 Frontend Dashboard
Leads Table

Displays name, email, phone, platform, campaign, timestamp

Hover effects, platform badges, responsive design

Sync Logs

Shows fetchedCount vs importedCount

Timestamp for each sync

Controls

Sync Now button (manual trigger)

Auto-Sync toggle (every 5 minutes)

Platform filter (All, META, GOOGLE)

User Experience Enhancements

Toast notifications on success/failure

Loading indicators

Gradient header + styled buttons

🔗 Live Demo

Frontend (Dashboard): https://lead-sync-module.vercel.app

Backend (API): [https://lead-sync-module.onrender.com](https://lead-sync-module-1.onrender.com/)

Try it out:

Open the dashboard (frontend link).

Click Sync Now → watch new mock leads appear in the table.

Enable Auto-Sync → system auto-fetches every 5 minutes.

Check the Logs → confirm how many were fetched vs imported.
