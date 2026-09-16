"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white font-sans">
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CampusSphere System Error
            </h1>
            <p className="text-sm text-slate-400">
              A critical application error occurred. Click below to reinitialize the workspace.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-500">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-all cursor-pointer"
          >
            Reinitialize Application
          </button>
        </div>
      </body>
    </html>
  );
}
