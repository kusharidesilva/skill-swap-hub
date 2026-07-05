// Firestore may contain old string ratings, so normalize both formats in one place.
export function parseRatingValue(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatRatingLabel(value: number | string | null | undefined): string {
  const numeric = parseRatingValue(value);
  // A zero rating means the user has not received a review yet.
  return numeric > 0 ? numeric.toFixed(1) : "New";
}
