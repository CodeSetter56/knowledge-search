// src/components/app/SearchResultItem.jsx

import { useState } from "react";
import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileExcel,
  FaFileCode,
  FaTrash,
  FaImage,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate, getPdfPageCount } from "@/lib/utils";

// ⬇️ LOCAL HELPER FUNCTION (Contains JSX, must stay local) ⬇️
function getFileIcon(file) {
  if (file.fileType.includes("pdf"))
    return <FaFilePdf className="text-red-500" size={24} />;

  // Group 1: Documents/General Text (DOCX, TXT)
  if (file.fileType.includes("wordprocessingml"))
    return <FaFileWord className="text-blue-500" size={24} />;

  if (file.fileType === "text/plain")
    return <FaFileAlt className="text-gray-500" size={24} />;

  // Group 2: Structured/Data Files
  if (file.fileType.includes("spreadsheetml"))
    return <FaFileExcel className="text-green-500" size={24} />;

  if (
    file.fileType.includes("xml") ||
    file.fileType.includes("json") ||
    file.fileType.includes("sql") ||
    file.fileType.includes("csv")
  ) {
    // Use code icon for all structured/markup text types
    return <FaFileCode className="text-purple-500" size={24} />;
  }

  if (file.fileType.startsWith("image/"))
    return (
      // Display image preview if path exists, otherwise generic image icon
      file.path ? (
        <img
          src={file.path}
          alt={file.filename}
          className="w-8 h-8 object-cover rounded"
        />
      ) : (
        <FaImage className="text-pink-500" size={24} />
      )
    );

  // Default fallback (for 'other' category)
  return <FaFileAlt className="text-gray-500" size={24} />;
}
// ⬆️ END OF LOCAL HELPER FUNCTION ⬆️

export function SearchResultItem({ file, onDelete, onStatsUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getIcon = () => getFileIcon(file);

  const handleDelete = async () => {
    setIsDeleting(true);

    if (!file || !file._id) {
      toast.error("File information missing for deletion.");
      setIsDeleting(false);
      return;
    }

    const toastId = toast.loading(`Deleting ${file.filename}...`);
    let responseData = null;

    try {
      const response = await fetch(`/api/delete?id=${file._id}`, {
        method: "DELETE",
      });

      responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to delete");
      }

      toast.success(`${file.filename} deleted successfully!`, { id: toastId });

      // Call parent callback to remove from UI
      if (onDelete) {
        onDelete(file._id);
      }

      // Update stats immediately
      if (onStatsUpdate && responseData.stats) {
        onStatsUpdate(responseData.stats);
      }

      // Only reset confirmation state on SUCCESS
      setShowConfirm(false);
    } catch (error) {
      console.error("[SearchResultItem] Delete failed:", error);
      const credits = responseData?.stats?.pdfCreditsRemaining;
      if (credits !== undefined) {
        toast.error(
          `Failed to delete: ${error.message} (PDF scans left: ${credits})`,
          { id: toastId }
        );
      } else {
        toast.error(`Failed to delete: ${error.message}`, { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // USE IMPORTED UTILITIES
  const pageCount = getPdfPageCount(file);
  const uploadDate = formatDate(file.uploadDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex shrink-0 w-8 text-center">{getIcon()}</div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <a
              href={file.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-primary hover:underline truncate"
            >
              {file.filename}
            </a>
            <span className="text-xs text-muted-foreground">{uploadDate}</span>
          </div>

          {/* Page count badge */}
          {pageCount && (
            <Badge variant="outline" className="shrink-0">
              {pageCount} {pageCount === "1" ? "page" : "pages"}
            </Badge>
          )}

          {/* Delete button */}
          {!showConfirm ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
              onClick={() => setShowConfirm(true)}
            >
              <FaTrash size={16} />
            </Button>
          ) : (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                // FIX: Aggressively force background and text color to ensure visibility
                className="bg-red-500! text-white! hover:bg-red-600!"
              >
                {isDeleting ? "..." : "Delete"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary */}
        <p className="text-sm text-muted-foreground mb-3">
          {file.summary || "No summary available."}
        </p>

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
