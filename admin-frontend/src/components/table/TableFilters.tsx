export function TableFilters({
  value,
  onChange,
  options = ["All statuses", "Active", "Draft", "Archived"],
}: {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}) {
  return (
    <select
      className="admin-input w-auto"
      aria-label="Filter status"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
export { TableFilters as Filters };
