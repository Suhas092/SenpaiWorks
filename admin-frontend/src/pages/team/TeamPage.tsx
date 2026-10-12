import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { del, patch, post } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invalidateResource, useFetch } from "@/hooks/useFetch";

const STAFF_ENDPOINT = "/admin/staff";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

type StaffRole = { key: string; label: string; description: string };

type Grant = "view" | "edit";
type PageGrants = Record<string, Grant>;
type StaffPage = { key: string; label: string };
type AccessLevel = "none" | Grant;
type AccessDraft = Record<string, AccessLevel>;

type StaffMember = {
  id: number;
  name: string;
  email: string | null;
  username: string;
  role: string;
  roleLabel: string;
  pageAccess: PageGrants;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type StaffList = { members: StaffMember[]; roles: StaffRole[]; pages: StaffPage[] };

type Credentials = { username: string; password: string };

type StaffMutationResult = { member: StaffMember; credentials?: Credentials };

type CreateValues = { name: string; email: string; role: string; pageAccess?: PageGrants };

type MemberUpdate = { id: number; role?: string; isActive?: boolean; pageAccess?: PageGrants };

const JUNIOR_ROLE = "junior_admin";

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: "none", label: "No access" },
  { value: "view", label: "View only" },
  { value: "edit", label: "View & edit" },
];

/** Converts picker state into the grants the API expects. Pages set to No access are dropped. */
function toPageGrants(draft: AccessDraft): PageGrants {
  const grants: PageGrants = {};
  for (const [key, level] of Object.entries(draft)) {
    if (level === "view" || level === "edit") grants[key] = level;
  }
  return grants;
}

/** Builds picker state from saved grants. Pages without a grant start at No access. */
function toAccessDraft(grants: PageGrants, pages: StaffPage[]): AccessDraft {
  return Object.fromEntries(pages.map((page) => [page.key, grants[page.key] ?? "none"]));
}

/** Short summary of a member's page access for the table. */
function accessSummary(member: StaffMember): string {
  if (member.role !== JUNIOR_ROLE) return "Full access";
  const levels = Object.values(member.pageAccess);
  if (levels.length === 0) return "No pages";
  const edit = levels.filter((level) => level === "edit").length;
  const view = levels.length - edit;
  return `${levels.length} page${levels.length === 1 ? "" : "s"} (${edit} edit, ${view} view)`;
}

const formatDate = (iso: string) => new Date(iso).toLocaleString();

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function TeamPage() {
  const client = useQueryClient();
  const query = useFetch<StaffList>(STAFF_ENDPOINT);
  const [creating, setCreating] = useState(false);
  const [shown, setShown] = useState<{ name: string; credentials: Credentials } | null>(null);
  const [removing, setRemoving] = useState<StaffMember | null>(null);
  const [editingAccess, setEditingAccess] = useState<{ member: StaffMember; changingRole: boolean } | null>(
    null,
  );

  const refresh = () => invalidateResource(client, STAFF_ENDPOINT);

  // Junior admins need page choices first, so the role only changes after the access modal is saved.
  const changeRole = (member: StaffMember, role: string) => {
    if (role === JUNIOR_ROLE) {
      setEditingAccess({ member, changingRole: true });
      return;
    }
    update.mutate({ id: member.id, role });
  };

  const create = useMutation({
    mutationFn: (values: CreateValues) => post<StaffMutationResult>(STAFF_ENDPOINT, values),
    onSuccess: (data) => {
      setCreating(false);
      if (data.credentials) setShown({ name: data.member.name, credentials: data.credentials });
      toast.success("Team member created");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Unable to create team member")),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: MemberUpdate) => patch<StaffMutationResult>(`${STAFF_ENDPOINT}/${id}`, body),
    onSuccess: () => {
      toast.success("Team member updated");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Unable to update team member")),
  });

  const resetPassword = useMutation({
    mutationFn: (member: StaffMember) =>
      post<StaffMutationResult>(`${STAFF_ENDPOINT}/${member.id}/reset-password`, {}),
    onSuccess: (data) => {
      if (data.credentials) setShown({ name: data.member.name, credentials: data.credentials });
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Unable to reset password")),
  });

  const remove = useMutation({
    mutationFn: (id: number) => del<{ success: boolean }>(`${STAFF_ENDPOINT}/${id}`),
    onSuccess: () => {
      setRemoving(null);
      toast.success("Team member removed");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Unable to remove team member")),
  });

  if (query.isPending) {
    return <p className="text-muted-foreground text-sm">Loading team…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm">Unable to load the team.</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { members, roles, pages } = query.data;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / TEAM</div>
          <h1>Team & roles</h1>
          <p>Create staff logins with limited access. Passwords are generated and shown only once.</p>
        </div>
        <div>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Add team member
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {roles.map((role) => (
          <div key={role.key} className="rounded-lg border p-4">
            <strong className="font-medium">{role.label}</strong>
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          </div>
        ))}
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <h3>No team members yet</h3>
          <p>Add a team member to give someone limited access to the console.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Page access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-medium">{member.name}</div>
                  {member.email && <div className="text-xs text-muted-foreground">{member.email}</div>}
                </TableCell>
                <TableCell className="font-mono text-sm">{member.username}</TableCell>
                <TableCell>
                  <select
                    aria-label={`Role for ${member.name}`}
                    className={SELECT_CLASS}
                    value={member.role}
                    disabled={update.isPending}
                    onChange={(e) => changeRole(member, e.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{accessSummary(member)}</TableCell>
                <TableCell>
                  <Badge variant={member.isActive ? "secondary" : "outline"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {member.role === JUNIOR_ROLE && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAccess({ member, changingRole: false })}
                      >
                        Edit pages
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resetPassword.isPending}
                      onClick={() => resetPassword.mutate(member)}
                    >
                      <KeyRound size={15} /> Reset password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: member.id, isActive: !member.isActive })}
                    >
                      {member.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => setRemoving(member)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal title="Add team member" open={creating} onClose={() => setCreating(false)}>
        <CreateStaffForm
          roles={roles}
          pages={pages}
          busy={create.isPending}
          onSubmit={(values) => create.mutate(values)}
          onCancel={() => setCreating(false)}
        />
      </Modal>

      <Modal
        title={editingAccess?.changingRole ? "Set page access" : "Edit page access"}
        open={editingAccess !== null}
        onClose={() => setEditingAccess(null)}
      >
        {editingAccess && (
          <PageAccessForm
            key={`${editingAccess.member.id}-${editingAccess.changingRole ? "role" : "pages"}`}
            member={editingAccess.member}
            changingRole={editingAccess.changingRole}
            pages={pages}
            busy={update.isPending}
            onCancel={() => setEditingAccess(null)}
            onSave={(pageAccess) =>
              update.mutate(
                {
                  id: editingAccess.member.id,
                  pageAccess,
                  ...(editingAccess.changingRole ? { role: JUNIOR_ROLE } : {}),
                },
                { onSuccess: () => setEditingAccess(null) },
              )
            }
          />
        )}
      </Modal>

      <Modal title="Login details" open={shown !== null} onClose={() => setShown(null)}>
        {shown && <CredentialsView name={shown.name} credentials={shown.credentials} />}
        <div className="flex justify-end mt-6">
          <Button onClick={() => setShown(null)}>Done</Button>
        </div>
      </Modal>

      {removing && (
        <ConfirmModal
          title="Remove team member"
          body={`Remove ${removing.name}? They will lose console access immediately.`}
          confirmLabel="Remove"
          busy={remove.isPending}
          onConfirm={() => remove.mutate(removing.id)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </>
  );
}

function CreateStaffForm({
  roles,
  pages,
  busy,
  onSubmit,
  onCancel,
}: {
  roles: StaffRole[];
  pages: StaffPage[];
  busy: boolean;
  onSubmit: (values: CreateValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0]?.key ?? "");
  const [access, setAccess] = useState<AccessDraft>(() => toAccessDraft({}, pages));
  const selected = roles.find((r) => r.key === role);
  const isJunior = role === JUNIOR_ROLE;
  const grants = toPageGrants(access);
  const needsPages = isJunior && Object.keys(grants).length === 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role,
      ...(isJunior ? { pageAccess: grants } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="staffNewName">Full name</Label>
        <Input id="staffNewName" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="staffNewEmail">Email (optional)</Label>
        <Input
          id="staffNewEmail"
          type="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="staffNewRole">Role</Label>
        <select
          id="staffNewRole"
          className={`${SELECT_CLASS} w-full`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        {selected && <p className="text-sm text-muted-foreground">{selected.description}</p>}
      </div>
      {isJunior && (
        <div className="grid gap-2">
          <Label>Page access</Label>
          <PageAccessPicker
            pages={pages}
            value={access}
            onChange={(key, level) => setAccess((prev) => ({ ...prev, [key]: level }))}
          />
          {needsPages && <p className="text-sm text-destructive">Choose at least one page for this junior admin.</p>}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !role || needsPages}>
          {busy ? "Creating…" : "Create login"}
        </Button>
      </div>
    </form>
  );
}

/** One row per console page with a No access / View only / View & edit choice. */
function PageAccessPicker({
  pages,
  value,
  onChange,
}: {
  pages: StaffPage[];
  value: AccessDraft;
  onChange: (key: string, level: AccessLevel) => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border p-3 max-h-72 overflow-y-auto">
      {pages.map((page) => (
        <div key={page.key} className="flex items-center justify-between gap-3">
          <span className="text-sm">{page.label}</span>
          <select
            aria-label={`Access to ${page.label}`}
            className={SELECT_CLASS}
            value={value[page.key] ?? "none"}
            onChange={(e) => onChange(page.key, e.target.value as AccessLevel)}
          >
            {ACCESS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

/** Edits the pages of an existing junior admin, or chooses them when promoting a member to junior admin. */
function PageAccessForm({
  member,
  changingRole,
  pages,
  busy,
  onSave,
  onCancel,
}: {
  member: StaffMember;
  changingRole: boolean;
  pages: StaffPage[];
  busy: boolean;
  onSave: (grants: PageGrants) => void;
  onCancel: () => void;
}) {
  const [access, setAccess] = useState<AccessDraft>(() => toAccessDraft(member.pageAccess, pages));
  const grants = toPageGrants(access);
  const hasPages = Object.keys(grants).length > 0;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (hasPages) onSave(grants);
      }}
    >
      <p className="text-sm text-muted-foreground">
        {changingRole
          ? `${member.name} will become a junior admin. Choose the pages they can open, and whether each one is view only or editable.`
          : `Choose the pages ${member.name} can open, and whether each one is view only or editable.`}
      </p>
      <PageAccessPicker
        pages={pages}
        value={access}
        onChange={(key, level) => setAccess((prev) => ({ ...prev, [key]: level }))}
      />
      {!hasPages && <p className="text-sm text-destructive">Choose at least one page for this junior admin.</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !hasPages}>
          {busy ? "Saving…" : changingRole ? "Make junior admin" : "Save access"}
        </Button>
      </div>
    </form>
  );
}

function CredentialsView({ name, credentials }: { name: string; credentials: Credentials }) {
  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Unable to copy"),
    );
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Share these details with {name}. The password is shown only once. Use Reset password to issue a new one.
      </p>
      <CredentialRow label="Username" value={credentials.username} onCopy={() => copy(credentials.username, "Username")} />
      <CredentialRow label="Password" value={credentials.password} onCopy={() => copy(credentials.password, "Password")} />
    </div>
  );
}

function CredentialRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">{value}</code>
        <Button variant="outline" size="icon" aria-label={`Copy ${label.toLowerCase()}`} onClick={onCopy}>
          <Copy size={15} />
        </Button>
      </div>
    </div>
  );
}
