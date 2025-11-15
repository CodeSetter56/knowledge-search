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

export function SearchResultItem({ file, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Pick correct icon depending on file type
  const getIcon = () => {
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

  const handleDelete = async () => {
    setIsDeleting(true);

    if (!file || !file._id) {
      toast.error("File information missing for deletion.");
      setIsDeleting(false);
      return;
    }

    const toastId = toast.loading(`Deleting ${file.filename}...`);

    try {
      const response = await fetch(`/api/delete?id=${file._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success(`${file.filename} deleted successfully!`, { id: toastId });

      // Call parent callback to remove from UI
      if (onDelete) {
        onDelete(file._id);
      }

      // Only reset confirmation state on SUCCESS
      setShowConfirm(false);
    } catch (error) {
      console.error("[SearchResultItem] Delete failed:", error);
      toast.error(`Failed to delete: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const pageCount = getPageCount();

  // Check if file.uploadDate exists before formatting
  const uploadDate = file.uploadDate
    ? new Date(file.uploadDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

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
