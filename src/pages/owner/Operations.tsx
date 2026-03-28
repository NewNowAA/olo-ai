import React, { useState } from 'react';
import { ShoppingBag, CalendarDays } from 'lucide-react';
import Orders from './Orders';
import Appointments from './Appointments';

type Tab = 'orders' | 'appointments';

export default function Operations() {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'orders'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag size={16} />
          Pedidos
        </button>
        <button
          onClick={() => setTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'appointments'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays size={16} />
          Agenda
        </button>
      </div>

      {tab === 'orders' ? <Orders /> : <Appointments />}
    </div>
  );
}
