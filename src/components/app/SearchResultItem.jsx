// src/components/app/SearchResultItem.jsx

import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileExcel,
  FaFileCode,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SearchResultItem({ file }) {
  // Pick correct icon depending on file type
  const getIcon = () => {
    if (file.fileType.includes("pdf"))
      return <FaFilePdf className="text-red-500" size={24} />;

    if (file.fileType.includes("word"))
      return <FaFileWord className="text-blue-500" size={24} />;

    if (file.fileType.includes("spreadsheet"))
      return <FaFileExcel className="text-green-500" size={24} />;

    if (file.fileType.startsWith("image"))
      return (
        <img
          src={file.path}
          alt={file.filename}
          className="w-8 h-8 object-cover rounded"
        />
      );

    if (file.fileType.startsWith("text/"))
      return <FaFileAlt className="text-gray-500" size={24} />;

    if (file.fileType.includes("xml") || file.fileType.includes("json"))
      return <FaFileCode className="text-purple-500" size={24} />;

    return <FaFileAlt className="text-gray-500" size={24} />;
  };

  // Extract page count for PDFs
  const getPageCount = () => {
    if (file.fileType.includes("pdf")) {
      const match = file.scannedText?.match(/\((\d+) page/);
      if (match) return match[1];

      const pageTag = file.tags?.find((t) => t.includes("-pages"));
      if (pageTag) return pageTag.split("-")[0];
    }
    return null;
  };

  const pageCount = getPageCount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex shrink-0 w-8 text-center">{getIcon()}</div>
          <a
            href={file.path}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-primary hover:underline"
          >
            {file.filename}
          </a>

          {/* Page count badge */}
          {pageCount && (
            <Badge variant="outline" className="ml-auto">
              {pageCount} {pageCount === "1" ? "page" : "pages"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary */}
        <p className="text-sm text-muted-foreground mb-3">{file.summary}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {file.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
