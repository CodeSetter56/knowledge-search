import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";
import { analyzeFile } from "@/lib/services/analyzer.service";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Determine subfolder based on file type
function getSubfolder(fileType) {
  if (fileType === "application/pdf") return "pdfs";
  if (fileType.startsWith("image/")) return "images";
  if (fileType.includes("wordprocessingml")) return "documents";
  if (fileType.includes("spreadsheetml")) return "spreadsheets";
  if (
    fileType.startsWith("text/") ||
    fileType.includes("xml") ||
    fileType.includes("json") ||
    fileType.includes("sql")
  ) {
    return "text";
  }
  return "other";
}

// Determine what kind of file was uploaded
function getUploadTypeCounters(fileType) {
  if (fileType === "application/pdf") return {};
  if (fileType.includes("wordprocessingml"))
    return { docxUploads: 1, totalUploads: 1 };
  if (fileType.includes("spreadsheetml"))
    return { xlsxUploads: 1, totalUploads: 1 };
  if (fileType.startsWith("image/"))
    return { imageUploads: 1, totalUploads: 1 };
  if (
    fileType.startsWith("text/") ||
    fileType.includes("xml") ||
    fileType.includes("json") ||
    fileType.includes("sql")
  ) {
    return { textUploads: 1, totalUploads: 1 };
  }
  return { otherUploads: 1, totalUploads: 1 };
}

// 30-day rolling credit system for PDFs
function processCreditCycle(stats) {
  const now = Date.now();

  if (!stats.pdfCycleStart) {
    stats.pdfCycleStart = new Date(now);
    stats.pdfNextReset = new Date(now + THIRTY_DAYS_MS);
    stats.pdfCreditsRemaining = stats.pdfMonthlyLimit;
    stats.pdfUploads = 0;
    return;
  }

  if (now >= stats.pdfNextReset.getTime()) {
    stats.pdfCycleStart = new Date(now);
    stats.pdfNextReset = new Date(now + THIRTY_DAYS_MS);
    stats.pdfCreditsRemaining = stats.pdfMonthlyLimit;
    stats.pdfUploads = 0;
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const { fileBase64, fileType, filename } = await req.json();
    if (!fileBase64 || !fileType || !filename) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const uniqueName = Date.now() + "-" + filename.replace(/\s+/g, "_");

    // Determine subfolder
    const subfolder = getSubfolder(fileType);
    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("[upload] Error creating directory:", err);
    }

    const uploadPath = path.join(uploadDir, uniqueName);
    const relativePath = `/uploads/${subfolder}/${uniqueName}`;

    await writeFile(uploadPath, buffer);

    // Analyze the file
    const analysis = await analyzeFile(fileBase64, fileType);

    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) stats = await Stats.create({ _id: "global-stats" });

    processCreditCycle(stats);

    // Deduct credits ONLY for PDFs
    if (fileType === "application/pdf") {
      if (stats.pdfCreditsRemaining > 0) {
        stats.pdfCreditsRemaining -= 1;
      }
      stats.pdfUploads += 1;
      stats.pdfUploadsTotal += 1;
    }

    stats.totalUploads += 1;
    const inc = getUploadTypeCounters(fileType);
    for (const key in inc) {
      stats[key] += inc[key];
    }

    await stats.save();

    // Save file metadata in MongoDB
    const newFile = await File.create({
      filename,
      path: relativePath,
      fileType,
      summary: analysis.summary,
      tags: analysis.tags,
      scannedText: analysis.scannedText,
    });

    return NextResponse.json({ newFile, stats }, { status: 201 });
  } catch (err) {
    console.error("[upload.js] Upload failed:", err);
    const fallbackStats = await Stats.findOne({ _id: "global-stats" });
    return NextResponse.json(
      { error: "Internal server error", stats: fallbackStats },
      { status: 500 }
    );
  }
}
