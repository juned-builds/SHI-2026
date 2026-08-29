import React from "react";
import { ShieldCheck } from "lucide-react";
import { PageContainer } from "../layout/PageContainer";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";

export function SettingsView() {
  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Configure workspace preferences, AI processing engines, and export formatting."
        badge="System"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation / Overview Column */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Configuration Sections
            </h3>
            <ul className="space-y-1 text-sm font-medium">
              <li className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 shadow-xs flex items-center justify-between">
                <span>General Workspace</span>
                <Badge variant="secondary">Active</Badge>
              </li>
              <li className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 flex items-center justify-between">
                <span>AI Engine Defaults</span>
                <span className="text-[10px] text-slate-400">Module 0.4</span>
              </li>
              <li className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 flex items-center justify-between">
                <span>Export & Formats</span>
                <span className="text-[10px] text-slate-400">Module 0.8</span>
              </li>
            </ul>
          </Card>

          {/* System Architecture Badge */}
          <Card className="p-4 bg-emerald-50/50 border-emerald-200/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-emerald-900">Local-First Architecture</p>
                <p className="text-emerald-700 leading-relaxed">
                  No remote cloud locks or external database dependencies. Your source documents remain local.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Forms Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Workspace Settings Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workspace Environment</CardTitle>
                <Badge variant="outline">Local</Badge>
              </div>
              <CardDescription>
                Basic parameters for project management and local execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Workspace Name"
                defaultValue="SIH 26154 Content Intelligence"
                disabled
                helperText="Fixed for local execution environment"
              />
              <Input
                label="Backend Service Host"
                defaultValue="http://localhost:8000"
                disabled
                helperText="FastAPI local backend URL"
              />
            </CardContent>
          </Card>

          {/* AI Transformation Defaults Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transformation Engine</CardTitle>
                <Badge variant="secondary">Upcoming (Module 0.4)</Badge>
              </div>
              <CardDescription>
                Multimodal AI model parameters and extraction prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-500">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-700">Planned Deliverable Generators:</p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside text-slate-600">
                  <li>Executive Summaries & Briefs</li>
                  <li>LinkedIn & Social Media Posts</li>
                  <li>Official Advisories & Circulars</li>
                  <li>Presentation Decks (Slides + Speaker Notes)</li>
                  <li>Video Scripts & Storyboards</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
