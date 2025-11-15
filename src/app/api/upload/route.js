import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";
import { analyzeFile } from "@/lib/services/analyzer.service";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Determine subfolder based on file type. Segregate general text from structured data.
function getSubfolder(fileType) {
  if (fileType === "application/pdf") return "pdfs";
  if (fileType.startsWith("image/")) return "images";

  // Group 1: Documents/General Text (DOCX, Plain TXT) -> texts folder
  if (
    fileType.includes("wordprocessingml") || // DOCX
    fileType.startsWith("text/plain")
  ) {
    return "texts";
  }

  // Group 2: Structured/Data Files (XLSX, JSON, SQL, XML, CSV, etc.) -> structured folder
  if (
    fileType.includes("spreadsheetml") || // XLSX
    fileType.includes("json") ||
    fileType.includes("xml") ||
    fileType.includes("sql") ||
    fileType.includes("csv") ||
    // Catch other general text types that are often structured/markup
    (fileType.startsWith("text/") && fileType !== "text/plain")
  ) {
    return "structured";
  }

  return "other";
}

// Determine what kind of file was uploaded - Counters remain distinct for stats tracking.
function getUploadTypeCounters(fileType) {
  // Return an object that shows which counter to increment by 1
  if (fileType === "application/pdf") return {}; // PDFs are handled separately for credits
  if (fileType.includes("wordprocessingml"))
    return { docxUploads: 1, totalUploads: 1 };
  if (fileType.includes("spreadsheetml"))
    return { xlsxUploads: 1, totalUploads: 1 };
  if (fileType.startsWith("image/"))
    return { imageUploads: 1, totalUploads: 1 };

  // Count all other text/structured files as textUploads
  if (
    fileType.startsWith("text/") ||
    fileType.includes("xml") ||
    fileType.includes("json") ||
    fileType.includes("sql") ||
    fileType.includes("csv")
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
    // Use a simpler unique name generation
    const uniqueId =
      new Date().getTime() + "-" + Math.random().toString(36).substring(2, 9);
    // Sanitize filename for safe file system usage, keeping extension
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const uniqueName = uniqueId + "-" + safeFilename;

    // Determine subfolder and path
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

    // Write the file first to ensure storage even if analysis fails
    await writeFile(uploadPath, buffer);

    // Initial check for stats and credit cycle processing
    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) stats = await Stats.create({ _id: "global-stats" });
    processCreditCycle(stats);

    let analysis = {
      summary: "File saved, analysis pending or failed.",
      tags: [fileType],
      scannedText: "",
    };

    // Check PDF credit limit BEFORE calling analyzeFile for PDFs
    const isPDF = fileType === "application/pdf";
    if (isPDF && stats.pdfCreditsRemaining <= 0) {
      analysis.summary =
        "PDF not scanned. Monthly credit limit reached. File saved to disk and indexed by filename/type.";
      analysis.tags = ["pdf", "credit-limit-reached"];
      console.warn("[upload] PDF not analyzed: credit limit reached.");
    } else {
      // Proceed with analysis and credit deduction (if PDF)
      analysis = await analyzeFile(fileBase64, fileType);

      // Deduct credit after successful analysis for PDF
      if (isPDF) {
        stats.pdfCreditsRemaining = Math.max(0, stats.pdfCreditsRemaining - 1);
      }
    }

    // Update general stats
    if (isPDF) {
      // Always count total PDF uploads
      stats.pdfUploads += 1;
      stats.pdfUploadsTotal += 1;
    } else {
      // For non-PDFs
      stats.totalUploads += 1;
      const inc = getUploadTypeCounters(fileType);
      for (const key in inc) {
        stats[key] += inc[key];
      }
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
