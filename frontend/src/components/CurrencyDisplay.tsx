import { formatCurrencyDetailed, formatUsdK, formatPhpK, phpToUsd } from '../utils/currency';

/**
 * Stacked vertical currency display component
 * Shows USD on top (prominent) with PHP below (smaller, lighter)
 */
export function CurrencyDisplay({
  php,
  className = '',
  usdClassName = '',
  phpClassName = ''
}: {
  php: number;
  className?: string;
  usdClassName?: string;
  phpClassName?: string;
}) {
  const usd = phpToUsd(php);
  const usdFormatted = formatUsdK(usd);
  const phpFormatted = formatPhpK(php);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={usdClassName || 'font-display text-xl font-bold text-navy'}>
        {usdFormatted}
      </span>
      <span className={phpClassName || 'text-xs text-dark/35 font-normal'}>
        {phpFormatted}
      </span>
    </div>
  );
}

/**
 * Detailed stacked currency display (no K suffix, with commas)
 * For tables and detailed views
 */
export function CurrencyDisplayDetailed({
  php,
  className = '',
  usdClassName = '',
  phpClassName = ''
}: {
  php: number;
  className?: string;
  usdClassName?: string;
  phpClassName?: string;
}) {
  const usd = phpToUsd(php);
  const usdFormatted = `$${usd.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const phpFormatted = `₱${php.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={usdClassName || 'text-sm font-semibold text-navy'}>
        {usdFormatted}
      </span>
      <span className={phpClassName || 'text-xs text-dark/30 font-normal'}>
        {phpFormatted}
      </span>
    </div>
  );
}
