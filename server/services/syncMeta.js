// services/syncMeta.js
import { prisma } from "../utils/prisma.js";

// If you're on Node < 18, uncomment next 2 lines and run: npm i node-fetch
// import fetch from "node-fetch";
// globalThis.fetch = globalThis.fetch || fetch;

export async function syncMetaLeads(baseUrl) {
  try {
    const resp = await fetch(`${baseUrl}/mock/meta/leads`);
    if (!resp.ok) throw new Error(`META fetch failed: ${resp.status}`);
    const data = await resp.json();

    let imported = 0;
    const fetched = (data.leads || []).length;

    for (const raw of data.leads || []) {
      const name  = raw.field_data.find(f => f.name === "full_name")?.values?.[0] || null;
      const email = raw.field_data.find(f => f.name === "email")?.values?.[0]?.toLowerCase() || null;
      const phone = raw.field_data.find(f => f.name === "phone_number")?.values?.[0] || null;

      await prisma.lead.upsert({
        where: { source_email: { source: "META", email } },
        update: {
          name,
          phone,
          externalId: raw.leadgen_id,
          // use unified meta keys the UI expects
          meta: {
            ad: raw.ad_id,
            campaign: raw.campaign_id, // << unify to `campaign`
            form_id: raw.form_id,
          },
          updatedAt: new Date(),
        },
        create: {
          source: "META",
          email,
          name,
          phone,
          externalId: raw.leadgen_id,
          meta: {
            ad: raw.ad_id,
            campaign: raw.campaign_id,
            form_id: raw.form_id,
          },
        },
      });
      imported++;
    }

    await prisma.syncLog.create({
      data: { source: "META", status: "SUCCESS", details: { fetched, imported } },
    });

    return { ok: true, fetched, imported };
  } catch (err) {
    await prisma.syncLog.create({
      data: { source: "META", status: "ERROR", details: { message: String(err) } },
    });
    return { ok: false, error: String(err) };
  }
}
