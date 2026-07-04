import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function KnowledgeDashboard() {
  const setCurrentStep = useAppStore(state => state.setCurrentStep);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState<'ALL' | 'TEST' | 'DEV' | 'PROD'>('ALL');

  const USER_FACING_CHUNKS = ["GOAL", "REQUIREMENT", "USER_STORY", "METRIC", "PRD_METADATA", "EPIC", "ROADMAP", "RELEASE_PLAN", "TASK", "SPRINT", "CAPACITY_PLAN", "RISK_REPORT", "READINESS_REPORT"];


  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 overflow-y-auto">
      <header className="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 tracking-tight">Organizational Memory</h1>
          <p className="text-sm text-gray-500 mt-1">Explore past PRDs, reused requirements, and organizational standards.</p>
        </div>
        <button onClick={() => setCurrentStep('input')} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to Generation
        </button>
      </header>

      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-gray-500 italic">Loading knowledge...</p>
        ) : (
          <div className="space-y-8 max-w-4xl">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Indexed Documents ({data?.docs?.filter((d: any) => envFilter === 'ALL' || d.environment === envFilter).length || 0})</h2>
                <select 
                  value={envFilter} 
                  onChange={(e) => setEnvFilter(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
                >
                  <option value="ALL">All Environments</option>
                  <option value="PROD">Production</option>
                  <option value="DEV">Development</option>
                  <option value="TEST">Test</option>
                </select>
              </div>
              <div className="grid gap-4">
                {data?.docs?.filter((d: any) => envFilter === 'ALL' || d.environment === envFilter).map((doc: any, index: number) => (
                  <div key={`${doc.id}-${index}`} className="p-4 border border-gray-200 rounded shadow-sm bg-gray-50">
                    <h3 className="font-semibold">{doc.title}</h3>
                    <div className="text-xs text-gray-500 mt-2 flex gap-4">
                      <span className="bg-gray-200 px-2 py-1 rounded">Type: {doc.type}</span>
                      <span className="bg-gray-200 px-2 py-1 rounded">Env: {doc.environment || 'PROD'}</span>
                      <span className="text-gray-400 py-1">Source ID: {doc.sourceId}</span>
                    </div>
                  </div>
                ))}
                {(!data?.docs || data.docs.length === 0) && (
                  <p className="text-sm text-gray-500">No documents indexed yet.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4">Most Reused Requirements</h2>
              <div className="grid gap-4">
                {data?.chunks?.filter((c: any) => c.usageCount > 0 && USER_FACING_CHUNKS.includes(c.chunkType)).sort((a: any, b: any) => b.usageCount - a.usageCount).map((chunk: any, index: number) => (
                  <div key={`${chunk.id}-${index}`} className="p-4 border border-gray-200 rounded shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">{chunk.chunkType}</span>
                      <span className="text-xs text-blue-600 font-bold">{chunk.usageCount} reuses</span>
                    </div>
                    <p className="text-sm mt-2">{chunk.content}</p>
                    <div className="text-xs text-gray-400 mt-2">Confidence: {chunk.sourceConfidence}</div>
                  </div>
                ))}
                {(!data?.chunks || data.chunks.filter((c: any) => c.usageCount > 0 && USER_FACING_CHUNKS.includes(c.chunkType)).length === 0) && (
                  <p className="text-sm text-gray-500">No requirements reused yet.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
