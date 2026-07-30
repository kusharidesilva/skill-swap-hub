export type IdentityRole = "buyer" | "provider" | "both";

export function getRoleBadge(role: IdentityRole) {
  if (role === "provider") {
    return {
      label: "Provider",
      className: "bg-blue-100 text-[#1453c4]",
    };
  }

  if (role === "both") {
    return {
      label: "Both",
      className: "bg-indigo-100 text-indigo-700",
    };
  }

  return {
    label: "Buyer",
    className: "bg-emerald-100 text-emerald-700",
  };
}

export function getVerificationBadge(
  role: IdentityRole,
  verifiedStudentProvider: boolean,
  accountType?: string,
) {
  if (role === "buyer") {
    if (accountType === "student") {
      return null;
    }

    return {
      label: "Verified Buyer",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      iconClassName: "text-emerald-600",
    };
  }

  if (role === "provider" || role === "both") {
    return {
      label: "Verified Student",
      className: "bg-[#eef4ff] text-[#2f66e7] ring-1 ring-[#d7e5ff]",
      iconClassName: "text-[#2f66e7]",
    };
  }

  return null;
}
