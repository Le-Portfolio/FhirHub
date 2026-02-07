"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Key,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Shield,
} from "@/components/ui/icons";

interface TokenData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  idToken?: string;
  refreshToken?: string;
  patient?: string;
  encounter?: string;
}

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

interface TokenInspectorProps {
  tokenData: TokenData | null;
  className?: string;
}

export function TokenInspector({ tokenData, className }: TokenInspectorProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!tokenData) {
    return (
      <div
        className={cn(
          "bg-base-100 rounded-xl border border-base-200 p-6",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-base-200 rounded-lg">
            <Key className="w-5 h-5 text-base-content/50" />
          </div>
          <div>
            <h3 className="font-semibold">Token Inspector</h3>
            <p className="text-sm text-base-content/60">
              No active token - launch a session to inspect tokens
            </p>
          </div>
        </div>
      </div>
    );
  }

  const b64decode = (str: string) => {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
  };

  const decodeJWT = (token: string): DecodedJWT | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      return {
        header: JSON.parse(b64decode(parts[0])),
        payload: JSON.parse(b64decode(parts[1])),
        signature: parts[2],
      };
    } catch {
      return null;
    }
  };

  const accessTokenDecoded = decodeJWT(tokenData.accessToken);
  const idTokenDecoded = tokenData.idToken
    ? decodeJWT(tokenData.idToken)
    : null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isExpired = (exp: number) => {
    return Date.now() > exp * 1000;
  };

  return (
    <div
      className={cn("bg-base-100 rounded-xl border border-base-200", className)}
    >
      <div className="p-6 border-b border-base-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Key className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Token Inspector</h3>
              <p className="text-sm text-base-content/60">
                Decoded JWT token information
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? "Show Decoded" : "Show Raw"}
            {showRaw ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Token Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-base-200 rounded-lg">
            <p className="text-xs text-base-content/60">Token Type</p>
            <p className="font-medium">{tokenData.tokenType}</p>
          </div>
          <div className="p-3 bg-base-200 rounded-lg">
            <p className="text-xs text-base-content/60">Expires In</p>
            <p className="font-medium">{tokenData.expiresIn}s</p>
          </div>
          {tokenData.patient && (
            <div className="p-3 bg-base-200 rounded-lg">
              <p className="text-xs text-base-content/60">Patient Context</p>
              <p className="font-medium font-mono text-sm">
                {tokenData.patient}
              </p>
            </div>
          )}
          {tokenData.encounter && (
            <div className="p-3 bg-base-200 rounded-lg">
              <p className="text-xs text-base-content/60">Encounter Context</p>
              <p className="font-medium font-mono text-sm">
                {tokenData.encounter}
              </p>
            </div>
          )}
        </div>

        {/* Access Token */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Access Token
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(tokenData.accessToken, "access")}
            >
              {copiedField === "access" ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {showRaw ? (
            <pre className="bg-base-200 p-4 rounded-lg text-xs font-mono overflow-x-auto">
              {tokenData.accessToken}
            </pre>
          ) : (
            accessTokenDecoded && (
              <div className="space-y-3">
                <TokenSection title="Header" data={accessTokenDecoded.header} />
                <TokenSection
                  title="Payload"
                  data={accessTokenDecoded.payload}
                  formatTimestamp={formatTimestamp}
                  isExpired={isExpired}
                />
              </div>
            )
          )}
        </div>

        {/* ID Token */}
        {tokenData.idToken && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="w-4 h-4" />
                ID Token
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tokenData.idToken!, "id")}
              >
                {copiedField === "id" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {showRaw ? (
              <pre className="bg-base-200 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                {tokenData.idToken}
              </pre>
            ) : (
              idTokenDecoded && (
                <div className="space-y-3">
                  <TokenSection title="Header" data={idTokenDecoded.header} />
                  <TokenSection
                    title="Payload"
                    data={idTokenDecoded.payload}
                    formatTimestamp={formatTimestamp}
                    isExpired={isExpired}
                  />
                </div>
              )
            )}
          </div>
        )}

        {/* Refresh Token */}
        {tokenData.refreshToken && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Refresh Token</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(tokenData.refreshToken!, "refresh")
                }
              >
                {copiedField === "refresh" ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <pre className="bg-base-200 p-4 rounded-lg text-xs font-mono overflow-x-auto">
              {tokenData.refreshToken}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

interface TokenSectionProps {
  title: string;
  data: Record<string, unknown>;
  formatTimestamp?: (ts: number) => string;
  isExpired?: (ts: number) => boolean;
}

function TokenSection({
  title,
  data,
  formatTimestamp,
  isExpired,
}: TokenSectionProps) {
  return (
    <div className="bg-base-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-base-300 font-medium text-sm">{title}</div>
      <div className="p-4">
        <dl className="space-y-2 text-sm">
          {Object.entries(data).map(([key, value]) => {
            const isTimestamp = ["exp", "iat", "nbf", "auth_time"].includes(
              key
            );
            const expired =
              key === "exp" &&
              isExpired &&
              typeof value === "number" &&
              isExpired(value);

            return (
              <div key={key} className="flex items-start gap-4">
                <dt className="font-mono text-base-content/60 w-32 shrink-0">
                  {key}
                </dt>
                <dd className="font-mono flex-1 break-all">
                  {isTimestamp &&
                  typeof value === "number" &&
                  formatTimestamp ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-base-content/50" />
                      {formatTimestamp(value)}
                      {expired && (
                        <Badge variant="warning" size="xs" icon={AlertTriangle}>
                          Expired
                        </Badge>
                      )}
                    </span>
                  ) : typeof value === "object" ? (
                    JSON.stringify(value)
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
