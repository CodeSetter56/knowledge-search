"use client"; 

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaSearch,
  FaFileExcel,
  FaFileCode,
} from "react-icons/fa";

import { fileToBase64 } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PDF_MAX_SIZE_BYTES = 1024 * 1024; // 1 MB size limit for PDFs

export default function Home() {

  const [searchResults, setSearchResults] = useState([]); // List of files from search
  const [searchQuery, setSearchQuery] = useState(""); // Current search input
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState(null);

// on component mount, fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        console.log("[page.js] Fetching initial stats...");
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");

        const data = await response.json();
        setStats(data);
        console.log("[page.js] Stats loaded:", data);
      } catch (error) {
        console.error("Could not fetch stats:", error);
        toast.error("Could not load file stats.");
      }
    }
    fetchStats();
  }, []); 

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Reject PDFs larger than 1 MB
    if (file.type === "application/pdf" && file.size > PDF_MAX_SIZE_BYTES) {
      toast.error(
        `PDFs must be 1 MB or less. This file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB.`
      );
      return;
    }
    console.log(`[page.js] File Dropped: ${file.name}, Type: ${file.type}`);

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    let responseData = null;

    // uploading and analyzing
    try {
      // Convert file to base64
      toast.loading(`Encoding ${file.name}...`, { id: toastId });
      const fileBase64 = await fileToBase64(file);
      console.log("[page.js] File encoded to Base64.");

      // Upload to backend API route /api/upload
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

      console.log("[page.js] Fetch request sent to /api/upload");
      responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Upload failed");
      }
      console.log("[page.js] Success response received:", responseData);

      // Update stats )
      if (responseData.stats) setStats(responseData.stats);
      const credits = responseData.stats.pdfCreditsRemaining;

      // different toast for pdfs vs other files
      if (responseData.newFile.fileType === "application/pdf") {
        toast.success(
          `${responseData.newFile.filename} saved! (PDF scans left: ${credits})`,
          { id: toastId }
        );
      } else {
        toast.success(`${responseData.newFile.filename} analyzed and saved!`, {
          id: toastId,
        });
      }

      setSearchResults((prev) => [responseData.newFile, ...prev]);

    } catch (error) {
      console.error("[page.js] Upload failed:", error);
      // If backend still returned stats, show them
      if (responseData && responseData.stats) {
        setStats(responseData.stats);
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
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    const toastId = toast.loading(`Searching for "${searchQuery}"...`);

    // perform search 
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();
      setSearchResults(results);

      toast.success(`${results.length} results found!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Search failed.", { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      {/* Display Stats */}
      {stats ? (
        <div className="text-right text-sm text-muted-foreground mb-2 flex justify-end gap-4">
          <span>
            Total Files: <strong>{stats.totalUploads}</strong>
          </span>
          <span>
            PDF Scan Credits: <strong>{stats.pdfCreditsRemaining}</strong>
          </span>
        </div>
      ) : (
        <div className="text-right text-sm text-muted-foreground mb-2">
          Loading stats...
        </div>
      )}

      <h1 className="text-4xl font-bold text-center mb-4">Mar-Intel Search</h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload, analyze, and search all your marketing assets.
      </p>

      {/* File upload card */}
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

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex mb-8">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by keyword, tag, or content..."
          className="flex-grow rounded-r-none text-base"
          disabled={isSearching}
        />
        <Button type="submit" className="rounded-l-none" disabled={isSearching}>
          {isSearching ? "..." : <FaSearch />}
        </Button>
      </form>

      {/* Search Results */}
      <div className="space-y-4">
        {isSearching && (
          <p className="text-center text-muted-foreground">Searching...</p>
        )}

        {!isSearching && searchResults.length === 0 && (
          <p className="text-center text-muted-foreground">
            No files found. Try uploading one!
          </p>
        )}

        {searchResults.map((file) => (
          <SearchResultItem key={file._id} file={file} />
        ))}
      </div>
    </div>
  );
}

function SearchResultItem({ file }) {
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
          <div className="flex-shrink-0 w-8 text-center">{getIcon()}</div>
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
