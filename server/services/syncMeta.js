import axios from "axios";
import { Lead } from "../models/Lead.js";
import { SyncLog } from "../models/SyncLog.js";

function normalizeMetaLead(metaLead) {
  const map = {};
  (metaLead.field_data || []).forEach(f => {
    map[f.name] = f.values[0] || null;
  });

  return {
    platform: "META",
    providerLeadId: metaLead.leadgen_id,
    name: map.full_name || null,
    email: map.email || null,
    phone: map.phone_number || null,
    campaignId: metaLead.campaign_id,
    campaignName: "Meta Campaign",
    adId: metaLead.ad_id,
    formId: metaLead.form_id,
    raw: metaLead
  };
}

export async function syncMetaLeads(baseUrl) {
  const startedAt = new Date();
  let fetched = 0, imported = 0;

  try {
    const { data } = await axios.get(`${baseUrl}/mock/meta/leads`);
    const leads = data.leads || [];
    fetched = leads.length;

    for (const l of leads) {
      const normalized = normalizeMetaLead(l);
      try {
        await Lead.create(normalized);
        imported++;
      } catch (e) {
        if (e.code === 11000) {
          // duplicate → skip
        } else {
          throw e;
        }
      }
    }

    await SyncLog.create({
      platform: "META",
      fetchedCount: fetched,
      importedCount: imported,
      startedAt,
      finishedAt: new Date(),
      status: "SUCCESS"
    });

    return { ok: true, fetched, imported };
  } catch (err) {
    await SyncLog.create({
      platform: "META",
      fetchedCount: fetched,
      importedCount: imported,
      startedAt,
      finishedAt: new Date(),
      status: "ERROR",
      notes: err.message
    });
    return { ok: false, error: err.message };
  }
}
