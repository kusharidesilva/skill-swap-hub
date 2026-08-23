"use client";

import Image from "next/image";
import { useState } from "react";

import { getGigCoverForCategory } from "@/lib/gig-covers";

type GigCoverImageProps = {
  src?: string;
  alt: string;
  title?: string;
  category?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
};

export default function GigCoverImage({
  src,
  alt,
  title,
  category,
  className,
  sizes,
  priority = false,
}: GigCoverImageProps) {
  const fallback = getGigCoverForCategory(category, title);
  const requestedSource = src?.trim() || fallback;
  const [failedSource, setFailedSource] = useState("");
  const resolvedSource = failedSource === requestedSource ? fallback : requestedSource;

  return (
    <Image
      src={resolvedSource}
      alt={alt}
      fill
      priority={priority}
      className={className}
      sizes={sizes}
      unoptimized={resolvedSource.startsWith("https://firebasestorage.googleapis.com/")}
      onError={() => {
        if (resolvedSource !== fallback) {
          setFailedSource(requestedSource);
        }
      }}
    />
  );
}
