import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, Info } from "lucide-react";
import { FactMeshClaimStatus } from "../../../types";

export interface ClaimStatusBadgeProps {
  status: FactMeshClaimStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function ClaimStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: ClaimStatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  switch (status) {
    case "verified":
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses} ${className}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />}
          Verified
        </span>
      );
    case "inferred":
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses} ${className}`}
        >
          {showIcon && <HelpCircle className={`${iconSize} text-blue-600 shrink-0`} />}
          Inferred
        </span>
      );
    case "unsupported":
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200 animate-pulse ${sizeClasses} ${className}`}
        >
          {showIcon && <AlertTriangle className={`${iconSize} text-rose-600 shrink-0`} />}
          Unsupported
        </span>
      );
    case "not_a_fact":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 ${sizeClasses} ${className}`}
        >
          {showIcon && <Info className={`${iconSize} text-slate-500 shrink-0`} />}
          Editorial
        </span>
      );
  }
}
