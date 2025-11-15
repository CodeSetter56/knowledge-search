import { NextResponse } from "next/server";

import dbConnect from "@/lib/db";

import Stats from "@/lib/models/stats.model";

export async function GET() {
  try {

    await dbConnect();

    let stats = await Stats.findOne({ _id: "global-stats" });
    if (!stats) {
      stats = await Stats.create({ _id: "global-stats" });
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error("[stats/GET] Error:", error);
    return NextResponse.json(
      { error: "Server error fetching stats" },
      { status: 500 }
    );
  }
}
