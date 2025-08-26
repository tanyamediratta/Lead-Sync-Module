import axios from "axios";
import { Lead } from "../models/Lead.js";
import { SyncLog } from "../models/SyncLog.js";

function normalizeGoogleLead(gLead) {
  let name = null, email = null, phone = null;
  (gLead.custom_lead_form_fields || []).forEach(f => {
    const q = f.question_text.toLowerCase();
    if (q.includes("name")) name = f.user_input;
    if (q.includes("email")) email = f.user_input;
    if (q.includes("phone")) phone = f.user_input;
  });

  return {
    platform: "GOOGLE",
    providerLeadId: gLead.resource_name,
    name,
    email,
    phone,
    campaignId: gLead.campaign,
    campaignName: "Google Campaign",
    adId: gLead.ad,
    formId: gLead.lead_form_id,
    raw: gLead
  };
}

export async function syncGoogleLeads(baseUrl) {
  const startedAt = new Date();
  let fetched = 0, imported = 0;

  try {
    const { data } = await axios.get(`${baseUrl}/mock/google/leads`);
    const leads = data.leads || [];
    fetched = leads.length;

    for (const l of leads) {
      const normalized = normalizeGoogleLead(l);
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
      platform: "GOOGLE",
      fetchedCount: fetched,
      importedCount: imported,
      startedAt,
      finishedAt: new Date(),
      status: "SUCCESS"
    });

    return { ok: true, fetched, imported };
  } catch (err) {
    await SyncLog.create({
      platform: "GOOGLE",
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
