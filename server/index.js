import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connect } from './utils/db.js';
import { Lead } from './models/Lead.js';
import { syncMetaLeads } from "./services/syncMeta.js";
import { SyncLog } from "./models/SyncLog.js";
import { syncGoogleLeads } from "./services/syncGoogle.js";


const app = express();
app.use(cors());
app.use(express.json());

// --- Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- Dev: list latest leads
app.get('/api/leads', async (_req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 }).limit(50);
  res.json(leads);
});

// --- Dev: insert one dummy lead (for quick testing)
app.post('/api/dev/insert-dummy', async (req, res) => {
  try {
    const b = req.body || {};
    const lead = await Lead.create({
      platform: b.platform || 'META',
      providerLeadId: b.providerLeadId || ('META_' + Date.now()),
      name: b.name || 'Dummy User',
      email: b.email || 'dummy.user@example.com',
      phone: b.phone || '+91-9999999999',
      campaignId: b.campaignId || 'cmp_123',
      campaignName: b.campaignName || 'Demo Campaign',
      adId: b.adId || 'ad_456',
      formId: b.formId || 'form_789',
      raw: b.raw || { source: 'dev-insert' }
    });
    res.json({ ok: true, lead });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// --- Dev: drop ALL indexes on leads (use if index conflict)
app.delete('/api/dev/drop-indexes', async (_req, res) => {
  try {
    const result = await Lead.collection.dropIndexes();
    res.json({ ok: true, result: result ?? 'Indexes dropped (or none existed)' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Dev: (re)build indexes from schema
app.get('/api/dev/build-indexes', async (_req, res) => {
  try {
    const result = await Lead.syncIndexes();
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Dev: show existing indexes
app.get('/api/dev/indexes', async (_req, res) => {
  const idx = await Lead.collection.indexes();
  res.json(idx);
});

// --- Start server after DB connect
const PORT = process.env.PORT || 4000;
connect().then(() => {
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
});


app.post('/api/dev/rebuild-contact-indexes', async (_req, res) => {
  try {
    // Drop just these two (if they exist)
    try { await Lead.collection.dropIndex('email_1'); } catch (_) {}
    try { await Lead.collection.dropIndex('phone_1'); } catch (_) {}

    // Recreate with unique + sparse
    await Lead.collection.createIndex({ email: 1 }, { name: 'email_1', unique: true, sparse: true });
    await Lead.collection.createIndex({ phone: 1 }, { name: 'phone_1', unique: true, sparse: true });

    // Keep platform+providerLeadId unique (if it somehow got removed)
    await Lead.collection.createIndex(
      { platform: 1, providerLeadId: 1 },
      { name: 'platform_1_providerLeadId_1', unique: true }
    );

    const idx = await Lead.collection.indexes();
    res.json({ ok: true, indexes: idx });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// --- Mock Meta API (simulated leads)
app.get("/mock/meta/leads", (_req, res) => {
  // Fake raw Meta-style payload
  const leads = [
    {
      leadgen_id: "META_" + Date.now(),
      field_data: [
        { name: "full_name", values: ["Alice Meta"] },
        { name: "email", values: ["alice.meta@example.com"] },
        { name: "phone_number", values: ["+91-9000000001"] }
      ],
      ad_id: "ad_meta_123",
      campaign_id: "cmp_meta_123",
      form_id: "form_meta_123",
      created_time: new Date().toISOString()
    },
    {
      leadgen_id: "META_" + (Date.now() + 1),
      field_data: [
        { name: "full_name", values: ["Bob Meta"] },
        { name: "email", values: ["bob.meta@example.com"] },
        { name: "phone_number", values: ["+91-9000000002"] }
      ],
      ad_id: "ad_meta_456",
      campaign_id: "cmp_meta_456",
      form_id: "form_meta_456",
      created_time: new Date().toISOString()
    }
  ];
  res.json({ leads });
});

// --- Dev: list sync logs
app.get("/api/logs", async (_req, res) => {
  try {
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// --- Trigger Meta sync
// app.post("/api/sync/meta", async (req, res) => {
//   const result = await syncMetaLeads("http://localhost:4000");
//   res.json(result);
// });




app.post("/api/sync/all", async (_req, res) => {
  const meta = await syncMetaLeads("http://localhost:4000");
 const google = await syncGoogleLeads("http://localhost:4000");
  res.json({ ok: true, meta, google });
});



// --- Mock Google API (simulated leads)
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
        { question_text: "Phone", user_input: "+91-9000000003" }
      ],
      created_at: new Date().toISOString()
    },
    {
      resource_name: "customers/123/leadForms/1/leadFormSubmissionData/2",
      lead_form_id: "form_google_456",
      campaign: "cmp_google_456",
      ad: "ad_google_456",
      custom_lead_form_fields: [
        { question_text: "Full Name", user_input: "Diana Google" },
        { question_text: "Email", user_input: "diana.google@example.com" },
        { question_text: "Phone", user_input: "+91-9000000004" }
      ],
      created_at: new Date().toISOString()
    }
  ];
  res.json({ leads });
});



// --- Trigger Google sync
app.post("/api/sync/google", async (_req, res) => {
  const result = await syncGoogleLeads("http://localhost:4000");
  res.json(result);
});