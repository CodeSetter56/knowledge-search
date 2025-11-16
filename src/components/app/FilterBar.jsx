// src/components/app/FilterBar.jsx

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaFilter, FaTimes } from "react-icons/fa";
import { FILE_TYPE_FILTERS } from "@/lib/utils";

export function FilterBar({ filters, updateFilters, resetFilters }) {

  const hasActiveFilters =
    filters.fileType !== "all" || filters.dateFrom || filters.dateTo;

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-lg border bg-amber-50">
      <div className="grid grid-cols-2 md:grid-cols-[1fr_2fr_2fr_2fr] gap-3 md:items-end">
        <div className="flex flex-col justify-start h-full pb-1 pr-3">
          <div className="text-sm flex gap-2 text-muted-foreground mb-4">
            <FaFilter className="text-primary" size={24} />
            <h3 className="font-semibold text-lg text-foreground">Filter</h3>
          </div>

          <div className="flex-1 flex flex-col justify-start">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-2 w-full"
              >
                <FaTimes />
                Clear Filters
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center pt-2">
                No active filters.
              </p>
            )}
          </div>
        </div>

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
    </div>
  );
}
