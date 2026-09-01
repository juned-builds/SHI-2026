import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  History as HistoryIcon,
  Library,
  Presentation,
  Share2,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const workspaceNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    id: "history",
    label: "History",
    icon: HistoryIcon,
  },
];

const libraryNavItems: NavItem[] = [
  {
    id: "library",
    label: "All Deliverables",
    icon: Library,
  },
  {
    id: "library/presentations",
    label: "Presentations",
    icon: Presentation,
  },
  {
    id: "library/social",
    label: "Social Posts",
    icon: Share2,
  },
  {
    id: "library/briefs",
    label: "Briefs & Summaries",
    icon: FileText,
  },
  {
    id: "library/advisories",
    label: "Field Advisories",
    icon: ShieldCheck,
  },
];

const intelligenceNavItems: NavItem[] = [
  {
    id: "intelligence/factmesh",
    label: "FactMesh™ Audit",
    icon: ShieldCheck,
  },
  {
    id: "intelligence/audiencelens",
    label: "AudienceLens™",
    icon: Users,
  },
];

const systemNavItems: NavItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const isNavActive = (id: string) => {
    if (id === "dashboard") return currentRoute === "dashboard";
    if (id === "projects") return currentRoute === "projects" || currentRoute.startsWith("projects/");
    if (id === "history") return currentRoute === "history" || currentRoute.startsWith("history/");
    if (id === "library") return currentRoute === "library" || currentRoute === "library/all";
    if (id === "settings") return currentRoute === "settings";
    return currentRoute === id;
  };

  const renderNavLinks = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(item.id);

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-white" : "text-slate-500"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20" : "md:w-64"} w-64`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              onNavigate("dashboard");
              onCloseMobile();
            }}
            className={`flex items-center gap-2.5 text-slate-900 font-bold tracking-tight overflow-hidden cursor-pointer ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  TransformAI
                </span>
              </div>
            )}
          </button>

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {/* Workspace Group */}
          <div>
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Workspace
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}
            {renderNavLinks(workspaceNavItems)}
          </div>

          {/* Library Group */}
          <div>
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Library
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}
            {renderNavLinks(libraryNavItems)}
          </div>

          {/* Intelligence Group */}
          <div>
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Intelligence
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}
            {renderNavLinks(intelligenceNavItems)}
          </div>

          {/* System Group */}
          <div>
            {!isCollapsed ? (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                System
              </p>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}
            {renderNavLinks(systemNavItems)}
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex items-center justify-end px-3 py-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User Profile Badge */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={`flex items-center gap-3 p-2 rounded-lg ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-300">
              WS
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  Local Workspace
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Local-First Engine
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
