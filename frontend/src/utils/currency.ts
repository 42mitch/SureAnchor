/**
 * Currency conversion and formatting utilities
 *
 * Exchange rate: Fixed at 1 USD = 58 PHP (0.0172 USD per PHP)
 * This rate is acceptable for reporting and demo purposes.
 */

const PHP_TO_USD_RATE = 0.0172; // ~58 PHP = 1 USD

/**
 * Convert Philippine Pesos to US Dollars
 */
export function phpToUsd(php: number): number {
  return php * PHP_TO_USD_RATE;
}

/**
 * Format USD amount with K suffix for thousands
 * Examples: 5234 → "$5.2K", 125000 → "$125K", 450 → "$450"
 */
export function formatUsdK(usd: number): string {
  if (usd >= 1000) {
    const k = usd / 1000;
    return `$${k.toFixed(k >= 100 ? 0 : 1)}K`;
  }
  return `$${Math.round(usd).toLocaleString()}`;
}

/**
 * Format PHP amount with K/M suffix
 * Examples: 290000 → "₱290K", 5600000 → "₱5.6M", 450 → "₱450"
 */
export function formatPhpK(php: number): string {
  if (php >= 1000000) {
    const m = php / 1000000;
    return `₱${m.toFixed(1)}M`;
  }
  if (php >= 1000) {
    const k = php / 1000;
    return `₱${k.toFixed(k >= 100 ? 0 : 1)}K`;
  }
  return `₱${Math.round(php).toLocaleString()}`;
}

/**
 * Format currency showing USD primarily with PHP in parentheses
 *
 * @param php - Amount in Philippine Pesos
 * @param options - Formatting options
 * @returns Formatted string like "$5.2K (₱290K)" or just "$5.2K"
 *
 * Examples:
 *   formatCurrency(290000) → "$5K (₱290K)"
 *   formatCurrency(290000, { showPhp: false }) → "$5K"
 *   formatCurrency(5600000) → "$96.3K (₱5.6M)"
 */
export function formatCurrency(
  php: number,
  options: { showPhp?: boolean } = {}
): string {
  const { showPhp = true } = options;

  const usd = phpToUsd(php);
  const usdFormatted = formatUsdK(usd);

  if (!showPhp) {
    return usdFormatted;
  }

  const phpFormatted = formatPhpK(php);
  return `${usdFormatted} (${phpFormatted})`;
}

/**
 * Format currency for detailed displays (no K suffix)
 * Examples: "$5,234 (₱290,000)" or "$125.50 (₱7,300)"
 */
export function formatCurrencyDetailed(
  php: number,
  options: { showPhp?: boolean; decimals?: number } = {}
): string {
  const { showPhp = true, decimals = 0 } = options;

  const usd = phpToUsd(php);
  const usdFormatted = `$${usd.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  if (!showPhp) {
    return usdFormatted;
  }

  const phpFormatted = `₱${php.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  return `${usdFormatted} (${phpFormatted})`;
}

/**
 * Format currency for chart axis labels
 * Returns shorter format suitable for Y-axis: "$5K", "$96K", etc.
 */
export function formatCurrencyAxis(php: number): string {
  return formatUsdK(phpToUsd(php));
}

/**
 * Normalize safehouse display names.
 * Strips "Lighthouse" so "Lighthouse Safehouse 1" → "Safehouse 1"
 * and bare numbers like "Lighthouse 2" → "Safehouse 2".
 */
export function formatSafehouseName(name: string): string {
  if (!name) return name;
  const cleaned = name.replace(/\bLighthouse\b\s*/gi, '').trim();
  if (!cleaned) return name;
  // If what remains starts with a digit, prepend "Safehouse"
  if (/^\d/.test(cleaned)) return `Safehouse ${cleaned}`;
  return cleaned;
}
