export type Permission =
  | "files:upload"
  | "kpis:upload"
  | "frameworks:create"
  | "frameworks:export"
  | "recommendations:generate"
  | "admin:outbox"
  | "admin:jobs";

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    "files:upload",
    "kpis:upload",
    "frameworks:create",
    "frameworks:export",
    "recommendations:generate",
    "admin:outbox",
    "admin:jobs"
  ],
  analyst: ["files:upload", "kpis:upload", "frameworks:create", "frameworks:export", "recommendations:generate"],
  reviewer: ["frameworks:export"]
};

export const can = (role: string | undefined, permission: Permission) => {
  if (!role) return false;
  return (rolePermissions[role] ?? []).includes(permission);
};
