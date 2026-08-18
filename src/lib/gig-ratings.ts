type GigLike = {
  id?: string | null;
  gigId?: string | null;
  title?: string | null;
  category?: string | null;
};

type RequestServiceContext = {
  gigId?: string | null;
  title?: string | null;
  serviceTitle?: string | null;
  gigTitle?: string | null;
  subject?: string | null;
  name?: string | null;
  category?: string | null;
  serviceCategory?: string | null;
};

type RequestLike = {
  gigId?: string | null;
  title?: string | null;
  requestTitle?: string | null;
  serviceTitle?: string | null;
  gigTitle?: string | null;
  serviceName?: string | null;
  name?: string | null;
  subject?: string | null;
  skill?: string | null;
  category?: string | null;
  serviceCategory?: string | null;
  serviceContext?: RequestServiceContext | null;
  review?: {
    rating?: number | null;
  };
};

function normalize(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeTitle(value: unknown) {
  return normalize(value)
    .replace(/^direct request for\s+/, "")
    .replace(/^request for\s+/, "")
    .replace(/\s+request$/, "")
    .replace(/^["'“”]+|["'“”.]+$/g, "")
    .trim();
}

function titleVariants(value: unknown) {
  const title = normalizeTitle(value);
  if (!title) {
    return [];
  }

  return unique([title, title.replace(/^i will do\s+/, "").trim()]);
}

function gigIdCandidates(gig: GigLike) {
  return unique([normalize(gig.gigId), normalize(gig.id)]);
}

function requestGigIdCandidates(request: RequestLike) {
  return unique([normalize(request.gigId), normalize(request.serviceContext?.gigId)]);
}

function gigTitleCandidates(gig: GigLike) {
  return titleVariants(gig.title);
}

function gigCategoryCandidates(gig: GigLike) {
  return unique([normalize(gig.category)]);
}

function requestTitleCandidates(request: RequestLike) {
  return unique([
    ...titleVariants(request.title),
    ...titleVariants(request.requestTitle),
    ...titleVariants(request.serviceTitle),
    ...titleVariants(request.gigTitle),
    ...titleVariants(request.serviceName),
    ...titleVariants(request.name),
    ...titleVariants(request.subject),
    ...titleVariants(request.skill),
    ...titleVariants(request.serviceContext?.title),
    ...titleVariants(request.serviceContext?.serviceTitle),
    ...titleVariants(request.serviceContext?.gigTitle),
    ...titleVariants(request.serviceContext?.subject),
    ...titleVariants(request.serviceContext?.name),
  ]);
}

function requestCategoryCandidates(request: RequestLike) {
  return unique([
    normalize(request.category),
    normalize(request.serviceCategory),
    normalize(request.serviceContext?.category),
    normalize(request.serviceContext?.serviceCategory),
  ]);
}

function titleMatches(gigTitle: string, requestTitle: string) {
  if (!gigTitle || !requestTitle) {
    return false;
  }

  if (gigTitle === requestTitle) {
    return true;
  }

  const shortest = Math.min(gigTitle.length, requestTitle.length);
  return shortest >= 6 && (requestTitle.includes(gigTitle) || gigTitle.includes(requestTitle));
}

export function requestMatchesGig(gig: GigLike, request: RequestLike) {
  const gigIds = gigIdCandidates(gig);
  const requestGigIds = requestGigIdCandidates(request);

  if (gigIds.length > 0 && requestGigIds.length > 0) {
    return requestGigIds.some((requestGigId) => gigIds.includes(requestGigId));
  }

  const gigTitles = gigTitleCandidates(gig);
  const requestTitles = requestTitleCandidates(request);
  if (
    gigTitles.length > 0 &&
    requestTitles.length > 0 &&
    gigTitles.some((gigTitle) => requestTitles.some((requestTitle) => titleMatches(gigTitle, requestTitle)))
  ) {
    return true;
  }

  const gigCategories = gigCategoryCandidates(gig);
  const requestCategories = requestCategoryCandidates(request);
  if (gigCategories.length > 0 && requestCategories.length > 0) {
    return gigCategories.some((gigCategory) => requestCategories.includes(gigCategory));
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
