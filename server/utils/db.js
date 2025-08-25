console.log('MONGO_URI present:', !!process.env.MONGO_URI, 'length:', (process.env.MONGO_URI||'').length);
await mongoose.connect(process.env.MONGO_URI);

import mongoose from "mongoose";


export async function connect() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
