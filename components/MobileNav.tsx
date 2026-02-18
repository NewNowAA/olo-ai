import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, BrainCircuit, Target, Settings } from 'lucide-react';

const MobileNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
        { id: 'billing', path: '/billing', icon: Receipt, label: 'Faturas' },
        { id: 'ai', path: '/ai', icon: BrainCircuit, label: 'IA' },
        { id: 'goals', path: '/goals', icon: Target, label: 'Metas' },
        { id: 'settings', path: '/settings', icon: Settings, label: 'Ajustes' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 md:hidden pb-safe">
            <div className="flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path) || (item.id === 'dashboard' && location.pathname === '/');
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-full py-2 gap-1 transition-colors ${
                                isActive ? 'text-[#2e8ba6]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <item.icon 
                                size={24} 
                                strokeWidth={isActive ? 2.5 : 2}
                                className={isActive ? 'animate-in zoom-in-50 duration-200' : ''}
                            />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNav;
