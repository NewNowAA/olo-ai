import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import * as api from '../../services/api';
import type { Sector } from '../../types';

const SECTORS: { value: Sector; label: string; icon: string }[] = [
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'clinica', label: 'Clínica / Saúde', icon: '🏥' },
  { value: 'salao', label: 'Salão de Beleza', icon: '💇' },
  { value: 'farmacia', label: 'Farmácia', icon: '💊' },
  { value: 'hotel', label: 'Hotel / Alojamento', icon: '🏨' },
  { value: 'academia', label: 'Academia / Ginásio', icon: '💪' },
  { value: 'advogado', label: 'Advocacia / Jurídico', icon: '⚖️' },
  { value: 'oficina', label: 'Oficina / Auto', icon: '🔧' },
  { value: 'loja', label: 'Loja / Comércio', icon: '🛍️' },
  { value: 'generico', label: 'Outro', icon: '📦' },
];

export default function Onboarding() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<Record<string, any>>({});
  
  const [data, setData] = useState({
    business_name: '', sector: 'generico' as Sector,
    agent_name: '', agent_tone: 'profissional',
    agent_greeting: '', agent_system_prompt: '',
    absence_message: '', first_contact_message: '',
    quick_replies: [] as Array<{trigger: string, response: string}>,
    hours: Array.from({ length: 7 }, (_, i) => ({ day: i, open: '09:00', close: '18:00', closed: i === 0 })),
    products: [{ name: '', price: 0 }],
  });

  React.useEffect(() => {
    api.getSectorTemplates().then(setTemplates).catch(console.error);
  }, []);

  const next = async () => {
    if (!orgId) return;
    // Save at each step
    if (step === 0) await api.updateOrg(orgId, { business_name: data.business_name, name: data.business_name }).catch(() => {});
    if (step === 1) await api.updateOrg(orgId, { sector: data.sector }).catch(() => {});
    if (step === 2) {
      await api.updateOrg(orgId, { 
        agent_name: data.agent_name, 
        agent_tone: data.agent_tone,
        agent_greeting: data.agent_greeting,
        agent_system_prompt: data.agent_system_prompt,
        absence_message: data.absence_message,
        first_contact_message: data.first_contact_message
      }).catch(() => {});
    }
    if (step === 3) {
      const hours = data.hours.map(h => ({ day_of_week: h.day, open_time: h.open, close_time: h.close, is_closed: h.closed }));
      await api.updateBusinessHours(orgId, hours).catch(() => {});
    }
    if (step === 4) {
      for (const p of data.products.filter(p => p.name.trim())) {
        await api.createCatalogItem(orgId, { name: p.name, price: p.price, is_available: true }).catch(() => {});
      }
      for (const qr of data.quick_replies) {
        await api.createQuickReply(orgId, { trigger_words: [qr.trigger], response: qr.response }).catch(() => {});
      }
    }
    if (step === 5) {
      await api.updateOrg(orgId, { setup_progress: 100 }).catch(() => {});
      navigate('/app/dashboard');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSectorSelect = (sector: Sector) => {
    const tpl = templates[sector] || templates.generico;
    
    // Process templates with current business name
    const greeting = tpl?.greeting?.replace(/\{BUSINESS_NAME\}/g, data.business_name || 'nossa loja') || '';
    const absence = tpl?.absence_message?.replace(/\{BUSINESS_NAME\}/g, data.business_name || '')
                                        ?.replace(/\{HOURS\}/g, 'o nosso horário') || '';
    const firstContact = tpl?.first_contact_message?.replace(/\{BUSINESS_NAME\}/g, data.business_name || '')
                                                   ?.replace(/\{AGENT_NAME\}/g, tpl.agent_name_suggestion || 'Assistente') || '';
    const prompt = tpl?.system_prompt_template?.replace(/\{BUSINESS_NAME\}/g, data.business_name || '')
                                              ?.replace(/\{AGENT_NAME\}/g, tpl.agent_name_suggestion || 'Assistente') || '';
                                              
    const categoriesAsProducts = (tpl?.suggested_categories || []).map((c: string) => ({ name: c, price: 0 }));
    
    setData(d => ({ 
      ...d, 
      sector,
      agent_name: tpl?.agent_name_suggestion || d.agent_name,
      agent_tone: tpl?.agent_tone || d.agent_tone,
      agent_greeting: greeting,
      agent_system_prompt: prompt,
      absence_message: absence,
      first_contact_message: firstContact,
      quick_replies: tpl?.suggested_quick_replies || [],
      products: categoriesAsProducts.length > 0 ? categoriesAsProducts : [{ name: '', price: 0 }]
    }));
  };

  const steps = [
    // Step 0: Business name
    <div key={0} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Qual é o nome do teu negócio?</h2>
      <input type="text" value={data.business_name} onChange={e => setData(d => ({ ...d, business_name: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg" placeholder="Ex: Restaurante Kizomba" autoFocus />
    </div>,

    // Step 1: Sector
    <div key={1} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Que tipo de negócio é?</h2>
      <div className="grid grid-cols-2 gap-3">
        {SECTORS.map(s => (
          <button key={s.value} onClick={() => handleSectorSelect(s.value)} className={`p-4 rounded-lg border-2 text-center transition-colors ${data.sector === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="font-medium text-sm text-gray-900">{s.label}</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Agent
    <div key={2} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Como queres que o atendente se chame?</h2>
      <input type="text" value={data.agent_name} onChange={e => setData(d => ({ ...d, agent_name: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ex: Ana" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tom de voz</label>
        <input type="text" value={data.agent_tone} onChange={e => setData(d => ({ ...d, agent_tone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="profissional, amigável, informal..." />
      </div>
    </div>,

    // Step 3: Hours
    <div key={3} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Qual é o horário de funcionamento?</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-10 text-sm font-medium text-gray-700">{day}</span>
            <input type="checkbox" checked={!data.hours[i].closed} onChange={e => setData(d => { const h = [...d.hours]; h[i] = { ...h[i], closed: !e.target.checked }; return { ...d, hours: h }; })} />
            <input type="time" value={data.hours[i].open} onChange={e => setData(d => { const h = [...d.hours]; h[i] = { ...h[i], open: e.target.value }; return { ...d, hours: h }; })} disabled={data.hours[i].closed} className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30" />
            <span className="text-gray-400">—</span>
            <input type="time" value={data.hours[i].close} onChange={e => setData(d => { const h = [...d.hours]; h[i] = { ...h[i], close: e.target.value }; return { ...d, hours: h }; })} disabled={data.hours[i].closed} className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30" />
          </div>
        ))}
      </div>
    </div>,

    // Step 4: Products
    <div key={4} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Adiciona pelo menos 3 produtos/serviços</h2>
      {data.products.map((p, i) => (
        <div key={i} className="flex gap-2">
          <input type="text" value={p.name} onChange={e => setData(d => { const ps = [...d.products]; ps[i] = { ...ps[i], name: e.target.value }; return { ...d, products: ps }; })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={`Produto ${i + 1}`} />
          <input type="number" value={p.price || ''} onChange={e => setData(d => { const ps = [...d.products]; ps[i] = { ...ps[i], price: +e.target.value }; return { ...d, products: ps }; })} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Preço" />
        </div>
      ))}
      <button onClick={() => setData(d => ({ ...d, products: [...d.products, { name: '', price: 0 }] }))} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Adicionar mais</button>
    </div>,

    // Step 5: Done
    <div key={5} className="text-center space-y-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-bold text-gray-900">Tudo pronto!</h2>
      <p className="text-gray-500">O teu atendente IA está configurado e pronto a usar.</p>
    </div>,
  ];

  return (
    <div className="max-w-lg mx-auto py-8">
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {steps[step]}

      <div className="mt-8 flex justify-between">
        {step > 0 && step < 5 && (
          <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Voltar</button>
        )}
        <button onClick={next} className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          {step === 5 ? <><Check size={16} /> Ir para o Dashboard</> : <>Continuar <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
