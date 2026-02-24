import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Encontramos um erro inesperado. Tente recarregar a página ou voltar para o início.
            </p>

            {this.state.error && (
              <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl mb-6 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 bg-[#2e8ba6] hover:bg-[#257a91] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={18} /> Recarregar Página
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Home size={18} /> Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
