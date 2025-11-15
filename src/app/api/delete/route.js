import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import Stats from "@/lib/models/stats.model";

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
      stats.totalUploads = Math.max(0, stats.totalUploads - 1);

      // Decrement specific counters based on file type (using MIME type matching)
      if (file.fileType === "application/pdf") {
        // Only decrement PDF total count. Current cycle credits are unaffected by deletion.
        stats.pdfUploadsTotal = Math.max(0, stats.pdfUploadsTotal - 1);
        stats.pdfUploads = Math.max(0, stats.pdfUploads - 1);
      } else if (file.fileType.includes("wordprocessingml")) {
        stats.docxUploads = Math.max(0, stats.docxUploads - 1);
      } else if (file.fileType.includes("spreadsheetml")) {
        // Correct counter retained for XLSX/Spreadsheets
        stats.xlsxUploads = Math.max(0, stats.xlsxUploads - 1);
      } else if (file.fileType.startsWith("image/")) {
        stats.imageUploads = Math.max(0, stats.imageUploads - 1);
      } else if (
        file.fileType.startsWith("text/") ||
        file.fileType.includes("xml") ||
        file.fileType.includes("json") ||
        file.fileType.includes("sql")
      ) {
        // Correct counter for all non-document text/structured files
        stats.textUploads = Math.max(0, stats.textUploads - 1);
      } else {
        stats.otherUploads = Math.max(0, stats.otherUploads - 1);
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
