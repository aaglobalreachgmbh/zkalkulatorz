import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  showFallback?: boolean;
}

export function BrandLogo({
  src,
  alt = "Firmenlogo",
  className,
  imageClassName,
  fallbackClassName,
  showFallback = true,
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    if (!showFallback) return null;

    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-muted text-muted-foreground",
          className,
          fallbackClassName,
        )}
        role="img"
        aria-label={src ? `${alt} konnte nicht geladen werden` : "Kein Firmenlogo hinterlegt"}
      >
        <ImageOff className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={cn("block h-full w-full object-contain", imageClassName)}
        loading="eager"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </div>
  );
}