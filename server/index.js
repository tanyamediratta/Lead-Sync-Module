import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connect } from './utils/db.js';
import { Lead } from './models/Lead.js';

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