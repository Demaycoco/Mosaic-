import React, { useState } from 'react';
import { Sparkles, ImageOff } from 'lucide-react';

interface NftImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'auto';
}

export const NftImage: React.FC<NftImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : '';

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#0c0f1c] select-none ${aspectClass} ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-purple-400/30 animate-spin" />
        </div>
      )}

      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#12162a] to-[#0c0e18] p-4 text-center">
          <ImageOff className="w-8 h-8 text-slate-600 mb-2" />
          <span className="text-xs text-slate-400 font-medium line-clamp-1">{alt}</span>
          <span className="text-[10px] text-purple-400/60 mt-1 uppercase tracking-wider">Mosaic Verified</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
};
