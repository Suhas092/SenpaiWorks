import { useState } from "react";
export function usePagination<T>(rows: T[], size = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  return { page: current, pages, setPage, rows: rows.slice((current - 1) * size, current * size) };
}
