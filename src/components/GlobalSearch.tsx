import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Target, Package, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/invoice/invoiceService';
import { Invoice } from '../types/invoice.types';
import { goalsService, Goal } from '../services/goalsService';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [invoiceResults, setInvoiceResults] = useState<Invoice[]>([]);
  const [goalResults, setGoalResults] = useState<Goal[]>([]);
  const [itemResults, setItemResults] = useState<{invoiceId: string, item: any}[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setInvoiceResults([]);
        setGoalResults([]);
        setItemResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const [invoices, goals] = await Promise.all([
          invoiceService.getInvoices(),
          goalsService.getGoals()
        ]);

        const lowerQuery = debouncedQuery.toLowerCase();

        // Search Invoices
        const matchedInvoices = invoices.filter(inv => 
          inv.client.toLowerCase().includes(lowerQuery) ||
          inv.displayId.toLowerCase().includes(lowerQuery) ||
          (inv.category && inv.category.toLowerCase().includes(lowerQuery))
        );
        setInvoiceResults(matchedInvoices);

        // Search Goals
        const matchedGoals = goals.filter(g => 
          g.title.toLowerCase().includes(lowerQuery) ||
          (g.category && g.category.toLowerCase().includes(lowerQuery)) ||
          g.kpi.toLowerCase().includes(lowerQuery)
        );
        setGoalResults(matchedGoals);

        // Search Items inside invoices
        const matchedItems: {invoiceId: string, item: any}[] = [];
        invoices.forEach(inv => {
          if (inv.items) {
            inv.items.forEach(item => {
              if (
                item.description.toLowerCase().includes(lowerQuery) || 
                (item.name && item.name.toLowerCase().includes(lowerQuery))
              ) {
                matchedItems.push({ invoiceId: inv.id || '', item });
              }
            });
          }
        });
        setItemResults(matchedItems);

      } catch (error) {
        console.error("Error performing search", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const navigateTo = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = invoiceResults.length > 0 || goalResults.length > 0 || itemResults.length > 0;

  return (
    <div className="relative w-full group" ref={searchRef}>
      <Search 
        className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: 'var(--t3)' }} 
        size={18} 
      />
      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        onFocus={handleFocus}
        className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-[13px] font-sans focus:outline-none focus:ring-2 transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: 'var(--t1)',
          fontFamily: "'Outfit', sans-serif",
        }}
        placeholder="Pesquisar faturas, metas, itens..."
      />

      {/* Search Results Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-[1.5rem] border shadow-2xl overflow-hidden z-50 flex flex-col card-glass"
          style={{ maxHeight: '70vh' }}
        >
          {isSearching ? (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--blue)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--t2)' }}>Pesquisando...</p>
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-sm font-medium" style={{ color: 'var(--t3)' }}>
              Nenhum resultado encontrado para "{query}"
            </div>
          ) : (
            <div className="overflow-y-auto p-2 space-y-4 max-h-[60vh] no-scrollbar">
              
              {/* Invoices */}
              {invoiceResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 rounded-t-xl" style={{ color: 'var(--t3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <FileText size={14} /> Faturas
                  </div>
                  <div className="space-y-1 mt-1">
                    {invoiceResults.slice(0, 5).map(inv => (
                      <button 
                        key={inv.id}
                        onClick={() => navigateTo('/billing?invoiceId=' + inv.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{inv.client}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{inv.displayId} • {inv.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--blue)' }}>
                            {inv.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </span>
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--t3)' }} />
                        </div>
                      </button>
                    ))}
                    {invoiceResults.length > 5 && (
                      <button className="w-full text-xs font-medium py-2 text-center" style={{ color: 'var(--blue)' }} onClick={() => navigateTo('/billing')}>
                        Ver todas as +{(invoiceResults.length - 5)} faturas
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Goals */}
              {goalResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 rounded-t-xl" style={{ color: 'var(--t3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Target size={14} /> Metas
                  </div>
                  <div className="space-y-1 mt-1">
                    {goalResults.slice(0, 5).map(goal => (
                      <button 
                        key={goal.id}
                        onClick={() => navigateTo('/goals')}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{goal.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-black/5 dark:bg-white/5" style={{ color: 'var(--t2)' }}>{goal.kpi}</span>
                            <p className="text-xs" style={{ color: 'var(--t3)' }}>Progresso: {goal.progress}%</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--t3)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              {itemResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md z-10 rounded-t-xl" style={{ color: 'var(--t3)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Package size={14} /> Itens Faturados
                  </div>
                  <div className="space-y-1 mt-1">
                    {itemResults.slice(0, 5).map((result, idx) => (
                      <button 
                        key={`${result.invoiceId}-${idx}`}
                        onClick={() => navigateTo('/billing?invoiceId=' + result.invoiceId)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
                      >
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{result.item.description || result.item.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>Qtd: {result.item.quantity} • IVA: {result.item.vat}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--t1)' }}>
                            {(result.item.price * result.item.quantity).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                          </span>
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--t3)' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
