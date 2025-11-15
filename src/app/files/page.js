// src/app/files/page.js

"use client";

import { useState, useCallback } from "react";
import { useFileStats } from "@/hooks/useFileStats";
import { useFileSearch } from "@/hooks/useFileSearch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { SearchBar } from "@/components/app/SearchBar";
import { FilterBar } from "@/components/app/FilterBar";
import { ResultsList } from "@/components/app/ResultsList";
import { StatsDisplay } from "@/components/app/StatsDisplay";
import { FileSidebar } from "@/components/app/FileSidebar";
import { toast } from "sonner";

export default function FileSearchPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const { stats, setStats } = useFileStats();

  const {
    searchResults,
    setSearchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
    filters,
    updateFilters,
    resetFilters,
  } = useFileSearch();

  // Use the hook to get handlers. We manually manage the drop zone visualization.
  const { isUploading, getRootProps, getInputProps, isDragActive } =
    useFileUpload({
      onUploadSuccess: (newFile) => {
        setSearchResults((prev) => [newFile, ...prev]);
        toast.success(`${newFile.filename} uploaded successfully!`);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
    });

  const handleDelete = useCallback(
    (fileId) => {
      setSearchResults((prev) => prev.filter((file) => file._id !== fileId));
      setSelectedFile(null);
    },
    [setSearchResults]
  );

  const handleFileClick = useCallback((file) => {
    setSelectedFile(file);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const HEADER_COLOR = "bg-orange-600 text-white";

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Dropzone functionality overlay (Only active on drag, prevents file dialog on click) */}
      <div
        {...getRootProps({
          // Disable the built-in click action that opens the file dialog
          onClick: (e) => e.stopPropagation(),
        })}
        className="fixed inset-0"
        style={{
          zIndex: isDragActive ? 999 : -1,
          pointerEvents: isDragActive ? "auto" : "none",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive && (
          // Only show the visual indicator when dragging a file
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
            <p className="text-white text-2xl font-bold">
              Drop file to upload...
            </p>
          </div>
        )}
      </div>

      {/* Navbar/Header (Fixed Top) */}
      <header
        className={`p-4 flex justify-between items-center shrink-0 ${HEADER_COLOR}`}
      >
        <a href="/" className="text-xl font-bold">
          Home Brand
        </a>
        {/* FIX: Removed displayTotalFiles prop so it always shows the system total (stats.totalUploads) */}
        <StatsDisplay stats={stats} isHome={true} />
      </header>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col p-4 md:p-8 w-full max-w-6xl mx-auto overflow-hidden">
        {/* Title and fixed controls (Search/Filters) */}
        <div className="shrink-0">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Knowledge Search
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Search and manage your uploaded assets.
          </p>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            isSearching={isSearching || isUploading}
          />
          <FilterBar
            filters={filters}
            updateFilters={updateFilters}
            resetFilters={resetFilters}
          />
        </div>

        {/* Results List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto pt-4 -mt-2">
          <ResultsList
            searchResults={searchResults}
            isSearching={isSearching || isUploading}
            onFileClick={handleFileClick}
          />
        </div>
      </main>

      {/* Sidebar */}
      {selectedFile && (
        <FileSidebar
          file={selectedFile}
          onClose={handleCloseSidebar}
          onDelete={handleDelete}
          onStatsUpdate={setStats}
        />
      )}
    </div>
  );
}
