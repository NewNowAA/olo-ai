import React, { useState } from 'react';
import { Users, Clock } from 'lucide-react';
import Workers from './Workers';
import Attendance from './Attendance';

type Tab = 'workers' | 'attendance';

export default function Team() {
  const [tab, setTab] = useState<Tab>('workers');

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('workers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'workers'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} />
          Colaboradores
        </button>
        <button
          onClick={() => setTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'attendance'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={16} />
          Ponto
        </button>
      </div>

      {tab === 'workers' ? <Workers /> : <Attendance />}
    </div>
  );
}
