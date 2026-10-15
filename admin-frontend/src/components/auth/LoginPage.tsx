import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, post } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_SESSION_KEY } from "@/hooks/useAdminSession";

type LoginResponse = { success: boolean; username: string; token?: string };

export function LoginPage() {
  const client = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: () => post<LoginResponse>("/admin/login", { username, password }),
    onSuccess: (data) => {
      setError(null);
      setPassword("");
      if (data?.token) {
        localStorage.setItem("adminToken", data.token);
      }
      client.invalidateQueries({ queryKey: ADMIN_SESSION_KEY });
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the server. Please try again.",
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    login.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to the SenpaiWorks admin console.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-username">Username</Label>
          <Input
            id="admin-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={login.isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={login.isPending}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
