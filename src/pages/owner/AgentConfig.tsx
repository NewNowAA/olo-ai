import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

export default function AgentConfig() {
  const { orgId } = useAuth();
  const [form, setForm] = useState({
    agent_name: '', agent_tone: '', agent_greeting: '',
    agent_system_prompt: '', sector: 'generico',
    absence_message: '', first_contact_message: ''
  });
  
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [newQr, setNewQr] = useState({ trigger: '', response: '' });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    
    Promise.all([
      api.getOrg(orgId),
      api.getQuickReplies(orgId)
    ]).then(([org, qrs]) => {
      setForm({
        agent_name: org.agent_name || '',
        agent_tone: org.agent_tone || '',
        agent_greeting: org.agent_greeting || '',
        agent_system_prompt: org.agent_system_prompt || '',
        sector: org.sector || 'generico',
        absence_message: org.absence_message || '',
        first_contact_message: org.first_contact_message || ''
      });
      setQuickReplies(qrs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updateOrg(orgId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQr = async () => {
    if (!orgId || !newQr.trigger.trim() || !newQr.response.trim()) return;
    try {
      const created = await api.createQuickReply(orgId, { 
        trigger_words: [newQr.trigger.trim().toLowerCase()], 
        response: newQr.response 
      });
      setQuickReplies([created, ...quickReplies]);
      setNewQr({ trigger: '', response: '' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-gray-500">A carregar...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração do Agente IA</h1>
        <p className="text-gray-600">Personalize o comportamento, mensagens automáticas e respostas rápidas do seu atendente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Core Persona */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Persona Base</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do atendente</label>
            <input type="text" value={form.agent_name} onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Ana" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tom de voz</label>
            <input type="text" value={form.agent_tone} onChange={e => setForm(f => ({ ...f, agent_tone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="profissional, amigável..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="restaurante">🍽️ Restaurante</option>
              <option value="clinica">🏥 Clínica</option>
              <option value="salao">💇 Salão</option>
              <option value="generico">📦 Genérico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt personalizado</label>
            <p className="text-xs text-gray-400 mb-1">Instruções para personalizar o comportamento do agente.</p>
            <textarea value={form.agent_system_prompt} onChange={e => setForm(f => ({ ...f, agent_system_prompt: e.target.value }))} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none" />
          </div>
        </div>

        {/* Right Column: Messages */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Mensagens Padrão</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1º Contacto Novo Cliente</label>
              <textarea value={form.first_contact_message} onChange={e => setForm(f => ({ ...f, first_contact_message: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm resize-none" placeholder="Bem-vindo! Como posso ajudar?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saudação Inicial (Cliente Habitual)</label>
              <textarea value={form.agent_greeting} onChange={e => setForm(f => ({ ...f, agent_greeting: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="Olá de novo! Como posso ajudar?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem Fora do Horário</label>
              <textarea value={form.absence_message} onChange={e => setForm(f => ({ ...f, absence_message: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-orange-300 bg-orange-50 rounded-lg text-sm resize-none" placeholder="Estamos fechados. Deixe mensagem." />
            </div>

            <div className="pt-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save size={16} /> {saving ? 'A guardar...' : 'Guardar Alterações'}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium mt-2 block">✓ Alterações guardadas com sucesso.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Replies Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Respostas Rápidas (Sem IA)</h2>
        <p className="text-sm text-gray-600 mb-4">Quando o cliente enviar uma mensagem que contenha o Trigger (palavra-chave), o sistema responde instantaneamente com a Resposta definida, sem usar o Gemini.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input type="text" value={newQr.trigger} onChange={e => setNewQr({ ...newQr, trigger: e.target.value })} placeholder="Palavra trigger (ex: wifi)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input type="text" value={newQr.response} onChange={e => setNewQr({ ...newQr, response: e.target.value })} placeholder="Resposta (ex: A rede é X...)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2" />
          <button onClick={handleAddQr} disabled={!newQr.trigger || !newQr.response} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 md:col-span-3">
            <Plus size={16} /> Adicionar Resposta Rápida
          </button>
        </div>

        <div className="space-y-3">
          {quickReplies.length === 0 ? (
           <p className="text-sm text-gray-500 italic text-center py-4">Nenhuma resposta rápida configurada.</p>
          ) : (
            quickReplies.map(qr => (
              <div key={qr.id} className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-bold font-mono">
                      {qr.trigger_words?.[0]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{qr.response}</p>
                </div>
                {/* Delete function not yet implemented in API, so hidden for now or just visual */}
                <button className="text-gray-400 hover:text-red-500 p-2" title="Em breve">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
