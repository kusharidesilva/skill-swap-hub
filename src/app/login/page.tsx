import LoginPage from "@/components/login flow/login-page";

interface Props {
  searchParams: Promise<{ reason?: string }>;
}

export default async function Login({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  return <LoginPage searchParams={resolvedSearchParams} />;
}
