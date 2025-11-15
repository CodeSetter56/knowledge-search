// src/components/app/StatsDisplay.jsx

import { cn } from "@/lib/utils";

// Removed displayTotalFiles prop
export function StatsDisplay({ stats, isHome = false }) {
  if (!stats) {
    // Adjust color for navbar context
    return (
      <div
        className={cn(
          "text-right text-sm mb-2",
          isHome ? "text-white/80" : "text-muted-foreground"
        )}
      >
        Loading stats...
      </div>
    );
  }

  const textColorClass = isHome ? "text-white" : "text-foreground";
  const mutedTextColorClass = isHome
    ? "text-white/80"
    : "text-muted-foreground";

  // Now consistently shows the global system total (stats.totalUploads)
  const totalFilesCount = stats.totalUploads;
  const totalFilesLabel = "Total Files";

  return (
    <div
      className={cn(
        "text-right text-sm mb-2 flex justify-end gap-4",
        mutedTextColorClass
      )}
    >
      <span>
        {totalFilesLabel}:{" "}
        <strong className={textColorClass}>{totalFilesCount}</strong>
      </span>
      <span>
        PDF Scan Credits:{" "}
        <strong className={textColorClass}>{stats.pdfCreditsRemaining}</strong>
      </span>
    </div>
  );
}
