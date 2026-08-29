import React from "react";
import { Menu, HelpCircle } from "lucide-react";

export interface TopbarProps {
  onOpenMobile: () => void;
  title?: string;
  breadcrumbs?: { label: string; id?: string }[];
  onNavigate?: (route: string) => void;
}

export function Topbar({ onOpenMobile, title, breadcrumbs, onNavigate }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left side: Mobile trigger & Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {crumb.id && onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(crumb.id!)}
                      className="hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-slate-900 font-semibold">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : (
            <h1 className="text-sm font-semibold text-slate-900">{title || "Workspace"}</h1>
          )}
        </div>
      </div>

      {/* Right side: Status, Help & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* System Status */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Engine Active</span>
        </div>

        {/* Documentation / Info */}
        <button
          type="button"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="SIH 26154 Documentation"
          aria-label="Help and Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
