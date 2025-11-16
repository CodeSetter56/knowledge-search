import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { fileToBase64 } from "@/lib/utils";

const PDF_MAX_SIZE_BYTES = 1024 * 1024; // 1 MB

export function useFileUpload({ onUploadSuccess, onStatsUpdate }) {
 
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type === "application/pdf" && file.size > PDF_MAX_SIZE_BYTES) {
        toast.error(
          `PDFs must be 1 MB or less. This file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB.`
        );
        return;
      }
      console.log(`[useFileUpload] File Dropped: ${file.name}`);

      setIsUploading(true);
      setLastUploadedFile(null); // Clear previous upload 
      const toastId = toast.loading(`Uploading ${file.name}...`);
      let responseData = null;

      try {
        // encode file to Base64
        toast.loading(`Encoding ${file.name}...`, { id: toastId });
        const fileBase64 = await fileToBase64(file);
        console.log("[useFileUpload] File encoded.");

        // send file to API for processing
        toast.loading(`Analyzing ${file.name}...`, { id: toastId });
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            fileType: file.type,
            filename: file.name,
          }),
        });

        responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || "Upload failed");
        }
        console.log("[useFileUpload] Success:", responseData);

        const newFile = responseData.newFile;
        setLastUploadedFile(newFile); 

        if (onUploadSuccess) {
          onUploadSuccess(newFile);
        }
        if (onStatsUpdate) {
          onStatsUpdate(responseData.stats);
        }

        const credits = responseData.stats.pdfCreditsRemaining;
        if (newFile.fileType === "application/pdf") {
          toast.success(
            `${newFile.filename} saved! (PDF scans left: ${credits})`,
            { id: toastId }
          );
        } else {
          toast.success(`${newFile.filename} analyzed and saved!`, {
            id: toastId,
          });
        }

      } catch (error) {
        console.error("[useFileUpload] Upload failed:", error);
        if (responseData && responseData.stats) {
          const credits = responseData.stats.pdfCreditsRemaining;
          toast.error(`Failed: ${error.message} (PDF scans left: ${credits})`, {
            id: toastId,
          });
        } else {
          toast.error(`Failed: ${error.message}`, { id: toastId });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess, onStatsUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // Only accept one file at a time
    // Define accepted MIME types
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/xml": [".xml"],
      "application/json": [".json"],
      "application/sql": [".sql"],
    },
    disabled: isUploading,
  });

  return {
    onDrop,
    isUploading,
    getRootProps,
    getInputProps,
    isDragActive,
    lastUploadedFile,
  };
}
