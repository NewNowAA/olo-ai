import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Users, 
  Bell, 
  Globe, 
  Moon, 
  Smartphone,
  Check,
  Plus,
  Shield,
  Zap,
  Bot,
  Sun,
  Building2,
  Save,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { organizationService, Organization } from '../services/organizationService';
import { userService, UserProfile } from '../services/userService';
import { supabase } from '../services/supabase/client';
import { Modal } from './common/Modal/Modal';
import toast from 'react-hot-toast';

interface SettingsProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  aiFrequency: string;
  setAiFrequency: (freq: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleDarkMode, aiFrequency, setAiFrequency }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing' | 'preferences' | 'company'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New states for Telegram token generation
  const [generatingToken, setGeneratingToken] = useState(false);
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [telegramTokenExpiry, setTelegramTokenExpiry] = useState<Date | null>(null);

  // Data States
  const [org, setOrg] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  // Form States (for optimistic updates)
  const [orgForm, setOrgForm] = useState({ 
    name: '', 
    sector: '', 
    description: '',
    tax_id: '',
    fiscal_address: '',
    employee_range: ''
  });
  const [profileForm, setProfileForm] = useState({ 
    full_name: '', 
    email: '',
    mobile_number: '',
    whatsapp_id: '',
    telegram_id: ''
  });

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer', fullName: '', phone: '' });
  const [inviting, setInviting] = useState(false);

  // Upgrade / Manual Payment Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  // Preference States
  const [currencyForm, setCurrencyForm] = useState('AOA');
  const [languageForm, setLanguageForm] = useState('pt');
  const [notificationsForm, setNotificationsForm] = useState({
      email: true,
      push: true,
      marketing: false
  });

  useEffect(() => {
    // Load local preferences
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) setLanguageForm(savedLang);
    
    const savedNotifs = localStorage.getItem('app_notifications');
    if (savedNotifs) setNotificationsForm(JSON.parse(savedNotifs));
    
    loadData();
  }, []);

  useEffect(() => {
    // Persist local preferences
    localStorage.setItem('app_language', languageForm);
    localStorage.setItem('app_notifications', JSON.stringify(notificationsForm));
  }, [languageForm, notificationsForm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await userService.getCurrentProfile();
      if (userProfile) {
        setProfile(userProfile);

        setProfileForm({ 
            full_name: userProfile.full_name, 
            email: userProfile.email,
            mobile_number: userProfile.mobile_number || '',
            whatsapp_id: userProfile.whatsapp_id || '',
            telegram_id: userProfile.telegram_id || ''
        });

        // Check if there is an active telegram link token
        if (userProfile.link_token && userProfile.token_expires_at) {
            const expiryDate = new Date(userProfile.token_expires_at);
            if (expiryDate > new Date()) {
                setTelegramToken(userProfile.link_token);
                setTelegramTokenExpiry(expiryDate);
            } else {
                // Clean up expired token
                await supabase.from('users').update({
                    link_token: null,
                    token_expires_at: null
                }).eq('id', userProfile.id);
            }
        }

        if (userProfile.org_id) {
          const [orgData, teamData] = await Promise.all([
            organizationService.getOrganization(userProfile.org_id),
            userService.getTeamMembers(userProfile.org_id)
          ]);
          setOrg(orgData);
          if (orgData) {
            setOrgForm({
              name: orgData.name,
              sector: orgData.sector || '',
              description: orgData.objective_description || '',
              tax_id: orgData.tax_id || '',
              fiscal_address: orgData.fiscal_address || '',
              employee_range: orgData.employee_range || ''
            });
            // Set currency from Org
            if (orgData.currency_default) {
                setCurrencyForm(orgData.currency_default);
            }
          }
          setTeamMembers(teamData);
        }
      }
    } catch (error) {
      console.error("Error loading settings data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await organizationService.updateOrganization(org.id, {
        name: orgForm.name,
        sector: orgForm.sector,
        objective_description: orgForm.description,
        tax_id: orgForm.tax_id,
        fiscal_address: orgForm.fiscal_address,
        employee_range: orgForm.employee_range
      });
      // Refresh local state
      setOrg({ 
          ...org, 
          name: orgForm.name, 
          sector: orgForm.sector, 
          objective_description: orgForm.description,
          tax_id: orgForm.tax_id,
          fiscal_address: orgForm.fiscal_address,
          employee_range: orgForm.employee_range
      });
      console.log('Configurações da empresa atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar empresa.', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await userService.updateProfile(profile.id, {
        full_name: profileForm.full_name,
        mobile_number: profileForm.mobile_number,

        whatsapp_id: profileForm.whatsapp_id,
        telegram_id: profileForm.telegram_id
      });
      setProfile({ 
          ...profile, 
          full_name: profileForm.full_name,
          mobile_number: profileForm.mobile_number,
          whatsapp_id: profileForm.whatsapp_id,
          telegram_id: profileForm.telegram_id
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar perfil.', error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setSaving(true);
    try {
        // Update Currency in Org if exists
        if (org) {
            await organizationService.updateOrganization(org.id, {
                currency_default: currencyForm
            });
            // Update local org state
            setOrg({ ...org, currency_default: currencyForm });
        }
        
        // Language and Notifications are persisted via useEffect/localStorage
        // We could also save to User Profile if needed
        
        console.log('Preferências salvas com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar preferências.', error);
    } finally {
        setSaving(false);
    }
  };

  const handleGenerateTelegramToken = async () => {
    if (!profile) return;
    setGeneratingToken(true);
    try {
        // Generate a random 8-character uppercase alphanumeric token
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < 8; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Expiry time (e.g., 15 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        const { error } = await supabase
            .from('users')
            .update({ 
                link_token: token,
                token_expires_at: expiresAt.toISOString()
            })
            .eq('id', profile.id);

        if (error) throw error;

        setTelegramToken(token);
        setTelegramTokenExpiry(expiresAt);
        toast.success("Código Telegram gerado com sucesso! É válido por 15 minutos.");

    } catch (error) {
        console.error("Error generating Telegram token", error);
        toast.error("Erro ao gerar código do Telegram.");
    } finally {
        setGeneratingToken(false);
    }
};

  const handleInviteUser = async () => {
      if (!profile?.org_id) return;
      setInviting(true);
      try {
          await userService.inviteUser({
              email: inviteForm.email,
              role: inviteForm.role,
              fullName: inviteForm.fullName,
              phone: inviteForm.phone,
              org_id: profile.org_id
          });
          console.log(`Convite enviado para ${inviteForm.email}`);
          setIsInviteModalOpen(false);
          setInviteForm({ email: '', role: 'viewer', fullName: '', phone: '' });
          loadData(); // Refresh list
      } catch (error: any) {
          console.error(`Erro ao convidar: ${error.message}`);
      } finally {
          setInviting(false);
      }
  };

  const openUpgradeModal = (planName: string, price: string) => {
    setSelectedPlan({ name: planName, price });
    setIsUpgradeModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copiado para a área de transferência!');
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gerencie sua conta, time e preferências.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
              <button onClick={() => setActiveTab('company')} className={`p-4 rounded-xl text-left flex items-center gap-3 transition-all ${activeTab === 'company' ? 'bg-[#73c6df] text-white shadow-md' : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Building2 size={18} /> <span className="font-bold text-sm whitespace-nowrap">Empresa</span>
              </button>
              <button onClick={() => setActiveTab('team')} className={`p-4 rounded-xl text-left flex items-center gap-3 transition-all ${activeTab === 'team' ? 'bg-[#73c6df] text-white shadow-md' : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Users size={18} /> <span className="font-bold text-sm whitespace-nowrap">Time e Membros</span>
              </button>
              <button onClick={() => setActiveTab('billing')} className={`p-4 rounded-xl text-left flex items-center gap-3 transition-all ${activeTab === 'billing' ? 'bg-[#73c6df] text-white shadow-md' : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <CreditCard size={18} /> <span className="font-bold text-sm whitespace-nowrap">Planos e Fatura</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`p-4 rounded-xl text-left flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-[#73c6df] text-white shadow-md' : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <User size={18} /> <span className="font-bold text-sm whitespace-nowrap">Meu Perfil</span>
              </button>
              <button onClick={() => setActiveTab('preferences')} className={`p-4 rounded-xl text-left flex items-center gap-3 transition-all ${activeTab === 'preferences' ? 'bg-[#73c6df] text-white shadow-md' : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <Globe size={18} /> <span className="font-bold text-sm whitespace-nowrap">Preferências</span>
              </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2.5rem] p-8 min-h-[600px]">
              
              {loading ? (
                <div className="flex h-full items-center justify-center">
                   <Loader2 className="animate-spin text-[#73c6df]" size={40} />
                </div>
              ) : (
                <>
                  {/* COMPANY TAB */}
                  {activeTab === 'company' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dados da Empresa</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Informações usadas pela IA para gerar conselhos.</p>
                       </div>
                       
                       <div className="space-y-4 max-w-2xl">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome da Empresa</label>
                              <input 
                                type="text" 
                                value={orgForm.name}
                                onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Setor / Nicho</label>
                              <input 
                                type="text" 
                                value={orgForm.sector}
                                onChange={(e) => setOrgForm({...orgForm, sector: e.target.value})}
                                placeholder="Ex: E-commerce de Moda, Consultoria TI..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Descrição do Negócio</label>
                              <textarea 
                                value={orgForm.description}
                                onChange={(e) => setOrgForm({...orgForm, description: e.target.value})}
                                rows={4}
                                placeholder="Descreva o que sua empresa faz, seus principais objetivos e desafios..."
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white resize-none" 
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">NIF (Tax ID)</label>
                                  <input 
                                    type="text" 
                                    value={orgForm.tax_id}
                                    onChange={(e) => setOrgForm({...orgForm, tax_id: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nº Funcionários</label>
                                  <select 
                                    value={orgForm.employee_range}
                                    onChange={(e) => setOrgForm({...orgForm, employee_range: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white"
                                  >
                                      <option value="">Selecione...</option>
                                      <option value="1-10">1-10</option>
                                      <option value="11-50">11-50</option>
                                      <option value="51-200">51-200</option>
                                      <option value="200+">200+</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Endereço Fiscal</label>
                              <input 
                                type="text" 
                                value={orgForm.fiscal_address}
                                onChange={(e) => setOrgForm({...orgForm, fiscal_address: e.target.value})}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                              />
                          </div>

                          <button 
                            onClick={handleUpdateOrg}
                            disabled={saving}
                            className="px-6 py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center gap-2"
                          >
                            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                            Salvar Alterações
                          </button>
                       </div>
                    </div>
                  )}

                  {/* INVITE MODAL */}
                  <Modal
                      isOpen={isInviteModalOpen && activeTab === 'team'}
                      onClose={() => setIsInviteModalOpen(false)}
                      title="Convidar Membro"
                      size="md"
                  >
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Email</label>
                              <input 
                                  type="email" 
                                  value={inviteForm.email}
                                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                                  placeholder="colega@empresa.com"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nome Completo</label>
                              <input 
                                  type="text" 
                                  value={inviteForm.fullName}
                                  onChange={e => setInviteForm({...inviteForm, fullName: e.target.value})}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                                  placeholder="João Silva"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Telefone</label>
                                  <input 
                                      type="tel" 
                                      value={inviteForm.phone}
                                      onChange={e => setInviteForm({...inviteForm, phone: e.target.value})}
                                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                                      placeholder="+244..."
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Função</label>
                                  <select 
                                      value={inviteForm.role}
                                      onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                                  >
                                      <option value="viewer">Leitor (Viewer)</option>
                                      <option value="editor">Editor</option>
                                      <option value="admin">Administrador</option>
                                  </select>
                              </div>
                          </div>
                          <button 
                              onClick={handleInviteUser}
                              disabled={inviting}
                              className="w-full py-4 bg-[#2e8ba6] text-white font-bold rounded-xl hover:bg-[#257a91] flex justify-center items-center gap-2 mt-4"
                          >
                              {inviting ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                              Enviar Convite
                          </button>
                      </div>
                  </Modal>

                  {/* UPGRADE MODAL (MANUAL PAYMENT) */}
                  <Modal
                      isOpen={isUpgradeModalOpen && activeTab === 'billing' && !!selectedPlan}
                      onClose={() => setIsUpgradeModalOpen(false)}
                      title={`Upgrade: ${selectedPlan?.name}`}
                      size="md"
                  >
                      {selectedPlan && (
                          <div className="space-y-6">
                              <div className="text-center">
                                  <p className="text-slate-600 dark:text-slate-300 mb-2">Para ativar seu plano de <strong>{selectedPlan.name}</strong>, faça uma transferência bancária:</p>
                                  <div className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{selectedPlan.price}</div>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Entidade Bancária</label>
                                      <p className="font-bold text-slate-800 dark:text-gray-200">Banco Angolano (TBD)</p>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">IBAN</label>
                                      <div className="flex items-center gap-3">
                                          <code className="text-lg font-mono font-bold text-[#2e8ba6] bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 select-all">
                                              AO06 . . . (Provide Full IBAN Here)
                                          </code>
                                          <button 
                                            onClick={() => copyToClipboard("AO06...")}
                                            className="p-2 text-slate-400 hover:text-[#2e8ba6] transition-colors" 
                                            title="Copiar IBAN"
                                          >
                                              <Copy size={20} />
                                          </button>
                                      </div>
                                      <p className="text-xs text-red-400 mt-1">* aguardando dados reais do cliente</p>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Beneficiário</label>
                                      <p className="font-bold text-slate-800 dark:text-gray-200">InvoiceApp Lda</p>
                                  </div>
                              </div>

                              <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                                  <div className="mt-0.5 text-blue-500"><ExternalLink size={16} /></div>
                                  <div>
                                      <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">Próximo Passo:</p>
                                      <p>Envie o comprovativo de transferência para <strong className="text-blue-600 dark:text-blue-300">financeiro@invoiceapp.com</strong> ou via WhatsApp, indicando o nome da sua empresa.</p>
                                      <p className="mt-2 text-xs opacity-80">Sua conta será atualizada em até 24h úteis.</p>
                                  </div>
                              </div>

                              <button 
                                  onClick={() => setIsUpgradeModalOpen(false)}
                                  className="w-full py-4 bg-[#2e8ba6] text-white font-bold rounded-xl hover:bg-[#257a91] shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
                              >
                                  Entendi, farei isso
                              </button>
                          </div>
                      )}
                  </Modal>

                  {activeTab === 'team' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="flex justify-between items-center">
                              <div>
                                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Membros da Equipe</h2>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Convide colegas para colaborar no mesmo painel.</p>
                              </div>
                              <button 
                                onClick={() => setIsInviteModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl bg-[#2e8ba6] text-white font-bold text-sm hover:bg-[#257a91] transition-all flex items-center gap-2"
                              >
                                  <Plus size={18} /> Convidar Membro
                              </button>
                          </div>

                          <div className="space-y-4">
                              {teamMembers.map((member) => (
                                  <div key={member.id} className="bg-white/60 dark:bg-slate-700/60 p-4 rounded-2xl flex items-center justify-between border border-white/60 dark:border-slate-600 shadow-sm">
                                      <div className="flex items-center gap-4">
                                          {member.avatar_url ? (
                                              <img src={member.avatar_url} alt={member.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-600" />
                                          ) : (
                                              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 border-2 border-white dark:border-slate-500 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                                                  {member.full_name?.substring(0,2).toUpperCase() || 'NA'}
                                              </div>
                                          )}
                                          <div>
                                              <h4 className="font-bold text-slate-800 dark:text-white">
                                                {member.full_name} 
                                                {member.id === profile?.id && <span className="text-[10px] bg-[#73c6df]/20 text-[#2e8ba6] px-2 py-0.5 rounded-full ml-2">VOCÊ</span>}
                                              </h4>
                                              <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${member.status?.toLowerCase() === 'active' ? 'bg-[#8bd7bf]/20 text-[#4ca68a]' : 'bg-slate-100 text-slate-500'}`}>
                                              {member.status || 'Active'}
                                          </span>
                                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                              {member.user_role || 'Member'}
                                          </span>
                                          {/* Only show remove for others if current user is admin (logic simplified) */}
                                          {member.id !== profile?.id && <button className="text-rose-400 hover:text-rose-600 font-bold text-xs" onClick={() => console.log('Feature em desenvolvimento')}>Remover</button>}
                                      </div>
                                  </div>
                              ))}
                              {teamMembers.length === 0 && <p className="text-slate-500">Nenhum membro encontrado.</p>}
                          </div>

                          <div className="p-6 bg-[#73c6df]/10 dark:bg-[#73c6df]/5 rounded-2xl border border-[#73c6df]/20 flex gap-4 items-start">
                               <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-[#2e8ba6] shadow-sm"><Shield size={20} /></div>
                               <div>
                                   <h4 className="font-bold text-[#2e8ba6] text-sm">Segurança do Time</h4>
                                   <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                                       Administradores têm acesso total. Editores podem criar faturas mas não podem alterar configurações de faturamento. Viewers só podem visualizar dashboards.
                                   </p>
                               </div>
                          </div>
                      </div>
                  )}


                  {/* BILLING TAB */}
                  {activeTab === 'billing' && (
                       <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Planos e Assinaturas</h2>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Escolha o plano ideal para o seu negócio.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Starter Plan */}
                              <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col hover:border-[#73c6df] transition-all group">
                                  <div className="mb-4">
                                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider">Starter</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Grátis</h3>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1">Para freelancers e microempreendedores que estão começando.</p>
                                  
                                  <ul className="space-y-3 mb-8">
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>Até 5 faturas/mês</span></li>
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>1 Usuário</span></li>
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>Relatórios Básicos</span></li>
                                  </ul>

                                  <button onClick={() => console.log('Seu plano atual.')} className="w-full py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Plano Atual</button>
                              </div>

                              {/* Pro Plan */}
                              <div className="p-6 rounded-[2rem] bg-[#2e8ba6] text-white relative overflow-hidden flex flex-col shadow-xl transform md:-translate-y-4">
                                  <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={100} /></div>
                                  <div className="mb-4 relative z-10">
                                      <span className="text-xs font-bold bg-[#73c6df] text-slate-900 px-3 py-1 rounded-full uppercase tracking-wider">Mais Popular</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold mb-2 relative z-10">$29<span className="text-lg text-white/70 font-medium">/mês</span></h3>
                                  <p className="text-white/80 text-sm mb-6 flex-1 relative z-10">Para empresas em crescimento que precisam de automação.</p>
                                  
                                  <ul className="space-y-3 mb-8 relative z-10">
                                      <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Faturas Ilimitadas</span></li>
                                      <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Até 5 Usuários</span></li>
                                      <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Consultor IA Avançado</span></li>
                                      <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Exportação PDF/CSV</span></li>
                                  </ul>

                                  <button onClick={() => openUpgradeModal('Pro', '$29/mês')} className="w-full py-3 bg-white text-[#2e8ba6] rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg relative z-10">Fazer Upgrade</button>
                              </div>

                              {/* Enterprise Plan */}
                              <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col hover:border-[#73c6df] transition-all">
                                  <div className="mb-4">
                                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider">Enterprise</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Custom</h3>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1">Para grandes organizações com necessidades específicas.</p>
                                  
                                  <ul className="space-y-3 mb-8">
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>Usuários Ilimitados</span></li>
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>API Dedicada</span></li>
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>Audit Logs</span></li>
                                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="text-[#73c6df]" /> <span>Gerente de Conta</span></li>
                                  </ul>

                                  <button onClick={() => openUpgradeModal('Enterprise', 'Sob Consulta')} className="w-full py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Contactar Vendas</button>
                              </div>
                          </div>
                       </div>
                  )}

              {/* PREFERENCES TAB (Technical / Caching) */}
              {activeTab === 'preferences' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Preferências do Sistema</h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Personalize sua experiência.</p>
                      </div>

                      <div className="space-y-6">
                           
                           {/* Region & Language */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Moeda Principal</label>
                                   <select 
                                     value={currencyForm}
                                     onChange={(e) => setCurrencyForm(e.target.value)}
                                     className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white"
                                   >
                                       <option value="AOA">Kwanza (AOA)</option>
                                       <option value="EUR">Euro (EUR)</option>
                                       <option value="USD">Dólar (USD)</option>
                                       <option value="BRL">Real (BRL)</option>
                                   </select>
                                   <p className="text-[10px] text-slate-400 mt-1">Afeta a exibição em todo o sistema.</p>
                               </div>

                               <div>
                                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Idioma</label>
                                   <select 
                                     value={languageForm}
                                     onChange={(e) => setLanguageForm(e.target.value)}
                                     className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white"
                                   >
                                       <option value="pt">Português</option>
                                       <option value="en">English (Beta)</option>
                                       <option value="es">Español (Beta)</option>
                                   </select>
                               </div>
                           </div>

                           {/* Notifications */}
                           <div className="space-y-4">
                               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Notificações</label>
                               
                               <div className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-700/40 rounded-xl border border-white/40 dark:border-slate-600">
                                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Resumo Semanal por Email</span>
                                   <input 
                                     type="checkbox" 
                                     checked={notificationsForm.email}
                                     onChange={(e) => setNotificationsForm({...notificationsForm, email: e.target.checked})}
                                     className="w-5 h-5 accent-[#2e8ba6]" 
                                   />
                               </div>
                               <div className="flex items-center justify-between p-3 bg-white/40 dark:bg-slate-700/40 rounded-xl border border-white/40 dark:border-slate-600">
                                   <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Alertas de Pagamento (Push)</span>
                                   <input 
                                     type="checkbox" 
                                     checked={notificationsForm.push}
                                     onChange={(e) => setNotificationsForm({...notificationsForm, push: e.target.checked})}
                                     className="w-5 h-5 accent-[#2e8ba6]" 
                                   />
                               </div>
                           </div>

                           <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button 
                                     onClick={handleUpdatePreferences}
                                     disabled={saving}
                                     className="px-6 py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center gap-2"
                                   >
                                     {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                     Salvar Preferências
                                </button>
                           </div>
                           
                           {/* Dark Mode Toggle */}
                           <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-700/60 rounded-2xl border border-white/60 dark:border-slate-600">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-slate-100 dark:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300">
                                       {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-slate-800 dark:text-white">Modo Escuro</h4>
                                       <p className="text-xs text-slate-500 dark:text-slate-400">
                                           Alterne entre temas claro e escuro.
                                       </p>
                                   </div>
                               </div>
                               <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        name="toggle-dark" 
                                        id="toggle-dark" 
                                        checked={darkMode}
                                        onChange={toggleDarkMode}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-[#73c6df]" 
                                    />
                                    <label htmlFor="toggle-dark" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer checked:bg-[#73c6df]"></label>
                                </div>
                           </div>
                           
                           {/* AI Frequency Selector */}
                           <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/60 dark:bg-slate-700/60 rounded-2xl border border-white/60 dark:border-slate-600 gap-4">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-slate-100 dark:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300"><Bot size={20} /></div>
                                   <div>
                                       <h4 className="font-bold text-slate-800 dark:text-white">Frequência da IA</h4>
                                       <p className="text-xs text-slate-500 dark:text-slate-400">
                                           Com que frequência a IA deve analisar seus KPIs.
                                       </p>
                                   </div>
                               </div>
                               <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                   {['realtime', 'daily', 'weekly'].map((freq) => (
                                       <button
                                          key={freq}
                                          onClick={() => setAiFrequency(freq)}
                                          className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${aiFrequency === freq ? 'bg-white dark:bg-slate-600 text-[#2e8ba6] shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                       >
                                           {freq === 'realtime' ? 'Tempo Real' : freq === 'daily' ? 'Diário' : 'Semanal'}
                                       </button>
                                   ))}
                               </div>
                           </div>

                           {/* Cache Toggle */}
                           <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-700/60 rounded-2xl border border-white/60 dark:border-slate-600">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-slate-100 dark:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300"><Smartphone size={20} /></div>
                                   <div>
                                       <h4 className="font-bold text-slate-800 dark:text-white">Cache Local</h4>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                                           Salvar visualizações no navegador para carregamento instantâneo.
                                       </p>
                                   </div>
                               </div>
                               <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-[#73c6df]" defaultChecked />
                                    <label className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-600 cursor-pointer checked:bg-[#73c6df]"></label>
                                </div>
                           </div>

                      </div>
                  </div>
              )}
               
               {/* PROFILE TAB */}
               {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
                      <div className="relative inline-block">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-lg mx-auto" />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white dark:border-slate-700 shadow-lg mx-auto flex items-center justify-center text-4xl font-bold text-slate-400">
                                {profile?.full_name?.substring(0,2).toUpperCase() || 'ME'}
                            </div>
                          )}
                          <button className="absolute bottom-0 right-0 p-2 bg-[#73c6df] text-white rounded-full shadow-md hover:bg-[#5fb397]"><User size={16}/></button>
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-4">{profile?.full_name}</h2>
                      <p className="text-slate-500 dark:text-slate-400">{profile?.email} • {profile?.user_role}</p>
                      
                      <div className="max-w-md mx-auto mt-8 space-y-4 text-left">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                              <input 
                                type="text" 
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Telemóvel</label>
                                  <input 
                                    type="tel" 
                                    value={profileForm.mobile_number}
                                    onChange={(e) => setProfileForm({...profileForm, mobile_number: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white"
                                    placeholder="+244..."
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">WhatsApp ID</label>
                                  <input 
                                    type="text" 
                                    value={profileForm.whatsapp_id}
                                    onChange={(e) => setProfileForm({...profileForm, whatsapp_id: e.target.value})}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white"
                                    placeholder="Ex: 244923..."
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Integração Telegram</label>
                              <div className="flex gap-4 items-center">
                                  {telegramToken ? (
                                      <>
                                          <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-emerald-500/30 dark:border-emerald-500/30 rounded-xl dark:text-white flex justify-between items-center">
                                            <div>
                                              <span className="text-xs text-slate-500 block mb-1">CÓDIGO DE LIGAÇÃO</span>
                                              <span className="font-mono font-bold tracking-widest text-lg text-emerald-600 dark:text-emerald-400">{telegramToken}</span>
                                            </div>
                                            {telegramTokenExpiry && (
                                              <div className="text-right">
                                                 <span className="text-[10px] text-slate-400 block uppercase">Expira às</span>
                                                 <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{telegramTokenExpiry.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              </div>
                                            )}
                                          </div>
                                          <a 
                                            href={`https://t.me/Lumea_ia_bot?start=${telegramToken}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-4 bg-[#2AABEE] text-white rounded-xl font-bold hover:bg-[#229ED9] transition-colors shadow-sm whitespace-nowrap flex items-center gap-2 h-full"
                                          >
                                              Abrir Telegram
                                          </a>
                                      </>
                                  ) : (
                                    <>
                                        <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-slate-400 text-sm flex items-center">
                                            Nenhum código gerado.
                                        </div>
                                        <button 
                                            onClick={handleGenerateTelegramToken}
                                            disabled={generatingToken}
                                            className="px-6 py-3 bg-[#2AABEE] text-white rounded-xl font-bold hover:bg-[#229ED9] transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
                                        >
                                            {generatingToken ? <Loader2 className="animate-spin" size={16}/> : null}
                                            Gerar Código Telegram
                                        </button>
                                    </>
                                  )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2">
                                  {telegramToken 
                                      ? "Clique no botão ou envie a mensagem '/start CODIGO' no Telegram. Este código expira em 15 minutos." 
                                      : "Gere um código seguro temporário para vincular o seu Telegram ao aplicativo."}
                              </p>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email</label>
                              <input 
                                type="text" 
                                value={profileForm.email} 
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" 
                                disabled 
                              />
                          </div>
                          <button 
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="w-full py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91] flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 className="animate-spin" size={18}/> : null}
                            Salvar Alterações
                          </button>
                      </div>
                  </div>
               )}

                </>
              )}
          </div>
      </div>
    </div>
  );
};

export default Settings;