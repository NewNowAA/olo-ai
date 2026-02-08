import React, { useState } from 'react';
import { ArrowLeft, Building, User, Check, ChevronRight, MessageSquare, Briefcase, Zap, Shield, BarChart3, UploadCloud, Smartphone, Mail, Lock, FileText, Globe } from 'lucide-react';

interface RegisterPageProps {
  onLoginRequest: () => void;
  onBack: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onLoginRequest, onBack }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [accountType, setAccountType] = useState<'company' | 'freelancer' | null>(null);

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps + 1)); 
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // --- Step 1: Account Type ---
  const Step1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
        <h3 className="text-2xl font-bold text-slate-800 text-center">Qual o seu perfil?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => { setAccountType('company'); nextStep(); }}
                className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${accountType === 'company' ? 'border-[#73c6df] bg-[#73c6df]/5 shadow-lg' : 'border-slate-100 bg-white hover:border-[#73c6df]/30 hover:shadow-md'}`}
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${accountType === 'company' ? 'bg-[#73c6df] text-white' : 'bg-slate-100 text-slate-400 group-hover:text-[#73c6df]'}`}>
                    <Building size={32} />
                </div>
                <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-lg">Empresa</h4>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Gestão completa para PMEs e startups.</p>
                </div>
            </button>
            <button 
                onClick={() => { setAccountType('freelancer'); nextStep(); }}
                className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${accountType === 'freelancer' ? 'border-[#8bd7bf] bg-[#8bd7bf]/5 shadow-lg' : 'border-slate-100 bg-white hover:border-[#8bd7bf]/30 hover:shadow-md'}`}
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${accountType === 'freelancer' ? 'bg-[#8bd7bf] text-white' : 'bg-slate-100 text-slate-400 group-hover:text-[#8bd7bf]'}`}>
                    <User size={32} />
                </div>
                <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-lg">Freelancer</h4>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Ideal para recibos verdes e ENI.</p>
                </div>
            </button>
        </div>
    </div>
  );

  // --- Step 2: Manager Data ---
  const Step2 = () => (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nome</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Apelido</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Telemóvel</label>
              <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
                  <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
              </div>
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar</label>
                  <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" />
              </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Canais de Integração</label>
              <div className="flex gap-4">
                  <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#73c6df] transition-all flex-1 shadow-sm">
                      <input type="checkbox" className="w-4 h-4 rounded text-[#73c6df] border-slate-300 focus:ring-[#73c6df]" />
                      <span className="text-sm font-bold text-slate-700">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#73c6df] transition-all flex-1 shadow-sm">
                      <input type="checkbox" className="w-4 h-4 rounded text-[#73c6df] border-slate-300 focus:ring-[#73c6df]" />
                      <span className="text-sm font-bold text-slate-700">Telegram</span>
                  </label>
              </div>
          </div>
      </div>
  );

  // --- Step 3: Company Data ---
  const Step3 = () => (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
           <div className="text-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Dados do Negócio</h3>
               <p className="text-sm text-slate-500">Para personalizar sua experiência.</p>
           </div>

           <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                 {accountType === 'company' ? 'Nome da Empresa' : 'Nome Comercial / Marca'}
              </label>
              <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" placeholder="Ex: Lumea Tech Lda" />
              </div>
          </div>
          <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {accountType === 'company' ? 'NIF (Empresa)' : 'NIF (Pessoal)'}
              </label>
              <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none transition-all focus:bg-white" placeholder="123 456 789" />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Setor</label>
                <div className="relative">
                     <select className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none appearance-none transition-all focus:bg-white font-medium text-sm">
                        <option>Tecnologia</option>
                        <option>Varejo</option>
                        <option>Serviços</option>
                        <option>Saúde</option>
                        <option>Outro</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={14} />
                </div>
            </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tamanho</label>
                <div className="relative">
                     <select className="w-full pl-4 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#73c6df] focus:outline-none appearance-none transition-all focus:bg-white font-medium text-sm">
                        <option>1-5 pessoas</option>
                        <option>5-20 pessoas</option>
                        <option>20-50 pessoas</option>
                        <option>50+ pessoas</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={14} />
                </div>
            </div>
          </div>
      </div>
  );

  // --- Step 4: Team ---
  const Step4 = () => (
      <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="w-20 h-20 bg-[#73c6df]/10 text-[#73c6df] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Briefcase size={32} />
          </div>
          <div>
              <h4 className="text-xl font-bold text-slate-800">Convide sua equipe</h4>
              <p className="text-sm text-slate-500 mt-2">Adicione colaboradores agora ou pule esta etapa.</p>
          </div>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 text-left shadow-inner">
              <div className="flex items-end gap-3">
                  <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email do Colaborador</label>
                      <input type="email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-[#73c6df]" placeholder="colaborador@empresa.com" />
                  </div>
                  <button className="px-5 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors shadow-lg">Adicionar</button>
              </div>
          </div>
      </div>
  );

  // --- Step 5: Modules ---
  const Step5 = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center mb-6">
             <h4 className="text-xl font-bold text-slate-800">Personalize seu Painel</h4>
             <p className="text-sm text-slate-500">Selecione o que é mais importante para você.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              {[
                  { icon: Zap, label: "OCR Inteligente", desc: "Leitura automática", color: "text-amber-500" },
                  { icon: MessageSquare, label: "WhatsApp Bot", desc: "Envio fácil", color: "text-green-500" },
                  { icon: Shield, label: "Auditoria IA", desc: "Anti-fraude", color: "text-blue-500" },
                  { icon: BarChart3, label: "Analytics Pro", desc: "Insights", color: "text-purple-500" }
              ].map((mod, i) => (
                  <label key={i} className="cursor-pointer p-5 rounded-[1.5rem] border border-slate-200 bg-white hover:border-[#73c6df] hover:shadow-lg transition-all relative group">
                      <input type="checkbox" className="absolute top-4 right-4 w-5 h-5 rounded border-slate-300 text-[#73c6df] focus:ring-[#73c6df]" defaultChecked />
                      <mod.icon className={`${mod.color} mb-3`} size={28} />
                      <div className="font-bold text-slate-800 text-sm">{mod.label}</div>
                      <div className="text-xs text-slate-400 font-medium mt-1">{mod.desc}</div>
                  </label>
              ))}
          </div>
      </div>
  );

  // --- Success Screen ---
  if (step > totalSteps) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
                      <Check size={48} strokeWidth={4} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Conta Criada!</h2>
                  <p className="text-slate-500 leading-relaxed font-medium">Tudo pronto para automatizar as suas finanças. Bem-vindo ao faturAI.</p>
                  <button 
                    onClick={onLoginRequest}
                    className="w-full py-4 bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white font-extrabold rounded-2xl hover:brightness-110 transition-all shadow-xl hover:shadow-[#73c6df]/30 mt-4"
                  >
                      Continuar para Login
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
       {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#73c6df]/20 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#8bd7bf]/20 rounded-full blur-[80px] animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10 flex flex-col min-h-[650px]">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
              {step === 1 ? (
                  <button onClick={onBack} className="text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft size={24} /></button>
              ) : (
                  <button onClick={prevStep} className="text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft size={24} /></button>
              )}
              <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-[#73c6df]' : 'w-2 bg-slate-200'}`}></div>
                  ))}
              </div>
          </div>

          <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Crie a sua conta</h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Passo {step} de {totalSteps}</p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
              {step === 1 && <Step1 />}
              {step === 2 && <Step2 />}
              {step === 3 && <Step3 />}
              {step === 4 && <Step4 />}
              {step === 5 && <Step5 />}
          </div>

          {step > 1 && (
              <div className="pt-8 mt-6 border-t border-slate-100 flex justify-between items-center">
                  <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Voltar</button>
                  <button 
                    onClick={nextStep}
                    className="px-10 py-4 bg-gradient-to-r from-[#73c6df] to-[#8bd7bf] text-white rounded-2xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-xl hover:shadow-[#73c6df]/30 hover:-translate-y-1"
                  >
                      {step === totalSteps ? 'Finalizar' : 'Próximo'} <ChevronRight size={18} />
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default RegisterPage;