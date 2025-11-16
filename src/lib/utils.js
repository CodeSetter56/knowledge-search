import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileExcel,
  FaFileCode,
  FaImage,
} from "react-icons/fa";

// Utility function to merge Tailwind CSS classes safely
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Converts a browser File object to a Base64 string for API transport
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      // API expects only the Base64 data, so remove the "data:mime/type;base64," prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = (error) => reject(error);
  });
};

// Map of common MIME types/regex patterns for easy reference
export const MIME_TYPE_MAP = {
  PDF: "application/pdf",
  DOCX: /wordprocessingml/,
  XLSX: /spreadsheetml/,
  IMAGE: /^image\//,
  PLAIN_TEXT: "text/plain",
  STRUCTURED_TEXT: /(json|xml|sql|csv)/,
  TEXT: /^text\//, // All text types (text/plain, text/csv, etc.)
};

// Options used in the FilterBar component for selecting file types
export const FILE_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDFs" },
  { value: "documents-text", label: "Documents (DOCX/TXT)" },
  { value: "structured-data", label: "Structured Data (XLSX/JSON/SQL)" },
  { value: "image", label: "Images" },
  { value: "other", label: "Other" },
];

// Determines the logical storage subfolder for a given file type.
export function getFileCategory(fileType) {
  if (fileType === MIME_TYPE_MAP.PDF) return "pdfs";
  if (MIME_TYPE_MAP.IMAGE.test(fileType)) return "images";

  // Documents/General Text
  if (
    MIME_TYPE_MAP.DOCX.test(fileType) ||
    fileType.startsWith(MIME_TYPE_MAP.PLAIN_TEXT)
  ) {
    return "texts";
  }

  // Structured/Data Files
  if (
    MIME_TYPE_MAP.XLSX.test(fileType) ||
    MIME_TYPE_MAP.STRUCTURED_TEXT.test(fileType) ||
    (MIME_TYPE_MAP.TEXT.test(fileType) && fileType !== MIME_TYPE_MAP.PLAIN_TEXT)
  ) {
    return "structured";
  }

  return "other";
}

// Returns the React icon component and a flag indicating if the file is an image.
export function getFileIcon(file) {
  const isImage = file.fileType.startsWith("image/");

  if (file.fileType.includes("pdf"))
    return {
      icon: <FaFilePdf className="text-red-500" size={24} />,
      isImage: false,
    };

  if (file.fileType.includes("wordprocessingml"))
    return {
      icon: <FaFileWord className="text-blue-500" size={24} />,
      isImage: false,
    };

  if (file.fileType === "text/plain")
    return {
      icon: <FaFileAlt className="text-gray-500" size={24} />,
      isImage: false,
    };

  if (file.fileType.includes("spreadsheetml"))
    return {
      icon: <FaFileExcel className="text-green-500" size={24} />,
      isImage: false,
    };

  if (
    file.fileType.includes("xml") ||
    file.fileType.includes("json") ||
    file.fileType.includes("sql") ||
    file.fileType.includes("csv")
  ) {
    return {
      icon: <FaFileCode className="text-purple-500" size={24} />,
      isImage: false,
    };
  }

  if (isImage)
    return {
      icon: <FaImage className="text-pink-500" size={24} />,
      isImage: true,
    };

  // Default icon for unknown or other files
  return {
    icon: <FaFileAlt className="text-gray-500" size={24} />,
    isImage: false,
  };
}

// Determines which counters in the Stats model should be incremented for a given file type.
export function getUploadCountersToIncrement(fileType) {
  // PDFs increment multiple counters for credit tracking and total count
  if (fileType === MIME_TYPE_MAP.PDF)
    return { pdfUploads: 1, pdfUploadsTotal: 1, totalUploads: 1 };

  if (MIME_TYPE_MAP.DOCX.test(fileType))
    return { docxUploads: 1, totalUploads: 1 };
  if (MIME_TYPE_MAP.XLSX.test(fileType))
    return { xlsxUploads: 1, totalUploads: 1 };
  if (MIME_TYPE_MAP.IMAGE.test(fileType))
    return { imageUploads: 1, totalUploads: 1 };

  // All other text/structured files (JSON, SQL, TXT, CSV, etc.)
  if (
    MIME_TYPE_MAP.TEXT.test(fileType) ||
    MIME_TYPE_MAP.STRUCTURED_TEXT.test(fileType)
  ) {
    return { textUploads: 1, totalUploads: 1 };
  }

  return { otherUploads: 1, totalUploads: 1 };
}

// Generates a MongoDB query fragment based on the filter value selected in the UI.
export function getFileTypeFilterQuery(filterValue) {
  switch (filterValue) {
    case "pdf":
      return { fileType: MIME_TYPE_MAP.PDF };

    case "documents-text":
      // DOCX (regex match) OR Plain TXT (exact match)
      return {
        $or: [
          { fileType: { $regex: MIME_TYPE_MAP.DOCX } },
          { fileType: MIME_TYPE_MAP.PLAIN_TEXT },
        ],
      };

    case "structured-data":
      // XLSX OR JSON/XML/SQL/CSV OR generic TEXT excluding Plain TXT AND explicitly exclude DOCX
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
          // Exclude DOCX to keep this group separate from documents-text
          { fileType: { $not: { $regex: MIME_TYPE_MAP.DOCX } } },
        ],
      };

    case "image":
      return { fileType: { $regex: MIME_TYPE_MAP.IMAGE } };

    case "other":
      // Exclude all specific categories (PDF, Image, DOCX, XLSX, and all other Text/Structured)
      return {
        $and: [
          { fileType: { $not: { $regex: MIME_TYPE_MAP.PDF } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.IMAGE } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.DOCX } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.XLSX } } },
          { fileType: { $not: { $regex: MIME_TYPE_MAP.TEXT } } },
        ],
      };
    case "all":
    default:
      return {};
  }
}

// Attempts to extract the page count of a PDF from tags or scanned text hints.
export function getPdfPageCount(file) {
  if (!file || file.fileType !== MIME_TYPE_MAP.PDF) {
    return null;
  }

  // 1. Try to extract page count from scannedText hint (if a custom analyzer added it)
  const match = file.scannedText?.match(/\((\d+) page/);
  if (match) return match[1];

  // 2. Try to extract page count from tags (if added by the AI)
  const pageTag = file.tags?.find((t) => t.includes("-pages"));
  if (pageTag) return pageTag.split("-")[0];

  return null;
}

// Date Formatting Utility 
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
