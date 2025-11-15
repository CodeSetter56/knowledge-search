// src/components/app/ResultsList.jsx - MODIFIED

import { SearchResultItem } from "./SearchResultItem";

export function ResultsList({ searchResults, isSearching, onFileClick }) {
  if (isSearching) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 bg-secondary/30 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2">No files found</div>
        <p className="text-sm text-muted-foreground">
          Try uploading a file or adjusting your search filters
        </p>
      </div>
    );
  }

  // 6. Use a grid layout for the icon view
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {searchResults.map((file) => (
        <SearchResultItem
          key={file._id}
          file={file}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
}
