import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  // Relative path in Next.js public folder (e.g., "/uploads/123-file.pdf")
  path: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  summary: { type: String },
  tags: [String],
  // Raw extracted text from PDF/DOCX/XLSX/plain text/OCR
  scannedText: { type: String },
});

// Full-Text Search Index that makes keyword searching much faster.
FileSchema.index({
  scannedText: "text",
  summary: "text",
  tags: "text",
  filename: "text",
});

export default mongoose.models.File || mongoose.model("File", FileSchema);
