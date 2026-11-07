"use client";

import React, { useState } from "react";
import type { ImageProps } from "next/image";
import Image from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onLoad" | "onLoadingComplete"> {
  wrapperClassName?: string;
  skeletonClassName?: string;
}

export default function SafeImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  skeletonClassName = "",
  ...props
}: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative h-full w-full overflow-hidden ${wrapperClassName}`}>
      {/* Premium Shimmering Skeleton Loader */}
      {!isLoaded && (
        <div
          className={`shimmer-loader absolute inset-0 z-10 rounded-[inherit] ${skeletonClassName}`}
          style={{ width: "100%", height: "100%" }}
        />
      )}

      {/* Optimized Next.js Image with Transition */}
      <Image
        src={src}
        alt={alt}
        className={`transition-all duration-700 ease-out ${
          isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.01] blur-sm"
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
