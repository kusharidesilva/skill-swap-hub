import AuthGuard from "@/components/auth-guard"; 
 
export default function MyGigsLayout({ children }: { children: React.ReactNode }) { 
  return <AuthGuard requiredRole="provider">{children}</AuthGuard>; 
} 
 