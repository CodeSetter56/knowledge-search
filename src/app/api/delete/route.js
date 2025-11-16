import { NextResponse } from "next/server";
import { del } from "@vercel/blob"; 
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

    const file = await File.findById(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Vercel Blob 
    try {
      await del(file.path);
      console.log(`[delete] File deleted from Vercel Blob: ${file.path}`);
    } catch (err) {
      console.error("[delete] Error deleting file from Vercel Blob:", err);
    }

    let stats = await Stats.findOne({ _id: "global-stats" });
    if (stats) {
      const decrements = getUploadCountersToIncrement(file.fileType);
      for (const key in decrements) {
        if (stats[key] !== undefined) {
          stats[key] = Math.max(0, stats[key] - 1);
        }
      }

      await stats.save();
    }

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
