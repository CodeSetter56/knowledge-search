// src/components/app/UploadDropzone.jsx

import { Card, CardContent } from "@/components/ui/card";

export function UploadDropzone({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
}) {
  return (
    <Card className={`mb-8 ${isUploading ? "opacity-50" : ""}`}>
      <CardContent
        {...getRootProps()}
        className={`flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer
          ${
            isDragActive ? "border-primary bg-secondary" : "border-border"
          } p-6`}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground text-center">
          {isUploading
            ? "Processing file..."
            : isDragActive
            ? "Drop the file here ..."
            : "Drag 'n' drop a file (PDF, DOCX, XLSX, TXT, IMG), or click"}
        </p>
      </CardContent>
    </Card>
  );
}
