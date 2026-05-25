import AuthGuard from "@/components/auth-guard";

export default function BecomeASellerIntroLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="buyer">{children}</AuthGuard>;
}
