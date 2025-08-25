import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ["META", "GOOGLE"], required: true },
    providerLeadId: { type: String, required: true },
    name: String,
    email: { type: String, index: true, sparse: true, trim: true, lowercase: true },
    phone: { type: String, index: true, sparse: true, trim: true },
    campaignId: String,
    campaignName: String,
    adId: String,
    formId: String,
    raw: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

// Source-level dedupe & business dedupe
LeadSchema.index({ platform: 1, providerLeadId: 1 }, { unique: true });
LeadSchema.index({ email: 1 }, { unique: true, sparse: true });
LeadSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const Lead = mongoose.model("Lead", LeadSchema);
