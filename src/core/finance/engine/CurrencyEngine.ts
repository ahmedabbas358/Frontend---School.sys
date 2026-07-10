import { Currency } from '../types';

export class CurrencyEngine {
  // Base currency of the system (e.g. USD)
  private baseCurrency: Currency;
  
  // Exchange rates relative to the base currency (Base Currency = 1.0)
  private exchangeRates: Map<Currency, number> = new Map();

  constructor(baseCurrency: Currency = 'USD') {
    this.baseCurrency = baseCurrency;
    this.exchangeRates.set(baseCurrency, 1.0);
  }

  public updateRate(currency: Currency, rate: number) {
    if (rate <= 0) {
      throw new Error("Exchange rate must be positive.");
    }
    this.exchangeRates.set(currency, rate);
  }

  public getRate(currency: Currency): number {
    const rate = this.exchangeRates.get(currency);
    if (!rate) {
      throw new Error(`Exchange rate for ${currency} not found.`);
    }
    return rate;
  }

  /**
   * Converts an amount from a given currency to the base currency.
   */
  public convertToBase(amount: number, fromCurrency: Currency): number {
    if (fromCurrency === this.baseCurrency) return amount;
    
    const rate = this.getRate(fromCurrency);
    // Standard formula: Amount in Base = Amount in Foreign / Foreign Exchange Rate
    const converted = amount / rate;
    
    return Math.round(converted * 100) / 100;
  }

  /**
   * Calculates Realized Forex Gain or Loss when settling an invoice.
   * If the rate changed between invoice date and payment date.
   */
  public calculateForexGainLoss(
    amountForeign: number,
    invoiceRate: number,
    paymentRate: number,
    isReceivable: boolean
  ): number {
    const invoiceBase = amountForeign / invoiceRate;
    const paymentBase = amountForeign / paymentRate;
    
    // For Receivables: If we get MORE base currency at payment than at invoice, it's a gain.
    // For Payables: If we pay LESS base currency at payment than at invoice, it's a gain.
    const difference = paymentBase - invoiceBase;
    return isReceivable ? difference : -difference;
  }
}
