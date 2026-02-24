import React from "react";
import { Rocket, Sparkles } from "lucide-react";

const InvoiceBuilder: React.FC = () => {
  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-lg">
        <div className="w-24 h-24 bg-gradient-to-br from-[#73c6df]/20 to-[#8bd7bf]/20 rounded-3xl flex items-center justify-center mx-auto">
          <Rocket size={48} className="text-[#2e8ba6]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
          Criador de Faturas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Em breve poderás criar faturas profissionais directamente na
          plataforma. Por agora, usa a página <strong>Faturação</strong> para
          gerir as tuas faturas.
        </p>
        <div className="flex items-center justify-center gap-2 text-[#2e8ba6] font-bold text-sm">
          <Sparkles size={16} />
          Novidades em breve
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;