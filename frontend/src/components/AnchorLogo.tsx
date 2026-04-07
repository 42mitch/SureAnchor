import { Anchor } from 'lucide-react';

interface AnchorLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export default function AnchorLogo({ size = 'md', variant = 'dark' }: AnchorLogoProps) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  const iconSizes = { sm: 16, md: 20, lg: 28 };
  const textColor = variant === 'light' ? 'text-white' : 'text-navy';
  const subColor = variant === 'light' ? 'text-teal-light' : 'text-teal';

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${variant === 'light' ? 'bg-white/15' : 'bg-teal/10'}`}>
        <Anchor size={iconSizes[size]} className={variant === 'light' ? 'text-gold' : 'text-teal'} strokeWidth={2.2} />
      </div>
      <div>
        <div className={`font-display font-semibold leading-tight ${sizes[size]} ${textColor}`}>
          SureAnchor
        </div>
        {size === 'lg' && (
          <div className={`text-xs font-sans tracking-wide ${subColor}`}>
            An anchor for the soul
          </div>
        )}
      </div>
    </div>
  );
}
