// src/app/api/upload/route.js

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb"; // <-- RENAMED IMPORT

import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";

// <-- UPDATED IMPORT
import { analyzeFile } from "@/lib/services/analyzer.service";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ... (rest of the file is identical) ...

// Determine what kind of file was uploaded
function getUploadTypeCounters(fileType) {
  // ... (no changes) ...
}

// 30-day rolling credit system for PDFs
function processCreditCycle(stats) {
  // ... (no changes) ...
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

    const uploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      uniqueName
    );

    const relativePath = `/uploads/${uniqueName}`;
    await writeFile(uploadPath, buffer);

    // analyze the file: OCR + AI summary + tags
    // This function call remains the same, but it now calls
    // the new refactored "orchestrator" service.
    const analysis = await analyzeFile(fileBase64, fileType);

    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) stats = await Stats.create({ _id: "global-stats" });

    processCreditCycle(stats);

    // ... (rest of the file is identical) ...

    //=Deduct credits ONLY for PDFs
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
