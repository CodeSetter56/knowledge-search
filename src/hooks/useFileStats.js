// src/hooks/useFileStats.js

import { useState, useEffect } from "react";
import { toast } from "sonner";

// Custom hook to fetch and manage global application statistics
export function useFileStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    /**
     * Fetches the global stats object from the API.
     */
    async function fetchStats() {
      try {
        console.log("[useFileStats] Fetching initial stats...");
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");

        const data = await response.json();
        setStats(data);
        console.log("[useFileStats] Stats loaded:", data);
      } catch (error) {
        console.error("Could not fetch stats:", error);
        toast.error("Could not load file stats.");
      }
    }
    fetchStats();
  }, []); // Run only once on component mount

  return { stats, setStats };
}
