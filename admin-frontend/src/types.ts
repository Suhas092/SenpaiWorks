import type { LucideIcon } from "lucide-react";

export interface AdminRecord {
  id: string;
  name: string;
  sub?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

export type FormValues = Record<string, string | number | boolean>;

export type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "date" | "checkbox" | "image";
  options?: string[] | undefined;
  required?: boolean;
};

export type ResourceColumn = { key: string; label: string };

export type ResourceConfig = {
  title: string;
  description: string;
  singular: string;
  /** GET path relative to the API base (e.g. "/admin/orders"). */
  listPath: string;
  /** Re-fetches the list on this interval (ms) so counts stay live. */
  refetchInterval?: number;
  /** Fixed status filter options; defaults to the statuses found in the rows. */
  statusOptions?: string[];
  /** Icon stats shown on visual cards, read from the row by `key`. */
  cardStats?: { key: string; icon: LucideIcon; label: string; filled?: boolean }[];
  /** Converts the raw API response into table rows. */
  toRows: (raw: unknown) => AdminRecord[];
  columns: ResourceColumn[];
  fields: Field[];
  /** Per-row form fields; used when rows of one resource need different inputs. */
  fieldsFor?: (row: AdminRecord) => Field[];
  visual?: boolean;
  create?: (values: FormValues) => Promise<unknown>;
  update?: (row: AdminRecord, values: FormValues) => Promise<unknown>;
  remove?: (row: AdminRecord) => Promise<unknown>;
  /** Used when `remove` is refused with 409 (e.g. product has orders). */
  archive?: (row: AdminRecord) => Promise<unknown>;
  rowAction?: {
    label: (row: AdminRecord) => string;
    run: (row: AdminRecord) => Promise<unknown>;
    success: string;
  };
  /** Public storefront URL for the row, opened from a row action. */
  liveUrl?: (row: AdminRecord) => string;
  /** Dropdown that filters rows by one field. Empty `options` are derived from the loaded rows. */
  extraFilter?: { key: string; label: string; allLabel: string; options: string[] };
  openDetail?: boolean;
  viewReviews?: boolean;
};
