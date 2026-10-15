import { useFetch } from "./useFetch";

export type ProductLite = { id: string; name: string };

export function useProducts(search = "") {
  return useFetch<ProductLite[]>(`/products?search=${encodeURIComponent(search.slice(0, 100))}`);
}
