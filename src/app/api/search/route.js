import { NextResponse } from "next/server";

import dbConnect from "@/lib/db";

import File from "@/lib/models/file.model";

export async function GET(req) {
  try {

    await dbConnect();

    // Extract query parameters from request URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    if (!query) {
      return NextResponse.json([]);
    }

    // use the Search index named "searchFiles"
    const results = await File.aggregate([
      {
        $search: {
          index: "searchFiles", // named in mongoDB Atlas

          // Searching across multiple fields
          compound: {
            should: [
              {
                autocomplete: {
                  query: query,
                  path: "filename",
                },
              },
              {
                autocomplete: {
                  query: query,
                  path: "summary",
                },
              },
              {
                autocomplete: {
                  query: query,
                  path: "tags",
                },
              },
            ],
            minimumShouldMatch: 1, // at least one condition must match
          },
        },
      },
      { $limit: 20 },

      {
        $project: {
          _id: 1,
          filename: 1,
          path: 1,
          fileType: 1,
          summary: 1,
          tags: 1,
          uploadDate: 1,
        },
      },
    ]);

    return NextResponse.json(results);
    
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error during search." },
      { status: 500 }
    );
  }
}
