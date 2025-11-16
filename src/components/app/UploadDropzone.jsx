import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFileIcon } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import React from "react";

const MERGED_H = "h-[22rem]"; // 352px
const MERGED_W = "w-[36rem]"; // 576px

function UploadContent({
  isUploading,
  lastUploadedFile,
  isDragActive,
  getRootProps,
  getInputProps,
}) {
  let mainContent;

  if (isUploading) {
    mainContent = (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-800 text-center">Processing file...</p>
      </div>
    );
  }

  else if (lastUploadedFile) {
    const { icon, isImage } = getFileIcon(lastUploadedFile);

    mainContent = (
      <div className="flex w-full h-full divide-x divide-orange-300 p-3">
        <div className="flex flex-col items-center justify-center p-2 w-5/12 h-full">
          <div className="flex items-center justify-center w-full max-h-40 shrink-0 mb-2">
            {isImage && lastUploadedFile.path ? (
              <img
                src={lastUploadedFile.path}
                alt={lastUploadedFile.filename}
                className="max-h-full max-w-full object-contain border rounded"
              />
            ) : (
              <div className="text-orange-600" style={{ fontSize: "3.5rem" }}>
                {icon}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col pl-4 w-7/12 h-full overflow-hidden">
          <p className="text-lg font-bold text-gray-800 truncate max-w-full mb-2 border-b border-orange-300 pb-1">
            {lastUploadedFile.filename}
          </p>

          <div className="flex flex-col mb-3 pb-3 flex-1 overflow-hidden">
            <CardTitle className="text-base font-semibold text-gray-800 mb-1">
              Summary
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 overflow-y-auto pr-1">
              {lastUploadedFile.summary ||
                "Analysis in progress or no summary available."}
            </CardDescription>
          </div>

          <div className="flex flex-col shrink-0 pt-3 border-t border-orange-300 mt-auto">
            <CardTitle className="text-base font-semibold text-gray-800 mb-1">
              Tags
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(lastUploadedFile.tags) &&
                lastUploadedFile.tags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-orange-200 text-orange-800"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  else {
    mainContent = (
      <div className="flex flex-col items-center justify-center h-full w-full text-center">
        <p className="text-gray-600 text-lg">
          {isDragActive
            ? "Drop your file here..."
            : "Drag 'n' drop a file here, or click to upload"}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          (PDF, DOCX, XLSX, TXT, IMG, etc.)
        </p>
      </div>
    );
  }

  return (
    <Card
      className={`mb-8 ${MERGED_H} ${MERGED_W} mx-auto bg-orange-100 border-2 border-dashed
                ${
                  isDragActive ? "border-orange-500" : "border-orange-300"
                } transition-colors
                ${isUploading ? "opacity-70" : ""}`}
    >
      <CardContent
        {...getRootProps()}
        className="flex flex-col justify-center items-center w-full h-full p-0 cursor-pointer"
      >
        <input {...getInputProps()} />
        {mainContent}
      </CardContent>
    </Card>
  );
}

export { UploadContent as UploadDropzone };
