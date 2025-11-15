// src/hooks/useFileSearch.js

import { useState } from "react";
import { toast } from "sonner";

export function useFileSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const toastId = toast.loading(`Searching for "${searchQuery}"...`);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();
      setSearchResults(results);
      toast.success(`${results.length} results found!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Search failed.", { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchResults,
    setSearchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
  };
}
