// services/syncGoogle.js
import { prisma } from "../utils/prisma.js";

// If you're on Node < 18, uncomment next 2 lines and run: npm i node-fetch
// import fetch from "node-fetch";
// globalThis.fetch = globalThis.fetch || fetch;

export async function syncGoogleLeads(baseUrl) {
  try {
    const resp = await fetch(`${baseUrl}/mock/google/leads`);
    if (!resp.ok) throw new Error(`GOOGLE fetch failed: ${resp.status}`);
    const data = await resp.json();

    let count = 0;
    for (const raw of data.leads || []) {
      const get = (label) =>
        raw.custom_lead_form_fields.find(f => f.question_text.toLowerCase().includes(label))?.user_input || null;

      const name  = get("full");
      const email = (get("email") || "").toLowerCase() || null;
      const phone = get("phone");

      await prisma.lead.upsert({
        where: { source_email: { source: "GOOGLE", email } },
        update: {
          name,
          phone,
          externalId: raw.resource_name,
          meta: {
            lead_form_id: raw.lead_form_id,
            campaign: raw.campaign,
            ad: raw.ad,
          },
          updatedAt: new Date(),
        },
        create: {
          source: "GOOGLE",
          email,
          name,
          phone,
          externalId: raw.resource_name,
          meta: {
            lead_form_id: raw.lead_form_id,
            campaign: raw.campaign,
            ad: raw.ad,
          },
        },
      });
      count++;
    }

    await prisma.syncLog.create({
      data: { source: "GOOGLE", status: "SUCCESS", details: { imported: count } },
    });

    return { ok: true, imported: count };
  } catch (err) {
    await prisma.syncLog.create({
      data: { source: "GOOGLE", status: "ERROR", details: { message: String(err) } },
    });
    return { ok: false, error: String(err) };
  }
}
