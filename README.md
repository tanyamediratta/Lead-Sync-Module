# Lead Sync Module

This project is a **full-stack lead management module** designed to demonstrate how marketing leads from multiple ad platforms can be integrated into a single CRM system.  
It automatically **fetches leads from mock Meta and Google Ads APIs**, ensures **deduplication** at the database level, and provides a clean **React dashboard** to monitor both **leads** and **sync logs**.  

The project simulates a real-world scenario where companies run ads on multiple platforms and need to consolidate data into one reliable system.

---

## 🚀 Tech Stack

**Backend (API & Database)**  
- Node.js with Express for REST APIs  
- MongoDB Atlas as the cloud database  
- Mongoose for schema validation and indexing  
- Axios for fetching mock data  
- Nodemon for local dev hot-reload  

**Frontend (Dashboard)**  
- React (Vite) for a fast development/build setup  
- Tailwind CSS for modern UI styling  
- Axios for API calls  
- Deployed via Vercel  

**Deployment**  
- Backend: Render (always-live REST API)  
- Frontend: Vercel (public React dashboard)  

---

## ✨ Features

### 🔗 Backend APIs
- `POST /api/sync/all` → Fetch and import leads from **Meta** and **Google** simultaneously.  
- `GET /api/leads` → Returns a paginated, filterable list of leads. Supports filtering by platform (`META` or `GOOGLE`).  
- `GET /api/logs` → Returns the last 50 sync logs, showing how many leads were fetched and how many were actually imported after deduplication.  
- Deduplication logic:
  - **Unique by** `(platform + providerLeadId)`
  - **Unique by email** (if provided)
  - **Unique by phone** (if provided)

### 📊 Frontend Dashboard
- **Leads Table**  
  - Displays name, email, phone, platform, campaign, and timestamp.  
  - Hover effects, colored badges for platform, and responsive design.  
- **Sync Logs**  
  - Shows recent sync attempts with `fetchedCount` and `importedCount`.  
  - Displays timestamp for each sync.  
- **Controls**  
  - **Sync Now** button (manual trigger).  
  - **Auto-Sync toggle** (every 5 minutes; preference stored in browser).  
  - Platform dropdown filter (`All`, `META`, `GOOGLE`).  
- **User Experience Enhancements**  
  - Toast notifications on success or failure.  
  - Loading indicators while leads/logs are fetched.  
  - Professional gradient header + contrasting buttons for visual clarity.  

---

## 🔗 Live Demo

- **Frontend (Dashboard):** https://lead-sync-module.vercel.app  
- **Backend (API):** https://lead-sync-module.onrender.com  

Try it out:  
1. Open the dashboard (frontend link).  
2. Click **Sync Now** → watch new mock leads appear in the leads table.  
3. Enable **Auto-Sync** → see the system automatically fetch every 5 minutes.  
4. Check the **Logs** section → confirm how many leads were fetched vs imported.  

---

## 📸 Screenshots  


### Dashboard (Leads Table)
[![Dashboard](./screenshots/dashboard.png)](https://github.com/tanyamediratta/Lead-Sync-Module/blob/main/screenshots/Dashboard.png)

### Sync Logs with Auto-Sync
[![Logs](./screenshots/logs.png)](https://github.com/tanyamediratta/Lead-Sync-Module/blob/main/screenshots/Logs.png)

---

## 🛠 Local Development

### Prerequisites
- Node.js (v20 LTS recommended; pinned via `.nvmrc`)  
- MongoDB Atlas account (free tier is enough)  
- Git + npm  
