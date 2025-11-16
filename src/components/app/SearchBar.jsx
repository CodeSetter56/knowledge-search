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
    handleSearch({ preventDefault: () => {} });
  };

  return (

<form onSubmit={handleSearch} className="flex mb-8">
      <div className="relative flex grow gap-1 items-center">
        Search:

        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by keyword, tag, or content..."
          className="w-full rounded-r-none text-base pr-10 bg-amber-50"
          disabled={isSearching}
          onFocus={(e) => e.target.select()} // Auto-select text on focus for quick entry
        />

        {searchQuery && (
          <Button
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

      <Button
        type="submit"
        className="rounded-l-none bg-orange-500 hover:bg-orange-700"
        disabled={isSearching}
      >
        {isSearching ? "..." : <FaSearch />}
      </Button>
    </form>
  );
}
