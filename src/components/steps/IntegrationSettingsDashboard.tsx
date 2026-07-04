'use client';

import React, { useState, useEffect } from 'react';
import { ExternalSystem } from '@/lib/integrations/integration-schema';

interface IntegrationSettingsDashboardProps {
  system: ExternalSystem;
}

export function IntegrationSettingsDashboard({ system }: IntegrationSettingsDashboardProps) {
  const [status, setStatus] = useState<any>(null);
  const [token, setToken] = useState('');

  const fetchStatus = async () => {
    const res = await fetch(`/api/integrations/auth?system=${system}`);
    if (res.ok) setStatus(await res.json());
  };

  useEffect(() => {
    fetchStatus();
  }, [system]);

  const handleConnect = async () => {
    await fetch('/api/integrations/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'connect_pat', system, token })
    });
    setToken('');
    fetchStatus();
  };

  const handleDisconnect = async () => {
    await fetch('/api/integrations/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', system })
    });
    fetchStatus();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-4">Integration Settings: {system}</h2>
      
      {status?.hasToken ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
          <p className="font-semibold mb-2">Connected successfully</p>
          <p className="text-sm opacity-80 mb-4">Type: {status.type}</p>
          <button 
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-md">
          <p className="text-gray-600 dark:text-gray-400">Connect to {system} using a Personal Access Token.</p>
          <input 
            type="password" 
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter PAT Token..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
