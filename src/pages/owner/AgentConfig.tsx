import React, { useState, useEffect } from 'react';
import { Save, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';

export default function AgentConfig() {
  const { orgId } = useAuth();
  const [form, setForm] = useState({
    agent_name: '', agent_tone: '', agent_greeting: '',
    agent_system_prompt: '', sector: 'generico',
    absence_message: '', first_contact_message: ''
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sectorsTemplates, setSectorsTemplates] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    
    Promise.all([
      api.getOrg(orgId),
      api.getSectorTemplates()
    ]).then(([org, templates]) => {
      setForm({
        agent_name: org.agent_name || '',
        agent_tone: org.agent_tone || '',
        agent_greeting: org.agent_greeting || '',
        agent_system_prompt: org.agent_system_prompt || '',
        sector: org.sector || 'generico',
        absence_message: org.absence_message || '',
        first_contact_message: org.first_contact_message || ''
      });
      setSectorsTemplates(templates);
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

  // Quick Replies have been migrated elsewhere

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
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, agent_tone: 'amigavel' }))}
                className={`py-2 px-1 text-sm rounded-lg border text-center transition-colors ${form.agent_tone === 'amigavel' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Amigável
              </button>
              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, agent_tone: 'intermedio' }))}
                className={`py-2 px-1 text-sm rounded-lg border text-center transition-colors ${form.agent_tone === 'intermedio' || !form.agent_tone ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Intermédio
              </button>
              <button 
                type="button"
                onClick={() => setForm(f => ({ ...f, agent_tone: 'profissional' }))}
                className={`py-2 px-1 text-sm rounded-lg border text-center transition-colors ${form.agent_tone === 'profissional' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Profissional
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select 
              value={form.sector} 
              onChange={e => {
                const newSector = e.target.value;
                setForm(f => {
                  const updates = { ...f, sector: newSector };
                  if (sectorsTemplates && sectorsTemplates[newSector]) {
                    if (!f.first_contact_message) updates.first_contact_message = sectorsTemplates[newSector].first_contact_message;
                    if (!f.absence_message) updates.absence_message = sectorsTemplates[newSector].absence_message;
                  }
                  return updates;
                });
              }} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="restaurante">🍽️ Restaurante</option>
              <option value="clinica">🏥 Clínica</option>
              <option value="salao">💇 Salão</option>
              <option value="farmacia">💊 Farmácia</option>
              <option value="hotel">🏨 Hotel/Alojamento</option>
              <option value="academia">🏋️ Academia</option>
              <option value="advogado">⚖️ Advogado</option>
              <option value="oficina">🔧 Oficina</option>
              <option value="loja">🛍️ Loja/Retalho</option>
              <option value="generico">📦 Genérico</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
              Avançado
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instruções personalizadas (substitui comportamento padrão do setor)</label>
                <p className="text-xs text-amber-600 font-medium mb-1">⚠️ Alterar isto afeta profundamente o comportamento do agente</p>
                <textarea value={form.agent_system_prompt} onChange={e => setForm(f => ({ ...f, agent_system_prompt: e.target.value }))} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none" placeholder="Escreva as instruções para a IA..." />
              </div>
            )}
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

      {/* Upsell Placeholder Card */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 relative overflow-hidden mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Upsell & Marketing Automático</h2>
          </div>
          <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded text-xs font-bold uppercase">Em breve</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 max-w-2xl">
          Configure mensagens automáticas de upsell: o agente sugere produtos ou promoções em momentos estratégicos da conversa.
        </p>
        <ul className="text-sm text-gray-500 space-y-2 list-disc list-inside opacity-70">
          <li>Upsell pós-marcação</li>
          <li>Promoção sazonal automatizada</li>
          <li>Recuperação de carrinho e contatos pendentes</li>
        </ul>
      </div>
    </div>
  );
}
