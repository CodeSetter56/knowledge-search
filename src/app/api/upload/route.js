import { NextResponse } from "next/server";
import { put } from "@vercel/blob"; 
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";
import { analyzeFile } from "@/lib/services/analyzer.service";
import {
  getUploadCountersToIncrement,
  MIME_TYPE_MAP,
} from "@/lib/utils";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

    // unique name generation
    const uniqueId =
      new Date().getTime() + "-" + Math.random().toString(36).substring(2, 9);
    // Sanitize filename for safe usage, keeping extension
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    // This will be the unique name/key in the Blob store
    const uniqueName = uniqueId + "-" + safeFilename;

    //  Vercel Blob
    const blob = await put(uniqueName, buffer, {
      access: "public", 
      contentType: fileType, // Ensures the browser handles the file correctly
    });

    const relativePath = blob.url;
 
    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) stats = await Stats.create({ _id: "global-stats" });
    processCreditCycle(stats);

    let analysis = {
      summary: "File saved, analysis pending or failed.",
      tags: [fileType],
      scannedText: "",
    };

    // Check PDF credit limit BEFORE calling analyzeFile for PDFs
    const isPDF = fileType === MIME_TYPE_MAP.PDF;
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
    const inc = getUploadCountersToIncrement(fileType);
    for (const key in inc) {
      if (stats[key] !== undefined) {
        stats[key] += inc[key];
      }
    }

    await stats.save();

    // Save file metadata in MongoDB, using the Blob URL as the permanent path
    const newFile = await File.create({
      filename,
      path: relativePath, // Store Vercel Blob URL here
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
