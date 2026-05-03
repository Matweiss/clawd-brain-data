"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type ActionBarProps = {
  granolaMeetingId: string;
  status: string | null;
  onAnalyzingStart: () => void;
};

export function ActionBar({
  granolaMeetingId,
  status,
  onAnalyzingStart,
}: ActionBarProps) {
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const isAnalyzing = status === "analyzing" || reanalyzing;

  async function handleReanalyze() {
    setReanalyzing(true);
    setReanalyzeError(null);
    try {
      const res = await fetch(
        `/api/meetings/${granolaMeetingId}/reanalyze`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onAnalyzingStart();
    } catch (e) {
      setReanalyzeError((e as Error).message);
    } finally {
      setReanalyzing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleReanalyze}
        disabled={isAnalyzing}
        className={cn(
          "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-capwide transition-colors",
          isAnalyzing
            ? "border-ember-500/40 bg-ember-500/5 text-ember-500"
            : "border-ink-600 text-bone-200 hover:border-ember-500/60 hover:text-bone-50"
        )}
      >
        {isAnalyzing ? "Analyzing…" : "Re-analyze"}
      </button>

      <button
        type="button"
        disabled
        title="Available in Phase 3"
        className="cursor-not-allowed border border-ink-700 px-3 py-1.5 font-mono text-[11px] uppercase tracking-capwide text-bone-500"
      >
        Push to Notion
      </button>

      {reanalyzeError && (
        <span className="font-mono text-[11px] text-status-blocked">
          {reanalyzeError}
        </span>
      )}
    </div>
  );
}
