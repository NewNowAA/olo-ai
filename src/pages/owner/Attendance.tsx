import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

export default function Attendance() {
  const { orgId } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterDays, setFilterDays] = useState(7);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const dateFrom = new Date(Date.now() - filterDays * 86400000).toISOString();
      const [sessionsData, workersData] = await Promise.all([
        api.getWorkSessions(orgId, { worker_id: filterWorker || undefined, date_from: dateFrom }),
        api.getWorkers(orgId),
      ]);
      setSessions(sessionsData || []);
      setWorkers(workersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orgId, filterWorker, filterDays]);

  const calcDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return null;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const totalMs = sessions
    .filter(s => s.check_out)
    .reduce((acc, s) => acc + (new Date(s.check_out).getTime() - new Date(s.check_in).getTime()), 0);
  const totalH = Math.floor(totalMs / 3600000);
  const totalM = Math.floor((totalMs % 3600000) / 60000);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ponto Eletrónico</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterWorker}
          onChange={e => setFilterWorker(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os colaboradores</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select
          value={filterDays}
          onChange={e => setFilterDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={14}>Últimos 14 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </select>
      </div>

      {/* Summary */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Turnos registados</p>
            <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Total de horas</p>
            <p className="text-2xl font-bold text-gray-900">{totalH}h {totalM}min</p>
          </div>
        </div>
      )}

      {/* Sessions table */}
      {loading ? (
        <p className="text-gray-500 text-sm">A carregar...</p>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock size={48} className="mx-auto mb-3 opacity-40" />
          <p>Sem registos no período selecionado</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Colaborador</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Entrada</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Saída</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(session => {
                const dur = calcDuration(session.check_in, session.check_out);
                const checkInDate = new Date(session.check_in);
                const checkOutDate = session.check_out ? new Date(session.check_out) : null;
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {session.workers?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{checkInDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</div>
                      <div className="text-xs text-gray-400">{checkInDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {checkOutDate ? (
                        <>
                          <div>{checkOutDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}</div>
                          <div className="text-xs text-gray-400">{checkOutDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Em curso</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {dur || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
