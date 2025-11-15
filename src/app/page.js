// src/app/page.js

"use client";

import { useFileStats } from "@/hooks/useFileStats";
import { useFileSearch } from "@/hooks/useFileSearch";
import { useFileUpload } from "@/hooks/useFileUpload";

import { StatsDisplay } from "@/components/app/StatsDisplay";
import { UploadDropzone } from "@/components/app/UploadDropzone";
import { SearchBar } from "@/components/app/SearchBar";
import { ResultsList } from "@/components/app/ResultsList";

export default function Home() {
  // Custom hook to fetch stats on load
  const { stats } = useFileStats();

  // Custom hook for all search-related state and logic
  const {
    searchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
    setSearchResults,
  } = useFileSearch();

  // Custom hook for all upload-related state and logic
  const { onDrop, isUploading, getRootProps, getInputProps, isDragActive } =
    useFileUpload({
      // Pass a callback to update the search results on success
      onUploadSuccess: (newFile) => {
        setSearchResults((prev) => [newFile, ...prev]);
      },
    });

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <StatsDisplay stats={stats} />

      <h1 className="text-4xl font-bold text-center mb-4">Mar-Intel Search</h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload, analyze, and search all your marketing assets.
      </p>

      {/* The Upload component now gets its props from the hook */}
      <UploadDropzone
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isUploading={isUploading}
      />

      {/* The Search component gets its props from its hook */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
      />

      {/* The Results component is now self-contained */}
      <ResultsList searchResults={searchResults} isSearching={isSearching} />
    </div>
  );
}
