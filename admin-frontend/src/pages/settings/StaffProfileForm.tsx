import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { post, put } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_SESSION_KEY, initialsFor } from "@/hooks/useAdminSession";
import { useFetch } from "@/hooks/useFetch";

const PROFILE_ENDPOINT = "/admin/profile";
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export type StaffProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  username: string;
  role: string;
  roleLabel: string;
  accessPrivileges: string;
};

type StaffDraft = {
  name: string;
  email: string;
  phone: string;
  password: string;
  currentPassword: string;
};

export function StaffProfileForm() {
  const client = useQueryClient();
  const query = useFetch<StaffProfile>(PROFILE_ENDPOINT);
  const [draft, setDraft] = useState<StaffDraft | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const saved = query.data;
  const current: StaffDraft | null =
    draft ??
    (saved
      ? { name: saved.name, email: saved.email, phone: saved.phone, password: "", currentPassword: "" }
      : null);
  const dirty =
    draft !== null &&
    saved !== undefined &&
    (draft.name !== saved.name ||
      draft.email !== saved.email ||
      draft.phone !== saved.phone ||
      draft.password !== "");

  const save = useMutation({
    mutationFn: (values: StaffDraft) => put<StaffProfile>(PROFILE_ENDPOINT, values),
    onSuccess: (data) => {
      client.setQueryData([PROFILE_ENDPOINT], data);
      setDraft(null);
      void client.invalidateQueries({ queryKey: ADMIN_SESSION_KEY });
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to save profile");
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: (imageBase64: string) =>
      post<{ success: boolean; avatarUrl: string }>("/admin/profile/avatar", { imageBase64 }),
    onSuccess: (data) => {
      client.setQueryData<StaffProfile>([PROFILE_ENDPOINT], (prev) =>
        prev ? { ...prev, avatar: data.avatarUrl } : prev,
      );
      void client.invalidateQueries({ queryKey: ADMIN_SESSION_KEY });
      toast.success("Profile photo updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to upload photo");
    },
  });

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Profile photo must be 3 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadAvatar.mutate(String(reader.result));
    reader.onerror = () => toast.error("Could not read that file.");
    reader.readAsDataURL(file);
  };

  if (query.isPending) {
    return <p className="text-muted-foreground text-sm">Loading profile…</p>;
  }

  if (query.isError || !saved || !current) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm">Unable to load your profile.</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const update = (patch: Partial<StaffDraft>) => setDraft({ ...current, ...patch });
  const changingPassword = current.password !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (dirty) save.mutate(current);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / PROFILE</div>
          <h1>My profile</h1>
          <p>Update your details, phone, photo and password. Your username and role are set by the super admin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold">
            {saved.avatar ? (
              <img src={saved.avatar} alt="Your profile photo" className="size-full object-cover" />
            ) : (
              initialsFor(saved.name || saved.username)
            )}
          </div>
          <div className="grid gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              className="hidden"
              onChange={handlePhoto}
            />
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadAvatar.isPending}
                onClick={() => fileInput.current?.click()}
              >
                {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP or GIF, up to 3 MB.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="staffUsername">Username</Label>
            <Input id="staffUsername" value={saved.username} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staffRole">Role</Label>
            <Input id="staffRole" value={saved.roleLabel} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staffAccess">Access privileges</Label>
            <Input id="staffAccess" value={saved.accessPrivileges} readOnly />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="staffName">Full name</Label>
            <Input
              id="staffName"
              maxLength={80}
              required
              value={current.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staffEmail">Email</Label>
            <Input
              id="staffEmail"
              type="email"
              maxLength={254}
              value={current.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staffPhone">Phone number</Label>
            <Input
              id="staffPhone"
              type="tel"
              maxLength={30}
              value={current.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="staffPassword">New password</Label>
            <Input
              id="staffPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={200}
              placeholder="Leave blank to keep your password"
              value={current.password}
              onChange={(e) => update({ password: e.target.value })}
            />
          </div>
          {changingPassword && (
            <div className="grid gap-2">
              <Label htmlFor="staffCurrentPassword">Current password</Label>
              <Input
                id="staffCurrentPassword"
                type="password"
                autoComplete="current-password"
                maxLength={200}
                required
                value={current.currentPassword}
                onChange={(e) => update({ currentPassword: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          {dirty && <span className="text-sm text-muted-foreground mr-auto">Unsaved changes</span>}
          <Button type="button" variant="outline" disabled={!dirty || save.isPending} onClick={() => setDraft(null)}>
            Discard
          </Button>
          <Button type="submit" disabled={!dirty || save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </>
  );
}
