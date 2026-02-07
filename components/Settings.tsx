import React, { useState } from 'react';
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
  Sun
} from 'lucide-react';

interface SettingsProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  aiFrequency: string;
  setAiFrequency: (freq: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ darkMode, toggleDarkMode, aiFrequency, setAiFrequency }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing' | 'preferences'>('preferences');

  // Mock Team Data
  const [teamMembers, setTeamMembers] = useState([
      { id: 1, name: 'Alex Morgan', role: 'Admin', email: 'alex@lumea.ai', status: 'Ativo', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAA7S9yhFXk294T9os4H2nZ73Ye4sGgPvCL1T6UKO9gSLjjPY2EKJMR0ilYFyCHpANawfLPYXziZ_XjAiTXedd3Zc7Fy8QjiZcepcE9cEW8k_2AKvOeLcJ2Puf3F_1yXe3h1U2_DDDCboIQXcYmfec02eRQ2aF596Ag_HaUeBgBtkaood65M_fDyJxO8EwfZtWFK46AS33k3NoVvezn8stuHWT6aTltqeRns2rk73peLEkStvvJvG4tylKUzJmL54uyUCKFanZ5p1A' },
      { id: 2, name: 'Sarah Connor', role: 'Editor', email: 'sarah@lumea.ai', status: 'Ativo', avatar: null },
      { id: 3, name: 'John Doe', role: 'Viewer', email: 'john@lumea.ai', status: 'Pendente', avatar: null },
  ]);

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
              
              {/* TEAM TAB */}
              {activeTab === 'team' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex justify-between items-center">
                          <div>
                              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Membros da Equipe</h2>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Convide colegas para colaborar no mesmo painel.</p>
                          </div>
                          <button className="px-5 py-2.5 rounded-xl bg-[#2e8ba6] text-white font-bold text-sm hover:bg-[#257a91] transition-all flex items-center gap-2">
                              <Plus size={18} /> Convidar Membro
                          </button>
                      </div>

                      <div className="space-y-4">
                          {teamMembers.map((member) => (
                              <div key={member.id} className="bg-white/60 dark:bg-slate-700/60 p-4 rounded-2xl flex items-center justify-between border border-white/60 dark:border-slate-600 shadow-sm">
                                  <div className="flex items-center gap-4">
                                      {member.avatar ? (
                                          <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-600" />
                                      ) : (
                                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 border-2 border-white dark:border-slate-500 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                                              {member.name.substring(0,2).toUpperCase()}
                                          </div>
                                      )}
                                      <div>
                                          <h4 className="font-bold text-slate-800 dark:text-white">{member.name} {member.id === 1 && <span className="text-[10px] bg-[#73c6df]/20 text-[#2e8ba6] px-2 py-0.5 rounded-full ml-2">VOCÊ</span>}</h4>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${member.status === 'Ativo' ? 'bg-[#8bd7bf]/20 text-[#4ca68a]' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                          {member.status}
                                      </span>
                                      <select className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer" defaultValue={member.role}>
                                          <option>Admin</option>
                                          <option>Editor</option>
                                          <option>Viewer</option>
                                      </select>
                                      {member.id !== 1 && <button className="text-rose-400 hover:text-rose-600 font-bold text-xs">Remover</button>}
                                  </div>
                              </div>
                          ))}
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
                          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Seu Plano Atual</h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie sua assinatura e métodos de pagamento.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Current Plan */}
                          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden shadow-xl">
                              <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={100} /></div>
                              <div className="relative z-10">
                                  <span className="text-xs font-bold bg-[#73c6df] text-slate-900 px-3 py-1 rounded-full uppercase tracking-wider">Pro Plan</span>
                                  <h3 className="text-4xl font-extrabold mt-4 mb-1">$29<span className="text-lg text-slate-400 font-medium">/mês</span></h3>
                                  <p className="text-slate-400 text-sm mb-6">Renova em 24 Out, 2024</p>
                                  
                                  <div className="space-y-3 mb-8">
                                      <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Membros ilimitados</span></div>
                                      <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>IA Analysis avançada</span></div>
                                      <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-[#8bd7bf]" /> <span>Exportação PDF/CSV</span></div>
                                  </div>

                                  <div className="flex gap-3">
                                      <button className="flex-1 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Gerenciar</button>
                                      <button className="flex-1 py-2.5 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">Cancelar</button>
                                  </div>
                              </div>
                          </div>

                          {/* Upgrade Option */}
                          <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-[#73c6df]/30 relative overflow-hidden flex flex-col justify-center text-center">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Enterprise</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Para grandes organizações que precisam de auditoria e suporte dedicado.</p>
                              <button className="w-full py-3 bg-[#73c6df] text-white rounded-xl font-bold shadow-lg shadow-[#73c6df]/20 hover:bg-[#5fb397] transition-all">Falar com Vendas</button>
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
                          <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA7S9yhFXk294T9os4H2nZ73Ye4sGgPvCL1T6UKO9gSLjjPY2EKJMR0ilYFyCHpANawfLPYXziZ_XjAiTXedd3Zc7Fy8QjiZcepcE9cEW8k_2AKvOeLcJ2Puf3F_1yXe3h1U2_DDDCboIQXcYmfec02eRQ2aF596Ag_HaUeBgBtkaood65M_fDyJxO8EwfZtWFK46AS33k3NoVvezn8stuHWT6aTltqeRns2rk73peLEkStvvJvG4tylKUzJmL54uyUCKFanZ5p1A" 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-lg mx-auto"
                          />
                          <button className="absolute bottom-0 right-0 p-2 bg-[#73c6df] text-white rounded-full shadow-md hover:bg-[#5fb397]"><User size={16}/></button>
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-4">Alex Morgan</h2>
                      <p className="text-slate-500 dark:text-slate-400">alex@lumea.ai • CEO</p>
                      
                      <div className="max-w-md mx-auto mt-8 space-y-4 text-left">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                              <input type="text" defaultValue="Alex Morgan" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email</label>
                              <input type="text" defaultValue="alex@lumea.ai" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl dark:text-white" disabled />
                          </div>
                          <button className="w-full py-3 bg-[#2e8ba6] text-white rounded-xl font-bold shadow-lg hover:bg-[#257a91]">Salvar Alterações</button>
                      </div>
                  </div>
               )}

          </div>
      </div>
    </div>
  );
};

export default Settings;