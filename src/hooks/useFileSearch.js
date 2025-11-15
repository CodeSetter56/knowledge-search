import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useFileSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    fileType: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch all files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async (customFilters = {}) => {
    setIsSearching(true);

    const activeFilters = {
      ...filters,
      ...customFilters,
    };

    // Determine the current query to use: allow passing 'q' via customFilters
    const currentQuery =
      customFilters.q !== undefined ? customFilters.q : searchQuery;

    const params = new URLSearchParams();

    // Use currentQuery here
    if (currentQuery.trim()) {
      params.append("q", currentQuery);
    }
    if (activeFilters.fileType !== "all") {
      params.append("fileType", activeFilters.fileType);
    }
    if (activeFilters.dateFrom) {
      params.append("dateFrom", activeFilters.dateFrom);
    }
    if (activeFilters.dateTo) {
      params.append("dateTo", activeFilters.dateTo);
    }

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch files.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e) => {
    // Only call preventDefault if an event object is provided (i.e., a form submit)
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    fetchFiles();
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Pass current query and new filters to fetchFiles
    fetchFiles({ ...filters, q: searchQuery, ...newFilters });
  };

  const resetFilters = () => {
    const defaultFilters = {
      fileType: "all",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(defaultFilters);
    setSearchQuery("");
    // Pass empty query and default filters to trigger fetch
    fetchFiles({ q: "", ...defaultFilters });
  };

  return {
    searchResults,
    setSearchResults,
    searchQuery,
    setSearchQuery,
    isSearching,
    handleSearch,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchFiles,
  };
}
