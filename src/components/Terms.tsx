import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Termos de Uso</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
          <p>Última atualização: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar e usar a plataforma Lumea ("Serviço"), você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá usar o Serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">2. Descrição do Serviço</h2>
            <p>A Lumea é uma plataforma de gestão financeira e processamento de faturas assistida por Inteligência Artificial. O Serviço é fornecido "como está" e "conforme disponível".</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">3. Contas e Segurança</h2>
            <p>Você é responsável por manter a confidencialidade da sua conta e senha. A Lumea não se responsabiliza por perdas decorrentes do uso não autorizado da sua conta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">4. Pagamentos e Assinaturas</h2>
            <p>Alguns recursos do Serviço são cobrados. Ao selecionar um plano pago, você concorda em pagar as taxas aplicáveis via transferência bancária ou outros meios disponibilizados. O não pagamento pode resultar na suspensão do acesso.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">5. Propriedade Intelectual</h2>
            <p>O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva da Lumea e seus licenciadores.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">6. Limitação de Responsabilidade</h2>
            <p>Em nenhum caso a Lumea será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados ou uso.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">7. Alterações</h2>
            <p>Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.</p>
          </section>

          <section>
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Contactos</h2>
             <p>Se tiver dúvidas sobre estes Termos, contacte-nos através de support@lumea.ao.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
