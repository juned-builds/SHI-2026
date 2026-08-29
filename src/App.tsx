/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
          Module 0.1: Project Foundation
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Content Transformation Platform
        </h1>
        <p className="text-sm font-medium text-slate-600">
          SIH 26154
        </p>
        <div className="pt-2 border-t border-slate-100">
          <p className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Frontend foundation is running.
          </p>
        </div>
      </div>
    </main>
  );
}

