import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { syncMetaLeads } from "./services/syncMeta.js";
import { syncGoogleLeads } from "./services/syncGoogle.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

// -------- Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: "postgres", time: new Date().toISOString() });
});

// -------- Leads (pagination + optional platform filter)
// GET /api/leads?page=1&limit=20&platform=META
app.get("/api/leads", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const platform = req.query.platform?.toString().toUpperCase();

    const where = platform ? { source: platform } : {};

    const [rows, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    // 🔁 Normalize to the frontend’s expected shape
    const items = rows.map((r) => ({
      name: r.name ?? "-",
      phone: r.phone ?? "-",
      email: r.email ?? "-",
      platform: r.source, // UI expects `platform`
      // prefer a single `campaign` key across META/GOOGLE
      campaign:
        (r.meta?.campaign) ||
        (r.meta?.campaign_id) ||
        "-",
      timestamp: r.createdAt, // UI shows this as “Timestamp”
    }));

    res.json({ items, total, page, limit });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// -------- Logs (latest first)
app.get("/api/logs", async (_req, res) => {
  try {
    const rows = await prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const logs = rows.map((r) => ({
      source: r.source ?? "-",
      status: r.status ?? "-",
      fetched: r.details?.fetched ?? 0,
      imported: r.details?.imported ?? 0,
      timestamp: r.createdAt,
    }));
    res.json(logs);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// -------- Mock Meta (simulated external source)
app.get("/mock/meta/leads", (_req, res) => {
  const leads = [
    {
      leadgen_id: "META_" + Date.now(),
      field_data: [
        { name: "full_name", values: ["Alice Meta"] },
        { name: "email", values: ["alice.meta@example.com"] },
        { name: "phone_number", values: ["+91-9000000001"] },
      ],
      ad_id: "ad_meta_123",
      campaign_id: "cmp_meta_123",
      form_id: "form_meta_123",
      created_time: new Date().toISOString(),
    },
    {
      leadgen_id: "META_" + (Date.now() + 1),
      field_data: [
        { name: "full_name", values: ["Bob Meta"] },
        { name: "email", values: ["bob.meta@example.com"] },
        { name: "phone_number", values: ["+91-9000000002"] },
      ],
      ad_id: "ad_meta_456",
      campaign_id: "cmp_meta_456",
      form_id: "form_meta_456",
      created_time: new Date().toISOString(),
    },
  ];
  res.json({ leads });
});

// -------- Mock Google (simulated external source)
app.get("/mock/google/leads", (_req, res) => {
  const leads = [
    {
      resource_name: "customers/123/leadForms/1/leadFormSubmissionData/1",
      lead_form_id: "form_google_123",
      campaign: "cmp_google_123",
      ad: "ad_google_123",
      custom_lead_form_fields: [
        { question_text: "Full Name", user_input: "Charlie Google" },
        { question_text: "Email", user_input: "charlie.google@example.com" },
        { question_text: "Phone", user_input: "+91-9000000003" },
      ],
      created_at: new Date().toISOString(),
    },
    {
      resource_name: "customers/123/leadForms/1/leadFormSubmissionData/2",
      lead_form_id: "form_google_456",
      campaign: "cmp_google_456",
      ad: "ad_google_456",
      custom_lead_form_fields: [
        { question_text: "Full Name", user_input: "Diana Google" },
        { question_text: "Email", user_input: "diana.google@example.com" },
        { question_text: "Phone", user_input: "+91-9000000004" },
      ],
      created_at: new Date().toISOString(),
    },
  ];
  res.json({ leads });
});

// -------- Sync Meta
app.post("/api/sync/meta", async (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const result = await syncMetaLeads(baseUrl);
  res.json(result);
});

// -------- Sync Google
app.post("/api/sync/google", async (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const result = await syncGoogleLeads(baseUrl);
  res.json(result);
});

// -------- Sync All
app.post("/api/sync/all", async (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const meta = await syncMetaLeads(baseUrl);
  const google = await syncGoogleLeads(baseUrl);
  res.json({ ok: true, meta, google });
});

// -------- Root Landing Page --------
app.get("/", (_req, res) => {
  res.type("html").send(`
    <h2>Lead Sync API</h2>
    <p>Status check: <a href="/api/health">/api/health</a></p>
    <p>Available endpoints:</p>
    <ul>
      <li>GET <code>/api/leads</code></li>
      <li>GET <code>/api/logs</code></li>
      <li>POST <code>/api/sync/all</code></li>
      <li>POST <code>/api/sync/meta</code></li>
      <li>POST <code>/api/sync/google</code></li>
    </ul>
  `);
});

// -------- Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
