import AuthGuard from "@/components/auth-guard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every route in this group requires a verified Firebase account.
  return <AuthGuard>{children}</AuthGuard>;
}
