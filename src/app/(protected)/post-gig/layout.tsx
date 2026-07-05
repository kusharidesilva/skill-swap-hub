import AuthGuard from "@/components/auth-guard"; 

export default function PostGigLayout({ children }: { children: React.ReactNode }) { 
  return <AuthGuard requiredRole="provider">{children}</AuthGuard>; 
} 
 