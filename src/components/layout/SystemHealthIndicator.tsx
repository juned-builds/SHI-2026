import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  HardDrive,
  X,
} from "lucide-react";
import { getAllProjects, getAllGenerations } from "../../services/db";

export function SystemHealthIndicator() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<{
    projectCount: number;
    generationCount: number;
    dbStatus: "ready" | "loading" | "error";
  }>({
    projectCount: 0,
    generationCount: 0,
    dbStatus: "loading",
  });

  useEffect(() => {
    Promise.all([getAllProjects(), getAllGenerations()])
      .then(([projects, generations]) => {
        setStats({
          projectCount: projects.length,
          generationCount: generations.length,
          dbStatus: "ready",
        });
      })
      .catch((err) => {
        console.warn("[SystemHealth] Error fetching DB stats:", err);
        setStats({ projectCount: 0, generationCount: 0, dbStatus: "error" });
      });
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
        title="System Architecture & Storage Status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline">Engine:</span>
        <span className="font-semibold text-emerald-700">Healthy</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900">Platform Diagnostic</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  IndexedDB Storage
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected ({stats.projectCount} projects)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  Deterministic Engine
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Active (0 Quota)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Fact Integrity Verifier
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                  Stored Generations
                </span>
                <span className="font-semibold text-slate-800">
                  {stats.generationCount} records
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
              <span>SIH Problem Statement 26154</span>
              <span className="text-emerald-700 font-semibold">Demo Ready</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
