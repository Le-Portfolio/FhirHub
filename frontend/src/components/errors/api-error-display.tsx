"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "@/components/ui/icons";
import { useState } from "react";

// FHIR OperationOutcome structure
interface OperationOutcomeIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  details?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  diagnostics?: string;
  expression?: string[];
  location?: string[];
}

interface OperationOutcome {
  resourceType: "OperationOutcome";
  issue: OperationOutcomeIssue[];
}

interface ApiErrorDisplayProps {
  error: Error | OperationOutcome | unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorDisplay({
  error,
  title = "An error occurred",
  onRetry,
  className,
}: ApiErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOperationOutcome = (err: unknown): err is OperationOutcome => {
    return (
      typeof err === "object" &&
      err !== null &&
      "resourceType" in err &&
      (err as OperationOutcome).resourceType === "OperationOutcome"
    );
  };

  const getErrorMessage = (): string => {
    if (isOperationOutcome(error)) {
      const firstIssue = error.issue[0];
      return (
        firstIssue?.details?.text ||
        firstIssue?.diagnostics ||
        `${firstIssue?.severity}: ${firstIssue?.code}`
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  };

  const getSeverityConfig = (severity: OperationOutcomeIssue["severity"]) => {
    switch (severity) {
      case "fatal":
      case "error":
        return {
          icon: XCircle,
          color: "text-error",
          bgColor: "bg-error/10",
          borderColor: "border-error/20",
          badge: "critical" as const,
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/20",
          badge: "warning" as const,
        };
      case "information":
        return {
          icon: Info,
          color: "text-info",
          bgColor: "bg-info/10",
          borderColor: "border-info/20",
          badge: "ghost" as const,
        };
    }
  };

  const copyError = () => {
    const errorText = isOperationOutcome(error)
      ? JSON.stringify(error, null, 2)
      : error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack}`
        : String(error);

    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // For simple errors
  if (!isOperationOutcome(error)) {
    return (
      <div
        className={cn(
          "bg-error/10 border border-error/20 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-error">{title}</h4>
            <p className="text-sm text-base-content/70 mt-1">
              {getErrorMessage()}
            </p>
            {error instanceof Error && error.stack && (
              <details className="mt-3">
                <summary className="text-xs text-base-content/50 cursor-pointer">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs font-mono text-base-content/60 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyError}>
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For FHIR OperationOutcome
  const primaryIssue = error.issue[0];
  const config = getSeverityConfig(primaryIssue?.severity || "error");
  const PrimaryIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <PrimaryIcon
            className={cn("w-5 h-5 mt-0.5 shrink-0", config.color)}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={cn("font-medium", config.color)}>{title}</h4>
              <Badge variant={config.badge} size="xs">
                {primaryIssue?.severity || "error"}
              </Badge>
            </div>
            <p className="text-sm text-base-content/70 mt-1">
              {getErrorMessage()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyError}>
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details */}
      {error.issue.length > 0 && (
        <div className="border-t border-base-300/30">
          <button
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-base-content/60 hover:bg-base-200/50 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>
              {error.issue.length} issue{error.issue.length !== 1 ? "s" : ""} in
              OperationOutcome
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="px-4 pb-4 space-y-3">
              {error.issue.map((issue, index) => {
                const issueConfig = getSeverityConfig(issue.severity);
                const IssueIcon = issueConfig.icon;

                return (
                  <div
                    key={index}
                    className="bg-base-100/50 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <IssueIcon className={cn("w-4 h-4", issueConfig.color)} />
                      <Badge variant={issueConfig.badge} size="xs">
                        {issue.severity}
                      </Badge>
                      <span className="text-sm font-mono text-base-content/70">
                        {issue.code}
                      </span>
                    </div>

                    {issue.details?.text && (
                      <p className="text-sm">{issue.details.text}</p>
                    )}

                    {issue.diagnostics && (
                      <pre className="text-xs font-mono bg-base-200 p-2 rounded overflow-x-auto">
                        {issue.diagnostics}
                      </pre>
                    )}

                    {issue.expression && issue.expression.length > 0 && (
                      <div className="text-xs">
                        <span className="text-base-content/50">
                          Expression:{" "}
                        </span>
                        <span className="font-mono">
                          {issue.expression.join(", ")}
                        </span>
                      </div>
                    )}

                    {issue.location && issue.location.length > 0 && (
                      <div className="text-xs">
                        <span className="text-base-content/50">Location: </span>
                        <span className="font-mono">
                          {issue.location.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
