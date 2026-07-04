"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ReliabilityDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/telemetry')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats', err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading Telemetry Data...</p>
      </div>
    </AppLayout>
  );

  if (!stats) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <p className="text-red-400">Failed to load telemetry.</p>
      </div>
    </AppLayout>
  );

  const correctionRatePct = (stats.aiCorrectionRate * 100).toFixed(1);
  const healthScore = (stats.healthScore ?? 100).toFixed(1);
  const retryRatePct = ((stats.correctionsByType?.RESEARCH_RETRY || 0) + (stats.correctionsByType?.CONSENSUS_RETRY || 0)) / Math.max(1, stats.totalGenerations) * 100;

  return (
    <AppLayout>
      <div className="p-8 space-y-8 max-w-7xl mx-auto text-white">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            AI Reliability Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Real-time metrics on platform-level self-healing and model compliance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="p-6 bg-[#1a1c23] border border-[#2d303a] rounded-xl flex flex-col justify-between">
            <h3 className="text-gray-400 font-medium">AI Health Score</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${Number(healthScore) >= 90 ? 'text-green-400' : Number(healthScore) > 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                {healthScore}
              </span>
            </div>
            {stats.penalties && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-500">Validation: <span className="text-red-400">-{stats.penalties.validationPenalty.toFixed(1)}</span></div>
                <div className="text-gray-500">Retry: <span className="text-yellow-400">-{stats.penalties.retryPenalty.toFixed(1)}</span></div>
                <div className="text-gray-500">Correction: <span className="text-blue-400">-{stats.penalties.correctionPenalty.toFixed(1)}</span></div>
                <div className="text-gray-500">Latency: <span className="text-purple-400">-{stats.penalties.latencyPenalty.toFixed(1)}</span></div>
              </div>
            )}
          </div>

          <div className="p-6 bg-[#1a1c23] border border-[#2d303a] rounded-xl flex flex-col justify-between">
            <h3 className="text-gray-400 font-medium">AI Correction Rate</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-400">{correctionRatePct}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Corrections / Total Generations</p>
          </div>

          <div className="p-6 bg-[#1a1c23] border border-[#2d303a] rounded-xl flex flex-col justify-between">
            <h3 className="text-gray-400 font-medium">Retry Rate</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-yellow-400">{retryRatePct.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Retries / Total Generations</p>
          </div>

          <div className="p-6 bg-[#1a1c23] border border-[#2d303a] rounded-xl flex flex-col justify-between">
            <h3 className="text-gray-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Critical Escapes
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${(stats.criticalEscapes ?? 0) > 0 ? 'text-red-500' : 'text-green-400'}`}>
                {stats.criticalEscapes ?? 0}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Uncorrected failures reaching users</p>
          </div>

          <div className="p-6 bg-[#1a1c23] border border-[#2d303a] rounded-xl flex flex-col justify-between">
            <h3 className="text-gray-400 font-medium">Avg Generation Latency</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-400">
                {(stats.averageLatencyMs / 1000).toFixed(2)}s
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Per generation step</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1c23] border border-[#2d303a] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Top Failure Sources (Corrections by Type)
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.correctionsByType || {}).sort(([,a]: any, [,b]: any) => b - a).map(([type, count]: any) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{type.replace(/_/g, ' ').toLowerCase()}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-[#2d303a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-400/80 rounded-full" 
                        style={{ width: `${Math.min(100, (count / Math.max(1, stats.totalCorrections)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-mono text-gray-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.correctionsByType || {}).length === 0 && (
                <p className="text-sm text-gray-500">No corrections recorded yet.</p>
              )}
            </div>
          </div>

          <div className="bg-[#1a1c23] border border-[#2d303a] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Corrections by Stage
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.correctionsByStage || {}).sort(([,a]: any, [,b]: any) => b - a).map(([stage, count]: any) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-gray-300">{stage}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-[#2d303a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400/80 rounded-full" 
                        style={{ width: `${Math.min(100, (count / Math.max(1, stats.totalCorrections)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-mono text-gray-400 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.correctionsByStage || {}).length === 0 && (
                <p className="text-sm text-gray-500">No corrections recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
