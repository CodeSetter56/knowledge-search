import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stats from "@/lib/models/stats.model";

// API Route Handler for GET requests (to fetch global application statistics)
export async function GET() {
  try {
    // 1. Connect to MongoDB
    await dbConnect();

    // 2. Find the global stats document, or create it if it doesn't exist
    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) {
      stats = await Stats.create({ _id: "global-stats" });
    }

    // 3. Return the stats object
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[stats/GET] Error:", error);
    return NextResponse.json(
      { error: "Server error fetching stats" },
      { status: 500 }
    );
  }
}
