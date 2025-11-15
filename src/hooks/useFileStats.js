// src/hooks/useFileStats.js

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useFileStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
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
  }, []);

  return { stats };
}
