import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; id?: string }[];
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export function AppShell({
  children,
  title,
  breadcrumbs,
  currentRoute,
  onNavigate,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Topbar */}
        <Topbar
          onOpenMobile={() => setIsMobileOpen(true)}
          title={title}
          breadcrumbs={breadcrumbs}
          onNavigate={onNavigate}
        />

        {/* Content View */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
