// src/components/app/FileSearchPage.jsx

import { StatsDisplay } from "./StatsDisplay";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { ResultsList } from "./ResultsList";
import { UploadDropzone } from "./UploadDropzone";

export function FileSearchPage({
  stats,
  searchResults,
  searchQuery,
  setSearchQuery,
  isSearching,
  handleSearch,
  filters,
  updateFilters,
  resetFilters,
  onDelete,
  onFileClick,
  onUploadDrop,
  isUploading,
  getRootProps,
  getInputProps,
  isDragActive,
  setStats,
}) {
  // Use a fixed header, and the main content will use flex-col and overflow-auto for scrolling
  const HEADER_COLOR = "bg-orange-600 text-white";

  return (
    <div className="flex flex-col h-screen w-full">
      {/* 2. Navbar/Header (Fixed Top) */}
      <header
        className={`p-4 flex justify-between items-center shrink-0 ${HEADER_COLOR}`}
      >
        <div className="text-xl font-bold">Mar-Intel Search</div>
        {/* The StatsDisplay must be updated to use white text/foreground in this context */}
        <StatsDisplay stats={stats} className="text-white" />
      </header>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl w-full mx-auto overflow-hidden">
        {/* App Title/Description */}
        <div className="shrink-0">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Knowledge Search
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Upload, analyze, and search all your marketing assets.
          </p>
        </div>

        {/* Search and Filters (Fixed within main content, shrink-0) */}
        <div className="shrink-0">
          <UploadDropzone
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isUploading={isUploading}
          />
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            isSearching={isSearching}
          />
          <FilterBar
            filters={filters}
            updateFilters={updateFilters}
            resetFilters={resetFilters}
          />
        </div>

        {/* 6. Results List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto pt-4 -mt-2">
          <ResultsList
            searchResults={searchResults}
            isSearching={isSearching}
            onDelete={onDelete}
            onStatsUpdate={setStats}
            onFileClick={onFileClick} // New prop for opening sidebar
          />
        </div>
      </main>
    </div>
  );
}
