import { prisma } from "../utils/prisma.js";

export async function syncMetaLeads(baseUrl) {
  try {
    const resp = await fetch(`${baseUrl}/mock/meta/leads`);
    if (!resp.ok) throw new Error(`META fetch failed: ${resp.status}`);
    const data = await resp.json();

    const fetched = (data.leads || []).length;
    let imported = 0;

    for (const raw of data.leads || []) {
      const name  = raw.field_data.find(f => f.name === "full_name")?.values?.[0] || null;
      const email = raw.field_data.find(f => f.name === "email")?.values?.[0]?.toLowerCase() || null;
      const phone = raw.field_data.find(f => f.name === "phone_number")?.values?.[0] || null;

      if (!email) continue; // optional: skip rows with no email

      const where = { source_email: { source: "META", email } };
      const exists = await prisma.lead.findUnique({ where });

      const common = {
        name,
        phone,
        externalId: raw.leadgen_id,
        meta: {
          ad: raw.ad_id,
          campaign: raw.campaign_id, // unified key for UI
          form_id: raw.form_id,
        },
      };

      if (exists) {
        await prisma.lead.update({ where, data: { ...common, updatedAt: new Date() } });
        // not counted as imported
      } else {
        await prisma.lead.create({ data: { source: "META", email, ...common } });
        imported += 1; // count only brand new rows
      }
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
