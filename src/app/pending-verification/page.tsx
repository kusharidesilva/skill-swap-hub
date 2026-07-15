import PendingVerificationPage from "@/components/login flow/pending-verification-page";

interface Props {
  searchParams: Promise<{ registered?: string }>;
}

export default async function PendingVerification({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  return <PendingVerificationPage searchParams={resolvedSearchParams} />;
}
