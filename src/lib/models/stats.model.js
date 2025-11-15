import mongoose from "mongoose";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Stores ALL global counters + PDF credit system.
const StatsSchema = new mongoose.Schema({
  // Fixed ID so we always update the same stats document
  _id: { type: String, default: "global-stats" },

  pdfMonthlyLimit: { type: Number, default: 25000 },
  pdfCreditsRemaining: { type: Number, default: 25000 },
  pdfCycleStart: { type: Date, default: null },
  pdfNextReset: { type: Date, default: null },
  pdfUploads: { type: Number, default: 0 },

  totalUploads: { type: Number, default: 0 },
  pdfUploadsTotal: { type: Number, default: 0 },

  docxUploads: { type: Number, default: 0 },
  xlsxUploads: { type: Number, default: 0 },
  imageUploads: { type: Number, default: 0 },
  textUploads: { type: Number, default: 0 },
  otherUploads: { type: Number, default: 0 },
});

export default mongoose.models.Stats || mongoose.model("Stats", StatsSchema);
