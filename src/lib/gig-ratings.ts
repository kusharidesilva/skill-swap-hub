type GigLike = {
  id?: string;
  gigId?: string;
  title?: string;
  category?: string;
};

type RequestLike = {
  gigId?: string;
  title?: string;
  category?: string;
  review?: {
    rating?: number;
  };
};

function normalize(value: string | null | undefined) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function requestMatchesGig(gig: GigLike, request: RequestLike) {
  const gigId = normalize(gig.gigId || gig.id);
  const requestGigId = normalize(request.gigId);

  if (gigId && requestGigId) {
    return gigId === requestGigId;
  }

  const gigTitle = normalize(gig.title);
  const requestTitle = normalize(request.title);
  if (gigTitle && requestTitle && (requestTitle.includes(gigTitle) || gigTitle.includes(requestTitle))) {
    return true;
  }

  const gigCategory = normalize(gig.category);
  const requestCategory = normalize(request.category);
  if (gigCategory && requestCategory) {
    return gigCategory === requestCategory;
  }

  return false;
}

export function buildGigRatingSummary<TGig extends GigLike, TRequest extends RequestLike>(
  gig: TGig,
  requests: TRequest[],
) {
  const ratings = requests
    .filter((request) => requestMatchesGig(gig, request))
    .map((request) => request.review?.rating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);

  return {
    count: ratings.length,
    rating: ratings.length > 0 ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)) : 0,
  };
}
