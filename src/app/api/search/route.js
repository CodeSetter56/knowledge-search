import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const fileType = searchParams.get("fileType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let results;

    // If there's a search query, use Atlas Search
    if (query && query.trim()) {
      const searchPipeline = [
        {
          $search: {
            index: "searchFiles",
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
              minimumShouldMatch: 1,
            },
          },
        },
      ];

      // Add filters after search
      const matchFilters = {};
      if (fileType && fileType !== "all") {
        matchFilters.fileType = fileType;
      }
      if (dateFrom || dateTo) {
        matchFilters.uploadDate = {};
        if (dateFrom) matchFilters.uploadDate.$gte = new Date(dateFrom);
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          matchFilters.uploadDate.$lte = endDate;
        }
      }

      if (Object.keys(matchFilters).length > 0) {
        searchPipeline.push({ $match: matchFilters });
      }

      searchPipeline.push({ $limit: 100 });
      searchPipeline.push({
        $project: {
          _id: 1,
          filename: 1,
          path: 1,
          fileType: 1,
          summary: 1,
          tags: 1,
          uploadDate: 1,
        },
      });

      results = await File.aggregate(searchPipeline);
    } else {
      // No query - return all files with filters
      const findFilters = {};

      if (fileType && fileType !== "all") {
        findFilters.fileType = fileType;
      }

      if (dateFrom || dateTo) {
        findFilters.uploadDate = {};
        if (dateFrom) findFilters.uploadDate.$gte = new Date(dateFrom);
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          findFilters.uploadDate.$lte = endDate;
        }
      }

      results = await File.find(findFilters)
        .sort({ uploadDate: -1 })
        .limit(100)
        .select("_id filename path fileType summary tags uploadDate");
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[search/GET] Error:", error);
    return NextResponse.json(
      { error: "Server error during search." },
      { status: 500 }
    );
  }
}
