"use client";

import clsx from "clsx";
import { useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type GuideImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fade?: boolean;
};

export default function GuideImage({
  className,
  fade = true,
  onLoad,
  alt = "",
  src,
  ...props
}: GuideImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      ref={imgRef}
      src={src}
      alt={alt}
      decoding="async"
      className={clsx(
        className,
        fade && "transition-opacity duration-200 ease-out",
        fade && (loaded ? "opacity-100" : "opacity-0")
      )}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
