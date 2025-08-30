import "dotenv/config";
import express from "express";
import cors from "cors";
import { connect } from "./utils/db.js";
import { Lead } from "./models/Lead.js";
import { SyncLog } from "./models/SyncLog.js";
import { syncMetaLeads } from "./services/syncMeta.js";
import { syncGoogleLeads } from "./services/syncGoogle.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json());

// -------- Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// -------- Leads (pagination + optional platform filter)
// GET /api/leads?page=1&limit=20&platform=META
app.get("/api/leads", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const platform = req.query.platform?.toString().toUpperCase();
    const filter = platform ? { platform } : {};

    const [items, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Lead.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// -------- Logs (latest first)
app.get("/api/logs", async (_req, res) => {
  try {
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(100);
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

// -------- Start
const PORT = process.env.PORT || 4000;
connect().then(() => {
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
});
