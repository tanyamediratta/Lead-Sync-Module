# 📌 Lead Sync Module  

This project is a full-stack lead management module designed to demonstrate how marketing leads from multiple ad platforms can be integrated into a single CRM system.  

It automatically fetches leads from mock **Meta** and **Google Ads** APIs, ensures **deduplication at the database level**, and provides a clean **React dashboard** to monitor both leads and sync logs.  

The project simulates a real-world scenario where companies run ads on multiple platforms and need to consolidate data into one reliable system.  

---

## 🚀 Tech Stack  

### 🔙 Backend (API & Database)  
- Node.js with Express for REST APIs  
- PostgreSQL (via Render cloud database)  
- Prisma ORM for schema validation and migrations  
- Axios for fetching mock data  
- Nodemon for local dev hot-reload  

### 🎨 Frontend (Dashboard)  
- React (Vite) for a fast development/build setup  
- Tailwind CSS for modern UI styling  
- Axios for API calls  
- Deployed via Vercel  

### ☁️ Deployment  
- **Backend:** Render (always-live REST API)  
- **Frontend:** Vercel (public React dashboard)  

---

## ✨ Features  

### 🔗 Backend APIs  
- `POST /api/sync/all` → Fetch and import leads from Meta and Google simultaneously  
- `GET /api/leads` → Paginated, filterable list of leads (filter by `META` / `GOOGLE`)  
- `GET /api/logs` → Last 50 sync logs with fetched/imported counts  

#### Deduplication logic  
- Unique by `(platform + providerLeadId)`  
- Unique by `email` (if provided)  
- Unique by `phone` (if provided)  

---

### 📊 Frontend Dashboard – Leads Table  
- Displays **name, email, phone, platform, campaign, timestamp**  
- Hover effects, colored platform badges, responsive design  

### 📈 Sync Logs  
- Shows **fetchedCount vs importedCount**  
- Displays **timestamp** for each sync  

### 🛠 Controls  
- **Sync Now** button (manual trigger)  
- **Auto-Sync** toggle (every 5 minutes; preference stored in browser)  
- **Platform filter** (All, META, GOOGLE)  

### 🎨 User Experience Enhancements  
- Toast notifications on success/failure  
- Loading indicators  
- Professional gradient header + styled buttons  

---

## 🔗 Live Demo  

- **Frontend (Dashboard):** [lead-sync-module.vercel.app](https://lead-sync-module.vercel.app)  
- **Backend (API):** ([https://lead-sync-module.onrender.com](https://lead-sync-module-1.onrender.com))  

### Try it out:  
1. Open the **dashboard** (frontend link).  
2. Click **Sync Now** → watch new mock leads appear in the table.  
3. Enable **Auto-Sync** → system auto-fetches every 5 minutes.  
4. Check the **Logs section** → confirm how many leads were fetched vs imported.  

---


## 🛠 Local Development  

### Prerequisites  
- Node.js (v20 LTS recommended; pinned via `.nvmrc`)  
- PostgreSQL (via Render, or local)  
- Git + npm  

### 1. Clone Repo  
```bash
git clone https://github.com/tanyamediratta/Lead-Sync-Module.git
cd crm-lead-sync
