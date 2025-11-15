import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FaFilter, FaTimes } from "react-icons/fa";

// Simplified to use short keys that map to the final, distinct logical groups
export const FILE_TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDFs" },
  { value: "documents-text", label: "Documents (DOCX/TXT)" }, // Files stored in 'texts' folder
  { value: "structured-data", label: "Structured Data (XLSX/JSON/SQL)" }, // Files stored in 'structured' folder
  { value: "image", label: "Images" },
  { value: "other", label: "Other" },
];

export function FilterBar({ filters, updateFilters, resetFilters }) {
  const hasActiveFilters =
    filters.fileType !== "all" || filters.dateFrom || filters.dateTo;

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <FaFilter className="text-muted-foreground" />
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-auto">
            Active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* File Type Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            File Type
          </label>
          <select
            value={filters.fileType}
            onChange={(e) => updateFilters({ fileType: e.target.value })}
            className="flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px] dark:bg-input/30"
          >
            {FILE_TYPE_FILTERS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            From Date
          </label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
          />
        </div>

        {/* Date To Filter */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            To Date
          </label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="gap-2"
          >
            <FaTimes />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
