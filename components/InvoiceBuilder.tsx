import React from 'react';
import { PenTool, LayoutTemplate, MousePointer2, Sparkles } from 'lucide-react';

const InvoiceBuilder: React.FC = () => {
  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col justify-center items-center text-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#73c6df]/20 to-[#8bd7bf]/20 rounded-full blur-[100px] -z-10"></div>

      <div className="mb-8 relative">
        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#73c6df] to-[#8bd7bf] flex items-center justify-center shadow-xl shadow-[#73c6df]/30 animate-bounce-slow">
            <PenTool size={48} className="text-white" />
        </div>
        <div className="absolute -right-8 -bottom-4 bg-white p-3 rounded-2xl shadow-lg animate-pulse">
            <MousePointer2 size={24} className="text-[#2e8ba6]" />
        </div>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-6 tracking-tight">
        Construtor <span className="custom-text-gradient">Drag & Drop</span>
      </h1>
      
      <p className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed">
        Estamos construindo uma ferramenta revolucionária para você desenhar suas faturas arrastando elementos. Personalize cores, logos e layouts em segundos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
         <div className="bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
            <LayoutTemplate size={32} className="text-[#73c6df] mb-4 mx-auto" />
            <h3 className="font-bold text-slate-700">Templates Prontos</h3>
            <p className="text-xs text-slate-500 mt-2">Mais de 50 modelos profissionais.</p>
         </div>
         <div className="bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
            <MousePointer2 size={32} className="text-[#8bd7bf] mb-4 mx-auto" />
            <h3 className="font-bold text-slate-700">Arrastar e Soltar</h3>
            <p className="text-xs text-slate-500 mt-2">Interface visual intuitiva.</p>
         </div>
         <div className="bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
            <Sparkles size={32} className="text-amber-400 mb-4 mx-auto" />
            <h3 className="font-bold text-slate-700">Sugestões IA</h3>
            <p className="text-xs text-slate-500 mt-2">A IA sugere o melhor layout.</p>
         </div>
      </div>

      <button className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
          Notifique-me quando lançar
      </button>

      <p className="mt-6 text-xs font-bold text-[#73c6df] uppercase tracking-widest bg-[#73c6df]/10 px-4 py-2 rounded-full">
         Chegando em Q4 2024
      </p>

    </div>
  );
};

export default InvoiceBuilder;