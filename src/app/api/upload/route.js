import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";
import { analyzeFile } from "@/lib/services/analyzer.service";
import {
  getFileCategory,
  getUploadCountersToIncrement,
  MIME_TYPE_MAP,
} from "@/lib/utils";

// 30 days for PDF credit cycle
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function processCreditCycle(stats) {
  const now = Date.now();

  // for first upload
  if (!stats.pdfCycleStart) {
    stats.pdfCycleStart = new Date(now);
    stats.pdfNextReset = new Date(now + THIRTY_DAYS_MS);
    stats.pdfCreditsRemaining = stats.pdfMonthlyLimit;
    stats.pdfUploads = 0;
    return;
  }

  // next reset time 
  if (now >= stats.pdfNextReset.getTime()) {
    stats.pdfCycleStart = new Date(now);
    stats.pdfNextReset = new Date(now + THIRTY_DAYS_MS);
    stats.pdfCreditsRemaining = stats.pdfMonthlyLimit;
    stats.pdfUploads = 0;
  }
}

export async function POST(req) {

  let responseData = null; 

  try {

    await dbConnect();

    const { fileBase64, fileType, filename } = await req.json();
    if (!fileBase64 || !fileType || !filename) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    const buffer = Buffer.from(fileBase64, "base64");

    // Generate unique filename and determine storage path
    const uniqueId =
      new Date().getTime() + "-" + Math.random().toString(36).substring(2, 9);
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const uniqueName = uniqueId + "-" + safeFilename;
    const subfolder = getFileCategory(fileType);
    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

    // Create upload directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("[upload] Error creating directory:", err);
    }

    const uploadPath = path.join(uploadDir, uniqueName);
    const relativePath = `/uploads/${subfolder}/${uniqueName}`;

    await writeFile(uploadPath, buffer);

    // Load and process file stats 
    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) stats = await Stats.create({ _id: "global-stats" });
    processCreditCycle(stats);

    let analysis = {
      summary: "File saved, analysis pending or failed.",
      tags: [fileType],
      scannedText: "",
    };

    // Check PDF credits and run analysis
    const isPDF = fileType === MIME_TYPE_MAP.PDF;
    if (isPDF && stats.pdfCreditsRemaining <= 0) {
      // Bypass analysis if no PDF credits left
      analysis.summary =
        "PDF not scanned. Monthly credit limit reached. File saved to disk and indexed by filename/type.";
      analysis.tags = ["pdf", "credit-limit-reached"];
      console.warn("[upload] PDF not analyzed: credit limit reached.");
    } else {
      analysis = await analyzeFile(fileBase64, fileType);

      if (isPDF) {
        stats.pdfCreditsRemaining = Math.max(0, stats.pdfCreditsRemaining - 1);
      }
    }

    const inc = getUploadCountersToIncrement(fileType);
    for (const key in inc) {
      if (stats[key] !== undefined) {
        stats[key] += inc[key];
      }
    }

    await stats.save();

    const newFile = await File.create({
      filename,
      path: relativePath,
      fileType,
      summary: analysis.summary,
      tags: analysis.tags,
      scannedText: analysis.scannedText,
    });

    responseData = { newFile, stats };
    return NextResponse.json(responseData, { status: 201 });

  } catch (err) {
    console.error("[upload.js] Upload failed:", err);
    const fallbackStats = await Stats.findOne({ _id: "global-stats" });
    return NextResponse.json(
      { error: "Internal server error", stats: fallbackStats },
      { status: 500 }
    );
  }
}
