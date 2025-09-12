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

    let count = 0;
    for (const raw of data.leads || []) {
      const name  = raw.field_data.find(f => f.name === "full_name")?.values?.[0] || null;
      const email = raw.field_data.find(f => f.name === "email")?.values?.[0]?.toLowerCase() || null;
      const phone = raw.field_data.find(f => f.name === "phone_number")?.values?.[0] || null;

      await prisma.lead.upsert({
        where: { source_email: { source: "META", email } },   // composite unique in Prisma
        update: {
          name,
          phone,
          externalId: raw.leadgen_id,
          meta: {
            ad_id: raw.ad_id,
            campaign_id: raw.campaign_id,
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
            ad_id: raw.ad_id,
            campaign_id: raw.campaign_id,
            form_id: raw.form_id,
          },
        },
      });
      count++;
    }

    await prisma.syncLog.create({
      data: { source: "META", status: "SUCCESS", details: { imported: count } },
    });

    return { ok: true, imported: count };
  } catch (err) {
    await prisma.syncLog.create({
      data: { source: "META", status: "ERROR", details: { message: String(err) } },
    });
    return { ok: false, error: String(err) };
  }
}
