import mongoose from "mongoose";

const SyncLogSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ["META", "GOOGLE"], required: true },
    fetchedCount: { type: Number, required: true },
    importedCount: { type: Number, required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    status: { type: String, enum: ["SUCCESS", "PARTIAL", "ERROR"], default: "SUCCESS" },
    notes: { type: String, default: null }
  },
  { timestamps: true }
);

SyncLogSchema.index({ createdAt: -1 });
SyncLogSchema.index({ platform: 1, createdAt: -1 });

export const SyncLog = mongoose.model("SyncLog", SyncLogSchema);
