import { prisma } from "../utils/prisma.js";

export async function syncGoogleLeads(baseUrl) {
  try {
    const resp = await fetch(`${baseUrl}/mock/google/leads`);
    if (!resp.ok) throw new Error(`GOOGLE fetch failed: ${resp.status}`);
    const data = await resp.json();

    const fetched = (data.leads || []).length;
    let imported = 0;

    for (const raw of data.leads || []) {
      const get = (label) =>
        raw.custom_lead_form_fields.find(f => f.question_text.toLowerCase().includes(label))?.user_input || null;

      const name  = get("full");
      const email = (get("email") || "").toLowerCase() || null;
      const phone = get("phone");

      if (!email) continue; // optional: skip rows with no email

      const where = { source_email: { source: "GOOGLE", email } };
      const exists = await prisma.lead.findUnique({ where });

      const common = {
        name,
        phone,
        externalId: raw.resource_name,
        meta: {
          lead_form_id: raw.lead_form_id,
          campaign: raw.campaign, // unified key for UI
          ad: raw.ad,
        },
      };

      if (exists) {
        await prisma.lead.update({ where, data: { ...common, updatedAt: new Date() } });
        // not counted as imported
      } else {
        await prisma.lead.create({ data: { source: "GOOGLE", email, ...common } });
        imported += 1; // count only brand new rows
      }
    }

    await prisma.syncLog.create({
      data: { source: "GOOGLE", status: "SUCCESS", details: { fetched, imported } },
    });

    return { ok: true, fetched, imported };
  } catch (err) {
    await prisma.syncLog.create({
      data: { source: "GOOGLE", status: "ERROR", details: { message: String(err) } },
    });
    return { ok: false, error: String(err) };
  }
}
