import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import * as api from '../../services/api';

export default function DevOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminOrganizations().then(data => { setOrgs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Organizações</h1>
      {loading ? <p className="text-gray-500 text-sm">A carregar...</p> : orgs.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><Building2 size={48} className="mx-auto mb-3 opacity-40" /><p>Nenhuma organização</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Setor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Setup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{org.business_name || org.name}</td>
                  <td className="px-4 py-3 text-gray-500">{org.sector || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${org.setup_progress || 0}%` }} /></div>
                      <span className="text-xs text-gray-500">{org.setup_progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
