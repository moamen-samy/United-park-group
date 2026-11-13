import React, { useState } from 'react';
import { Factory } from 'lucide-react';

interface ResilientImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  lazy?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  lazy = true,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#133D68] to-[#0C2B4B] text-white/80 p-6 text-center ${className}`}
      >
        <Factory className="w-10 h-10 mb-2 opacity-80" aria-hidden="true" />
        <span className="text-xs font-medium max-w-[200px] leading-snug">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
