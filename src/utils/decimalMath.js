import Decimal from 'decimal.js';

/**
 * Feature flag for decimal.js usage
 * Set VITE_USE_DECIMAL_PRECISION=false to rollback to native JavaScript math
 */
const USE_DECIMAL = import.meta.env?.VITE_USE_DECIMAL_PRECISION !== 'false';

/**
 * Decimal Math Utility
 * Provides precise decimal arithmetic with feature flag for instant rollback
 */
export const DecimalMath = {
  /**
   * Add two or more numbers with precision
   */
  add: (...values) => {
    if (!USE_DECIMAL) {
      return values?.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
    return values?.reduce((sum, val) => {
      return sum?.plus(new Decimal(val || 0));
    }, new Decimal(0))?.toNumber();
  },

  /**
   * Subtract values with precision
   */
  subtract: (a, b) => {
    if (!USE_DECIMAL) {
      return (parseFloat(a) || 0) - (parseFloat(b) || 0);
    }
    return new Decimal(a || 0)?.minus(new Decimal(b || 0))?.toNumber();
  },

  /**
   * Multiply two or more numbers with precision
   */
  multiply: (...values) => {
    if (!USE_DECIMAL) {
      return values?.reduce((product, val) => product * (parseFloat(val) || 0), 1);
    }
    return values?.reduce((product, val) => {
      return product?.times(new Decimal(val || 0));
    }, new Decimal(1))?.toNumber();
  },

  /**
   * Divide two numbers with precision
   */
  divide: (a, b) => {
    if (!USE_DECIMAL) {
      const divisor = parseFloat(b) || 1;
      return divisor === 0 ? 0 : (parseFloat(a) || 0) / divisor;
    }
    const divisor = new Decimal(b || 1);
    if (divisor?.isZero()) return 0;
    return new Decimal(a || 0)?.dividedBy(divisor)?.toNumber();
  },

  /**
   * Calculate percentage with precision
   */
  percentage: (value, percent) => {
    if (!USE_DECIMAL) {
      return ((parseFloat(value) || 0) * (parseFloat(percent) || 0)) / 100;
    }
    return new Decimal(value || 0)?.times(new Decimal(percent || 0))?.dividedBy(100)?.toNumber();
  },

  /**
   * Sum an array of values with precision
   */
  sum: (values) => {
    if (!USE_DECIMAL) {
      return values?.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
    return values?.reduce((sum, val) => {
      return sum?.plus(new Decimal(val || 0));
    }, new Decimal(0))?.toNumber();
  },

  /**
   * Parse float with fallback
   */
  parse: (value, fallback = 0) => {
    if (!USE_DECIMAL) {
      return parseFloat(value) || fallback;
    }
    try {
      return new Decimal(value || fallback)?.toNumber();
    } catch {
      return fallback;
    }
  },

  /**
   * Round to specified decimal places
   */
  round: (value, decimals = 2) => {
    if (!USE_DECIMAL) {
      return Math.round((parseFloat(value) || 0) * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    return new Decimal(value || 0)?.toDecimalPlaces(decimals)?.toNumber();
  },

  /**
   * Ceiling with precision
   */
  ceil: (value) => {
    if (!USE_DECIMAL) {
      return Math.ceil(parseFloat(value) || 0);
    }
    return new Decimal(value || 0)?.ceil()?.toNumber();
  },

  /**
   * Max value with precision
   */
  max: (...values) => {
    if (!USE_DECIMAL) {
      return Math.max(...values?.map(v => parseFloat(v) || 0));
    }
    return Decimal?.max(...values?.map(v => new Decimal(v || 0)))?.toNumber();
  },

  /**
   * Min value with precision
   */
  min: (...values) => {
    if (!USE_DECIMAL) {
      return Math.min(...values?.map(v => parseFloat(v) || 0));
    }
    return Decimal?.min(...values?.map(v => new Decimal(v || 0)))?.toNumber();
  },

  /**
   * Absolute value with precision
   */
  abs: (value) => {
    if (!USE_DECIMAL) {
      return Math.abs(parseFloat(value) || 0);
    }
    return new Decimal(value || 0)?.abs()?.toNumber();
  },

  /**
   * Check if decimal precision is enabled
   */
  isEnabled: () => USE_DECIMAL
};

/**
 * Format number with comma separators (enhanced with decimal support)
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with commas
 */
export function formatNumber(value, decimals = 2) {
  const num = USE_DECIMAL ? DecimalMath?.parse(value, 0) : parseFloat(value);
  if (isNaN(num)) return '0';
  
  return num?.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default DecimalMath;