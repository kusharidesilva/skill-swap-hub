import VerifyEmailPage from "@/components/login flow/verify-email-page";

interface Props {
  searchParams?: { from?: string };
}

export default function VerifyEmail({ searchParams }: Props) {
  return <VerifyEmailPage searchParams={searchParams} />;
}
