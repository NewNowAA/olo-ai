import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing' | 'preferences' | 'company'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<'company' | 'profile' | 'preferences' | null>(null);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'APAGAR') return;
    setIsDeleting(true);
    try {
      // Edge Function does ALL cleanup server-side (invoices, goals, org, profile, auth)
      const { error: invokeError } = await supabase.functions.invoke('delete-account');
      
      if (invokeError) {
        console.error('Erro na Edge Function:', invokeError);
        toast.error('Ocorreu um erro no servidor. A forçar o encerramento da sessão...');
      }

      // ALWAYS sign out locally and redirect, even if the Edge Function fails
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deleting account', error);
      toast.error('A forçar o encerramento da sessão...');
      await supabase.auth.signOut();
      window.location.href = '/';
    } finally {
      setIsDeleting(false);
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
        // Gerar UUID válido
        const token = crypto.randomUUID();
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24h, não 15min

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
    } catch (error) {
        console.error(error);
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
    <>
      <style>{`
        .settings-v3-input {
          background: var(--input-bg, rgba(255,255,255,0.04));
          border: 1px solid var(--input-border, rgba(255,255,255,0.09));
          border-radius: 10px;
          color: var(--t1);
          font-size: 12.5px;
          padding: 10px 14px;
          width: 100%;
          transition: border-color 0.2s;
        }
        .settings-v3-input:focus {
          border-color: var(--blue);
          outline: none;
        }
        .settings-v3-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .settings-v3-label {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--t3);
          display: block;
          margin-bottom: 8px;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, var(--blue), rgba(16,66,255,0.85));
          box-shadow: 0 4px 16px rgba(16,66,255,0.25);
          transition: all 0.2s;
        }
        .btn-primary:active {
          transform: scale(0.98);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--t2);
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          color: var(--t1);
          background: var(--card-h);
        }
        .v3-toggle {
          width: 40px;
          height: 22px;
          border-radius: 11px;
          background: rgba(255,255,255,0.1);
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
          display: inline-block;
        }
        .v3-toggle.on {
          background: var(--blue);
        }
        .v3-toggle-knob {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }
        .v3-toggle.on .v3-toggle-knob {
          transform: translateX(18px);
        }
      `}</style>
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
              <button onClick={() => setActiveTab('company')} className={`p-3 rounded-[10px] flex items-center gap-3 transition-all text-sm ${activeTab === 'company' ? 'bg-[rgba(16,66,255,0.08)] text-[var(--blue)] font-semibold border border-[rgba(16,66,255,0.12)]' : 'bg-transparent text-[var(--t2)] hover:bg-[var(--card)] hover:text-[var(--t1)]'}`}>
                  <Building2 size={18} /> <span className="whitespace-nowrap">Empresa</span>
              </button>
              <button onClick={() => setActiveTab('team')} className={`p-3 rounded-[10px] flex items-center gap-3 transition-all text-sm ${activeTab === 'team' ? 'bg-[rgba(16,66,255,0.08)] text-[var(--blue)] font-semibold border border-[rgba(16,66,255,0.12)]' : 'bg-transparent text-[var(--t2)] hover:bg-[var(--card)] hover:text-[var(--t1)]'}`}>
                  <Users size={18} /> <span className="whitespace-nowrap">Time e Membros</span>
              </button>
              <button onClick={() => setActiveTab('billing')} className={`p-3 rounded-[10px] flex items-center gap-3 transition-all text-sm ${activeTab === 'billing' ? 'bg-[rgba(16,66,255,0.08)] text-[var(--blue)] font-semibold border border-[rgba(16,66,255,0.12)]' : 'bg-transparent text-[var(--t2)] hover:bg-[var(--card)] hover:text-[var(--t1)]'}`}>
                  <CreditCard size={18} /> <span className="whitespace-nowrap">Planos e Fatura</span>
              </button>
              <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-[10px] flex items-center gap-3 transition-all text-sm ${activeTab === 'profile' ? 'bg-[rgba(16,66,255,0.08)] text-[var(--blue)] font-semibold border border-[rgba(16,66,255,0.12)]' : 'bg-transparent text-[var(--t2)] hover:bg-[var(--card)] hover:text-[var(--t1)]'}`}>
                  <User size={18} /> <span className="whitespace-nowrap">Meu Perfil</span>
              </button>
              <button onClick={() => setActiveTab('preferences')} className={`p-3 rounded-[10px] flex items-center gap-3 transition-all text-sm ${activeTab === 'preferences' ? 'bg-[rgba(16,66,255,0.08)] text-[var(--blue)] font-semibold border border-[rgba(16,66,255,0.12)]' : 'bg-transparent text-[var(--t2)] hover:bg-[var(--card)] hover:text-[var(--t1)]'}`}>
                  <Globe size={18} /> <span className="whitespace-nowrap">Preferências</span>
              </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-[600px] bg-[var(--card)] border border-[var(--border)] rounded-[16px] backdrop-blur-[12px] p-8">
              
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
                              <label className="settings-v3-label">Nome da Empresa</label>
                              <input 
                                type="text" 
                                value={orgForm.name}
                                onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                                disabled={editingSection !== 'company'}
                                className="settings-v3-input" 
                              />
                          </div>
                          <div>
                              <label className="settings-v3-label">Setor / Nicho</label>
                              <input 
                                type="text" 
                                value={orgForm.sector}
                                onChange={(e) => setOrgForm({...orgForm, sector: e.target.value})}
                                disabled={editingSection !== 'company'}
                                placeholder="Ex: E-commerce de Moda, Consultoria TI..."
                                className="settings-v3-input" 
                              />
                          </div>
                          <div>
                              <label className="settings-v3-label">Descrição do Negócio</label>
                              <textarea 
                                value={orgForm.description}
                                onChange={(e) => setOrgForm({...orgForm, description: e.target.value})}
                                disabled={editingSection !== 'company'}
                                rows={4}
                                placeholder="Descreva o que sua empresa faz, seus principais objetivos e desafios..."
                                className="settings-v3-input resize-none" 
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="settings-v3-label">NIF (Tax ID)</label>
                                  <input 
                                    type="text" 
                                    value={orgForm.tax_id}
                                    onChange={(e) => setOrgForm({...orgForm, tax_id: e.target.value})}
                                    disabled={editingSection !== 'company'}
                                    className="settings-v3-input" 
                                  />
                              </div>
                              <div>
                                  <label className="settings-v3-label">Nº Funcionários</label>
                                  <select 
                                    value={orgForm.employee_range}
                                    onChange={(e) => setOrgForm({...orgForm, employee_range: e.target.value})}
                                    disabled={editingSection !== 'company'}
                                    className="settings-v3-input"
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
                              <label className="settings-v3-label">Endereço Fiscal</label>
                              <input 
                                type="text" 
                                value={orgForm.fiscal_address}
                                onChange={(e) => setOrgForm({...orgForm, fiscal_address: e.target.value})}
                                disabled={editingSection !== 'company'}
                                className="settings-v3-input" 
                              />
                          </div>

                          <div className="flex items-center gap-3 pt-4">
                            {editingSection !== 'company' ? (
                                <button 
                                    onClick={() => setEditingSection('company')} 
                                    className="btn-secondary"
                                >
                                    ✏️ Editar
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={async () => { await handleUpdateOrg(); setEditingSection(null); }}
                                        disabled={saving}
                                        className="btn-primary"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        💾 Guardar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setEditingSection(null);
                                            // Restore from org state
                                            if (org) {
                                                setOrgForm({
                                                    name: org.name,
                                                    sector: org.sector || '',
                                                    description: org.objective_description || '',
                                                    tax_id: org.tax_id || '',
                                                    fiscal_address: org.fiscal_address || '',
                                                    employee_range: org.employee_range || ''
                                                });
                                            }
                                        }} 
                                        className="btn-secondary"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                          </div>
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
                              <label className="settings-v3-label">Email</label>
                              <input 
                                  type="email" 
                                  value={inviteForm.email}
                                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                                  className="settings-v3-input"
                                  placeholder="colega@empresa.com"
                              />
                          </div>
                          <div>
                              <label className="settings-v3-label">Nome Completo</label>
                              <input 
                                  type="text" 
                                  value={inviteForm.fullName}
                                  onChange={e => setInviteForm({...inviteForm, fullName: e.target.value})}
                                  className="settings-v3-input"
                                  placeholder="João Silva"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="settings-v3-label">Telefone</label>
                                  <input 
                                      type="tel" 
                                      value={inviteForm.phone}
                                      onChange={e => setInviteForm({...inviteForm, phone: e.target.value})}
                                      className="settings-v3-input"
                                      placeholder="+244..."
                                  />
                              </div>
                              <div>
                                  <label className="settings-v3-label">Função</label>
                                  <select 
                                      value={inviteForm.role}
                                      onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                                      className="settings-v3-input"
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
                              className="btn-primary w-full mt-4 py-4 text-base"
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
                                  <p className="text-[var(--t2)] mb-2">Para ativar seu plano de <strong>{selectedPlan.name}</strong>, faça uma transferência bancária:</p>
                                  <div className="text-3xl font-bold text-[var(--t1)] mb-2">{selectedPlan.price}</div>
                              </div>

                              <div className="p-6 rounded-2xl border border-dashed border-[var(--border)] space-y-4" style={{ background: 'var(--card-h)' }}>
                                  <div>
                                      <label className="settings-v3-label">Entidade Bancária</label>
                                      <p className="font-bold text-[var(--t1)]">Banco Angolano (TBD)</p>
                                  </div>
                                  <div>
                                      <label className="settings-v3-label">IBAN</label>
                                      <div className="flex items-center gap-3">
                                          <code className="text-lg font-mono font-bold px-3 py-1 rounded-lg border border-[var(--border)] select-all" style={{ color: 'var(--blue)', background: 'var(--card)' }}>
                                              AO06 . . . (Provide Full IBAN Here)
                                          </code>
                                          <button 
                                            onClick={() => copyToClipboard("AO06...")}
                                            className="p-2 transition-colors hover:text-[var(--blue)] text-[var(--t3)]" 
                                            title="Copiar IBAN"
                                          >
                                              <Copy size={20} />
                                          </button>
                                      </div>
                                      <p className="text-xs text-red-400 mt-1">* aguardando dados reais do cliente</p>
                                  </div>
                                  <div>
                                      <label className="settings-v3-label">Beneficiário</label>
                                      <p className="font-bold text-[var(--t1)]">InvoiceApp Lda</p>
                                  </div>
                              </div>

                              <div className="text-sm p-4 rounded-xl flex items-start gap-3" style={{ color: 'var(--t2)', backgroundColor: 'color-mix(in srgb, var(--blue) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--blue) 15%, transparent)' }}>
                                  <div className="mt-0.5" style={{ color: 'var(--blue)' }}><ExternalLink size={16} /></div>
                                  <div>
                                      <p className="font-bold mb-1" style={{ color: 'var(--blue)' }}>Próximo Passo:</p>
                                      <p>Envie o comprovativo de transferência para <strong style={{ color: 'var(--blue)' }}>financeiro@invoiceapp.com</strong> ou via WhatsApp, indicando o nome da sua empresa.</p>
                                      <p className="mt-2 text-xs opacity-80 text-[var(--t3)]">Sua conta será atualizada em até 24h úteis.</p>
                                  </div>
                              </div>

                              <button 
                                  onClick={() => setIsUpgradeModalOpen(false)}
                                  className="btn-primary w-full py-4 text-base"
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
                                  <h2 className="text-xl font-bold text-[var(--t1)]">Membros da Equipe</h2>
                                  <p className="text-sm text-[var(--t2)]">Convide colegas para colaborar no mesmo painel.</p>
                              </div>
                              <button 
                                onClick={() => setIsInviteModalOpen(true)}
                                className="btn-primary py-2.5"
                              >
                                  <Plus size={18} /> Convidar Membro
                              </button>
                          </div>

                          <div className="space-y-4">
                              {teamMembers.map((member) => (
                                  <div key={member.id} className="bg-[var(--card)] p-4 rounded-[16px] flex items-center justify-between border border-[var(--border)] shadow-sm">
                                      <div className="flex items-center gap-4">
                                          {member.avatar_url ? (
                                              <img src={member.avatar_url} alt={member.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border)]" />
                                          ) : (
                                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold tracking-wider" style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
                                                  {member.full_name?.substring(0,2).toUpperCase() || 'NA'}
                                              </div>
                                          )}
                                          <div>
                                              <h4 className="font-bold text-[var(--t1)]">
                                                {member.full_name} 
                                                {member.id === profile?.id && <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] ml-2" style={{ background: 'color-mix(in srgb, var(--cyan) 15%, transparent)', color: 'var(--cyan)' }}>VOCÊ</span>}
                                              </h4>
                                              <p className="text-xs text-[var(--t3)]">{member.email}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                          <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-[6px] ${member.status?.toLowerCase() === 'active' ? '' : 'bg-[var(--card-h)] text-[var(--t3)]'}`} style={member.status?.toLowerCase() === 'active' ? { background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' } : {}}>
                                              {member.status || 'Active'}
                                          </span>
                                          <span className="text-sm font-semibold text-[var(--t2)] w-24">
                                              {member.user_role || 'Member'}
                                          </span>
                                          {member.id !== profile?.id && <button className="text-[var(--t3)] hover:text-red-500 font-semibold text-sm transition-colors" onClick={() => console.log('Feature em desenvolvimento')}>Remover</button>}
                                      </div>
                                  </div>
                              ))}
                              {teamMembers.length === 0 && <p className="text-[var(--t3)]">Nenhum membro encontrado.</p>}
                          </div>

                          <div className="p-6 rounded-[16px] flex gap-4 items-start" style={{ background: 'color-mix(in srgb, var(--blue) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--blue) 10%, transparent)' }}>
                               <div className="p-2 bg-[var(--card)] rounded-full shadow-sm" style={{ color: 'var(--blue)' }}><Shield size={20} /></div>
                               <div>
                                   <h4 className="font-bold text-sm" style={{ color: 'var(--blue)' }}>Segurança do Time</h4>
                                   <p className="text-xs mt-1 max-w-xl" style={{ color: 'var(--t2)' }}>
                                       Administradores têm acesso total. Editores podem criar faturas mas não podem alterar configurações de faturamento. Viewers só podem visualizar dashboards.
                                   </p>
                               </div>
                          </div>
                      </div>
                  )}


                  {/* BILLING TAB */}
                  {activeTab === 'billing' && (
                       <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center md:text-left">
                          <div className="flex flex-col md:items-center text-center max-w-2xl mx-auto mb-10">
                              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--t1)]">Planos e Assinaturas</h2>
                              <p className="text-[var(--t2)] mt-2">Escolha o plano ideal para alavancar o seu negócio com faturamento inteligente.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Starter Plan */}
                              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col transition-all group hover:border-[var(--blue)]">
                                  <div className="mb-4">
                                      <span className="text-[10px] font-bold text-[var(--t2)] bg-[var(--card-h)] px-3 py-1.5 rounded-full uppercase tracking-wider">Starter</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold text-[var(--t1)] mb-2">Kz 4.990<span className="text-sm text-[var(--t3)] font-medium">/mês</span></h3>
                                  <p className="text-[var(--t2)] text-sm mb-8 flex-1">Para freelancers e microempreendedores que estão começando.</p>
                                  
                                  <ul className="space-y-4 mb-8">
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>Até 10 faturas/mês</span></li>
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>1 Usuário</span></li>
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>Relatórios Básicos</span></li>
                                  </ul>

                                  <button onClick={() => console.log('Seu plano atual.')} className="btn-secondary w-full py-3.5 mt-auto">Plano Atual</button>
                              </div>

                              {/* Profissional Plan */}
                              <div className="p-8 rounded-[24px] text-white relative overflow-hidden flex flex-col shadow-2xl transform md:-translate-y-4 border border-white/20" style={{ background: 'linear-gradient(135deg, var(--blue), color-mix(in srgb, var(--cyan) 50%, var(--blue)))' }}>
                                  <div className="absolute top-[-20px] right-[-20px] p-8 opacity-10"><CreditCard size={140} /></div>
                                  <div className="mb-4 relative z-10 flex justify-between items-center">
                                      <span className="text-[10px] font-bold bg-white text-[var(--blue)] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Profissional</span>
                                      <span className="text-[9px] font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Recomendado</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold mb-2 relative z-10">Kz 12.900<span className="text-sm text-white/70 font-medium">/mês</span></h3>
                                  <p className="text-white/80 text-sm mb-8 flex-1 relative z-10">Para empresas em crescimento que precisam de automação.</p>
                                  
                                  <ul className="space-y-4 mb-8 relative z-10">
                                      <li className="flex items-center gap-3 text-sm font-medium"><Check size={18} className="text-[#8bd7bf]" /> <span>Faturas Ilimitadas</span></li>
                                      <li className="flex items-center gap-3 text-sm font-medium"><Check size={18} className="text-[#8bd7bf]" /> <span>Até 10 Usuários</span></li>
                                      <li className="flex items-center gap-3 text-sm font-medium"><Check size={18} className="text-[#8bd7bf]" /> <span>Consultor IA Avançado</span></li>
                                      <li className="flex items-center gap-3 text-sm font-medium"><Check size={18} className="text-[#8bd7bf]" /> <span>Exportação PDF/CSV</span></li>
                                  </ul>

                                  <button onClick={() => openUpgradeModal('Profissional', 'Kz 12.900/mês')} className="w-full py-3.5 bg-white rounded-[12px] font-bold hover:bg-slate-50 transition-colors shadow-lg relative z-10 mt-auto" style={{ color: 'var(--blue)' }}>Fazer Upgrade</button>
                              </div>

                              {/* Empresarial Plan */}
                              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] relative overflow-hidden flex flex-col hover:border-[var(--blue)] transition-all">
                                  <div className="mb-4">
                                      <span className="text-[10px] font-bold text-[var(--t2)] bg-[var(--card-h)] px-3 py-1.5 rounded-full uppercase tracking-wider">Empresarial</span>
                                  </div>
                                  <h3 className="text-3xl font-extrabold text-[var(--t1)] mb-2">Kz 29.900<span className="text-sm text-[var(--t3)] font-medium">/mês</span></h3>
                                  <p className="text-[var(--t2)] text-sm mb-8 flex-1">Para grandes organizações com necessidades corporativas de RH e faturamento.</p>
                                  
                                  <ul className="space-y-4 mb-8">
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>Usuários Ilimitados</span></li>
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>API Dedicada & Webhooks</span></li>
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>Audit Logs (HIPAA/GDPR)</span></li>
                                      <li className="flex items-center gap-3 text-sm text-[var(--t1)] font-medium"><Check size={18} className="text-[var(--blue)]" /> <span>Gerente de Conta 24/7</span></li>
                                  </ul>

                                  <button onClick={() => openUpgradeModal('Empresarial', 'Kz 29.900/mês')} className="btn-secondary w-full py-3.5 mt-auto">Fazer Upgrade</button>
                              </div>
                          </div>
                       </div>
                  )}

              {/* PREFERENCES TAB (Technical / Caching) */}
              {activeTab === 'preferences' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                          <h2 className="text-xl font-bold text-[var(--t1)]">Preferências do Sistema</h2>
                          <p className="text-sm text-[var(--t2)]">Personalize sua experiência.</p>
                      </div>

                      <div className="space-y-6">
                           
                           {/* Region & Language */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="settings-v3-label">Moeda Principal</label>
                                   <select 
                                     value={currencyForm}
                                     onChange={(e) => setCurrencyForm(e.target.value)}
                                     disabled={editingSection !== 'preferences'}
                                     className="settings-v3-input"
                                   >
                                       <option value="AOA">Kwanza (AOA)</option>
                                       <option value="EUR">Euro (EUR)</option>
                                       <option value="USD">Dólar (USD)</option>
                                       <option value="BRL">Real (BRL)</option>
                                   </select>
                                   <p className="text-[10px] text-[var(--t3)] mt-1">Afeta a exibição em todo o sistema.</p>
                               </div>

                               <div>
                                   <label className="settings-v3-label">Idioma</label>
                                   <select 
                                     value={languageForm}
                                     onChange={(e) => setLanguageForm(e.target.value)}
                                     disabled={editingSection !== 'preferences'}
                                     className="settings-v3-input"
                                   >
                                       <option value="pt">Português</option>
                                       <option value="en">English (Beta)</option>
                                       <option value="es">Español (Beta)</option>
                                   </select>
                               </div>
                           </div>

                           {/* Notifications */}
                           <div className="space-y-4">
                               <label className="settings-v3-label">Notificações</label>
                               
                               <div className="flex items-center justify-between p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                   <span className="text-sm font-medium text-[var(--t1)]">Resumo Semanal por Email</span>
                                   <input 
                                     type="checkbox" 
                                     checked={notificationsForm.email}
                                     disabled={editingSection !== 'preferences'}
                                     onChange={(e) => setNotificationsForm({...notificationsForm, email: e.target.checked})}
                                     className="w-5 h-5 disabled:opacity-50" 
                                     style={{ accentColor: 'var(--blue)' }}
                                   />
                               </div>
                               <div className="flex items-center justify-between p-3 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                   <span className="text-sm font-medium text-[var(--t1)]">Alertas de Pagamento (Push)</span>
                                   <input 
                                     type="checkbox" 
                                     checked={notificationsForm.push}
                                     disabled={editingSection !== 'preferences'}
                                     onChange={(e) => setNotificationsForm({...notificationsForm, push: e.target.checked})}
                                     className="w-5 h-5 disabled:opacity-50" 
                                     style={{ accentColor: 'var(--blue)' }}
                                   />
                               </div>
                           </div>

                           <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3">
                                {editingSection !== 'preferences' ? (
                                    <button 
                                        onClick={() => setEditingSection('preferences')} 
                                        className="btn-secondary"
                                    >
                                        ✏️ Editar
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={async () => { await handleUpdatePreferences(); setEditingSection(null); }}
                                            disabled={saving}
                                            className="btn-primary"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                            💾 Guardar
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setEditingSection(null);
                                                if (org?.currency_default) setCurrencyForm(org.currency_default);
                                            }} 
                                            className="btn-secondary"
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}
                           </div>
                           
                           {/* Dark Mode Toggle */}
                           <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-[16px] border border-[var(--border)]">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-[var(--card-h)] rounded-[12px] text-[var(--t1)]">
                                       {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-[var(--t1)]">Modo Escuro</h4>
                                       <p className="text-xs text-[var(--t2)]">
                                           Alterne entre temas claro e escuro.
                                       </p>
                                   </div>
                               </div>
                               <div className={`v3-toggle ${darkMode ? 'on' : ''}`} onClick={toggleDarkMode}>
                                  <div className="v3-toggle-knob"></div>
                               </div>
                           </div>
                           
                           {/* AI Frequency Selector */}
                           <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--card)] rounded-[16px] border border-[var(--border)] gap-4">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-[var(--card-h)] rounded-[12px] text-[var(--t1)]"><Bot size={20} /></div>
                                   <div>
                                       <h4 className="font-bold text-[var(--t1)]">Frequência da IA</h4>
                                       <p className="text-xs text-[var(--t2)]">
                                           Com que frequência a IA deve analisar seus KPIs.
                                       </p>
                                   </div>
                               </div>
                               <div className="flex p-1 rounded-[12px] bg-[var(--card-h)] border border-[var(--border)]">
                                   {['realtime', 'daily', 'weekly'].map((freq) => (
                                       <button
                                          key={freq}
                                          onClick={() => setAiFrequency(freq)}
                                          className={`px-4 py-2 rounded-[8px] text-xs font-bold capitalize transition-all ${aiFrequency === freq ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--t2)]'}`}
                                          style={aiFrequency === freq ? { color: 'var(--blue)' } : {}}
                                       >
                                           {freq === 'realtime' ? 'Tempo Real' : freq === 'daily' ? 'Diário' : 'Semanal'}
                                       </button>
                                   ))}
                               </div>
                           </div>

                           {/* Cache Toggle */}
                           <div className="flex items-center justify-between p-4 bg-[var(--card)] rounded-[16px] border border-[var(--border)]">
                               <div className="flex items-center gap-4">
                                   <div className="p-3 bg-[var(--card-h)] rounded-[12px] text-[var(--t1)]"><Smartphone size={20} /></div>
                                   <div>
                                       <h4 className="font-bold text-[var(--t1)]">Cache Local</h4>
                                       <p className="text-xs text-[var(--t2)] max-w-md">
                                           Salvar visualizações no navegador para carregamento instantâneo.
                                       </p>
                                   </div>
                               </div>
                               <div className="v3-toggle on">
                                  <div className="v3-toggle-knob"></div>
                               </div>
                           </div>

                      </div>
                  </div>
              )}
               
               {/* PROFILE TAB */}
               {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 py-10">
                      <div className="text-center">
                          <div className="relative inline-block">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} className="w-32 h-32 rounded-full border-4 border-[var(--border)] shadow-lg mx-auto" />
                              ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-[var(--border)] shadow-lg mx-auto flex items-center justify-center text-4xl font-bold text-white tracking-widest" style={{ background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }}>
                                    {profile?.full_name?.substring(0,2).toUpperCase() || 'ME'}
                                </div>
                              )}
                              <button className="absolute bottom-0 right-0 p-2 text-white rounded-full shadow-md" style={{ background: 'var(--blue)' }}><User size={16}/></button>
                          </div>
                          <h2 className="text-2xl font-extrabold text-[var(--t1)] mt-4">{profile?.full_name}</h2>
                          <p className="text-[var(--t2)]">{profile?.email} • {profile?.user_role}</p>
                      </div>
                      
                      <div className="max-w-md mx-auto mt-8 space-y-4 text-left">
                          <div>
                              <label className="settings-v3-label">Nome Completo</label>
                              <input 
                                type="text" 
                                value={profileForm.full_name}
                                disabled={editingSection !== 'profile'}
                                onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                                className="settings-v3-input" 
                              />
                          </div>
                          <div>
                              <label className="settings-v3-label">Telemóvel</label>
                              <input 
                                type="tel" 
                                value={profileForm.mobile_number}
                                disabled={editingSection !== 'profile'}
                                onChange={(e) => setProfileForm({...profileForm, mobile_number: e.target.value})}
                                className="settings-v3-input"
                                placeholder="+244..."
                              />
                          </div>
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <label className="settings-v3-label mb-0">Integração WhatsApp</label>
                                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-[6px] flex items-center text-[9px] font-bold uppercase tracking-wider">Brevemente</span>
                              </div>
                              <div className="flex gap-4 items-center">
                                  <div className="flex-1 px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[10px] text-[var(--t2)] text-sm flex items-center">
                                      WhatsApp não ligado.
                                  </div>
                                  <button 
                                      disabled
                                      className="btn-primary opacity-50 cursor-not-allowed shadow-none"
                                  >
                                      🔗 Ligar
                                  </button>
                              </div>
                              <p className="text-[10px] text-[var(--t3)] mt-2">
                                  A ligação oficial com o bot do WhatsApp estará disponível em futuras atualizações.
                              </p>
                          </div>
                          <div>
                              <label className="settings-v3-label">Integração Telegram</label>
                              <div className="flex gap-4 items-center">
                                  {profile?.telegram_id ? (
                                      <div className="flex-1 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[10px] flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                              <Check size={16} strokeWidth={3} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-[var(--t1)]">Conectado ao Telegram</p>
                                              <p className="text-xs text-[var(--t2)]">ID: {profile.telegram_id}</p>
                                          </div>
                                      </div>
                                  ) : telegramToken ? (
                                      <>
                                          <div className="flex-1 px-4 py-3 bg-[var(--card)] border border-[var(--blue)] rounded-[10px] flex justify-between items-center">
                                            <div>
                                              <span className="text-xs text-[var(--t3)] block mb-1">CÓDIGO DE LIGAÇÃO</span>
                                              <span className="font-mono font-bold tracking-widest text-lg" style={{ color: 'var(--blue)' }}>{telegramToken}</span>
                                            </div>
                                            {telegramTokenExpiry && (
                                              <div className="text-right">
                                                 <span className="text-[10px] text-[var(--t3)] block uppercase">Expira às</span>
                                                 <span className="text-xs font-bold text-[var(--t2)]">{telegramTokenExpiry.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              </div>
                                            )}
                                          </div>
                                          <a 
                                            href={`https://t.me/FacturAIBot?start=${telegramToken}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary"
                                            style={{ height: '100%' }}
                                          >
                                              Abrir Telegram
                                          </a>
                                      </>
                                  ) : (
                                    <>
                                        <div className="flex-1 px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[10px] text-[var(--t2)] text-sm flex items-center">
                                            Telegram não ligado.
                                        </div>
                                        <button 
                                            onClick={handleGenerateTelegramToken}
                                            disabled={generatingToken}
                                            className="btn-primary shadow-none bg-[#2AABEE] text-white hover:opacity-90 transition-opacity"
                                            style={{ background: '#2AABEE' }}
                                        >
                                            {generatingToken ? <Loader2 className="animate-spin" size={16}/> : null}
                                            🔗 Ligar
                                        </button>
                                    </>
                                  )}
                              </div>
                              {!profile?.telegram_id && (
                                  <p className="text-[10px] text-[var(--t3)] mt-2">
                                      {telegramToken 
                                          ? "Clique no botão ou envie a mensagem '/start CODIGO' no Telegram. Este código expira em 15 minutos." 
                                          : "Gere um código seguro temporário para vincular o seu Telegram ao aplicativo."}
                                  </p>
                              )}
                          </div>
                          <div>
                              <label className="settings-v3-label">Email</label>
                              <input 
                                type="text" 
                                value={profileForm.email} 
                                className="settings-v3-input" 
                                disabled 
                              />
                          </div>

                          <div className="pt-6 flex items-center justify-center gap-3">
                            {editingSection !== 'profile' ? (
                                <button 
                                    onClick={() => setEditingSection('profile')} 
                                    className="btn-secondary w-full"
                                >
                                    ✏️ Editar
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={async () => { await handleUpdateProfile(); setEditingSection(null); }}
                                        disabled={saving}
                                        className="btn-primary w-1/2"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        💾 Guardar
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setEditingSection(null);
                                            if (profile) {
                                                setProfileForm({
                                                    full_name: profile.full_name || '',
                                                    email: profile.email || '',
                                                    mobile_number: profile.mobile_number || '',
                                                    whatsapp_id: profile.whatsapp_id || '',
                                                    telegram_id: profile.telegram_id || ''
                                                });
                                            }
                                        }} 
                                        className="btn-secondary w-1/2"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                          </div>
                          
                          {/* DANGER ZONE */}
                          <div className="mt-12 pt-8 border-t border-red-500/20">
                              <h3 className="text-lg font-bold text-red-500 mb-2">Zona de Perigo</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                  {profile?.user_role === 'admin' 
                                      ? "Ao apagar a sua conta, todos os seus dados e a empresa associada serão eliminados permanentemente. Esta ação não pode ser desfeita."
                                      : "Ao apagar a sua conta, os seus dados pessoais e acesso serão eliminados permanentemente. Esta ação não pode ser desfeita."
                                  }
                              </p>
                              <button
                                  onClick={() => {
                                      setShowDeleteModal(true);
                                      setDeleteStep(1);
                                      setDeleteConfirmText('');
                                  }}
                                  className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-colors"
                              >
                                  {profile?.user_role === 'admin' ? "Apagar Conta e Empresa" : "Apagar a Minha Conta"}
                              </button>
                          </div>
                      </div>
                  </div>
               )}

                </>
              )}
          </div>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={profile?.user_role === 'admin' ? "Apagar Conta e Empresa" : "Apagar Conta"} size="md">
          <div className="p-6">
              {deleteStep === 1 ? (
                  <>
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                          <Shield size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-center mb-2 text-[var(--t1)]">Tem a certeza absoluta?</h3>
                      <p className="text-[var(--t2)] text-center mb-6 text-sm">
                          {profile?.user_role === 'admin'
                              ? <>Esta ação irá eliminar permanentemente a sua conta, os dados da sua empresa, todas as faturas e histórico. <strong className="text-red-500">Esta ação não pode ser desfeita.</strong></>
                              : <>Esta ação irá eliminar permanentemente o seu acesso e os seus dados pessoais associados a esta organização. <strong className="text-red-500">Esta ação não pode ser desfeita.</strong></>
                          }
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setShowDeleteModal(false)}
                              className="btn-secondary flex-1 py-3"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={() => setDeleteStep(2)}
                              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-[10px] transition-colors shadow-lg shadow-red-500/20"
                          >
                              Sim, apagar
                          </button>
                      </div>
                  </>
              ) : (
                  <>
                      <h3 className="text-xl font-bold text-center mb-2 text-[var(--t1)]">Confirmação Final</h3>
                      <p className="text-[var(--t2)] text-center mb-6 text-sm">
                          Para confirmar, digite <strong className="text-red-500 select-all">APAGAR</strong> abaixo.
                      </p>
                      <input 
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Digite APAGAR"
                          className="settings-v3-input w-full px-4 py-3 mb-6 font-bold text-center focus:ring-2 focus:ring-red-500/50 border-red-500/30"
                      />
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setShowDeleteModal(false)}
                              className="btn-secondary flex-1 py-3"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== 'APAGAR' || isDeleting}
                              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-[10px] transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                              Apagar Permanentemente
                          </button>
                      </div>
                  </>
              )}
          </div>
      </Modal>

    </div>
    </>
  );
};

export default Settings;