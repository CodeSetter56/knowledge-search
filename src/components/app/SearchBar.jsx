// src/components/app/SearchBar.jsx

import { FaSearch } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
}) {
  return (
    <form onSubmit={handleSearch} className="flex mb-8">
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by keyword, tag, or content..."
        className="flex grow rounded-r-none text-base"
        disabled={isSearching}
      />
      <Button type="submit" className="rounded-l-none" disabled={isSearching}>
        {isSearching ? "..." : <FaSearch />}
      </Button>
    </form>
  );
}
