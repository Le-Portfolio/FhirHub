"use client";

import { cn } from "@/lib/utils";
import { Info } from "./icons";

interface ComingSoonBannerProps {
  message?: string;
  className?: string;
}

export function ComingSoonBanner({
  message = "This feature is coming soon. Form data will not be saved.",
  className,
}: ComingSoonBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-info/10 border border-info/20 rounded-lg text-sm text-info-content",
        className
      )}
    >
      <Info className="w-5 h-5 text-info shrink-0" />
      <span>{message}</span>
    </div>
  );
}
