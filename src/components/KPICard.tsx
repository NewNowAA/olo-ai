import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  change: string;
  changeType: 'up' | 'down' | 'flat';
  changeSubtext?: string;
  accentColor?: string;
  delay?: number;
  icon?: React.ReactNode;
  kpiId?: string;
  onClick?: (kpiId: string) => void;
}

const KPICard: React.FC<KPICardProps> = ({
  label, value, unit = 'Kz', change, changeType, changeSubtext, accentColor, delay = 0, icon, kpiId, onClick,
}) => {
  const changeIcon = changeType === 'up' ? <ArrowUpRight size={12} /> :
    changeType === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />;

  const changeColor = changeType === 'up' ? 'var(--green)' :
    changeType === 'down' ? 'var(--red)' : 'var(--t3)';
  const changeBg = changeType === 'up' ? 'var(--green-a)' :
    changeType === 'down' ? 'var(--red-a)' : 'var(--input-bg)';

  const isClickable = !!onClick && !!kpiId;

  return (
    <div
      className={`card-glow p-5 ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform' : ''}`}
      style={{
        '--accent-color': accentColor || 'var(--blue)',
        animationDelay: `${delay}ms`,
      } as React.CSSProperties}
      onClick={isClickable ? () => onClick(kpiId!) : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.5px]"
          style={{ color: 'var(--t2)', fontFamily: "'Outfit', sans-serif" }}>
          {label}
        </span>
        {icon && <span style={{ color: accentColor || 'var(--blue)' }}>{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[22px] font-semibold tracking-[-0.3px]"
          style={{ color: 'var(--t1)', fontFamily: "'JetBrains Mono', monospace" }}>
          {value}
        </span>
        {unit && (
          <span className="text-[12px] font-normal"
            style={{ color: 'var(--t3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-0.5 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
          style={{ color: changeColor, backgroundColor: changeBg, fontFamily: "'Outfit', sans-serif" }}
        >
          {changeIcon} {change}
        </span>
        {changeSubtext && (
          <span className="text-[10px]" style={{ color: 'var(--t3)', fontFamily: "'Outfit', sans-serif" }}>
            {changeSubtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;

