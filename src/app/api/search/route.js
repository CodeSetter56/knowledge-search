import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import File from "@/lib/models/file.model";

// Map simplified filter keys to MongoDB query operators for fileType
function getFileTypeFilter(filterValue) {
  switch (filterValue) {
    case "pdf":
      return { fileType: "application/pdf" };

    case "documents-text":
      // DOCX, TXT (files stored in 'texts' folder)
      return {
        $or: [
          // Explicitly match DOCX format
          { fileType: { $regex: /wordprocessingml/ } },
          // Explicitly match plain text
          { fileType: "text/plain" },
        ],
      };

    case "structured-data":
      // XLSX, CSV, JSON, XML, SQL, and other structured text (files stored in 'structured' folder)
      return {
        $and: [
          // Ensure we only look for structured/data types
          {
            $or: [
              { fileType: { $regex: /spreadsheetml/ } }, // XLSX
              { fileType: { $regex: /csv/ } }, // CSV
              { fileType: { $regex: /json/ } }, // JSON
              { fileType: { $regex: /xml/ } }, // XML
              { fileType: { $regex: /sql/ } }, // SQL
              // Catch other specific text types that aren't plain text
              // Check for any text MIME type that is NOT 'text/plain'
              {
                $and: [
                  { fileType: { $regex: /^text\// } },
                  { fileType: { $ne: "text/plain" } },
                ],
              },
            ],
          },
          // FIX: Explicitly exclude word processing types to prevent the DOCX bug
          { fileType: { $not: { $regex: /wordprocessingml/ } } },
        ],
      };

    case "image":
      // Match all image types
      return { fileType: { $regex: /^image\// } };

    case "other":
      // Files not matching any specific, defined type
      return {
        $and: [
          { fileType: { $not: { $regex: /^application\/pdf/ } } },
          { fileType: { $not: { $regex: /^image\// } } },
          { fileType: { $not: { $regex: /wordprocessingml/ } } },
          { fileType: { $not: { $regex: /spreadsheetml/ } } },
          // Exclude anything explicitly handled by the two text groups
          { fileType: { $not: { $regex: /text/ } } },
        ],
      };
    case "all":
    default:
      return {};
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const fileType = searchParams.get("fileType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let results;

    // --- Build common filters (for both search and find) ---
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

    // Convert simple filter key to MongoDB query fragment
    const typeFilter =
      fileType && fileType !== "all" ? getFileTypeFilter(fileType) : {};

    // Combine all filters
    const matchFilters = { ...typeFilter, ...dateFilter };

    // If there's a search query, use Atlas Search
    if (query && query.trim()) {
      const searchPipeline = [
        {
          $search: {
            index: "searchFiles",
            compound: {
              should: [
                {
                  autocomplete: { query: query, path: "filename" },
                },
                {
                  autocomplete: { query: query, path: "summary" },
                },
                {
                  autocomplete: { query: query, path: "tags" },
                },
                // Add a text search for the full scanned document content
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

      // Apply the date and type filters AFTER the search
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
      results = await File.find(matchFilters)
        .sort({ uploadDate: -1 }) // Sort by newest first
        .limit(100)
        .select("_id filename path fileType summary tags uploadDate");
    }

    // Ensure file paths are strings before sending response
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
