import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageRange } from "@/core/pagination";
import { Button } from "@/components/ui";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageRange(page, totalPages);

  return (
    <nav
      className="flex flex-col gap-3 border-t border-brown-deep/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
        <Button
          variant="toolbar"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
              p === page
                ? "bg-emerald-deep text-white shadow-sm"
                : "text-brown-deep hover:bg-foam"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ))}
        <Button
          variant="toolbar"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
