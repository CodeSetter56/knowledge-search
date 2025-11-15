// src/components/app/FileSidebar.jsx

import React, { useState } from "react";
import { FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate, getFileIcon } from "@/lib/utils";

export function FileSidebar({ file, onClose, onDelete, onStatsUpdate }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!file) return null;

  const handleInternalDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${file.filename} (Sidebar)...`);

    try {
      const response = await fetch(`/api/delete?id=${file._id}`, {
        method: "DELETE",
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to delete");
      }

      // Call parent callbacks
      if (onDelete) onDelete(file._id);
      if (onStatsUpdate && responseData.stats)
        onStatsUpdate(responseData.stats);

      toast.success(`${file.filename} deleted successfully!`, { id: toastId });
      onClose(); // Close the sidebar on success
    } catch (error) {
      console.error("[FileSidebar] Delete failed:", error);
      const credits = responseData?.stats?.pdfCreditsRemaining;
      toast.error(
        `Failed to delete: ${error.message}${
          credits !== undefined ? ` (PDF scans left: ${credits})` : ""
        }`,
        { id: toastId }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // FIX: Destructure the returned object to get the icon and isImage
  const { icon: IconComponent, isImage } = getFileIcon(file);

  return (
    // Overlay (click outside closes sidebar)
    <div className="fixed inset-0 bg-black/55 z-40" onClick={onClose}>
      <div
        className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white border-l shadow-2xl z-50 overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
      >
        <Card className="rounded-none border-0 h-full flex flex-col p-0">
          {/* Header with Close Button */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
            <CardTitle className="text-xl font-semibold">
              File Details
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaTimes size={20} />
            </Button>
          </CardHeader>

          {/* 8. File Preview (Top Section) */}
          <div className="p-4 flex flex-col items-center justify-center border-b shrink-0">
            {isImage && file.path ? (
              // Display image preview
              <img
                src={file.path}
                alt={file.filename}
                className="max-h-48 w-full object-contain mb-4 border rounded"
              />
            ) : (
              // Display generic icon
              <div className="p-8 border rounded-lg bg-secondary/30 mb-4">
                {IconComponent}
              </div>
            )}
            <p className="text-lg font-medium truncate w-full text-center">
              {file.filename}
            </p>
            <span className="text-xs text-muted-foreground">
              Uploaded: {formatDate(file.uploadDate)}
            </span>
          </div>

          {/* Summary and Tags (Scrollable Content) */}
          <CardContent className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
            {/* Summary */}
            <div>
              <CardTitle className="text-sm font-bold mb-2">Summary</CardTitle>
              <CardDescription className="text-sm">
                {file.summary || "No summary available."}
              </CardDescription>
            </div>

            {/* Tags */}
            <div>
              <CardTitle className="text-sm font-bold mb-2">Tags</CardTitle>
              <div className="flex flex-wrap gap-2">
                {file.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>

          {/* 8. Open and Delete Buttons (Bottom Fixed) */}
          <div className="flex gap-4 p-4 border-t shrink-0">
            {/* Open Button (Opens in new tab) */}
            <Button
              asChild
              className="flex-1 bg-orange-500 hover:bg-orange-700"
            >
              <a href={file.path} target="_blank" rel="noopener noreferrer">
                <FaExternalLinkAlt /> Open File
              </a>
            </Button>
            {/* Delete Button */}
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-700"
              onClick={handleInternalDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete File"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
