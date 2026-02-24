import React from "react";

interface LogoItem {
  name: string;
  icon?: React.ReactNode;
}

interface LogoMarqueeProps {
  logos: LogoItem[];
  speed?: number; // seconds for full loop
}

export const LogoMarquee = ({ logos, speed = 30 }: LogoMarqueeProps) => {
  // Duplicar logos para loop contínuo
  const allLogos = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden w-full">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

      <div
        className="flex items-center gap-16 animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {allLogos.map((logo, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            {logo.icon}
            <span className="text-sm font-bold tracking-wide whitespace-nowrap">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
