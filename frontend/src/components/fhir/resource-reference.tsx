"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "@/components/ui/icons";

interface FhirReference {
  reference?: string;
  type?: string;
  display?: string;
}

interface ResourceReferenceProps {
  reference: FhirReference | string | undefined | null;
  showType?: boolean;
  showIcon?: boolean;
  onHover?: (ref: string) => Promise<Record<string, unknown> | null>;
  className?: string;
}

function parseReference(ref: FhirReference | string | undefined | null): {
  type: string | null;
  id: string | null;
  display: string | null;
  href: string | null;
} {
  if (!ref) {
    return { type: null, id: null, display: null, href: null };
  }

  if (typeof ref === "string") {
    // Parse "ResourceType/id" format
    const match = ref.match(/^(\w+)\/(.+)$/);
    if (match) {
      const [, type, id] = match;
      return {
        type,
        id,
        display: null,
        href: getResourceHref(type, id),
      };
    }
    return { type: null, id: null, display: ref, href: null };
  }

  const { reference: refString, type, display } = ref;

  if (refString) {
    const match = refString.match(/^(\w+)\/(.+)$/);
    if (match) {
      const [, refType, id] = match;
      return {
        type: type || refType,
        id,
        display: display ?? null,
        href: getResourceHref(type || refType, id),
      };
    }
  }

  return { type: type ?? null, id: null, display: display ?? null, href: null };
}

function getResourceHref(type: string, id: string): string | null {
  // Map FHIR resource types to app routes
  const routeMap: Record<string, string> = {
    Patient: "/patients",
    Practitioner: "/practitioners",
    Organization: "/organizations",
    Encounter: "/encounters",
  };

  const baseRoute = routeMap[type];
  if (baseRoute) {
    return `${baseRoute}/${id}`;
  }
  return null;
}

export function ResourceReference({
  reference,
  showType = false,
  showIcon = true,
  onHover,
  className,
}: ResourceReferenceProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const { type, id, display, href } = parseReference(reference);

  if (!reference) {
    return <span className="text-base-content/50">-</span>;
  }

  const displayText = display || id || "Unknown";

  const handleMouseEnter = async () => {
    setIsHovering(true);
    if (onHover && type && id && !preview) {
      setLoading(true);
      try {
        const data = await onHover(`${type}/${id}`);
        setPreview(data);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const content = (
    <>
      {showType && type && (
        <span className="text-xs text-base-content/50 mr-1">[{type}]</span>
      )}
      <span>{displayText}</span>
      {showIcon && href && (
        <ExternalLink className="w-3 h-3 ml-1 inline-block opacity-50 group-hover:opacity-100" />
      )}
    </>
  );

  if (href) {
    return (
      <div className="relative inline-block">
        <Link
          href={href}
          className={cn(
            "group inline-flex items-center text-primary hover:underline",
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </Link>

        {/* Hover preview */}
        {isHovering && (onHover || preview) && (
          <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-base-100 rounded-lg shadow-lg border border-base-200">
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : preview ? (
              <div className="text-sm">
                <p className="font-medium">{type}</p>
                <pre className="text-xs mt-1 overflow-hidden text-ellipsis">
                  {JSON.stringify(preview, null, 2).slice(0, 200)}...
                </pre>
              </div>
            ) : (
              <p className="text-sm text-base-content/50">
                Hover to preview resource
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>{content}</span>
  );
}
