import React from 'react';

export const OFFICIAL_PARK_LOGO_URL =
  '/assets/aistudio/image_ad8ad2f2-dc9e-407d-af3f-5c7149625b89_6b02dcf2.jpg';

interface BrandMarkProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
  src?: string | null;
  alt?: string;
}

export const ParkLogo: React.FC<BrandMarkProps> = ({
  variant = 'dark',
  compact = false,
  src,
  alt = 'United Park Co. — شركة بارك المتحدة (PARK)',
}) => {
  const logoSrc = src && src.trim().length > 0 ? src : OFFICIAL_PARK_LOGO_URL;

  const wrapperClass =
    variant === 'light'
      ? compact
        ? 'inline-flex items-center justify-center bg-white rounded-md px-2 py-0.5 shadow-xs shrink-0 select-none'
        : 'inline-flex items-center justify-center bg-white rounded-lg px-3 py-1.5 shadow-sm shrink-0 select-none'
      : compact
        ? 'inline-flex items-center justify-center bg-white rounded-md px-1 py-0.5 shrink-0 select-none'
        : 'inline-flex items-center justify-center bg-white rounded-lg px-2 py-1 shrink-0 select-none';

  const imgClass = compact
    ? 'h-9 sm:h-10 w-auto max-w-[150px] object-contain block'
    : 'h-14 sm:h-16 w-auto max-w-[190px] object-contain block';

  return (
    <span className={wrapperClass}>
      <img src={logoSrc} alt={alt} className={imgClass} />
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
