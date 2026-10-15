import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
export function TableSearch({
  onSearch,
  placeholder = "Search...",
  debounce = 250,
}: {
  onSearch: (value: string) => void;
  placeholder?: string;
  debounce?: number;
}) {
  const [value, setValue] = useState("");
  const search = useDebounce(value, debounce);
  useEffect(() => onSearch(search), [search, onSearch]);
  return (
    <label className="search-field">
      <Search size={16} />
      <input
        value={value}
        maxLength={100}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}
