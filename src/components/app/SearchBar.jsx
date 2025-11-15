import { FaSearch, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
}) {
  const handleClear = () => {
    setSearchQuery("");
    // Trigger a new search with an empty query to refresh results
    // Pass a mock object as the event to satisfy handleSearch's expected signature
    handleSearch({ preventDefault: () => {} });
  };

  return (
    <form onSubmit={handleSearch} className="flex mb-8">
      <div className="relative flex grow">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by keyword, tag, or content..."
          // Added padding-right for clear button clearance
          className="w-full rounded-r-none text-base pr-10"
          disabled={isSearching}
        />
        {/* Clear Button */}
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full rounded-l-none text-muted-foreground hover:bg-transparent hover:text-foreground z-10"
            disabled={isSearching}
          >
            <FaTimes size={12} />
          </Button>
        )}
      </div>
      <Button type="submit" className="rounded-l-none" disabled={isSearching}>
        {isSearching ? "..." : <FaSearch />}
      </Button>
    </form>
  );
}
