// Currency code type
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "INR"

// Currency configuration options
export const currencyOptions = [
  { value: "USD", label: "US Dollar ($)", locale: "en-US", symbol: "$" },
  { value: "EUR", label: "Euro (€)", locale: "en-EU", symbol: "€" },
  { value: "GBP", label: "British Pound (£)", locale: "en-GB", symbol: "£" },
  { value: "JPY", label: "Japanese Yen (¥)", locale: "ja-JP", symbol: "¥" },
  { value: "INR", label: "Indian Rupee (₹)", locale: "en-IN", symbol: "₹" },
]

// Get currency config by code
export function getCurrencyConfig(currencyCode: CurrencyCode | string) {
  return (
    currencyOptions.find((c) => c.value === currencyCode) || currencyOptions[0]
  )
}

// Format number as currency string
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode | string = "USD"
): string {
  const config = getCurrencyConfig(currencyCode)

  // Use Intl.NumberFormat for proper localization
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return `${config.symbol}${formatted}`
}

// Format number with currency symbol (for charts/stats that need just the number formatting)
export function formatCurrencyValue(
  amount: number,
  currencyCode: CurrencyCode | string = "USD"
): { value: string; symbol: string; prefix: string } {
  const config = getCurrencyConfig(currencyCode)

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return {
    value: formatted,
    symbol: config.symbol,
    prefix: config.symbol,
  }
}

// Get currency symbol only
export function getCurrencySymbol(currencyCode: CurrencyCode | string = "USD"): string {
  return getCurrencyConfig(currencyCode).symbol
}

// Default currency code - can be changed based on user preferences
export const DEFAULT_CURRENCY: CurrencyCode = "USD"
