import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
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

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Política de Privacidade</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6 text-slate-600 dark:text-slate-300">
          <p>Última atualização: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">1. Introdução</h2>
            <p>A Lumea respeita a sua privacidade. Esta Política de Privacidade explica como recolhemos, usamos, divulgamos e protegemos as suas informações quando usa a nossa aplicação.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">2. Recolha de Informação</h2>
            <p>Recolhemos informações que você nos fornece diretamente, como dados de registo de conta, informações de perfil da empresa e dados de faturas que carrega no sistema.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">3. Uso da Informação</h2>
            <p>Usamos as informações recolhidas para fornecer, manter e melhorar os nossos serviços, processar transações, enviar notificações e fornecer suporte ao cliente.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">4. Processamento de Dados (IA)</h2>
            <p>Os documentos carregados podem ser processados por algoritmos de Inteligência Artificial para extração de dados. Estes dados são usados estritamente para fornecer o serviço contratado e não são partilhados com terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">5. Segurança de Dados</h2>
            <p>Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger os seus dados pessoais contra acesso, uso ou divulgação não autorizados.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">6. Os Seus Direitos</h2>
            <p>Você tem o direito de aceder, corrigir ou apagar os seus dados pessoais. Pode exercer estes direitos através das definições da sua conta ou contactando-nos.</p>
          </section>

          <section>
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Contactos</h2>
             <p>Se tiver questões sobre esta política, contacte o nosso Encarregado de Proteção de Dados em privacy@lumea.ao.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
