import AuthGuard from "@/components/auth-guard";

export default function IncomingRequestsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="provider">{children}</AuthGuard>;
}
