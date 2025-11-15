// src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// for tailwind
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Read the file as a DataURL
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Example reader.result:
      // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABVYAAAM..."
      // The backend expects just:
      // "iVBORw0KGgoAAAANSUhEUgAABVYAAAM...", remove the prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = (error) => reject(error);
  });
};

// ⬇️ REFACTORING: Constants and File Utility Functions ⬇️

// Map of common MIME types/regex patterns
export const MIME_TYPE_MAP = {
  PDF: "application/pdf",
  DOCX: /wordprocessingml/,
  XLSX: /spreadsheetml/,
  IMAGE: /^image\//,
  PLAIN_TEXT: "text/plain",
  STRUCTURED_TEXT: /(json|xml|sql|csv)/,
  TEXT: /^text\//, // All text types
};

// Extracted from FilterBar.jsx
export const FILE_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDFs" },
  { value: "documents-text", label: "Documents (DOCX/TXT)" },
  { value: "structured-data", label: "Structured Data (XLSX/JSON/SQL)" },
  { value: "image", label: "Images" },
  { value: "other", label: "Other" },
];

// Logic to determine the storage subfolder and for icon grouping
export function getFileCategory(fileType) {
  if (fileType === MIME_TYPE_MAP.PDF) return "pdfs";
  if (MIME_TYPE_MAP.IMAGE.test(fileType)) return "images";

  // Documents/General Text (DOCX, Plain TXT)
  if (
    MIME_TYPE_MAP.DOCX.test(fileType) ||
    fileType.startsWith(MIME_TYPE_MAP.PLAIN_TEXT)
  ) {
    return "texts";
  }

  // Structured/Data Files (XLSX, JSON, SQL, XML, CSV, etc.)
  if (
    MIME_TYPE_MAP.XLSX.test(fileType) ||
    MIME_TYPE_MAP.STRUCTURED_TEXT.test(fileType) ||
    (MIME_TYPE_MAP.TEXT.test(fileType) && fileType !== MIME_TYPE_MAP.PLAIN_TEXT)
  ) {
    return "structured";
  }

  return "other";
}

// Logic to determine which counters to increment (used in upload/delete APIs)
export function getUploadCountersToIncrement(fileType) {
  // PDFs are counted with two separate metrics for stat consistency
  if (fileType === MIME_TYPE_MAP.PDF)
    return { pdfUploads: 1, pdfUploadsTotal: 1, totalUploads: 1 };

  if (MIME_TYPE_MAP.DOCX.test(fileType))
    return { docxUploads: 1, totalUploads: 1 };
  if (MIME_TYPE_MAP.XLSX.test(fileType))
    return { xlsxUploads: 1, totalUploads: 1 };
  if (MIME_TYPE_MAP.IMAGE.test(fileType))
    return { imageUploads: 1, totalUploads: 1 };

  // All other text/structured files
  if (
    MIME_TYPE_MAP.TEXT.test(fileType) ||
    MIME_TYPE_MAP.STRUCTURED_TEXT.test(fileType)
  ) {
    return { textUploads: 1, totalUploads: 1 };
  }

  return { otherUploads: 1, totalUploads: 1 };
}

// Logic to generate the MongoDB filter query for search/route.js
export function getFileTypeFilterQuery(filterValue) {
  switch (filterValue) {
    case "pdf":
      return { fileType: MIME_TYPE_MAP.PDF };

    case "documents-text":
      return {
        $or: [
          { fileType: { $regex: MIME_TYPE_MAP.DOCX } },
          { fileType: MIME_TYPE_MAP.PLAIN_TEXT },
        ],
      };

    case "structured-data":
      return {
        $and: [
          {
            $or: [
              { fileType: { $regex: MIME_TYPE_MAP.XLSX } },
              { fileType: { $regex: MIME_TYPE_MAP.STRUCTURED_TEXT } },
              {
                $and: [
                  { fileType: { $regex: MIME_TYPE_MAP.TEXT } },
                  { fileType: { $ne: MIME_TYPE_MAP.PLAIN_TEXT } },
                ],
              },
            ],
          },
          // Explicitly exclude DOCX
          { fileType: { $not: { $regex: MIME_TYPE_MAP.DOCX } } },
        ],
      };

    case "image":
      return { fileType: { $regex: MIME_TYPE_MAP.IMAGE } };

    case "other":
      return {
        $and: [
          { fileType: { $not: { $regex: MIME_TYPE_MAP.PDF } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.IMAGE } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.DOCX } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.XLSX } } },
          // Exclude all specific text/structured groups
          { fileType: { $not: { $regex: MIME_TYPE_MAP.TEXT } } },
        ],
      };
    case "all":
    default:
      return {};
  }
}

// Extract PDF page count logic
export function getPdfPageCount(file) {
  // Use the MIME_TYPE_MAP for robust checking
  if (!file || file.fileType !== MIME_TYPE_MAP.PDF) {
    return null;
  }

  // Try to extract page count from scannedText hint
  const match = file.scannedText?.match(/\((\d+) page/);
  if (match) return match[1];

  // Try to extract page count from tags (if available)
  const pageTag = file.tags?.find((t) => t.includes("-pages"));
  if (pageTag) return pageTag.split("-")[0];

  return null;
}

// Date Formatting Utility (for SearchResultItem)
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
