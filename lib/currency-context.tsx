"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  currencyOptions,
  formatCurrency as formatCurrencyUtil,
  formatCurrencyValue as formatCurrencyValueUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
  DEFAULT_CURRENCY,
  CurrencyCode,
} from "@/lib/currency"

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  formatCurrency: (amount: number) => string
  formatCurrencyValue: (amount: number) => { value: string; symbol: string; prefix: string }
  getCurrencySymbol: () => string
  currencyOptions: typeof currencyOptions
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if available, otherwise use default
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY)

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem("preferred-currency") as CurrencyCode
    if (savedCurrency && currencyOptions.some((c) => c.value === savedCurrency)) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  // Save currency preference when changed
  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("preferred-currency", newCurrency)
  }, [])

  // Format functions that use current currency
  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyUtil(amount, currency),
    [currency]
  )

  const formatCurrencyValue = useCallback(
    (amount: number) => formatCurrencyValueUtil(amount, currency),
    [currency]
  )

  const getCurrencySymbol = useCallback(
    () => getCurrencySymbolUtil(currency),
    [currency]
  )

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        formatCurrencyValue,
        getCurrencySymbol,
        currencyOptions,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
