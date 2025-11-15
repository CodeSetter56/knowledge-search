import { SearchResultItem } from "./SearchResultItem";

export function ResultsList({ searchResults, isSearching, onDelete }) {
  if (isSearching) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-secondary/30 rounded-lg animate-pulse"
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

  return (
    <div className="space-y-4">
      {searchResults.map((file) => (
        <SearchResultItem key={file._id} file={file} onDelete={onDelete} />
      ))}
    </div>
  );
}
