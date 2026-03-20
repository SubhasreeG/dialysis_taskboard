import { useState, useCallback } from "react";
import type { FilterState } from "../types";

const DEFAULT_FILTERS: FilterState = {
  role: "all",
  timeFilter: "all",
  searchQuery: "",
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setRole = useCallback((role: FilterState["role"]) => {
    setFilters((f) => ({ ...f, role }));
  }, []);

  const setTimeFilter = useCallback((timeFilter: FilterState["timeFilter"]) => {
    setFilters((f) => ({ ...f, timeFilter }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((f) => ({ ...f, searchQuery }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.role !== "all" ||
    filters.timeFilter !== "all" ||
    filters.searchQuery.trim() !== "";

  return { filters, setRole, setTimeFilter, setSearchQuery, resetFilters, hasActiveFilters };
}
