import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-t gap-3">
      <span className="text-xs text-muted-foreground">
        {total} results · Page {page} of {pages}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            variant={n === page ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
