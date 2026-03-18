import React, { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

export default function Attendance() {
  const { orgId } = useAuth();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterDays, setFilterDays] = useState(7);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ worker_id: '', check_in: '', check_out: '' });

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

  const handleManualAdd = async () => {
    if (!orgId || !addForm.worker_id || !addForm.check_in) return;
    try {
      await api.createWorkSession(orgId, {
        worker_id: addForm.worker_id,
        check_in: addForm.check_in,
        check_out: addForm.check_out || undefined,
      });
      addToast('Registo adicionado com sucesso', 'success');
      setShowAdd(false);
      setAddForm({ worker_id: '', check_in: '', check_out: '' });
      load();
    } catch (err: any) {
      addToast(err.message || 'Erro ao adicionar registo', 'error');
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ponto Eletrónico</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

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
        <SkeletonTable rows={6} cols={4} />
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

      {/* Manual Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Registo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                <select
                  value={addForm.worker_id}
                  onChange={e => setAddForm(f => ({ ...f, worker_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Selecionar colaborador...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                <input
                  type="datetime-local"
                  value={addForm.check_in}
                  onChange={e => setAddForm(f => ({ ...f, check_in: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saída (opcional)</label>
                <input
                  type="datetime-local"
                  value={addForm.check_out}
                  onChange={e => setAddForm(f => ({ ...f, check_out: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleManualAdd}
                disabled={!addForm.worker_id || !addForm.check_in}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddForm({ worker_id: '', check_in: '', check_out: '' }); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
