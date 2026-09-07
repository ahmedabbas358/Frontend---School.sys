/**
 * Global enforcement of Latin/English digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
 * across the entire school management system.
 * Ensures dates, times, currency, and numerical counts always display English numerals.
 */

// Function to convert any string containing Eastern Arabic digits to English/Latin digits
export function toLatinDigits(str: string | number): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

if (typeof window !== "undefined") {
  // Override Number.prototype.toLocaleString to always format numbers with Latin/English digits
  const origNumberToLocaleString = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
    const opts: Intl.NumberFormatOptions = { ...options, numberingSystem: "latn" };
    return origNumberToLocaleString.call(this, "en-US", opts);
  };

  // Override Date.prototype.toLocaleDateString to always use Latin/English digits for day and year
  const origDateToLocaleDateString = Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    const opts: Intl.DateTimeFormatOptions = { ...options, numberingSystem: "latn" };
    const loc = locales
      ? (typeof locales === "string" && locales.startsWith("ar") ? "ar-EG" : locales)
      : "ar-EG";
    const res = origDateToLocaleDateString.call(this, loc, opts);
    return toLatinDigits(res);
  };

  // Override Date.prototype.toLocaleTimeString to always use Latin/English digits for hour, minute, second
  const origDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
  Date.prototype.toLocaleTimeString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    const opts: Intl.DateTimeFormatOptions = { ...options, numberingSystem: "latn" };
    const loc = locales
      ? (typeof locales === "string" && locales.startsWith("ar") ? "ar-EG" : locales)
      : "ar-EG";
    const res = origDateToLocaleTimeString.call(this, loc, opts);
    return toLatinDigits(res);
  };

  // Override Date.prototype.toLocaleString
  const origDateToLocaleString = Date.prototype.toLocaleString;
  Date.prototype.toLocaleString = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
    const opts: Intl.DateTimeFormatOptions = { ...options, numberingSystem: "latn" };
    const loc = locales
      ? (typeof locales === "string" && locales.startsWith("ar") ? "ar-EG" : locales)
      : "ar-EG";
    const res = origDateToLocaleString.call(this, loc, opts);
    return toLatinDigits(res);
  };

  // Override Intl.DateTimeFormat if used directly
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    const OrigDateTimeFormat = Intl.DateTimeFormat;
    // @ts-expect-error override constructor
    Intl.DateTimeFormat = function (locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
      const opts: Intl.DateTimeFormatOptions = { ...options, numberingSystem: "latn" };
      const loc = locales
        ? (typeof locales === "string" && locales.startsWith("ar") ? "ar-EG" : locales)
        : "ar-EG";
      return new OrigDateTimeFormat(loc, opts);
    };
    Intl.DateTimeFormat.prototype = OrigDateTimeFormat.prototype;
    Intl.DateTimeFormat.supportedLocalesOf = OrigDateTimeFormat.supportedLocalesOf;
  }

  // Override Intl.NumberFormat if used directly
  if (typeof Intl !== "undefined" && Intl.NumberFormat) {
    const OrigNumberFormat = Intl.NumberFormat;
    // @ts-expect-error override constructor
    Intl.NumberFormat = function (locales?: string | string[], options?: Intl.NumberFormatOptions) {
      const opts: Intl.NumberFormatOptions = { ...options, numberingSystem: "latn" };
      return new OrigNumberFormat("en-US", opts);
    };
    Intl.NumberFormat.prototype = OrigNumberFormat.prototype;
    Intl.NumberFormat.supportedLocalesOf = OrigNumberFormat.supportedLocalesOf;
  }
}
