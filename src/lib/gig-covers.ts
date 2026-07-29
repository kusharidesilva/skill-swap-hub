const DEFAULT_GIG_COVERS = [
  "/img/gig-photography.jpg",
  "/img/gig-party.png",
  "/img/gig-graphic.png",
  "/img/gig-video-editing.png",
  "/img/gig-video.png",
] as const;

export const GIG_COVER_PRESETS = [
  { label: "Photography", src: "/img/gig-photography.jpg" },
  { label: "Event Decoration", src: "/img/gig-party.png" },
  { label: "Graphic Design", src: "/img/gig-graphic.png" },
  { label: "Video Editing", src: "/img/gig-video-editing.png" },
  { label: "Videography", src: "/img/gig-video.png" },
] as const;

function normalize(value: string | undefined | null) {
  return (value || "").trim().toLowerCase();
}

export function getGigCoverForCategory(category?: string, title?: string, index = 0) {
  const haystack = `${normalize(category)} ${normalize(title)}`;

  if (
    haystack.includes("photo") ||
    haystack.includes("camera") ||
    haystack.includes("portrait") ||
    haystack.includes("wedding photography")
  ) {
    return "/img/gig-photography.jpg";
  }

  if (
    haystack.includes("event") ||
    haystack.includes("party") ||
    haystack.includes("birthday") ||
    haystack.includes("decoration")
  ) {
    return "/img/gig-party.png";
  }

  if (
    haystack.includes("graphic") ||
    haystack.includes("design") ||
    haystack.includes("t-shirt") ||
    haystack.includes("shirt") ||
    haystack.includes("craft") ||
    haystack.includes("handmade")
  ) {
    return "/img/gig-graphic.png";
  }

  if (
    haystack.includes("video editing") ||
    haystack.includes("editing") ||
    haystack.includes("cinematic")
  ) {
    return "/img/gig-video-editing.png";
  }

  if (
    haystack.includes("videography") ||
    haystack.includes("video") ||
    haystack.includes("film")
  ) {
    return "/img/gig-video.png";
  }

  return DEFAULT_GIG_COVERS[Math.abs(index) % DEFAULT_GIG_COVERS.length];
}

export function isPresetGigCover(src: string | undefined | null) {
  return GIG_COVER_PRESETS.some((preset) => preset.src === src);
}
