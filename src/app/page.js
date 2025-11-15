// src/app/page.js

"use client";

import { useFileStats } from "@/hooks/useFileStats";
import { useFileSearch } from "@/hooks/useFileSearch";
import { useFileUpload } from "@/hooks/useFileUpload";

import { StatsDisplay } from "@/components/app/StatsDisplay";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { SearchBar } from "@/components/app/SearchBar";
import { FilterBar } from "@/components/app/FilterBar";
import { ResultsList } from "@/components/app/ResultsList";

export default function Home() {
  // Custom hook to fetch stats on load
  const { stats, setStats } = useFileStats();

  // Custom hook for all search-related state and logic
  const {
    searchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
    setSearchResults,
    filters,
    updateFilters,
    resetFilters,
  } = useFileSearch();

  // Custom hook for all upload-related state and logic
  const { onDrop, isUploading, getRootProps, getInputProps, isDragActive } =
    useFileUpload({
      // Pass a callback to update the search results on success
      onUploadSuccess: (newFile) => {
        setSearchResults((prev) => [newFile, ...prev]);
      },
      // New callback to update stats state
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
    });

  // Handle file deletion
  const handleDelete = (fileId) => {
    setSearchResults((prev) => prev.filter((file) => file._id !== fileId));
    // Stats update on delete is handled by passing setStats to ResultsList
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <StatsDisplay stats={stats} />

      <h1 className="text-4xl font-bold text-center mb-4">Mar-Intel Search</h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload, analyze, and search all your marketing assets.
      </p>

      {/* Upload Dropzone */}
      <UploadDropzone
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isUploading={isUploading}
      />

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
      />

      {/* Results List */}
      <ResultsList
        searchResults={searchResults}
        isSearching={isSearching}
        onDelete={handleDelete}
        onStatsUpdate={setStats} // Pass setStats down for delete operation
      />
    </div>
  );
}
