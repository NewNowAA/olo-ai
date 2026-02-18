import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav aria-label="breadcrumb" className="hidden md:flex items-center text-sm text-slate-500 mb-6">
            <Link to="/" className="hover:text-[#2e8ba6] transition-colors flex items-center gap-1">
                <Home size={14} />
                <span className="font-medium">Home</span>
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;

                return (
                    <div key={to} className="flex items-center">
                        <ChevronRight size={14} className="mx-2 text-slate-300" />
                        {isLast ? (
                            <span className="font-bold text-slate-800 dark:text-white capitalize">
                                {value.replace(/-/g, ' ')}
                            </span>
                        ) : (
                            <Link to={to} className="hover:text-[#2e8ba6] transition-colors capitalize text-slate-500 font-medium">
                                {value.replace(/-/g, ' ')}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
