import { useState } from "react";
import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileExcel,
  FaFileCode,
  FaTrash,
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

  const handleDelete = async () => {
    setIsDeleting(true);
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
    } catch (error) {
      console.error("[SearchResultItem] Delete failed:", error);
      toast.error(`Failed to delete: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const pageCount = getPageCount();
  const uploadDate = new Date(file.uploadDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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