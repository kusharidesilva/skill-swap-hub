import { redirect } from "next/navigation";

export default function SubmitReviewFallbackPage() {
  redirect("/get-started");
}
