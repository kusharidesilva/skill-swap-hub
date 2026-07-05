import AuthGuard from "@/components/auth-guard"; 

export default function FindServicesLayout({ children }: { children: React.ReactNode }) { 
  return <AuthGuard requiredRole="buyer">{children}</AuthGuard>; 
}
