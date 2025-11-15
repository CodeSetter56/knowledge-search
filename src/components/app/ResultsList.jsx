// src/components/app/ResultsList.jsx

import { SearchResultItem } from "./SearchResultItem";

export function ResultsList({ searchResults, isSearching }) {
  if (isSearching) {
    return <p className="text-center text-muted-foreground">Searching...</p>;
  }

  if (searchResults.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No files found. Try uploading one!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {searchResults.map((file) => (
        <SearchResultItem key={file._id} file={file} />
      ))}
    </div>
  );
}
