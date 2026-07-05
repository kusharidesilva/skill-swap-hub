import AuthGuard from "@/components/auth-guard"; 
 
export default function RequestServiceLayout({ children }: { children: React.ReactNode }) { 
  return <AuthGuard requiredRole="buyer">{children}</AuthGuard>; 
} 
 