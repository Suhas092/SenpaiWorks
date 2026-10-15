import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/api";
import { invalidateResource, resourceBase } from "./useFetch";

export function useMutate<T>(listPath: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      method,
      data,
      id,
    }: {
      method: string;
      data?: T | undefined;
      id?: string | undefined;
    }) =>
      request<unknown>(
        `${resourceBase(listPath)}${id ? `/${encodeURIComponent(id)}` : ""}`,
        method,
        data,
      ),
    onSuccess: () => invalidateResource(client, listPath),
  });
}
