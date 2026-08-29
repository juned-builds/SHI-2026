import Link from "next/link";
import { ArrowRight, Sparkles, FolderKanban, Settings, Layers, FileText, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-xl w-full p-8 sm:p-10 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
        {/* Module Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Module 0.2: Core UI Shell & Navigation</span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Content Transformation Platform
          </h1>
          <p className="text-sm font-medium text-slate-500">
            SIH 2026 Problem Statement 26154
          </p>
        </div>

        {/* Core Product Concept Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
            Central Architectural Concept
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-medium text-slate-700">
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] text-slate-400 uppercase">Input</span>
              One Source
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] text-slate-400 uppercase">Analysis</span>
              Understanding
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] text-slate-400 uppercase">Config</span>
              Transform Rules
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] text-slate-400 uppercase">Outputs</span>
              Multi-Deliverable
            </div>
          </div>
        </div>

        {/* Action Button to Enter Workspace */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <span>Open Application Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation Quicklinks */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <span>•</span>
          <Link href="/projects" className="hover:text-slate-900 transition-colors">
            Projects
          </Link>
          <span>•</span>
          <Link href="/settings" className="hover:text-slate-900 transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </main>
  );
}
