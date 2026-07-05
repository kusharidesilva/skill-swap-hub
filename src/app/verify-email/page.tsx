import VerifyEmailPage from "@/components/login flow/verify-email-page";

interface Props {
  searchParams: Promise<{ from?: string }>; 
}

export default async function VerifyEmail({ searchParams }: Props) { 
  const resolvedSearchParams = await searchParams; 
  return <VerifyEmailPage searchParams={resolvedSearchParams} />; 
} 
