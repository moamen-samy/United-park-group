import React from 'react';

interface BrandMarkProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export const ParkLogo: React.FC<BrandMarkProps> = ({ variant = 'dark', compact = false }) => {
  const primaryColor = variant === 'light' ? '#FFFFFF' : '#133D68';
  const subColor = variant === 'light' ? '#CBD5E1' : '#64748B';
  const swooshColor = variant === 'light' ? '#94A3B8' : '#CBD5E1';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        width={compact ? 30 : 36}
        height={compact ? 30 : 36}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Reconstructed curved arch & corporate P emblem matching PARK brand */}
        <path
          d="M6 16C6 9.373 11.373 4 18 4H26C30.418 4 34 7.582 34 12C34 16.418 30.418 20 26 20H18"
          stroke={swooshColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M12 34V10H22.5C26.09 10 29 12.686 29 16C29 19.314 26.09 22 22.5 22H16.5V34H12Z"
          fill={primaryColor}
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className="font-display font-extrabold tracking-tight text-lg sm:text-xl"
          style={{ color: primaryColor }}
        >
          PARK
        </span>
        {!compact && (
          <span
            className="text-[10px] font-medium tracking-wide mt-0.5"
            style={{ color: subColor }}
          >
            شركة بارك المتحدة · UNITED PARK
          </span>
        )}
      </span>
    </span>
  );
};

export const PartnerBrandBadge: React.FC<{ slug: string; name: string; logoUrl?: string }> = ({
  slug,
  name,
  logoUrl,
}) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="max-h-14 max-w-[180px] object-contain"
      />
    );
  }

  // Crisp corporate wordmarks matching the real manufacturer branding
  switch (slug) {
    case 'grundfos':
      return (
        <div className="flex flex-col items-center justify-center text-[#0A3B6E]">
          <span className="font-display font-extrabold tracking-wider text-xl">GRUNDFOS</span>
          <span className="text-[10px] tracking-[0.22em] uppercase text-slate-500 mt-0.5">
            Authorized Agent
          </span>
        </div>
      );
    case 'reflex':
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="px-4 py-1.5 rounded bg-[#56A832] text-white font-display font-bold tracking-tight text-xl">
            reflex
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-1">Thinking solutions</span>
        </div>
      );
    case 'global-water-solutions':
      return (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded bg-[#0073C6] text-white">
          <span className="w-7 h-7 rounded-full border-2 border-white/80 flex items-center justify-center font-bold text-xs">
            GWS
          </span>
          <span className="flex flex-col leading-tight text-left">
            <span className="font-display font-bold text-sm">globalwater</span>
            <span className="text-[10px] text-white/85">solutions</span>
          </span>
        </div>
      );
    case 'bristol-fire':
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="font-display font-extrabold tracking-tight text-xl text-[#B91C1C]">
            BRISTOL
          </span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-600">
            Fire Engineering
          </span>
        </div>
      );
    case 'ameriflo':
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="font-display font-extrabold tracking-wide text-xl text-[#133D68]">
            AMERIFLO
          </span>
          <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-slate-500">
            Pump Systems USA
          </span>
        </div>
      );
    default:
      return (
        <span className="font-display font-bold text-lg text-[#133D68]">{name}</span>
      );
  }
};
