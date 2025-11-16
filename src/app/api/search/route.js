import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";
import { getFileTypeFilterQuery } from "@/lib/utils";

export async function GET(req) {
  try {

    await dbConnect();

    // 2. Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const fileType = searchParams.get("fileType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let results;

    // custom date filter used during search or filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.uploadDate = {};
      if (dateFrom) dateFilter.uploadDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        // Set to end of day to include all records on that date
        endDate.setHours(23, 59, 59, 999);
        dateFilter.uploadDate.$lte = endDate;
      }
    }

    // Convert simple filter key to MongoDB query 
    const typeFilter =
      fileType && fileType !== "all" ? getFileTypeFilterQuery(fileType) : {};
    // Combine all non-search filters
    const matchFilters = { ...typeFilter, ...dateFilter };

    // 3. Perform search or direct query
    if (query && query.trim()) {

      const searchPipeline = [
        {
          $search: {
            index: "searchFiles", // Atlas Search Index name
            compound: {
              should: [
                // Autocomplete fields
                { autocomplete: { query: query, path: "filename" } },
                { autocomplete: { query: query, path: "summary" } },
                { autocomplete: { query: query, path: "tags" } },
                // Text search for the full scanned document content (lower boost)
                {
                  text: {
                    query: query,
                    path: "scannedText",
                    score: { boost: { value: 0.5 } },
                  },
                },
              ],
              minimumShouldMatch: 1,
            },
          },
        },
      ];

      // Apply selected filters
      if (Object.keys(matchFilters).length > 0) {
        searchPipeline.push({ $match: matchFilters });
      }

      // select only necessary fields
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
      results = await File.find(matchFilters)
        .sort({ uploadDate: -1 }) // Sort by newest first
        .limit(100)
        .select("_id filename path fileType summary tags uploadDate");
    }

    // 4. Format and return results
    const cleanedResults = results.map((r) => ({
      _id: r._id.toString(),
      filename: r.filename,
      path: r.path,
      fileType: r.fileType,
      summary: r.summary || "",
      tags: r.tags || [],
      uploadDate: r.uploadDate,
    }));

    return NextResponse.json(cleanedResults);
    
  } catch (error) {
    console.error("[search/GET] Error:", error);
    return NextResponse.json(
      { error: "Server error during search." },
      { status: 500 }
    );
  }
}
