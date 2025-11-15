// src/app/api/delete/route.js

import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";
import { getUploadCountersToIncrement } from "@/lib/utils";

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Find the file in database
    const file = await File.findById(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete the physical file
    try {
      // The file.path is the relative path (e.g., /uploads/structured/...)
      const filePath = path.join(process.cwd(), "public", file.path);
      await unlink(filePath);
      console.log(`[delete] Physical file deleted: ${filePath}`);
    } catch (err) {
      console.error("[delete] Error deleting physical file:", err);
      // Continue even if physical file deletion fails (file might have been manually deleted)
    }

    // Update stats based on fileType
    let stats = await Stats.findOne({ _id: "global-stats" });
    if (stats) {
      // SIMPLIFIED/CONSOLIDATED STATS DECREMENT
      const decrements = getUploadCountersToIncrement(file.fileType);

      // We only want to decrement the relevant counters
      for (const key in decrements) {
        // Find the counter key and ensure it exists before decrementing
        if (stats[key] !== undefined) {
          stats[key] = Math.max(0, stats[key] - 1);
        }
      }

      await stats.save();
    }

    // Delete from database
    await File.findByIdAndDelete(fileId);

    return NextResponse.json(
      { message: "File deleted successfully", stats },
      { status: 200 }
    );
  } catch (error) {
    console.error("[delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
