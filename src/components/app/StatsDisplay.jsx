// src/components/app/StatsDisplay.jsx

export function StatsDisplay({ stats }) {
  if (!stats) {
    return (
      <div className="text-right text-sm text-muted-foreground mb-2">
        Loading stats...
      </div>
    );
  }

  return (
    <div className="text-right text-sm text-muted-foreground mb-2 flex justify-end gap-4">
      <span>
        Total Files: <strong>{stats.totalUploads}</strong>
      </span>
      <span>
        PDF Scan Credits: <strong>{stats.pdfCreditsRemaining}</strong>
      </span>
    </div>
  );
}
