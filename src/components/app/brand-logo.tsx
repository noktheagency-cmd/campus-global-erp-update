import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  alt = "Campus Global",
  className,
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden bg-[#1518ba]",
        className,
      )}
    >
      <Image
        alt={alt}
        className="object-cover"
        fill
        sizes="56px"
        src="/brand/campus-global-logo.png"
      />
    </span>
  );
}
