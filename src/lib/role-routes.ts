export type Role = "buyer" | "provider" | "both";
export type SiteRole = Role | "guest";

const roles = ["buyer", "provider", "both"] as const;

// This also narrows unknown route values to the Role type for TypeScript.
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

// Invalid or missing role segments safely fall back to a buyer view.
export function resolveRole(value: unknown, fallback: Role = "buyer"): Role {
  return isRole(value) ? value : fallback;
}

// Route helpers keep role-aware links consistent across desktop and mobile navigation.
export function homeHref(role: SiteRole): string {
  return role === "guest" ? "/" : `/home/${role}`;
}

export function aboutHref(role: SiteRole): string {
  return role === "guest" ? "/about" : `/about/${role}`;
}

export function helpHref(role: Role): string {
  return `/help/${role}`;
}

export function dashboardHref(role: Role): string {
  return `/dashboard/${role}`;
}

export function profileHref(role: Role): string {
  return `/profile/${role}`;
}

export function settingsHref(role: Role): string {
  return `/profile-settings/${role}`;
}

export function scopedHref(basePath: string, role: Role): string {
  return `${basePath}/${role}`;
}
